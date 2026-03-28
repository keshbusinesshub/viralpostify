import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateContentDto, GenerationType } from './dto/generate.dto';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('openai.apiKey') || 'sk-placeholder',
    });
  }

  async generate(dto: GenerateContentDto) {
    const systemPrompt = this.buildSystemPrompt(dto.type, dto.platform, dto.tone);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: dto.prompt },
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content || '';

    return {
      type: dto.type,
      content,
      platform: dto.platform,
      usage: {
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
      },
    };
  }

  async generateImage(prompt: string, size?: string, style?: string) {
    try {
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: `${prompt}${style ? `. Art style: ${style}` : ''}`,
        n: 1,
        size: (size as any) || '1024x1024',
        quality: 'standard',
      });

      return {
        url: response.data?.[0]?.url,
        revisedPrompt: response.data?.[0]?.revised_prompt,
      };
    } catch (err: any) {
      return {
        error: err.message || 'Image generation failed. Ensure your API key supports DALL-E 3.',
      };
    }
  }

  private buildSystemPrompt(
    type: GenerationType,
    platform?: string,
    tone?: string,
  ): string {
    const platformContext = platform
      ? ` optimized for ${platform}`
      : '';
    const toneContext = tone ? ` in a ${tone} tone` : '';

    switch (type) {
      case GenerationType.CAPTION:
        return `You are a social media expert. Generate an engaging caption${platformContext}${toneContext}. Return only the caption text, no extra formatting.`;

      case GenerationType.HASHTAGS:
        return `You are a social media expert. Generate relevant, trending hashtags${platformContext}. Return only the hashtags separated by spaces, starting with #. Include 10-15 hashtags.`;

      case GenerationType.FULL_POST:
        return `You are a social media expert. Generate a complete social media post${platformContext}${toneContext}. Include both the caption and relevant hashtags. Format with caption first, then a line break, then hashtags.`;

      default:
        return `You are a social media content assistant. Help create engaging content${platformContext}${toneContext}.`;
    }
  }
}
