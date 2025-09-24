'use client';

import { useState } from 'react';
import apiClient from '@/lib/api';
import { toast } from 'react-hot-toast';
import { 
  Sparkles, 
  Copy, 
  RefreshCw, 
  Send, 
  Wand2,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';

interface GeneratedContent {
  content: string;
  imagePrompt?: string;
  suggestions?: string[];
}

export default function AIContentGenerator() {
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [formData, setFormData] = useState({
    topic: '',
    tone: 'professional',
    length: 'medium',
    platform: 'all',
    includeHashtags: true,
    includeImage: false,
  });

  const toneOptions = [
    { value: 'professional', label: 'Professional', icon: '💼' },
    { value: 'casual', label: 'Casual', icon: '😊' },
    { value: 'humorous', label: 'Humorous', icon: '😄' },
    { value: 'inspirational', label: 'Inspirational', icon: '✨' },
    { value: 'informative', label: 'Informative', icon: '📚' },
  ];

  const lengthOptions = [
    { value: 'short', label: 'Short (50-100 chars)', description: 'Perfect for Twitter' },
    { value: 'medium', label: 'Medium (100-200 chars)', description: 'Good for most platforms' },
    { value: 'long', label: 'Long (200+ chars)', description: 'Great for LinkedIn' },
  ];

  const platformOptions = [
    { value: 'all', label: 'All Platforms', icon: '🌐' },
    { value: 'twitter', label: 'Twitter', icon: '𝕏' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'instagram', label: 'Instagram', icon: '📸' },
  ];

  const generateContent = async () => {
    if (!formData.topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/ai/generate-content', {
        topic: formData.topic,
        tone: formData.tone,
        length: formData.length,
        platform: formData.platform,
        includeHashtags: formData.includeHashtags,
        includeImage: formData.includeImage,
      });

      setGeneratedContent(response.data);
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Failed to generate content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const createPost = async () => {
    if (!generatedContent) return;

    try {
      const platforms = formData.platform === 'all' 
        ? ['twitter', 'linkedin', 'instagram']
        : [formData.platform];

      await apiClient.post('/posts', {
        content: generatedContent.content,
        platforms,
        status: 'draft',
      });

      toast.success('Post created as draft!');
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Sparkles className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Content Generator</h2>
          <p className="text-gray-600">Let AI help you create engaging social media content</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Wand2 className="h-5 w-5 mr-2" />
            Content Settings
          </h3>

          <div className="space-y-4">
            {/* Topic Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic or Idea
              </label>
              <textarea
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., 'productivity tips for remote workers' or 'benefits of morning exercise'"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </div>

            {/* Tone Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <div className="grid grid-cols-2 gap-2">
                {toneOptions.map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value={option.value}
                      checked={formData.tone === option.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value }))}
                      className="text-purple-600"
                    />
                    <span>{option.icon}</span>
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Length Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Length
              </label>
              <div className="space-y-2">
                {lengthOptions.map((option) => (
                  <label key={option.value} className="flex items-start space-x-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value={option.value}
                      checked={formData.length === option.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                      className="text-purple-600 mt-0.5"
                    />
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {platformOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.includeHashtags}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeHashtags: e.target.checked }))}
                  className="rounded text-purple-600"
                />
                <span className="text-sm">Include relevant hashtags</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.includeImage}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeImage: e.target.checked }))}
                  className="rounded text-purple-600"
                />
                <span className="text-sm">Generate image prompt</span>
              </label>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateContent}
              disabled={loading || !formData.topic.trim()}
              className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Generate Content</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated Content */}
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Generated Content
          </h3>

          {generatedContent ? (
            <div className="space-y-4">
              {/* Main Content */}
              <div className="relative">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="prose prose-sm">
                    {generatedContent.content}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedContent.content)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              {/* Character Count */}
              <div className="text-sm text-gray-500">
                {generatedContent.content.length} characters
              </div>

              {/* Image Prompt */}
              {generatedContent.imagePrompt && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Image Prompt:</h4>
                  <div className="relative">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="text-sm text-blue-900">
                        {generatedContent.imagePrompt}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(generatedContent.imagePrompt!)}
                      className="absolute top-2 right-2 p-1 text-blue-400 hover:text-blue-600 transition-colors"
                      title="Copy image prompt"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {generatedContent.suggestions && generatedContent.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Variations:</h4>
                  <div className="space-y-2">
                    {generatedContent.suggestions.map((suggestion, index) => (
                      <div key={index} className="relative">
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <div className="text-sm text-green-900">
                            {suggestion}
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(suggestion)}
                          className="absolute top-2 right-2 p-1 text-green-400 hover:text-green-600 transition-colors"
                          title="Copy variation"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={generateContent}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Regenerate</span>
                </button>
                
                <button
                  onClick={createPost}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>Create Post</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div className="text-lg mb-2">No content generated yet</div>
              <div className="text-sm">Fill in the form and click &quot;Generate Content&quot; to get started</div>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Tips for Better Results
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">💡 Be Specific</h4>
            <p className="text-sm text-gray-600">
              Instead of &quot;health tips&quot;, try &quot;5 morning habits for better energy&quot;
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🎯 Include Context</h4>
            <p className="text-sm text-gray-600">
              Add details like your target audience or specific benefits
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">📝 Choose the Right Tone</h4>
            <p className="text-sm text-gray-600">
              Match your brand voice - professional for B2B, casual for lifestyle
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">📱 Platform Matters</h4>
            <p className="text-sm text-gray-600">
              LinkedIn content differs from Twitter - select the right platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
