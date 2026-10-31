import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { POPULAR_MODELS } from '@/data/models';
import { estimateTokens } from '@/lib/utils';
import { attachSessionCookie, getSession, SessionConfigurationError } from '@/lib/session';
import { consumeRateLimit, getClientAddress } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const session = getSession(req);
    const rateLimit = consumeRateLimit(`chat:${getClientAddress(req)}`, 30, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Inference rate limit exceeded. Try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 1_000_000) {
      return NextResponse.json({ error: 'Request payload is too large.' }, { status: 413 });
    }

    const body = await req.json();
    const {
      model = 'deepseek/deepseek-r1:free',
      messages = [],
      temperature = 0.7,
      maxTokens = 2048,
      topP = 1.0,
      systemPrompt = '',
      customApiKey = '',
    } = body;

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 100) {
      return NextResponse.json(
        { error: 'Invalid request: messages must contain between 1 and 100 items.' },
        { status: 400 }
      );
    }

    const validMessages = messages.every((message: unknown) => {
      if (!message || typeof message !== 'object') return false;
      const item = message as { role?: unknown; content?: unknown };
      return ['user', 'assistant', 'system'].includes(String(item.role))
        && typeof item.content === 'string'
        && item.content.length <= 100_000;
    });
    if (!validMessages) {
      return NextResponse.json({ error: 'Each message must have a valid role and content.' }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    if (!lastUserMessage.trim()) {
      return NextResponse.json({ error: 'A non-empty user message is required.' }, { status: 400 });
    }
    if (typeof model !== 'string' || model.length < 1 || model.length > 200) {
      return NextResponse.json({ error: 'Invalid model identifier.' }, { status: 400 });
    }
    if (![temperature, maxTokens, topP].every((value) => typeof value === 'number' && Number.isFinite(value))) {
      return NextResponse.json({ error: 'Generation parameters must be finite numbers.' }, { status: 400 });
    }
    if (typeof customApiKey !== 'string' || (customApiKey && !/^sk-or-v1-[A-Za-z0-9_-]{20,}$/.test(customApiKey.trim()))) {
      return NextResponse.json({ error: 'Invalid OpenRouter key format.' }, { status: 400 });
    }
    const activeModel = POPULAR_MODELS.find((m) => m.id === model) || {
      id: model,
      name: model.split('/')[1] || model,
      provider: model.split('/')[0] || 'AI Model',
    };

    // Determine API Key: Client BYOK takes precedence, followed by Server .env
    const apiKey = (customApiKey?.trim() || process.env.OPENROUTER_API_KEY?.trim()) || '';

    // Build payload messages with optional system prompt
    const apiMessages = [];
    if (systemPrompt && systemPrompt.trim()) {
      apiMessages.push({ role: 'system', content: systemPrompt.trim() });
    }
    apiMessages.push(...messages);

    // If an API key is available, call OpenRouter streaming endpoint
    if (apiKey) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'AI Model Playground',
          },
          body: JSON.stringify({
            model,
            messages: apiMessages,
            temperature: Math.min(Math.max(temperature, 0), 2),
            max_tokens: Math.min(Math.max(maxTokens, 16), 8192),
            top_p: Math.min(Math.max(topP, 0), 1),
            stream: true,
            stream_options: { include_usage: true },
          }),
          signal: req.signal,
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => null);
          const errorMsg =
            errJson?.error?.message ||
            `API Provider Error (${response.status}: ${response.statusText})`;

          // Log failure to database
          await prisma.usageLog.create({
            data: {
              modelId: activeModel.id,
              modelName: activeModel.name,
              provider: activeModel.provider,
              prompt: lastUserMessage,
              response: '',
              promptTokens: estimateTokens(lastUserMessage),
              completionTokens: 0,
              totalTokens: estimateTokens(lastUserMessage),
              latencyMs: Date.now() - startTime,
              status: 'error',
              errorMessage: errorMsg,
              ownerId: session.id,
              executionMode: 'live',
              tokenSource: 'estimated',
            },
          }).catch(console.error);

          const errorResponse = NextResponse.json({ error: errorMsg }, { status: response.status });
          attachSessionCookie(errorResponse, session);
          return errorResponse;
        }

        // Setup streaming SSE response
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let fullResponse = '';
        const promptTokens = estimateTokens(
          apiMessages.map((m) => m.content).join(' ')
        );
        let providerUsage: { prompt: number; completion: number } | null = null;

        const stream = new ReadableStream({
          async start(controller) {
            let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
            let completed = false;
            const abortReader = () => {
              reader?.cancel().catch(() => undefined);
            };
            try {
              reader = response.body?.getReader() || null;
              if (!reader) {
                throw new Error('Unable to read provider response stream.');
              }
              req.signal.addEventListener('abort', abortReader, { once: true });

              let buffer = '';

              while (!req.signal.aborted) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed || !trimmed.startsWith('data:')) continue;
                  const dataStr = trimmed.replace(/^data:\s*/, '');
                  if (dataStr === '[DONE]') continue;
                  const parsed = JSON.parse(dataStr);
                  if (parsed.error?.message) throw new Error(parsed.error.message);
                  const deltaContent = parsed.choices?.[0]?.delta?.content || '';
                  if (parsed.usage?.prompt_tokens || parsed.usage?.completion_tokens) {
                    providerUsage = {
                      prompt: Number(parsed.usage.prompt_tokens) || promptTokens,
                      completion: Number(parsed.usage.completion_tokens) || 0,
                    };
                  }
                  if (deltaContent) {
                    fullResponse += deltaContent;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: deltaContent })}\n\n`)
                    );
                  }
                }
              }

              if (req.signal.aborted) {
                await prisma.usageLog.create({
                  data: {
                    ownerId: session.id,
                    modelId: activeModel.id,
                    modelName: activeModel.name,
                    provider: activeModel.provider,
                    prompt: lastUserMessage,
                    response: fullResponse,
                    promptTokens,
                    completionTokens: estimateTokens(fullResponse),
                    totalTokens: promptTokens + estimateTokens(fullResponse),
                    latencyMs: Date.now() - startTime,
                    status: 'cancelled',
                    executionMode: 'live',
                    tokenSource: 'estimated',
                    errorMessage: 'Generation cancelled by the client.',
                  },
                });
                controller.close();
                return;
              }

              const latencyMs = Date.now() - startTime;
              const completionTokens = providerUsage?.completion || estimateTokens(fullResponse);
              const actualPromptTokens = providerUsage?.prompt || promptTokens;
              const totalTokens = actualPromptTokens + completionTokens;

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'done',
                    latencyMs,
                    tokenUsage: {
                      prompt: promptTokens,
                      completion: completionTokens,
                      total: totalTokens,
                    },
                    executionMode: 'live',
                  })}\n\n`
                )
              );
              controller.close();
              completed = true;

              await prisma.usageLog.create({
                data: {
                  ownerId: session.id,
                  modelId: activeModel.id,
                  modelName: activeModel.name,
                  provider: activeModel.provider,
                  prompt: lastUserMessage,
                  response: fullResponse,
                  promptTokens: actualPromptTokens,
                  completionTokens,
                  totalTokens,
                  latencyMs,
                  status: 'success',
                  executionMode: 'live',
                  tokenSource: providerUsage ? 'provider' : 'estimated',
                },
              });
            } catch (err: any) {
              const errorMsg = err.message || 'Stream processing failed';
              if (!completed && !req.signal.aborted) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'error', message: errorMsg })}\n\n`)
                );
                await prisma.usageLog.create({
                  data: {
                    ownerId: session.id,
                    modelId: activeModel.id,
                    modelName: activeModel.name,
                    provider: activeModel.provider,
                    prompt: lastUserMessage,
                    response: fullResponse,
                    promptTokens,
                    completionTokens: estimateTokens(fullResponse),
                    totalTokens: promptTokens + estimateTokens(fullResponse),
                    latencyMs: Date.now() - startTime,
                    status: 'error',
                    executionMode: 'live',
                    tokenSource: 'estimated',
                    errorMessage: errorMsg,
                  },
                }).catch((logError) => console.error('Prisma log error:', logError));
              }
              await reader?.cancel().catch(() => undefined);
              controller.close();
            } finally {
              req.signal.removeEventListener('abort', abortReader);
            }
          },
        });

        const streamResponse = new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
          },
        });
        attachSessionCookie(streamResponse, session);
        return streamResponse;
      } catch (networkErr: any) {
        console.error('API call exception:', networkErr);
        await prisma.usageLog.create({
          data: {
            ownerId: session.id,
            modelId: activeModel.id,
            modelName: activeModel.name,
            provider: activeModel.provider,
            prompt: lastUserMessage,
            response: '',
            promptTokens: estimateTokens(lastUserMessage),
            completionTokens: 0,
            totalTokens: estimateTokens(lastUserMessage),
            latencyMs: Date.now() - startTime,
            status: 'error',
            executionMode: 'live',
            tokenSource: 'estimated',
            errorMessage: networkErr?.message || 'Network error reaching AI API.',
          },
        }).catch((logError) => console.error('Prisma log error:', logError));
        const errorResponse = NextResponse.json(
          { error: `Network error reaching AI API: ${networkErr.message}` },
          { status: 502 }
        );
        attachSessionCookie(errorResponse, session);
        return errorResponse;
      }
    }

    // Interactive Demo Simulation Mode (when no API key is configured yet)
    // Provides realistic, contextual streaming responses tailored to the selected model personality
    const encoder = new TextEncoder();
    const simulatedResponse = generateSimulatedResponse(activeModel, lastUserMessage);
    const promptTokens = estimateTokens(lastUserMessage);
    const completionTokens = estimateTokens(simulatedResponse);

    const stream = new ReadableStream({
      async start(controller) {
        // Send demo banner note first
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'chunk',
              text: `> *[Demo Simulation Mode: To stream directly from live models, enter your OpenRouter key in Settings or add OPENROUTER_API_KEY in .env]*\n\n`,
            })}\n\n`
          )
        );

        // Stream word by word
        const words = simulatedResponse.split(' ');
        for (let i = 0; i < words.length; i++) {
          if (req.signal.aborted) {
            await prisma.usageLog.create({
              data: {
                ownerId: session.id,
                modelId: activeModel.id,
                modelName: activeModel.name,
                provider: activeModel.provider,
                prompt: lastUserMessage,
                response: simulatedResponse.slice(0, i * 5),
                promptTokens,
                completionTokens: 0,
                totalTokens: promptTokens,
                latencyMs: Date.now() - startTime,
                status: 'cancelled',
                executionMode: 'simulation',
                tokenSource: 'estimated',
                errorMessage: 'Generation cancelled by the client.',
              },
            }).catch((e) => console.error('Prisma log error:', e));
            controller.close();
            return;
          }
          const chunk = (i === 0 ? '' : ' ') + words[i];
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`)
          );
          // 15ms delay per token for realistic typing pace
          await new Promise((res) => setTimeout(res, 18));
        }

        const latencyMs = Date.now() - startTime;
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'done',
              latencyMs,
              tokenUsage: {
                prompt: promptTokens,
                completion: completionTokens,
                total: promptTokens + completionTokens,
              },
              executionMode: 'simulation',
            })}\n\n`
          )
        );
        controller.close();

        // Save demo request to SQLite database for usage tracking
        await prisma.usageLog.create({
          data: {
            ownerId: session.id,
            modelId: activeModel.id,
            modelName: activeModel.name,
            provider: activeModel.provider,
            prompt: lastUserMessage,
            response: simulatedResponse,
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
            latencyMs,
            status: 'success',
            executionMode: 'simulation',
            tokenSource: 'estimated',
          },
        }).catch((e) => console.error('Prisma log error:', e));
      },
    });

    const streamResponse = new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
    attachSessionCookie(streamResponse, session);
    return streamResponse;
  } catch (error: any) {
    if (error instanceof SessionConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('Chat endpoint error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing prompt.' },
      { status: 500 }
    );
  }
}

