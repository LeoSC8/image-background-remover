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
        alert("Processing failed, please try another image");
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
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Image Background Remover</h1>
          <p className="text-xl text-gray-600">Remove background from images in seconds.</p>
          <p className="text-gray-500 mt-2">Upload an image, remove the background automatically, and download a transparent PNG instantly.</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-dashed border-gray-300">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              id="fileInput"
            />
            <label
              htmlFor="fileInput"
              className="cursor-pointer block text-center"
            >
              <div className="py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-4 text-lg">{uploading ? "Processing..." : "Click to upload or drag and drop"}</p>
                <p className="text-sm text-gray-500 mt-2">JPG, PNG or WebP</p>
              </div>
            </label>
          </div>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Upload Image</h3>
              <p className="text-gray-600">Choose your image file</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">Remove Background</h3>
              <p className="text-gray-600">Automatic processing</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">Download PNG</h3>
              <p className="text-gray-600">Get your transparent image</p>
            </div>
          </div>
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">FAQ</h2>
          <div className="space-y-4">
            <details className="bg-white p-4 rounded-lg shadow">
              <summary className="font-semibold cursor-pointer">Is this free?</summary>
              <p className="mt-2 text-gray-600">Yes, you can use this tool for free.</p>
            </details>
            <details className="bg-white p-4 rounded-lg shadow">
              <summary className="font-semibold cursor-pointer">What image formats are supported?</summary>
              <p className="mt-2 text-gray-600">We support JPG, PNG, and WebP formats.</p>
            </details>
            <details className="bg-white p-4 rounded-lg shadow">
              <summary className="font-semibold cursor-pointer">Can I make the background white?</summary>
              <p className="mt-2 text-gray-600">Yes, after processing you can switch to a white background.</p>
            </details>
            <details className="bg-white p-4 rounded-lg shadow">
              <summary className="font-semibold cursor-pointer">Does it work for product photos?</summary>
              <p className="mt-2 text-gray-600">Yes, it works great for product photos, portraits, and logos.</p>
            </details>
            <details className="bg-white p-4 rounded-lg shadow">
              <summary className="font-semibold cursor-pointer">Do I need to sign up?</summary>
              <p className="mt-2 text-gray-600">No registration required. Just upload and download.</p>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
