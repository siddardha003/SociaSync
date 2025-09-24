'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  Sparkles,
  Settings,
  LogOut,
  Bell
} from 'lucide-react';
import PostsManager from '@/components/PostsManager';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import SocialAccountsManager from '@/components/SocialAccountsManager';
import AIContentGenerator from '@/components/AIContentGenerator';

type TabType = 'overview' | 'posts' | 'ai-generator' | 'social-accounts' | 'analytics';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    {
      id: 'overview' as TabType,
      name: 'Overview',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      id: 'posts' as TabType,
      name: 'Posts',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 'ai-generator' as TabType,
      name: 'AI Generator',
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      id: 'social-accounts' as TabType,
      name: 'Social Accounts',
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: 'analytics' as TabType,
      name: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />;
      case 'posts':
        return <PostsManager />;
      case 'ai-generator':
        return <AIContentGenerator />;
      case 'social-accounts':
        return <SocialAccountsManager />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Posty Bot</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Welcome back!</div>
                  <div className="text-gray-500">{user?.email}</div>
                </div>
                
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}

// Dashboard Overview Component
function DashboardOverview() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600 mt-1">Manage your social media presence with AI-powered content</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Connected Accounts</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">AI Generated</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Engagement</p>
              <p className="text-2xl font-bold text-gray-900">0%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Connect Your Social Accounts</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Link your Twitter, LinkedIn, and Instagram accounts to start posting
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Generate AI Content</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Use our AI generator to create engaging posts for your audience
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Schedule & Publish</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Schedule your posts for optimal times or publish immediately
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-2">🚀 Quick Actions</h4>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-2 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow">
                <div className="font-medium text-sm">Connect Twitter Account</div>
                <div className="text-xs text-gray-500">Start posting to Twitter</div>
              </button>
              
              <button className="w-full text-left px-4 py-2 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow">
                <div className="font-medium text-sm">Generate Your First Post</div>
                <div className="text-xs text-gray-500">Use AI to create content</div>
              </button>
              
              <button className="w-full text-left px-4 py-2 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow">
                <div className="font-medium text-sm">View Analytics</div>
                <div className="text-xs text-gray-500">Track your performance</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <div className="text-lg mb-2">No activity yet</div>
          <div className="text-sm">Your recent posts and activities will appear here</div>
        </div>
      </div>
    </div>
  );
}