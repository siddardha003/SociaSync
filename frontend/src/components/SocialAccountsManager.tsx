'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Settings, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface SocialAccount {
  _id: string;
  platform: string;
  username: string;
  isActive: boolean;
  isConnected: boolean;
  lastSync?: string;
  createdAt: string;
}

export default function SocialAccountsManager() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const platforms = [
    {
      name: 'twitter',
      displayName: 'Twitter (𝕏)',
      icon: '𝕏',
      color: 'bg-black',
      description: 'Connect your Twitter account to post tweets'
    },
    {
      name: 'linkedin',
      displayName: 'LinkedIn',
      icon: '💼',
      color: 'bg-blue-700',
      description: 'Connect your LinkedIn profile to share professional content'
    },
    {
      name: 'instagram',
      displayName: 'Instagram',
      icon: '📸',
      color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500',
      description: 'Connect your Instagram account to share photos and stories'
    }
  ];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await apiClient.get('/social/accounts');
      setAccounts(response.data.accounts || []);
    } catch (error) {
      console.error('Failed to fetch social accounts:', error);
      toast.error('Failed to load social accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      setConnectingPlatform(platform);
      
      // Initiate OAuth flow
      const response = await apiClient.get(`/social/auth/${platform}`);
      
      if (response.data.authUrl) {
        // Open OAuth window
        const authWindow = window.open(
          response.data.authUrl,
          'oauth',
          'width=600,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for OAuth completion
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            setConnectingPlatform(null);
            fetchAccounts(); // Refresh accounts after OAuth
            toast.success(`${platform} account connected successfully!`);
          }
        }, 1000);
      } else {
        throw new Error('No auth URL received');
      }
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
      toast.error(`Failed to connect ${platform} account`);
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (accountId: string, platform: string) => {
    if (!confirm(`Are you sure you want to disconnect your ${platform} account?`)) {
      return;
    }

    try {
      await apiClient.delete(`/social/accounts/${accountId}`);
      toast.success(`${platform} account disconnected`);
      fetchAccounts();
    } catch (error) {
      console.error(`Failed to disconnect ${platform}:`, error);
      toast.error(`Failed to disconnect ${platform} account`);
    }
  };

  const handleToggleActive = async (accountId: string, isActive: boolean) => {
    try {
      await apiClient.patch(`/social/accounts/${accountId}`, { isActive: !isActive });
      toast.success(`Account ${!isActive ? 'activated' : 'deactivated'}`);
      fetchAccounts();
    } catch (error) {
      console.error('Failed to toggle account status:', error);
      toast.error('Failed to update account status');
    }
  };

  const handleRefresh = async (accountId: string, platform: string) => {
    try {
      await apiClient.post(`/social/accounts/${accountId}/refresh`);
      toast.success(`${platform} account refreshed`);
      fetchAccounts();
    } catch (error) {
      console.error(`Failed to refresh ${platform}:`, error);
      toast.error(`Failed to refresh ${platform} account`);
    }
  };

  const getConnectedAccount = (platform: string) => {
    return accounts.find(account => account.platform === platform);
  };

  const getStatusIcon = (account: SocialAccount) => {
    if (!account.isConnected) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (!account.isActive) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getStatusText = (account: SocialAccount) => {
    if (!account.isConnected) return 'Disconnected';
    if (!account.isActive) return 'Inactive';
    return 'Active';
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Social Accounts</h2>
          <p className="text-gray-600 mt-1">Connect your social media accounts to start posting</p>
        </div>
      </div>

      {/* Available Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => {
          const connectedAccount = getConnectedAccount(platform.name);
          const isConnecting = connectingPlatform === platform.name;

          return (
            <div key={platform.name} className="bg-white rounded-lg shadow-md border overflow-hidden">
              {/* Platform Header */}
              <div className={`${platform.color} p-4 text-white`}>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div>
                    <h3 className="font-semibold">{platform.displayName}</h3>
                    <p className="text-sm opacity-90">{platform.description}</p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="p-4">
                {connectedAccount ? (
                  <div className="space-y-4">
                    {/* Account Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(connectedAccount)}
                        <div>
                          <div className="font-medium">@{connectedAccount.username}</div>
                          <div className="text-sm text-gray-500">
                            {getStatusText(connectedAccount)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Last Sync */}
                    {connectedAccount.lastSync && (
                      <div className="text-xs text-gray-500">
                        Last synced: {new Date(connectedAccount.lastSync).toLocaleString()}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleActive(connectedAccount._id, connectedAccount.isActive)}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          connectedAccount.isActive
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {connectedAccount.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      <button
                        onClick={() => handleRefresh(connectedAccount._id, platform.name)}
                        className="px-3 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                        title="Refresh connection"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDisconnect(connectedAccount._id, platform.name)}
                        className="px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                        title="Disconnect account"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center text-gray-500 py-4">
                      <div className="text-sm">Not connected</div>
                    </div>
                    
                    <button
                      onClick={() => handleConnect(platform.name)}
                      disabled={isConnecting}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isConnecting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Connect Account</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connected Accounts Summary */}
      {accounts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {accounts.filter(a => a.isConnected && a.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Active Accounts</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {accounts.filter(a => a.isConnected && !a.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Inactive Accounts</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {accounts.length}
              </div>
              <div className="text-sm text-gray-600">Total Connected</div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
        <p className="text-blue-800 mb-4">
          Follow these steps to connect your social media accounts:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Click "Connect Account" for the platform you want to add</li>
          <li>You'll be redirected to the platform's authorization page</li>
          <li>Log in and authorize Posty Bot to access your account</li>
          <li>You'll be redirected back and your account will be connected</li>
        </ol>
        <div className="mt-4 p-3 bg-blue-100 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Make sure you have the necessary permissions on your social media accounts to create and publish posts.
          </p>
        </div>
      </div>
    </div>
  );
}