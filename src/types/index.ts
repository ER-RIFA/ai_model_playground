export interface ModelPricing {
  prompt: number; // Cost per 1M tokens in USD
  completion: number; // Cost per 1M tokens in USD
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextLength: number;
  maxCompletionTokens?: number;
  pricing: ModelPricing;
  capabilities: ('Chat' | 'Code' | 'Reasoning' | 'Vision' | 'Analysis' | 'Math')[];
  isFree: boolean;
  featured?: boolean;
  architecture?: string;
  samplePrompt?: string;
  speedRating?: 'Ultra Fast' | 'Fast' | 'Balanced' | 'Heavy';
  releaseDate?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  latencyMs?: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  error?: string;
}

export interface ModelParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

export interface UsageRecord {
  id: string;
  modelId: string;
  modelName: string;
  provider: string;
  prompt: string;
  response: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  status: 'success' | 'error' | 'cancelled';
  executionMode: 'live' | 'simulation' | 'unknown';
  tokenSource: 'provider' | 'estimated';
  errorMessage?: string | null;
  createdAt: string;
}

export interface HistoryStats {
  totalRequests: number;
  totalTokens: number;
  avgLatencyMs: number;
  successRate: number;
  mostUsedModel: string;
  successfulRequests: number;
  failedRequests: number;
  cancelledRequests: number;
  liveRequests: number;
  simulatedRequests: number;
}
