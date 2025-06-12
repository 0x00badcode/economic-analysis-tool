import { GoogleGenAI, Type } from '@google/genai';

export interface AIToolConfig {
  apiKey?: string;
  model?: string;
  responseMimeType?: string;
  useStructuredOutput?: boolean;
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
      model: config?.model || 'gemini-2.0-flash',
      responseMimeType: config?.responseMimeType || 'application/json',
      useStructuredOutput: config?.useStructuredOutput ?? true,
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

  /**
   * Generate structured decision analysis using the AI model with JSON schema
   */
  async generateDecisionAnalysis(analysisData: any): Promise<{
    best_solution: string;
    justification_key_points: string;
    justification_long: string;
  }> {
    const modelConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          best_solution: {
            type: Type.STRING,
          },
          justification_key_points: {
            type: Type.STRING,
          },
          justification_long: {
            type: Type.STRING,
          },
        },
      },
      systemInstruction: [
        {
          text: `You are a financial decision analysis engine. You will be provided with structured JSON data representing multiple economic decision options. Each option includes numeric attributes such as expected value, return on investment (ROI), average cost and value, success and failure probabilities, and risk level. Your task is to evaluate these options and determine the best decision strictly based on this numerical data.

You must output your analysis using the following enforced JSON schema:
Guidelines for each field:

* **best_solution**: Write the exact name of the decision option (as given in the input) that is numerically the best based on overall expected value. If there is a tie, choose the one with better ROI or lower risk.

* **justification_key_points**: Summarize in 1–2 sentences the key numeric reasons why this option is best (e.g., highest expected value, superior ROI, lower failure rate). Only include numbers, percentages, or comparisons.

* **justification_long**: Provide a detailed, objective numeric analysis comparing all options. Use expected value as the primary factor. Discuss secondary factors such as ROI, risk level, success/failure rates, and cost/value ratios. Do not mention any non-numerical criteria (e.g., feasibility, strategy, market conditions). Only use data from the input.

Never speculate or include qualitative reasoning. Output must strictly reflect the numeric superiority of one option over others.`,
        }
      ],
    };

    const model = this.defaultConfig.model;
    
    const contents = [
      {
        role: 'user' as const,
        parts: [
          {
            text: JSON.stringify(analysisData, null, 2),
          },
        ],
      },
    ];

    const response = await this.ai.models.generateContent({
      model,
      config: modelConfig,
      contents,
    });

    try {
      const result = JSON.parse(response.text || '{}');
      return {
        best_solution: result.best_solution || '',
        justification_key_points: result.justification_key_points || '',
        justification_long: result.justification_long || '',
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        best_solution: 'Unable to determine',
        justification_key_points: 'AI analysis failed to provide structured output.',
        justification_long: 'The AI analysis could not be completed due to a parsing error.',
      };
    }
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
