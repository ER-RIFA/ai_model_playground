'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Send, 
  Square, 
  Trash2, 
  Sliders, 
  Copy, 
  Check, 
  AlertCircle, 
  Cpu, 
  Bot, 
  User, 
  ChevronDown, 
  Clock, 
  Hash, 
  SlidersHorizontal,
  Terminal
} from 'lucide-react';
import { AIModel, ChatMessage, ModelParameters } from '@/types';
import { POPULAR_MODELS } from '@/data/models';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { estimateTokens } from '@/lib/utils';

const PRESET_PROMPTS = [
  {
    title: 'Algorithm Optimization',
    prompt: 'Write an asynchronous retry function in TypeScript with exponential backoff and jitter. Include type generics and cancellation token support.',
  },
  {
    title: 'Logic & Deductive Reasoning',
    prompt: 'Solve this step by step: A farmer needs to cross a river with a wolf, a goat, and a cabbage. The boat can only carry the farmer and one item. If left alone, the wolf eats the goat, and the goat eats the cabbage. How does he cross?',
  },
  {
    title: 'System Architecture',
    prompt: 'Design a high-throughput webhook delivery system capable of processing 100,000 events/sec with guaranteed at-least-once delivery.',
  },
  {
    title: 'Database Comparison',
    prompt: 'Provide a structured comparison between PostgreSQL and MongoDB for a real-time analytics workload with time-series metrics.',
  },
];

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const initialModelId = searchParams.get('model') || 'deepseek/deepseek-r1:free';

  const [models, setModels] = useState<AIModel[]>(POPULAR_MODELS);
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showParameters, setShowParameters] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Model Parameters
  const [parameters, setParameters] = useState<ModelParameters>({
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1.0,
    systemPrompt: 'You are an expert AI assistant. Provide concise, production-ready, and accurate answers.',
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models) && data.models.length > 0) {
            setModels(data.models);
          }
        }
      } catch (err) {
        console.error('Failed to load models list:', err);
      }
    }
    loadModels();
  }, []);

  useEffect(() => {
    const m = searchParams.get('model');
    if (m) {
      setSelectedModelId(m);
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const currentModel = models.find((m) => m.id === selectedModelId) || models[0] || POPULAR_MODELS[0];

  const handleSendMessage = async () => {
    const prompt = inputPrompt.trim();
    if (!prompt || isGenerating) return;

    setErrorMessage(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
      tokenUsage: {
        prompt: estimateTokens(prompt),
        completion: 0,
        total: estimateTokens(prompt),
      },
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt('');

    const assistantMessageId = `asst-${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: currentModel.name,
    };

    setMessages([...newMessages, assistantPlaceholder]);
    setIsGenerating(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const customApiKey = typeof window !== 'undefined'
      ? localStorage.getItem('ai_playground_openrouter_key') || ''
      : '';

    const startTime = Date.now();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: currentModel.id,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          temperature: parameters.temperature,
          maxTokens: parameters.maxTokens,
          topP: parameters.topP,
          systemPrompt: parameters.systemPrompt,
          customApiKey,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: Failed to generate response`);
      }

      if (!response.body) {
        throw new Error('Streaming not supported in this environment.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            if (data.type === 'chunk' && data.text) {
              streamedContent += data.text;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: streamedContent }
                    : msg
                )
              );
            } else if (data.type === 'done') {
              const latencyMs = data.latencyMs || Date.now() - startTime;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: streamedContent,
                        latencyMs,
                        tokenUsage: data.tokenUsage,
                      }
                    : msg
                )
              );
            } else if (data.type === 'error') {
              throw new Error(data.message || 'Stream error occurred.');
            }
          } catch (e: any) {
            if (e.message && e.message.includes('Stream error')) {
              throw e;
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Handled abort
      } else {
        const msg = err.message || 'An unexpected error occurred during generation.';
        setErrorMessage(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  error: msg,
                  content: m.content || `⚠️ Generation Error: ${msg}`,
                }
              : m
          )
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleClearChat = () => {
    if (isGenerating) handleStopGenerating();
    setMessages([]);
    setErrorMessage(null);
  };

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#0c0e12] text-[#f1f3f7] overflow-hidden">
      {/* Top Studio Control Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-[#222733] bg-[#10141b] shrink-0 gap-3">
        {/* Model Selector */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="appearance-none bg-[#13171f] border border-[#222733] hover:border-[#2e3545] text-xs font-medium text-[#f1f3f7] rounded-md pl-8 pr-7 py-1.5 focus:outline-none focus:border-[#3b82f6] transition-colors cursor-pointer"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id} className="bg-[#13171f]">
                  {model.name} {model.isFree ? '(Free)' : ''}
                </option>
              ))}
            </select>
            <Cpu className="w-3.5 h-3.5 text-[#3b82f6] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-[#5c6470] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#181d26] text-[#8b94a0] border border-[#222733]">
              {currentModel.provider}
            </span>
            {currentModel.isFree && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#064e3b]/30 text-[#34d399] border border-[#059669]/30">
                Free
              </span>
            )}
            <span className="text-[11px] text-[#5c6470] font-mono">
              {Math.round(currentModel.contextLength / 1000)}k ctx
            </span>
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowParameters(!showParameters)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              showParameters
                ? 'bg-[#1e293b] border-[#3b82f6]/40 text-[#93c5fd]'
                : 'bg-[#13171f] border-[#222733] text-[#8b94a0] hover:text-[#f1f3f7] hover:bg-[#181d26]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Parameters</span>
          </button>

          <button
            onClick={handleClearChat}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#8b94a0] hover:text-[#ef4444] hover:bg-[#ef4444]/10 border border-[#222733] transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title="Clear chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Main Container: Chat + Parameters Drawer */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Chat Thread */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              /* Empty Benchmark Slate */
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8">
                <div className="w-10 h-10 rounded-md bg-[#13171f] border border-[#222733] flex items-center justify-center text-[#3b82f6] mb-3">
                  <Terminal className="w-5 h-5" />
                </div>
                <h2 className="text-base font-semibold text-[#f1f3f7] mb-1">
                  Ready to test with {currentModel.name}
                </h2>
                <p className="text-xs text-[#8b94a0] max-w-sm mb-6 leading-relaxed">
                  Submit a prompt below or pick a preset benchmark to test latency, observe streaming throughput, and inspect token consumption.
                </p>

                {/* Preset Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                  {PRESET_PROMPTS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputPrompt(preset.prompt)}
                      className="p-3 rounded-md bg-[#13171f] border border-[#222733] hover:border-[#2e3545] hover:bg-[#181d26] transition-colors text-left"
                    >
                      <span className="text-xs font-medium text-[#f1f3f7] block mb-0.5">
                        {preset.title}
                      </span>
                      <p className="text-[11px] text-[#8b94a0] line-clamp-2 leading-relaxed">
                        {preset.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Active Messages */
              messages.map((message, idx) => (
                <div
                  key={message.id}
                  className={`flex gap-3 max-w-3xl mx-auto ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 rounded bg-[#181d26] border border-[#222733] flex items-center justify-center text-[#3b82f6] shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`rounded-md px-4 py-3 max-w-[85%] text-xs transition-colors ${
                      message.role === 'user'
                        ? 'bg-[#181d26] border border-[#2e3545] text-[#f1f3f7]'
                        : 'bg-[#13171f] border border-[#222733] text-[#e1e4ea]'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-3 mb-1.5 text-[11px]">
                      <span className="font-semibold text-[#8b94a0]">
                        {message.role === 'user' ? 'You' : message.model || currentModel.name}
                      </span>
                      {message.latencyMs && (
                        <span className="font-mono flex items-center gap-1 text-[10px] text-[#5c6470]">
                          <Clock className="w-3 h-3" />
                          {message.latencyMs}ms
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-xs">{message.content}</p>
                    ) : (
                      <div>
                        {message.content ? (
                          <MarkdownRenderer content={message.content} />
                        ) : isGenerating ? (
                          <div className="flex items-center gap-2 text-xs text-[#8b94a0] py-1">
                            <span className="w-1.5 h-1.5 rounded-sm bg-[#3b82f6] animate-pulse" />
                            <span>Generating response...</span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Footer Metrics */}
                    <div className="mt-2.5 pt-2 border-t border-[#222733] flex items-center justify-between text-[10px] text-[#5c6470] font-mono">
                      <div className="flex items-center gap-2">
                        {message.tokenUsage?.total && (
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {message.tokenUsage.total} tokens
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleCopyMessage(message.content, idx)}
                        className="p-1 rounded hover:bg-[#181d26] text-[#5c6470] hover:text-[#f1f3f7] transition-colors"
                        title="Copy text"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-[#10b981]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-6 h-6 rounded bg-[#181d26] border border-[#222733] flex items-center justify-center text-[#8b94a0] shrink-0 mt-1">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="max-w-3xl mx-auto p-3 rounded-md bg-[#ef4444]/10 border border-[#ef4444]/30 flex items-start gap-2.5 text-xs text-[#fca5a5]">
                <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block mb-0.5">API Error:</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Prompt Input */}
          <div className="p-3.5 sm:p-4 border-t border-[#222733] bg-[#10141b] shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="relative rounded-md bg-[#0c0e12] border border-[#222733] focus-within:border-[#3b82f6] transition-colors">
                <textarea
                  ref={textareaRef}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Send a prompt to ${currentModel.name}... (Ctrl + Enter)`}
                  rows={3}
                  className="w-full bg-transparent p-3 pr-12 text-xs text-[#f1f3f7] placeholder-[#5c6470] resize-none focus:outline-none leading-relaxed"
                />

                <div className="absolute right-2.5 bottom-2.5">
                  {isGenerating ? (
                    <button
                      onClick={handleStopGenerating}
                      className="p-1.5 rounded-md bg-[#ef4444] hover:bg-[#dc2626] text-white transition-colors"
                      title="Stop generating"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputPrompt.trim()}
                      className="p-1.5 rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      title="Send prompt"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Monospace token info */}
              <div className="flex items-center justify-between mt-1.5 px-1 text-[11px] text-[#5c6470] font-mono">
                <span>~{estimateTokens(inputPrompt)} tokens</span>
                <span className="hidden sm:inline">Press Ctrl+Enter to send</span>
              </div>
            </div>
          </div>
        </div>

        {/* Parameters Sidebar */}
        {showParameters && (
          <aside className="w-72 border-l border-[#222733] bg-[#10141b] p-4 overflow-y-auto space-y-4 shrink-0 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#222733]">
              <h3 className="font-semibold text-[#f1f3f7] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#3b82f6]" />
                Inference Parameters
              </h3>
              <button
                onClick={() => setShowParameters(false)}
                className="text-[11px] text-[#8b94a0] hover:text-[#f1f3f7]"
              >
                Close
              </button>
            </div>

            {/* System Prompt */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#8b94a0] block">
                System Prompt
              </label>
              <textarea
                value={parameters.systemPrompt}
                onChange={(e) => setParameters({ ...parameters, systemPrompt: e.target.value })}
                rows={3}
                className="w-full p-2 bg-[#0c0e12] border border-[#222733] rounded-md text-xs text-[#f1f3f7] placeholder-[#5c6470] focus:outline-none focus:border-[#3b82f6] resize-none"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <label className="text-[#8b94a0]">Temperature</label>
                <span className="font-mono text-[#38bdf8]">{parameters.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={parameters.temperature}
                onChange={(e) => setParameters({ ...parameters, temperature: parseFloat(e.target.value) })}
                className="w-full accent-[#2563eb] bg-[#222733] rounded h-1 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#5c6470]">
                <span>0.0 (Strict)</span>
                <span>1.5 (Creative)</span>
              </div>
            </div>

            {/* Max Output Tokens */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <label className="text-[#8b94a0]">Max Output Tokens</label>
                <span className="font-mono text-[#38bdf8]">{parameters.maxTokens}</span>
              </div>
              <input
                type="range"
                min="128"
                max="4096"
                step="128"
                value={parameters.maxTokens}
                onChange={(e) => setParameters({ ...parameters, maxTokens: parseInt(e.target.value, 10) })}
                className="w-full accent-[#2563eb] bg-[#222733] rounded h-1 cursor-pointer"
              />
            </div>

            {/* Top P */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <label className="text-[#8b94a0]">Top P</label>
                <span className="font-mono text-[#38bdf8]">{parameters.topP}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={parameters.topP}
                onChange={(e) => setParameters({ ...parameters, topP: parseFloat(e.target.value) })}
                className="w-full accent-[#2563eb] bg-[#222733] rounded h-1 cursor-pointer"
              />
            </div>

            <button
              onClick={() =>
                setParameters({
                  temperature: 0.7,
                  maxTokens: 2048,
                  topP: 1.0,
                  systemPrompt: 'You are an expert AI assistant. Provide concise, production-ready, and accurate answers.',
                })
              }
              className="w-full py-1.5 text-xs text-[#8b94a0] hover:text-[#f1f3f7] bg-[#13171f] hover:bg-[#181d26] border border-[#222733] rounded-md transition-colors"
            >
              Reset Defaults
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[#0c0e12] text-[#8b94a0] text-xs font-mono">
          Loading Playground...
        </div>
      }
    >
      <PlaygroundContent />
    </React.Suspense>
  );
}
