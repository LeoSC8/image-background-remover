'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  image: string;
  createdAt: string;
  lastLogin: string;
  usageCount: number;
  creditsRemaining: number;
  membershipType: string;
  membershipExpiresAt: string | null;
  totalCreditsPurchased: number;
}

interface UsageHistoryItem {
  id: string;
  action_type: string;
  credits_used: number;
  created_at: string;
  image_size: number;
  status: string;
  error_message: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<UsageHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchProfile();
      fetchHistory(1);
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchHistory = async (page: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user/history?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
        setTotalPages(data.pagination.totalPages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMembershipBadge = (type: string) => {
    const badges = {
      free: { text: '免费用户', color: 'bg-gray-500' },
      premium: { text: '高级会员', color: 'bg-blue-500' },
      vip: { text: 'VIP会员', color: 'bg-yellow-500' },
    };
    const badge = badges[type as keyof typeof badges] || badges.free;
    return (
      <span className={`${badge.color} text-white px-3 py-1 rounded-full text-sm`}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">无法加载用户信息</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">个人中心</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            返回首页
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-6 mb-6">
            {profile.image && (
              <img
                src={profile.image}
                alt={profile.name}
                className="w-20 h-20 rounded-full"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{profile.name}</h2>
              <p className="text-gray-600 mb-2">{profile.email}</p>
              {getMembershipBadge(profile.membershipType)}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">剩余额度</div>
              <div className="text-3xl font-bold text-blue-600">
                {profile.membershipType === 'vip' ? '∞' : profile.creditsRemaining}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {profile.membershipType === 'free' && '每日5次'}
                {profile.membershipType === 'premium' && '每月100次'}
                {profile.membershipType === 'vip' && '无限次'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">累计使用</div>
              <div className="text-3xl font-bold text-green-600">{profile.usageCount}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">累计购买</div>
              <div className="text-3xl font-bold text-purple-600">{profile.totalCreditsPurchased}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">注册时间</div>
              <div className="text-sm font-medium text-orange-600">
                {new Date(profile.createdAt).toLocaleDateString('zh-CN')}
              </div>
            </div>
          </div>

          {/* Membership Info */}
          {profile.membershipExpiresAt && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-xl">
              <div className="text-sm text-gray-600">
                会员到期时间: {formatDate(profile.membershipExpiresAt)}
              </div>
            </div>
          )}

          {/* Purchase Button */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => router.push('/pricing')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow"
            >
              购买额度
            </button>
            <button
              onClick={() => router.push('/pricing')}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow"
            >
              升级会员
            </button>
          </div>
        </div>

        {/* Usage History */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">使用记录</h2>

          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无使用记录</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-gray-600 font-semibold">时间</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-semibold">操作类型</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-semibold">图片大小</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-semibold">消耗额度</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-semibold">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">{formatDate(item.created_at)}</td>
                        <td className="py-3 px-4 text-sm">背景移除</td>
                        <td className="py-3 px-4 text-sm">{formatFileSize(item.image_size)}</td>
                        <td className="py-3 px-4 text-sm">{item.credits_used}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              item.status === 'success'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {item.status === 'success' ? '成功' : '失败'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => fetchHistory(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <span className="px-4 py-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => fetchHistory(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