function generateSimulatedResponse(model: { id: string; name: string; provider: string }, prompt: string): string {
  const p = prompt.toLowerCase();

  // If DeepSeek R1 reasoning model
  if (model.id.includes('deepseek-r1') || model.id.includes('reason')) {
    return `### Reasoning Process
1. **Analyze User Intent:** The user prompt asks: "${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}".
2. **Decompose Requirements:** Break down into fundamental principles, boundary conditions, and edge cases.
3. **Synthesis & Verification:** Verify logical consistency and formulate optimal response.

---

### Solution

Here is a comprehensive breakdown:

1. **Core Concept:** Understanding the request requires isolating the key variables and systematically evaluating the outcomes.
2. **Recommended Implementation:**
\`\`\`typescript
// Production-grade implementation
export function solveTask(input: string): { success: boolean; data: string } {
  if (!input || input.trim().length === 0) {
    throw new Error('Input cannot be empty');
  }
  return {
    success: true,
    data: \`Processed: \${input.trim()}\`,
  };
}
\`\`\`
3. **Key Takeaways:**
- Time Complexity: Optimal $O(1)$ amortized.
- Memory Footprint: Minimal allocation.
- Fault Tolerant: Validated against empty and unexpected inputs.`;
  }

  // If Coding Model (Qwen Coder or Code capability)
  if (model.id.includes('coder') || p.includes('code') || p.includes('function') || p.includes('typescript') || p.includes('react')) {
    return `Here is a clean, modern implementation for your request:

\`\`\`typescript
import { useState, useCallback, useEffect } from 'react';

export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(asyncFunction: () => Promise<T>, immediate = true) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFunction();
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (error: any) {
      setState({ data: null, loading: false, error });
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) execute();
  }, [execute, immediate]);

  return { ...state, execute };
}
\`\`\`

### Highlights:
- **Type-safe:** Generics \`<T>\` guarantee complete compile-time validation.
- **Race Condition Prevention:** Memoized with \`useCallback\`.
- **Zero External Dependencies:** Built with pure React hooks.`;
  }

  // General high-quality conversational response
  return `Thank you for your prompt! Here is an in-depth answer generated by **${model.name}** (${model.provider}):

### Key Perspectives:
1. **Architecture & Design:** Modern systems benefit most from decoupling concerns, ensuring high testability, and adhering to single-responsibility design patterns.
2. **Performance Optimization:** Prioritize streaming data structures, eliminate redundant network roundtrips, and cache idempotent computations.
3. **Reliability & Observability:** Track latencies, capture token consumption metrics, and implement graceful fallback degradation paths for resilience.

> *"Simplicity is a prerequisite for reliability."* — Edsger W. Dijkstra

Feel free to ask follow-up questions, request specific code adaptations, or compare this output against another model!`;
}
