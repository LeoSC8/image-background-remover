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
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">Your Result</h1>

        <div className="max-w-4xl mx-auto">
          <div className={`bg-white rounded-lg shadow-lg p-8 ${showWhiteBg ? 'bg-white' : ''}`}>
            <div className={`relative ${showWhiteBg ? 'bg-white' : 'bg-gray-100'} rounded-lg p-4`} style={{
              backgroundImage: showWhiteBg ? 'none' : 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}>
              {resultImage && (
                <img src={resultImage} alt="Result" className="max-w-full h-auto mx-auto" />
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={handleDownload}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Download PNG
            </button>
            <button
              onClick={() => setShowWhiteBg(!showWhiteBg)}
              className="bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700"
            >
              {showWhiteBg ? "Show Transparent" : "White Background"}
            </button>
            <button
              onClick={() => router.push("/")}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              Upload Another Image
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
