import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { aiService } from '../services/aiService';
import { AuthenticatedRequest, AIGenerationRequest } from '../types';

const router = express.Router();

// Generate content using AI
router.post('/generate', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { prompt, type, platform, tone, length }: AIGenerationRequest = req.body;

    // Validation
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!type || !['caption', 'image', 'both'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "caption", "image", or "both"' });
    }

    if (platform && !['twitter', 'linkedin', 'instagram'].includes(platform)) {
      return res.status(400).json({ error: 'Platform must be "twitter", "linkedin", or "instagram"' });
    }

    if (tone && !['professional', 'casual', 'funny', 'inspirational'].includes(tone)) {
      return res.status(400).json({ error: 'Tone must be "professional", "casual", "funny", or "inspirational"' });
    }

    if (length && !['short', 'medium', 'long'].includes(length)) {
      return res.status(400).json({ error: 'Length must be "short", "medium", or "long"' });
    }

    // Generate content
    const result = await aiService.generateContent({
      prompt,
      type,
      platform,
      tone,
      length
    });

    res.json({
      success: true,
      data: result,
      metadata: {
        prompt,
        type,
        platform,
        tone,
        length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI generation error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return res.status(500).json({ 
          error: 'AI service configuration error',
          details: 'OpenAI API key is not configured'
        });
      }
      
      if (error.message.includes('quota')) {
        return res.status(429).json({ 
          error: 'AI service quota exceeded',
          details: 'Please try again later'
        });
      }
      
      if (error.message.includes('content_policy')) {
        return res.status(400).json({ 
          error: 'Content policy violation',
          details: 'The prompt violates content policy guidelines'
        });
      }
    }

    res.status(500).json({ 
      error: 'Failed to generate content',
      details: 'Please try again with a different prompt'
    });
  }
});

// Enhance a prompt for better AI generation
router.post('/enhance-prompt', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { prompt, platform, tone } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const enhancedPrompt = await aiService.enhancePrompt(prompt, { platform, tone });

    res.json({
      success: true,
      data: {
        originalPrompt: prompt,
        enhancedPrompt,
        suggestions: [
          'Make it more specific and detailed',
          'Include target audience information',
          'Add emotional triggers or call-to-action',
          'Consider trending topics or hashtags'
        ]
      }
    });

  } catch (error) {
    console.error('Prompt enhancement error:', error);
    res.status(500).json({ error: 'Failed to enhance prompt' });
  }
});

// Get AI generation suggestions based on trending topics (placeholder)
router.get('/suggestions', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { platform } = req.query;

    // TODO: Implement trending topics API integration
    // For now, return static suggestions
    const suggestions = {
      general: [
        'Share a behind-the-scenes moment from your day',
        'Ask your audience a thought-provoking question',
        'Share a valuable tip related to your industry',
        'Post an inspirational quote with personal commentary',
        'Share a recent achievement or milestone'
      ],
      twitter: [
        'Share a quick tip in a thread format',
        'Retweet with commentary on trending topics',
        'Share a poll to engage your audience',
        'Post a motivational Monday message',
        'Share industry news with your perspective'
      ],
      linkedin: [
        'Share professional insights or lessons learned',
        'Post about industry trends and their impact',
        'Share career advice or professional tips',
        'Discuss workplace culture and best practices',
        'Share thought leadership content'
      ],
      instagram: [
        'Post a carousel with tips or insights',
        'Share a day-in-the-life story',
        'Create a before/after transformation post',
        'Share user-generated content',
        'Post aesthetic quotes with branded visuals'
      ]
    };

    const platformSuggestions = platform && typeof platform === 'string' 
      ? suggestions[platform as keyof typeof suggestions] || suggestions.general
      : suggestions.general;

    res.json({
      success: true,
      data: {
        platform: platform || 'general',
        suggestions: platformSuggestions,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Get AI service status and usage (placeholder)
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // TODO: Implement actual OpenAI API usage tracking
    res.json({
      success: true,
      data: {
        service: 'OpenAI',
        status: 'operational',
        models: {
          textGeneration: 'gpt-4',
          imageGeneration: 'dall-e-3'
        },
        usage: {
          textGenerationsToday: 0, // TODO: Track actual usage
          imageGenerationsToday: 0,
          remainingQuota: 'unlimited' // TODO: Get from OpenAI API
        },
        lastChecked: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI status error:', error);
    res.status(500).json({ error: 'Failed to get AI service status' });
  }
});

export default router;