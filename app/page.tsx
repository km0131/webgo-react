"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// =================================================================
// Step 1: Username Input Component
// =================================================================
interface LoginStep1Props {
  onUserChecked: (username: string, imageList: string[], imageNames: string[]) => void;
}

function LoginStep1({ onUserChecked }: LoginStep1Props) {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUserCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage("なまえをいれてね。");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputUsername: username }),
      });

      const data = await response.json();

      if (response.ok && data.status === "next_step") {
        onUserChecked(username, data.img_list, data.img_name);
      } else {
        setErrorMessage(data.error || "そのなまえのひとはいないみたい。もういちどかくにんしてね。");
      }
    } catch (err) {
      setErrorMessage("えらーがはっせいしました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f9ff] p-4 font-sans">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-lg">
        <h3 className="text-center text-3xl font-bold text-[#0ea5e9] mb-6 tracking-tight">👋 ろぐいん</h3>

        {errorMessage && (
          <p className="text-red-500 border border-red-300 bg-red-50 p-3 mb-4 text-sm rounded-xl text-center">
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleUserCheck}>
          <div className="mb-5">
            <label className="block mb-2 text-sm font-semibold text-slate-600">
              😊 なまえ
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-100 transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 rounded-full transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:scale-100"
          >
            {isLoading ? "かくにんちゅう..." : "つぎへ →"}
          </button>
        </form>

        <hr className="my-6 border-slate-200" />

        <div className="text-center text-sm space-y-2">
          <a href="#" className="font-semibold text-slate-400 cursor-not-allowed">
            ぱすわーどをわすれたばあい
          </a>
          <Link href="/signup" className="block font-semibold text-sky-500 hover:text-sky-600 hover:underline">
            あたらしく とうろくする
          </Link>
        </div>
      </div>
    </div>
  );
}


// =================================================================
// Step 2: Image Password Component
// =================================================================
interface LoginStep2Props {
  username: string;
  imageList: string[];
  imageNames: string[];
  onBack: () => void;
}

function LoginStep2({ username, imageList, imageNames, onBack }: LoginStep2Props) {
  const router = useRouter();
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [statusMessage, setStatusMessage] = useState({ text: "えらんだ どうぶつ: 0/3", color: "text-slate-500" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const toggleImageSelection = (index: number) => {
    if (selectedIndices.includes(index) || isLoading || successMessage) {
      if (!isLoading && !successMessage) {
        setSelectedIndices(selectedIndices.filter(i => i !== index));
      }
    } else if (selectedIndices.length < 3) {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  useEffect(() => {
    const count = selectedIndices.length;
    if (count === 3) {
      setStatusMessage({ text: "3つえらんだね！OK！", color: "text-green-500" });
    } else {
      setStatusMessage({ text: `えらんだしゃしん: ${count}/3`, color: "text-slate-500" });
    }
  }, [selectedIndices]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndices.length !== 3) {
      setErrorMessage("しゃしんを3つえらんでね。");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const sortedIndices = [...selectedIndices].sort((a, b) => a - b);
      const sortedLabels = sortedIndices.map(index => imageNames[index]);
      const loginData = {
        username: username,
        images: sortedLabels
      };

      const response = await fetch('/api/login_registrer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (response.ok && result.password) {
        router.push('/signup');
      } else {
        setErrorMessage("パスワードが違う");
        setIsLoading(false);
      }

    } catch (err) {
      setErrorMessage('えらーがはっせいしました。');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f9ff] p-4 font-sans">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-lg">
        <h3 className="text-center text-3xl font-bold text-[#0ea5e9] mb-2 tracking-tight">ひみつのパスワード</h3>
        <p className="text-center text-slate-500 mb-6">とうろくした しゃしん 3つえらんでね</p>

        {errorMessage && (
          <p className="text-red-500 border border-red-300 bg-red-50 p-3 mb-4 text-sm rounded-xl text-center">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="text-green-600 border border-green-300 bg-green-50 p-3 mb-4 text-sm rounded-xl text-center">
            {successMessage}
          </p>
        )}

        <form onSubmit={handleLogin}>
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
            {imageList.map((path, index) => (
              <div key={index} className="flex justify-center">
                <label className={`relative cursor-pointer group w-full ${isLoading || successMessage ? 'cursor-not-allowed' : ''}`}>
                  <input
                    type="checkbox"
                    className="absolute opacity-0 w-0 h-0"
                    checked={selectedIndices.includes(index)}
                    onChange={() => toggleImageSelection(index)}
                    disabled={isLoading || !!successMessage}
                  />
                  <img
                    src={path}
                    alt={`img-pw-${index}`}
                    className={`w-full aspect-square object-contain p-1 rounded-2xl border-4 transition-all duration-200 
                      ${selectedIndices.includes(index)
                        ? "border-sky-400 ring-4 ring-sky-100 scale-105"
                        : "border-slate-200 group-hover:border-sky-300 group-hover:scale-105"
                      }
                      ${isLoading || successMessage ? 'opacity-50' : ''}
                    `}
                  />
                </label>
              </div>
            ))}
          </div>

          <p className={`text-center font-semibold mb-5 min-h-[1.5rem] ${statusMessage.color}`}>
            {statusMessage.text}
          </p>

          <button
            type="submit"
            disabled={selectedIndices.length !== 3 || isLoading || !!successMessage}
            className="w-full bg-[#34d399] hover:bg-[#10b981] text-white font-bold py-4 rounded-full transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:scale-100"
          >
            {isLoading ? "ろぐいんちゅう..." : "ろぐいん！"}
          </button>
        </form>

        <hr className="my-6 border-slate-200" />
        <div className="text-center">
          <button
            onClick={onBack}
            className="text-sm font-semibold text-sky-500 hover:text-sky-600 hover:underline disabled:text-slate-400 disabled:cursor-not-allowed disabled:no-underline"
            disabled={isLoading || !!successMessage}
          >
            ← なまえのにゅうりょくにもどる
          </button>
        </div>
      </div>
    </div>
  );
}


// =================================================================
// Main Page Component (Controller)
// =================================================================
interface LoginData {
  username: string;
  imageList: string[];
  imageNames: string[];
}

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [loginData, setLoginData] = useState<LoginData | null>(null);

  const handleUserChecked = (username: string, imageList: string[], imageNames: string[]) => {
    setLoginData({ username, imageList, imageNames });
    setStep(2);
  };

  const handleBackToStep1 = () => {
    setLoginData(null);
    setStep(1);
  }

  if (step === 1) {
    return <LoginStep1 onUserChecked={handleUserChecked} />;
  }

  if (step === 2 && loginData) {
    return <LoginStep2 {...loginData} onBack={handleBackToStep1} />;
  }

  return null; // Default fallback
}
