'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Calendar, Send, Eye, EyeOff } from 'lucide-react';

interface Post {
  _id: string;
  content: string;
  platforms: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  publishResults?: Array<{
    platform: string;
    success: boolean;
    publishedId?: string;
    error?: string;
  }>;
}

export default function PostsManager() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const [formData, setFormData] = useState({
    content: '',
    platforms: [] as string[],
    scheduledAt: '',
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await apiClient.get('/posts');
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }

    if (formData.platforms.length === 0) {
      toast.error('Select at least one platform');
      return;
    }

    try {
      if (editingPost) {
        await apiClient.put(`/posts/${editingPost._id}`, formData);
        toast.success('Post updated successfully');
      } else {
        await apiClient.post('/posts', formData);
        toast.success('Post created successfully');
      }
      
      setFormData({ content: '', platforms: [], scheduledAt: '' });
      setShowCreateForm(false);
      setEditingPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Failed to save post:', error);
      toast.error('Failed to save post');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await apiClient.delete(`/posts/${postId}`);
      toast.success('Post deleted successfully');
      fetchPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setFormData({
      content: post.content,
      platforms: post.platforms,
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
    });
    setShowCreateForm(true);
  };

  const togglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

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
        <h2 className="text-2xl font-bold text-gray-900">Posts</h2>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setEditingPost(null);
            setFormData({ content: '', platforms: [], scheduledAt: '' });
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Post</span>
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <h3 className="text-lg font-semibold mb-4">
            {editingPost ? 'Edit Post' : 'Create New Post'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="What's on your mind?"
                maxLength={280}
              />
              <div className="text-sm text-gray-500 mt-1">
                {formData.content.length}/280 characters
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platforms
              </label>
              <div className="flex space-x-4">
                {['twitter', 'linkedin', 'instagram'].map((platform) => (
                  <label key={platform} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.platforms.includes(platform)}
                      onChange={() => togglePlatform(platform)}
                      className="rounded"
                    />
                    <span className="flex items-center space-x-1">
                      <span>{getPlatformIcon(platform)}</span>
                      <span className="capitalize">{platform}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>{editingPost ? 'Update' : 'Create'} Post</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingPost(null);
                  setFormData({ content: '', platforms: [], scheduledAt: '' });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-500 text-lg mb-2">No posts yet</div>
            <div className="text-gray-400">Create your first post to get started!</div>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow-md p-6 border">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                    <div className="flex space-x-1">
                      {post.platforms.map((platform) => (
                        <span key={platform} title={platform} className="text-lg">
                          {getPlatformIcon(platform)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-900 mb-3">{post.content}</p>
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>Created: {new Date(post.createdAt).toLocaleString()}</div>
                    {post.scheduledAt && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Scheduled: {new Date(post.scheduledAt).toLocaleString()}</span>
                      </div>
                    )}
                    {post.publishedAt && (
                      <div>Published: {new Date(post.publishedAt).toLocaleString()}</div>
                    )}
                  </div>

                  {/* Publish Results */}
                  {post.publishResults && post.publishResults.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="text-sm font-medium text-gray-700">Publish Results:</div>
                      {post.publishResults.map((result, index) => (
                        <div key={index} className="text-sm flex items-center space-x-2">
                          <span>{getPlatformIcon(result.platform)}</span>
                          <span className="capitalize">{result.platform}:</span>
                          {result.success ? (
                            <span className="text-green-600 flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>Published</span>
                              {result.publishedId && (
                                <span className="text-gray-500">({result.publishedId})</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center space-x-1">
                              <EyeOff className="h-3 w-3" />
                              <span>Failed</span>
                              {result.error && (
                                <span className="text-gray-500" title={result.error}>
                                  (Error)
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit post"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(post._id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}