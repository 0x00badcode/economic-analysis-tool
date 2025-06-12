import { GoogleGenAI } from '@google/genai';

export interface AIToolConfig {
  apiKey?: string;
  model?: string;
  responseMimeType?: string;
}

export interface AIToolOptions {
  input: string;
  config?: AIToolConfig;
  streaming?: boolean;
}

export class AITool {
  private ai: GoogleGenAI;
  private defaultConfig: Required<AIToolConfig>;

  constructor(config?: AIToolConfig) {
    // Try to get API key from config, environment, or localStorage
    const apiKey = config?.apiKey || 
                   process.env.GEMINI_API_KEY || 
                   (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null);
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required. Please set it in your environment variables, pass it in the config, or configure it in the app settings.');
    }

    this.ai = new GoogleGenAI({
      apiKey,
    });

    this.defaultConfig = {
      apiKey,
      model: config?.model || 'gemma-3-27b-it',
      responseMimeType: config?.responseMimeType || 'text/plain',
    };
  }

  /**
   * Generate content using the AI model with streaming response
   */
  async generateContentStream(options: AIToolOptions): Promise<AsyncGenerator<string, void, unknown>> {
    const { input, config = {} } = options;
    
    const modelConfig = {
      responseMimeType: config.responseMimeType || this.defaultConfig.responseMimeType,
    };

    const model = config.model || this.defaultConfig.model;
    
    const contents = [
      {
        role: 'user' as const,
        parts: [
          {
            text: input,
          },
        ],
      },
    ];

    const response = await this.ai.models.generateContentStream({
      model,
      config: modelConfig,
      contents,
    });

    return this.streamGenerator(response);
  }

  /**
   * Generate content using the AI model with a complete response
   */
  async generateContent(options: AIToolOptions): Promise<string> {
    const { input, config = {} } = options;
    
    const modelConfig = {
      responseMimeType: config.responseMimeType || this.defaultConfig.responseMimeType,
    };

    const model = config.model || this.defaultConfig.model;
    
    const contents = [
      {
        role: 'user' as const,
        parts: [
          {
            text: input,
          },
        ],
      },
    ];

    const response = await this.ai.models.generateContent({
      model,
      config: modelConfig,
      contents,
    });

    return response.text || '';
  }

  /**
   * Helper method to convert the response stream to an async generator
   */
  private async* streamGenerator(response: any): AsyncGenerator<string, void, unknown> {
    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }

  /**
   * Utility method to collect all streaming chunks into a single string
   */
  async collectStreamedResponse(options: AIToolOptions): Promise<string> {
    const stream = await this.generateContentStream(options);
    let fullResponse = '';
    
    for await (const chunk of stream) {
      fullResponse += chunk;
    }
    
    return fullResponse;
  }
}

// Convenience function for quick usage
export async function generateAIContent(
  input: string, 
  config?: AIToolConfig,
  streaming: boolean = false
): Promise<string | AsyncGenerator<string, void, unknown>> {
  const aiTool = new AITool(config);
  
  if (streaming) {
    return aiTool.generateContentStream({ input, config });
  } else {
    return aiTool.generateContent({ input, config });
  }
}

// Default instance for simple usage
let defaultAITool: AITool | null = null;

export function getDefaultAITool(config?: AIToolConfig): AITool {
  if (!defaultAITool) {
    defaultAITool = new AITool(config);
  }
  return defaultAITool;
}

// Utility functions for API key management
export function getApiKeyFromStorage(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gemini_api_key');
  }
  return null;
}

export function setApiKeyInStorage(apiKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gemini_api_key', apiKey);
  }
}

export function removeApiKeyFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gemini_api_key');
  }
}

export function hasApiKey(): boolean {
  return !!(process.env.GEMINI_API_KEY || getApiKeyFromStorage());
}
