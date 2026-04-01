"use client";

import { useState, useRef } from "react";

export default function Home() {
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

  return (
    <main
      className="min-h-screen bg-white flex items-center justify-center p-8"
      onPaste={handlePaste}
    >
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Remove Background From Images
          </h1>
          <p className="text-xl text-gray-600">
            100% Automatically and Free
          </p>
        </div>

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
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-xl font-semibold text-gray-800 mb-2">
            Upload Image
          </p>
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
                <img
                  src={image!}
                  alt="原图"
                  className="w-full rounded-xl shadow-lg"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">处理后</h3>
                <div className="relative">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%,transparent_75%,#f0f0f0_75%,#f0f0f0),linear-gradient(45deg,#f0f0f0_25%,transparent_25%,transparent_75%,#f0f0f0_75%,#f0f0f0)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] rounded-xl"></div>
                  <img
                    src={result}
                    alt="处理后"
                    className="relative w-full rounded-xl shadow-lg"
                  />
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
