import OpenAI from 'openai';
import { AIGenerationRequest, AIGenerationResponse } from '../types';

export class AIService {
  private openai: OpenAI | null = null;

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required. Please set the OPENAI_API_KEY environment variable.');
      }

      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  async generateContent(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const response: AIGenerationResponse = {};

    try {
      // Generate captions if requested
      if (request.type === 'caption' || request.type === 'both') {
        response.captions = await this.generateCaptions(request);
      }

      // Generate image if requested
      if (request.type === 'image' || request.type === 'both') {
        const imageResult = await this.generateImage(request.prompt);
        response.imagePrompt = request.prompt;
        response.imageUrl = imageResult;
      }

      return response;
    } catch (error) {
      console.error('AI generation error:', error);
      throw new Error('Failed to generate content');
    }
  }

  private async generateCaptions(request: AIGenerationRequest): Promise<string[]> {
    const platformLimits = {
      twitter: 280,
      linkedin: 3000,
      instagram: 2200
    };

    const platformContext = request.platform ? ` for ${request.platform}` : '';
    const toneContext = request.tone ? ` in a ${request.tone} tone` : '';
    const lengthContext = this.getLengthGuideline(request.length, request.platform);

    const systemPrompt = `You are a social media content creator. Generate engaging social media captions${platformContext}${toneContext}. ${lengthContext}

    Guidelines:
    - Make it engaging and authentic
    - Include relevant hashtags when appropriate
    - Consider the platform's best practices
    - Generate 3 different variations
    - Each caption should be complete and ready to post
    ${request.platform ? `- Stay within ${platformLimits[request.platform]} characters` : ''}`;

    const openai = this.getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    // Split into variations (assuming AI returns numbered list)
    const captions = content
      .split(/\d+\.\s/)
      .filter(caption => caption.trim().length > 0)
      .map(caption => caption.trim())
      .slice(0, 3); // Ensure we only get 3 variations

    return captions.length > 0 ? captions : [content];
  }

  private async generateImage(prompt: string): Promise<string> {
    try {
      const openai = this.getOpenAI();
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: `Create a professional, high-quality image for social media: ${prompt}`,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL received');
      }

      return imageUrl;
    } catch (error) {
      console.error('DALL-E generation error:', error);
      throw new Error('Failed to generate image');
    }
  }

  private getLengthGuideline(length?: string, platform?: string): string {
    if (!length) return '';

    const guidelines = {
      short: 'Keep it concise and punchy (1-2 sentences)',
      medium: 'Use moderate length (2-4 sentences)',
      long: 'Create detailed, comprehensive content (multiple paragraphs)'
    };

    return guidelines[length as keyof typeof guidelines] || '';
  }

  // Method to enhance prompts for better AI generation
  async enhancePrompt(originalPrompt: string, context?: { platform?: string; tone?: string }): Promise<string> {
    const systemPrompt = `You are a prompt engineering expert. Enhance the following prompt to get better social media content generation results. Make it more specific, engaging, and optimized for ${context?.platform || 'social media'} with a ${context?.tone || 'engaging'} tone. Return only the enhanced prompt.`;

    const openai = this.getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: originalPrompt }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    return completion.choices[0]?.message?.content || originalPrompt;
  }
}

export const aiService = new AIService();