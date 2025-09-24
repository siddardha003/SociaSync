'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Users, 
  MessageSquare,
  Eye,
  Share2,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  failedPosts: number;
  platformStats: {
    platform: string;
    count: number;
    successRate: number;
  }[];
  recentActivity: {
    date: string;
    postsCount: number;
  }[];
}

interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Simulate analytics API call
      const response = await apiClient.get('/posts');
      const posts = response.data.posts || [];
      
      // Calculate analytics from posts data
      const totalPosts = posts.length;
  const publishedPosts = posts.filter((p: { status: string }) => p.status === 'published').length;
  const scheduledPosts = posts.filter((p: { status: string }) => p.status === 'scheduled').length;
  const failedPosts = posts.filter((p: { status: string }) => p.status === 'failed').length;

      // Platform statistics
      const platformCounts: { [key: string]: { total: number; successful: number } } = {};
      posts.forEach((post: { platforms: string[]; status: string }) => {
        post.platforms.forEach((platform: string) => {
          if (!platformCounts[platform]) {
            platformCounts[platform] = { total: 0, successful: 0 };
          }
          platformCounts[platform].total++;
          if (post.status === 'published') {
            platformCounts[platform].successful++;
          }
        });
      });

      const platformStats = Object.entries(platformCounts).map(([platform, stats]) => ({
        platform,
        count: stats.total,
        successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0
      }));

      // Recent activity (last 7 days)
      const now = new Date();
      const recentActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const postsCount = posts.filter((post: { createdAt: string }) => {
          const postDate = new Date(post.createdAt).toISOString().split('T')[0];
          return postDate === dateStr;
        }).length;

        recentActivity.push({
          date: dateStr,
          postsCount
        });
      }

      setAnalytics({
        totalPosts,
        publishedPosts,
        scheduledPosts,
        failedPosts,
        platformStats,
        recentActivity
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSuccessRate = () => {
    if (!analytics || analytics.totalPosts === 0) return 0;
    return Math.round((analytics.publishedPosts / analytics.totalPosts) * 100);
  };

  const statCards: StatCard[] = [
    {
      title: 'Total Posts',
      value: analytics?.totalPosts || 0,
      icon: <MessageSquare className="h-6 w-6" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Published',
      value: analytics?.publishedPosts || 0,
      icon: <Eye className="h-6 w-6" />,
      color: 'bg-green-500',
    },
    {
      title: 'Scheduled',
      value: analytics?.scheduledPosts || 0,
      icon: <Clock className="h-6 w-6" />,
      color: 'bg-yellow-500',
    },
    {
      title: 'Success Rate',
      value: `${calculateSuccessRate()}%`,
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'bg-purple-500',
    }
  ];

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return '𝕏';
      case 'linkedin': return '💼';
      case 'instagram': return '📸';
      default: return '📱';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                {card.change && (
                  <p className={`text-xs ${
                    card.changeType === 'increase' ? 'text-green-600' : 
                    card.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {card.change}
                  </p>
                )}
              </div>
              <div className={`${card.color} text-white p-3 rounded-lg`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Performance */}
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Platform Performance
          </h3>
          
          {analytics?.platformStats && analytics.platformStats.length > 0 ? (
            <div className="space-y-4">
              {analytics.platformStats.map((stat) => (
                <div key={stat.platform} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getPlatformIcon(stat.platform)}</span>
                      <span className="font-medium capitalize">{stat.platform}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {stat.count} posts • {Math.round(stat.successRate)}% success
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stat.successRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No platform data available
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Activity
          </h3>
          
          {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex justify-between items-center py-2">
                  <div className="text-sm text-gray-600">
                    {new Date(activity.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium">{activity.postsCount} posts</div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${Math.max(20, (activity.postsCount / Math.max(...analytics.recentActivity.map(a => a.postsCount))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No activity data available
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics?.totalPosts || 0}</div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analytics?.publishedPosts || 0}</div>
            <div className="text-sm text-gray-600">Published</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{analytics?.scheduledPosts || 0}</div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{analytics?.failedPosts || 0}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
