"use client";

import { useState, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      alert("仅支持 JPG、PNG、WEBP 格式");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("文件大小不能超过 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imgUrl = e.target?.result as string;
      setImage(imgUrl);
      setResult(null);

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("image_file", file);
        formData.append("size", "auto");

        const response = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: {
            "X-Api-Key": process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY!,
          },
          body: formData,
        });

        if (!response.ok) throw new Error("API request failed");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setResult(url);

        // Update usage count for logged-in user
        await fetch("/api/usage", { method: "POST" }).catch(() => {});
      } catch {
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

  return (
    <main
      className="min-h-screen bg-white flex items-center justify-center p-8"
      onPaste={handlePaste}
    >
      <div className="max-w-3xl w-full">
        {/* Header with auth controls */}
        <div className="flex justify-end mb-6">
          {status === "loading" ? (
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : session ? (
            <div className="flex items-center gap-3">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-gray-700">{session.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 transition hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
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

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Remove Background From Images
          </h1>
          <p className="text-xl text-gray-600">100% Automatically and Free</p>
        </div>

        {!session ? (
          /* Not logged in */
          <div className="border-2 border-dashed border-blue-200 rounded-2xl p-20 text-center bg-blue-50/20">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-gray-700 mb-2">Sign in to get started</p>
            <p className="text-gray-500 mb-6">Please sign in with Google to use the background remover</p>
            <button
              onClick={() => signIn("google")}
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition font-semibold"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          /* Logged in */
          <>
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
              <p className="text-gray-500">or drop a file</p>
            </div>

            {loading && (
              <div className="text-center mt-8">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 mt-2">处理中...</p>
              </div>
            )}

            {result && (
              <div className="mt-12">
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
          </>
        )}
      </div>
    </main>
  );
}
