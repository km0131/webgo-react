'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// --- 型定義 ---
type UserRole = 'teacher' | 'student';

interface User {
    id: string;
    name: string;
    role: UserRole;
}

interface ClassRoom {
    id: string;
    className: string;
    teacherName: string;
    description: string;
    themeColor: string; // カードの背景色用
}

// --- モックデータ ---
// UserデータはAPIから取得するため削除


const INITIAL_CLASSES: ClassRoom[] = [
    {
        id: 'c1',
        className: '3年B組 数学',
        teacherName: '佐藤 先生',
        description: '微分積分の基礎から応用まで学びます。',
        themeColor: 'bg-blue-600',
    },
    {
        id: 'c2',
        className: '現代文特講',
        teacherName: '鈴木 先生',
        description: '近代文学の名作を読み解く。',
        themeColor: 'bg-emerald-600',
    },
    {
        id: 'c3',
        className: '物理実験',
        teacherName: '高橋 先生',
        description: '実験を通じて物理法則を体感する。レポート提出必須。',
        themeColor: 'bg-amber-600',
    },
];

export default function MainRoomPage() {
    // --- State ---
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [classes, setClasses] = useState<ClassRoom[]>(INITIAL_CLASSES);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    // セッション取得
    React.useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch('/api/session');
                if (!res.ok) {
                    throw new Error('セッションの取得に失敗しました');
                }
                const data = await res.json();
                // Backend logic: user_teacher returns "teacher" or "student" string
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

    // 入力フォーム用State
    const [newClassName, setNewClassName] = useState('');
    const [newClassDesc, setNewClassDesc] = useState('');
    const [joinCode, setJoinCode] = useState('');

    // --- Actions ---

    // クラス作成 (先生のみ)
    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            const res = await fetch('/api/create_class', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    className: newClassName,
                    description: newClassDesc,
                }),
            });

            if (!res.ok) {
                throw new Error('クラスの作成に失敗しました');
            }

            const data = await res.json();

            alert(`作成しました！招待コードは ${data.course} です`);
            window.location.reload();

        } catch (error) {
            console.error(error);
            alert('クラスの作成に失敗しました');
        }
    };

    // クラス参加 (全員)
    const handleJoinClass = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`コード「${joinCode}」でクラスに参加しました（デモ）`);
        setJoinCode('');
        setShowJoinModal(false);
        setIsMenuOpen(false);
    };

    // ログアウト
    const handleLogout = () => {
        router.push('/');
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="text-gray-500 text-lg">読み込み中...</div>
            </div>
        );
    }

    return (
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
                                AI Classroom
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
                                <div className="px-4 py-2 text-sm text-gray-500 font-medium">
                                    ようこそ、{currentUser.name} さん
                                </div>
                                {/* ここに他のメニュー項目を追加可能 */}
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                                >
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

                    {/* Left: Branding & Hamburger */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-yellow-400 rounded-md flex items-center justify-center text-white font-bold text-lg">
                                A
                            </div>
                            <h1 className="text-xl text-gray-700 font-medium hidden sm:block">
                                AI Classroom
                            </h1>
                        </div>
                    </div>

                    {/* Right: Actions & Profile */}
                    <div className="flex items-center gap-4">
                        {/* Role Badge */}
                        <span className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-100">
                            {currentUser.role === 'teacher' ? '先生' : '生徒'}
                        </span>

                        {/* Plus Button Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                                title="クラスを作成または参加"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsMenuOpen(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-100 origin-top-right animate-in fade-in zoom-in-95 duration-100">
                                        <button
                                            onClick={() => { setShowJoinModal(true); setIsMenuOpen(false); }}
                                            className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 bg-white"
                                        >
                                            クラスに参加
                                        </button>
                                        {currentUser.role === 'teacher' && (
                                            <button
                                                onClick={() => { setShowCreateModal(true); setIsMenuOpen(false); }}
                                                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 bg-white"
                                            >
                                                クラスを作成
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* User Avatar */}
                        <div className="text-sm font-medium text-gray-700">
                            {currentUser.name}
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Main Content --- */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {classes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                        <p className="text-xl">クラスがありません</p>
                        <p className="text-sm mt-2">右上の「＋」ボタンからクラスを追加または参加してください</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {classes.map((cls) => (
                            <div
                                key={cls.id}
                                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-72 cursor-pointer"
                            >
                                {/* Card Header */}
                                <div className={`${cls.themeColor} p-4 h-28 flex flex-col justify-between relative`}>
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-xl text-white font-medium hover:underline truncate w-11/12">
                                            {cls.className}
                                        </h2>
                                        <button className="text-white opacity-80 hover:opacity-100">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-white text-sm opacity-90 truncate">
                                        {cls.teacherName}
                                    </p>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 flex-1 relative">
                                    {/* Placeholder Avatar overlapping header and body */}
                                    <div className="absolute -top-10 right-4 w-16 h-16 bg-white rounded-full p-1 shadow-sm hidden">
                                        {/* ユーザー画像があればここに入れる */}
                                        <div className="w-full h-full bg-gray-200 rounded-full"></div>
                                    </div>

                                    <p className="text-sm text-gray-600 line-clamp-3">
                                        {cls.description}
                                    </p>
                                </div>

                                {/* Card Footer */}
                                <div className="px-4 py-3 border-t border-gray-100 flex justify-end gap-2">
                                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors" title="ワークフォルダを開く">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                    </button>
                                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors" title="課題一覧">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* --- Modals --- */}

            {/* Create Class Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-medium text-gray-900">クラスを作成</h3>
                        </div>
                        <form onSubmit={handleCreateClass} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">クラス名 (必須)</label>
                                <input
                                    type="text"
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                    placeholder="例: 3年B組 数学"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">内容・科目など</label>
                                <input
                                    type="text"
                                    value={newClassDesc}
                                    onChange={(e) => setNewClassDesc(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                    placeholder="例: 微分積分の基礎"
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 focus:outline-none ring-offset-2 focus:ring-2"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none ring-offset-2 focus:ring-2"
                                    disabled={!newClassName}
                                >
                                    作成
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Class Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowJoinModal(false)}></div>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-medium text-gray-900">クラスに参加</h3>
                        </div>
                        <form onSubmit={handleJoinClass} className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-4">
                                    先生から伝えられたクラスコードを入力してください。
                                </p>
                                <label className="block text-sm font-medium text-gray-700 mb-1">クラスコード</label>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                    placeholder="例: abc-defg-hij"
                                    required
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowJoinModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 focus:outline-none"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
                                    disabled={!joinCode}
                                >
                                    参加
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

