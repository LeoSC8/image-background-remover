"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Result() {
  const [resultImage, setResultImage] = useState<string>("");
  const [originalImage, setOriginalImage] = useState<string>("");
  const [showWhiteBg, setShowWhiteBg] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const result = sessionStorage.getItem("resultImage");
    const original = sessionStorage.getItem("originalImage");
    if (!result) {
      router.push("/");
    } else {
      setResultImage(result);
      setOriginalImage(original || "");
    }
  }, [router]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = resultImage;
    a.download = "removed-background.png";
    a.click();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM4YjVjZjYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
      <div className="container mx-auto px-4 py-12 max-w-6xl relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-5 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full border border-green-200/50 backdrop-blur-sm">
            <span className="text-sm font-semibold text-green-700">✓ Processing Complete</span>
          </div>
          <h1 className="text-6xl font-bold mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
            Your Result
          </h1>
          <p className="text-lg text-gray-600">Download your image with transparent background</p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/50 hover:shadow-indigo-200/50 transition-all duration-500">
            <div className={`relative ${showWhiteBg ? 'bg-white' : 'bg-gray-50'} rounded-2xl p-10 min-h-[400px] flex items-center justify-center shadow-inner`} style={{
              backgroundImage: showWhiteBg ? 'none' : 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}>
              {resultImage && (
                <img src={resultImage} alt="Result" className="max-w-full max-h-[600px] h-auto mx-auto rounded-xl shadow-2xl" />
              )}
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-5 justify-center">
            <button
              onClick={handleDownload}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-12 py-5 rounded-2xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PNG
            </button>
            <button
              onClick={() => setShowWhiteBg(!showWhiteBg)}
              className="bg-white/90 backdrop-blur-sm text-gray-700 px-12 py-5 rounded-2xl font-bold text-lg hover:bg-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-gray-200"
            >
              {showWhiteBg ? "🔲 Show Transparent" : "⬜ White Background"}
            </button>
            <button
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-12 py-5 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              ↻ Upload Another
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
