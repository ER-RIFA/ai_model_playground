import { NextResponse } from 'next/server';
import { POPULAR_MODELS } from '@/data/models';
import { AIModel } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 },
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (response && response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.data)) {
        // Enriched list starting with our curated popular models, plus any additional top models from OpenRouter
        const popularMap = new Map<string, AIModel>(
          POPULAR_MODELS.map((m) => [m.id, m])
        );

        const fetchedModels: AIModel[] = data.data
          .filter((item: any) => item && item.id)
          .slice(0, 50) // Take top 50
          .map((item: any): AIModel => {
            const existing = popularMap.get(item.id);
            if (existing) {
              return existing;
            }

            const promptPrice = item.pricing?.prompt ? parseFloat(item.pricing.prompt) * 1000000 : 0;
            const completionPrice = item.pricing?.completion ? parseFloat(item.pricing.completion) * 1000000 : 0;
            const isFree = item.id.includes(':free') || (promptPrice === 0 && completionPrice === 0);

            // Infer provider
            let provider = 'Other';
            if (item.id.startsWith('openai/')) provider = 'OpenAI';
            else if (item.id.startsWith('anthropic/')) provider = 'Anthropic';
            else if (item.id.startsWith('google/')) provider = 'Google';
            else if (item.id.startsWith('meta-llama/')) provider = 'Meta';
            else if (item.id.startsWith('deepseek/')) provider = 'DeepSeek';
            else if (item.id.startsWith('mistralai/')) provider = 'Mistral';
            else if (item.id.startsWith('qwen/')) provider = 'Alibaba';
            else if (item.id.startsWith('cohere/')) provider = 'Cohere';

            const capabilities: ('Chat' | 'Code' | 'Reasoning' | 'Vision' | 'Analysis' | 'Math')[] = ['Chat'];
            const lowerId = item.id.toLowerCase();
            const lowerDesc = (item.description || '').toLowerCase();

            if (lowerId.includes('code') || lowerDesc.includes('code') || lowerDesc.includes('programming')) {
              capabilities.push('Code');
            }
            if (lowerId.includes('r1') || lowerId.includes('reason') || lowerDesc.includes('reasoning') || lowerDesc.includes('thought')) {
              capabilities.push('Reasoning');
            }
            if (lowerDesc.includes('vision') || lowerDesc.includes('multimodal') || lowerDesc.includes('image')) {
              capabilities.push('Vision');
            }
            if (lowerDesc.includes('math')) {
              capabilities.push('Math');
            }

            return {
              id: item.id,
              name: item.name || item.id.split('/')[1] || item.id,
              provider,
              description: item.description || 'Advanced general-purpose language model.',
              contextLength: item.context_length || 32768,
              maxCompletionTokens: item.top_provider?.max_completion_tokens || 4096,
              pricing: {
                prompt: Number(promptPrice.toFixed(4)),
                completion: Number(completionPrice.toFixed(4)),
              },
              capabilities,
              isFree,
              architecture: item.architecture?.modality || 'Transformer',
            };
          });

        // Ensure popular models are at the top
        const combined = [...POPULAR_MODELS];
        for (const model of fetchedModels) {
          if (!popularMap.has(model.id)) {
            combined.push(model);
          }
        }

        return NextResponse.json({
          models: combined,
          source: 'openrouter',
          count: combined.length,
        });
      }
    }

    // Fallback to our high-quality curated list
    return NextResponse.json({
      models: POPULAR_MODELS,
      source: 'curated_cache',
      count: POPULAR_MODELS.length,
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({
      models: POPULAR_MODELS,
      source: 'fallback',
      count: POPULAR_MODELS.length,
    });
  }
}
