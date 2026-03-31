"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        sessionStorage.setItem("resultImage", url);
        sessionStorage.setItem("originalImage", URL.createObjectURL(file));
        router.push("/result");
      } else {
        alert("Processing failed");
      }
    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-screen px-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Remove Background
            </h1>
            <p className="text-xl text-gray-700">
              Upload your image and get a transparent background instantly
            </p>
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="fileInput"
          />
          <label htmlFor="fileInput" className="block cursor-pointer">
            <div className="bg-white/90 backdrop-blur-sm border-2 border-dashed border-gray-300 rounded-2xl p-16 hover:border-purple-400 hover:bg-white transition-all shadow-xl">
              {uploading ? (
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg text-gray-700 font-medium">Processing...</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-xl font-semibold text-gray-800 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, WebP (Max 10MB)
                  </p>
                </div>
              )}
            </div>
          </label>
        </div>
      </main>
    </div>
  );
}
