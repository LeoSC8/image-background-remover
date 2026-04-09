"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

interface UserQuota {
  creditsRemaining: number;
  membershipType: string;
  dailyLimit: number;
  usedToday: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [hasWatermark, setHasWatermark] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session) {
      fetchQuota();
    }
  }, [session]);

  const fetchQuota = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setQuota({
          creditsRemaining: data.creditsRemaining,
          membershipType: data.membershipType,
          dailyLimit: data.membershipType === 'free' ? 5 : data.membershipType === 'premium' ? 100 : -1,
          usedToday: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch quota:', error);
    }
  };

  const getMaxFileSize = () => {
    return session ? 10 * 1024 * 1024 : 2 * 1024 * 1024; // 10MB for logged in, 2MB for anonymous
  };

  const handleFile = async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      alert("仅支持 JPG、PNG、WEBP 格式");
      return;
    }

    const maxSize = getMaxFileSize();
    const maxSizeMB = maxSize / (1024 * 1024);

    if (file.size > maxSize) {
      alert(`文件大小不能超过 ${maxSizeMB}MB${!session ? '（登录后可上传最大10MB文件）' : ''}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imgUrl = e.target?.result as string;
      setImage(imgUrl);
      setResult(null);
      setHasWatermark(false);

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("image_file", file);
        formData.append("size", "auto");

        const response = await fetch("/api/remove-bg", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          alert(error.error || "处理失败，请重试");
          return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setResult(url);

        // Check response headers
        const creditsRemaining = response.headers.get('X-Credits-Remaining');
        const watermark = response.headers.get('X-Has-Watermark');
        const userType = response.headers.get('X-User-Type');

        setHasWatermark(watermark === 'true');

        if (session && creditsRemaining) {
          setQuota(prev => prev ? { ...prev, creditsRemaining: parseInt(creditsRemaining) } : null);
        }

        // Update usage count for logged-in user
        if (session) {
          await fetch("/api/usage", { method: "POST" }).catch(() => {});
        }
      } catch (error) {
        alert("处理失败，请重试");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) handleFile(file);
        break;
      }
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = "removed-bg.png";
    a.click();
  };

  const getQuotaDisplay = () => {
    if (!session) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2 text-yellow-800">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">未登录用户限制：每日3次 | 最大2MB | 输出带水印</span>
          </div>
        </div>
      );
    }

    if (!quota) return null;

    const { creditsRemaining, membershipType } = quota;
    const isVIP = membershipType === 'vip';
    const isPremium = membershipType === 'premium';
    const isFree = membershipType === 'free';

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-700">
              <span className="font-medium">剩余额度：</span>
              <span className="text-lg font-bold text-blue-600">
                {isVIP ? '∞' : creditsRemaining}
              </span>
              {isFree && <span className="text-gray-500 ml-1">（每日5次）</span>}
              {isPremium && <span className="text-gray-500 ml-1">（每月100次）</span>}
            </div>
            <div className={`px-2 py-1 rounded text-xs font-semibold ${
              isVIP ? 'bg-yellow-500 text-white' :
              isPremium ? 'bg-blue-500 text-white' :
              'bg-gray-500 text-white'
            }`}>
              {isVIP ? 'VIP' : isPremium ? 'Premium' : 'Free'}
            </div>
          </div>
          <a
            href="/pricing"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            升级会员 →
          </a>
        </div>
      </div>
    );
  };

  return (
    <main
      className="min-h-screen bg-white flex items-center justify-center p-8"
      onPaste={handlePaste}
    >
      {/* 固定在页面右上角的登录区域 */}
      <div className="fixed top-4 right-6 z-50 flex items-center gap-3">
        {status === "loading" ? (
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        ) : session ? (
          <>
            {session.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name ?? ""}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-700">{session.user?.name}</span>
            <a
              href="/profile"
              className="text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg px-3 py-1.5 transition hover:bg-blue-50"
            >
              个人中心
            </a>
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 transition hover:bg-gray-50"
            >
              Sign out
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        )}
      </div>

      <div className="max-w-3xl w-full">
        <div className="mb-6"></div>

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Remove Background From Images
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            {session ? '100% Automatically' : '100% Automatically - Try it Free'}
          </p>
          {!session && (
            <p className="text-sm text-gray-500">
              登录后享受更多额度和无水印输出 | <a href="/pricing" className="text-blue-600 hover:underline">查看定价</a>
            </p>
          )}
        </div>

        {/* Quota Display */}
        <div className="mb-6">
          {getQuotaDisplay()}
        </div>

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-blue-400 rounded-2xl p-20 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition bg-blue-50/20"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <div className="w-20 h-20 mx-auto mb-6 bg-blue-500 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-gray-800 mb-2">Upload Image</p>
          <p className="text-gray-500">or drop a file, paste (Ctrl+V)</p>
          <p className="text-sm text-gray-400 mt-2">
            支持 JPG, PNG, WEBP | 最大 {session ? '10MB' : '2MB'}
          </p>
        </div>

        {loading && (
          <div className="text-center mt-8">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-2">处理中...</p>
          </div>
        )}

        {result && (
          <div className="mt-12">
            {hasWatermark && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>此图片包含水印。<a href="/pricing" className="underline font-medium">登录或升级会员</a>以获取无水印版本。</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">原图</h3>
                <img src={image!} alt="原图" className="w-full rounded-xl shadow-lg" />
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">处理后</h3>
                <div className="relative">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%,transparent_75%,#f0f0f0_75%,#f0f0f0),linear-gradient(45deg,#f0f0f0_25%,transparent_25%,transparent_75%,#f0f0f0_75%,#f0f0f0)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] rounded-xl"></div>
                  <img src={result} alt="处理后" className="relative w-full rounded-xl shadow-lg" />
                </div>
              </div>
            </div>
            <button
              onClick={download}
              className="w-full bg-blue-500 text-white py-4 rounded-xl hover:bg-blue-600 transition font-semibold text-lg"
            >
              Download
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
