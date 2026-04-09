"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (type: string, item: any) => {
    if (!session) {
      alert("请先登录");
      return;
    }

    setLoading(item.id);
    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          itemId: item.id,
          amount: item.price,
          credits: item.credits,
          membershipType: item.membershipType,
          durationDays: item.durationDays,
        }),
      });

      if (!response.ok) {
        throw new Error("购买失败");
      }

      const data = await response.json();
      alert(`购买成功！${type === "credit_pack" ? `已添加 ${item.credits} 次额度` : `已升级为 ${item.name} 会员`}`);
      router.push("/profile");
    } catch (error) {
      alert("购买失败，请稍后重试");
    } finally {
      setLoading(null);
    }
  };

  const creditPacks = [
    { id: "pack_10", name: "10次额度包", credits: 10, price: 0.3, perCredit: 0.03 },
    { id: "pack_50", name: "50次额度包", credits: 50, price: 1.2, perCredit: 0.024, popular: true },
    { id: "pack_200", name: "200次额度包", credits: 200, price: 3.6, perCredit: 0.018, bestValue: true },
  ];

  const memberships = [
    {
      id: "premium",
      name: "Premium",
      membershipType: "premium",
      price: 1.99,
      durationDays: 30,
      credits: 100,
      features: [
        "每月100次处理额度",
        "无水印输出",
        "最大10MB文件",
        "4K分辨率支持",
        "优先处理速度",
      ],
    },
    {
      id: "vip",
      name: "VIP",
      membershipType: "vip",
      price: 4.99,
      durationDays: 30,
      credits: -1, // unlimited
      features: [
        "无限次处理额度",
        "无水印输出",
        "最大10MB文件",
        "4K分辨率支持",
        "最高优先级处理",
        "专属客服支持",
      ],
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Pricing Plans
          </h1>
          <p className="text-xl text-gray-600">
            选择适合您的方案，开始高效去除图片背景
          </p>
        </div>

        {/* Free Tier Info */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">免费用户</h3>
              <p className="text-gray-600">注册即可享受基础功能</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900">$0</div>
              <div className="text-gray-500">永久免费</div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              每日5次处理额度
            </div>
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              最大10MB文件
            </div>
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              4K分辨率支持
            </div>
          </div>
        </div>

        {/* Membership Plans */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            会员套餐
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {memberships.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                  plan.popular ? "ring-4 ring-purple-500" : "border-2 border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-1 rounded-full text-sm font-semibold">
                      最受欢迎
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-500 ml-2">/月</span>
                  </div>
                  <p className="text-gray-600 mt-2">
                    {plan.credits === -1 ? "无限次处理" : `每月${plan.credits}次处理`}
                  </p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg
                        className="w-6 h-6 text-green-500 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePurchase("membership", plan)}
                  disabled={loading === plan.id}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === plan.id ? "处理中..." : "立即订阅"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Packs */}
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            额度包
          </h2>
          <p className="text-center text-gray-600 mb-8">
            按需购买，永久有效，适合偶尔使用的用户
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPacks.map((pack) => (
              <div
                key={pack.id}
                className={`relative bg-white rounded-xl shadow-lg p-6 ${
                  pack.popular
                    ? "ring-2 ring-purple-400"
                    : pack.bestValue
                    ? "ring-2 ring-green-400"
                    : "border-2 border-gray-200"
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
                      热门
                    </span>
                  </div>
                )}
                {pack.bestValue && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
                      最划算
                    </span>
                  </div>
                )}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {pack.credits} 次
                  </h3>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    ${pack.price}
                  </div>
                  <p className="text-sm text-gray-500">
                    平均 ${pack.perCredit.toFixed(3)}/次
                  </p>
                </div>
                <button
                  onClick={() => handlePurchase("credit_pack", pack)}
                  disabled={loading === pack.id}
                  className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === pack.id ? "处理中..." : "立即购买"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Unauthenticated Users Info */}
        <div className="mt-16 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            未登录用户限制
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              每日仅3次处理
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              最大2MB文件
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              输出带水印
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.push("/")}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← 返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
