'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// --- 型定義 ---
type UserRole = 'teacher' | 'student';

interface User {
    id: string;
    name: string;
    role: UserRole;
}

interface AiSet {
    name: string;
    desc: string;
    images: File[];
    previewUrls: string[];
}

function SubRoomContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const classId = searchParams.get('id');
    const className = searchParams.get('name');

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiSets, setAiSets] = useState<AiSet[]>([
        { name: '', desc: '', images: [], previewUrls: [] }
    ]);

    // セッション取得 (メイン画面と同一)
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch('/api/session');
                if (!res.ok) throw new Error('セッション取得失敗');
                const data = await res.json();
                const role = data.user_teacher === 'teacher' ? 'teacher' : 'student';
                setCurrentUser({
                    id: data.user_id,
                    name: data.user_nam,
                    role: role
                });
            } catch (error) {
                console.error(error);
                router.push('/');
            }
        };
        fetchSession();
    }, [router]);

    const handleAddSet = () => {
        setAiSets(prev => [...prev, { name: '', desc: '', images: [], previewUrls: [] }]);
    };

    const handleRemoveSet = (index: number) => {
        if (aiSets.length > 1) {
            setAiSets(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSetFieldChange = (index: number, field: keyof AiSet, value: string) => {
        setAiSets(prev => prev.map((set, i) => i === index ? { ...set, [field]: value } : set));
    };

    const handleSetImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setAiSets(prev => prev.map((set, i) => {
                if (i === index) {
                    const newUrls = files.map(file => URL.createObjectURL(file));
                    return {
                        ...set,
                        images: [...set.images, ...files],
                        previewUrls: [...set.previewUrls, ...newUrls]
                    };
                }
                return set;
            }));
        }
    };

    const handleSetImageRemove = (setIndex: number, imageIndex: number) => {
        setAiSets(prev => prev.map((set, i) => {
            if (i === setIndex) {
                return {
                    ...set,
                    images: set.images.filter((_, imgI) => imgI !== imageIndex),
                    previewUrls: set.previewUrls.filter((_, imgI) => imgI !== imageIndex)
                };
            }
            return set;
        }));
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    // 画像リサイズ用ユーティリティ
    const resizeImage = (file: File, width: number, height: number): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        canvas.toBlob((blob) => {
                            if (blob) resolve(blob);
                            else reject(new Error('Blob conversion failed'));
                        }, 'image/jpeg', 0.9);
                    } else {
                        reject(new Error('Canvas context failed'));
                    }
                };
            };
            reader.onerror = (error) => reject(error);
        });
    };

    // BlobをBase64文字列に変換するユーティリティ
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleAiSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            // 全てのセットの全画像をリサイズし、Base64に変換
            const processedSets = await Promise.all(aiSets.map(async (set) => {
                const resizedBlobs = await Promise.all(
                    set.images.map(img => resizeImage(img, 300, 300))
                );
                // API送信用にBase64文字列の配列を作成
                const base64Images = await Promise.all(
                    resizedBlobs.map(blob => blobToBase64(blob))
                );

                return {
                    name: set.name,
                    description: set.desc,
                    images: base64Images // Base64形式の画像データ
                };
            }));

            // API送信
            const response = await fetch('/api/ai_create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    classId: classId,
                    aiSets: processedSets
                }),
            });

            if (!response.ok) {
                throw new Error('サーバーへの送信に失敗しました');
            }

            // const result = await response.json();
            alert('AIの作成が完了しました！');

            // 状態のリセット
            setIsAiModalOpen(false);
            setAiSets([{ name: '', desc: '', images: [], previewUrls: [] }]);
        } catch (error) {
            console.error('Submission failed:', error);
            alert('エラーが発生しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500 text-lg">読み込み中...</div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* --- Sidebar (Drawer) --- */}
                {isSidebarOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                            onClick={() => setIsSidebarOpen(false)}
                        ></div>
                        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out animate-in slide-in-from-left">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h2 className="font-bold text-gray-700 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-yellow-400 rounded-md flex items-center justify-center text-white font-bold text-lg">
                                        A
                                    </div>
                                    {className}
                                </h2>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4 flex flex-col h-[calc(100%-64px)] justify-between">
                                <div className="space-y-1">
                                    <Link href="/api/main_room" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        ホーム
                                    </Link>
                                    <div className="px-4 py-2 text-sm text-gray-500 font-medium">
                                        ようこそ、{currentUser.name} さん
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <button className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium" onClick={() => router.push('/')}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        ログアウト
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* --- Header --- */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <Link href="/api/main_room" className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-yellow-400 rounded-md flex items-center justify-center text-white font-bold text-lg">
                                    A
                                </div>
                                <h1 className="text-xl text-gray-700 font-medium hidden sm:block">
                                    {className || 'ロード中...'}
                                </h1>
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-100">
                                {currentUser.role === 'teacher' ? '先生' : '生徒'}
                            </span>


                            <div className="text-sm font-medium text-gray-700">
                                {currentUser.name}
                            </div>
                        </div>
                    </div>
                </header>

                {/* --- Main Content --- */}
                <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
                        {/* Hero Area */}
                        <div className="bg-indigo-600 h-32 relative flex items-center px-8">
                            <h2 className="text-2xl text-white font-bold">
                                サブルーム: {className || 'ロード中...'}
                            </h2>
                        </div>

                        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                AI作成ページへようこそ！
                            </h3>

                            <p className="text-gray-600 mb-8 max-w-md">
                                ここは選択されたクラスの専用ページです。
                            </p>

                            <div className="w-full max-w-sm px-4">
                                <div
                                    onClick={() => setIsAiModalOpen(true)}
                                    className="bg-white p-8 rounded-2xl border-2 border-indigo-100 text-center hover:border-indigo-400 hover:shadow-xl transition-all cursor-pointer group scale-110 active:scale-105"
                                >
                                    <span className="text-3xl mb-4 block group-hover:scale-125 transition-transform duration-300">✨</span>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">AI作成</h4>
                                    <p className="text-sm text-gray-500">AIを作成してください。</p>
                                </div>
                            </div>

                            <Link
                                href="/api/main_room"
                                className="mt-12 px-8 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                ホームに戻る
                            </Link>
                        </div>
                    </div>
                </main>
            </div>

            {/* --- AI Creation Modal --- */}
            {isAiModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsAiModalOpen(false)}
                    ></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
                        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <span>✨</span> AIを作成する
                            </h3>
                            <button
                                onClick={() => setIsAiModalOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAiSubmit} className="p-8 space-y-10 overflow-y-auto max-h-[70vh]">
                            {aiSets.map((set, setIndex) => (
                                <div key={setIndex} className="p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100/50 space-y-6 relative">
                                    {aiSets.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSet(setIndex)}
                                            className="absolute -top-3 -right-3 bg-white text-red-500 p-2 rounded-full shadow-md border border-red-50 hover:bg-red-50 transition-colors"
                                            title="このセットを削除"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}

                                    <h4 className="font-bold text-indigo-900 border-l-4 border-indigo-500 pl-3">
                                        AI セット #{setIndex + 1}
                                    </h4>

                                    {/* Image Upload Area */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">AIの画像 (複数可)</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {set.previewUrls.map((url, imgIndex) => (
                                                <div key={imgIndex} className="relative aspect-square group">
                                                    <img
                                                        src={url}
                                                        alt={`Preview ${imgIndex}`}
                                                        className="w-full h-full object-cover rounded-xl border-2 border-white shadow-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetImageRemove(setIndex, imgIndex)}
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Upload Button */}
                                            <label className="aspect-square flex flex-col items-center justify-center bg-white border-2 border-dashed border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all group">
                                                <svg className="w-6 h-6 text-indigo-300 group-hover:text-indigo-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                <span className="text-[10px] text-gray-400 group-hover:text-indigo-600 font-medium">追加</span>
                                                <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleSetImageChange(setIndex, e)} />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Name Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">名前</label>
                                        <input
                                            type="text"
                                            value={set.name}
                                            onChange={(e) => handleSetFieldChange(setIndex, 'name', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-black shadow-sm"
                                            placeholder="例: 太宰府天満宮"
                                            required
                                        />
                                    </div>

                                    {/* Description Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">説明文</label>
                                        <textarea
                                            value={set.desc}
                                            onChange={(e) => handleSetFieldChange(setIndex, 'desc', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-24 text-black shadow-sm"
                                            placeholder="例：大宰府天満宮に祀られているのは菅原道真公です。"
                                            required
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Add Set Button */}
                            <button
                                type="button"
                                onClick={handleAddSet}
                                className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-3xl text-indigo-500 font-bold hover:bg-indigo-50 hover:border-indigo-400 transition-all flex items-center justify-center gap-2 group"
                            >
                                <svg className="w-6 h-6 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                セットをもう一つ追加
                            </button>

                            <div className="pt-4 flex gap-4 sticky bottom-0 bg-white/80 backdrop-blur-md py-2 z-20">
                                <button
                                    type="button"
                                    onClick={() => setIsAiModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    やめる
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex-[2] px-4 py-3 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            送信中...
                                        </>
                                    ) : (
                                        'すべてのセットを送信'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default function SubRoomPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">読み込み中...</div>}>
            <SubRoomContent />
        </Suspense>
    );
}
