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
  Terminal,
  Sparkles,
  Zap
} from 'lucide-react';
import { AIModel, ChatMessage, ModelParameters } from '@/types';
import { POPULAR_MODELS } from '@/data/models';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { estimateTokens, formatPrice } from '@/lib/utils';

const PRESET_PROMPTS = [
  {
    title: 'Distributed System Architecture',
    prompt: 'Design a resilient rate-limiting service using Redis with sliding window counters. Provide the pseudocode and explain failure handling.',
  },
  {
    title: 'TypeScript Type-Level Programming',
    prompt: 'Implement a deeply nested object path getter with compile-time type safety in TypeScript: type Path<T> = ...',
  },
  {
    title: 'Algorithmic Deduction',
    prompt: 'Solve step-by-step: A farmer has 17 sheep, and all but 9 die. How many are left? Detail the logical reasoning.',
  },
  {
    title: 'Low-Latency Cache Design',
    prompt: 'Write an idiomatic Rust implementation of a bounded LRU Cache with O(1) read and write performance.',
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
        throw new Error('ReadableStream not supported.');
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
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Aborted
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
    <div className="flex flex-col h-[calc(100vh-4.25rem)] bg-[#0B0C0E] text-[#F1F3F5] overflow-hidden">
      {/* Studio Workbench Header Strip */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-[#222630] bg-[#111317] shrink-0 gap-3">
        {/* Model Selector & Architecture Badge */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="appearance-none bg-[#16191F] border border-[#222630] hover:border-[#2F3542] text-xs font-semibold text-[#F1F3F5] rounded pl-7 pr-6 py-1.5 focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id} className="bg-[#111317]">
                  {model.name} {model.isFree ? '(Free)' : ''}
                </option>
              ))}
            </select>
            <Cpu className="w-3.5 h-3.5 text-[#2563EB] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3 h-3 text-[#64748B] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded text-[11px] bg-[#0B0C0E] text-[#9CA3AF] border border-[#222630]">
              {currentModel.provider}
            </span>
            {currentModel.isFree && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30">
                Free Tier
              </span>
            )}
            <span className="text-[11px] text-[#64748B]">
              {Math.round(currentModel.contextLength / 1000)}k ctx
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowParameters(!showParameters)}
            aria-label="Toggle generation parameters"
            aria-expanded={showParameters}
            title="Generation parameters"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
              showParameters
                ? 'bg-[#2563EB]/20 border-[#2563EB]/40 text-[#60A5FA]'
                : 'bg-[#16191F] border-[#222630] text-[#9CA3AF] hover:text-[#F1F3F5] hover:bg-[#21262F]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Parameters</span>
          </button>

          <button
            onClick={handleClearChat}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#EF4444]/10 border border-[#222630] transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body: Conversation + Parameters Panel */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Conversation Stream */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              /* High-Value Empty State with Instant Prompts */
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8">
                <div className="w-10 h-10 rounded bg-[#111317] border border-[#222630] flex items-center justify-center text-[#2563EB] mb-3">
                  <Terminal className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-[#F1F3F5] mb-1 tracking-tight">
                  {currentModel.name}
                </h2>
                <p className="text-xs text-[#9CA3AF] max-w-md mb-6 leading-relaxed">
                  Interactive inference session with real-time token streaming, parameter adjustment, and SQLite query logging.
                </p>

                {/* Preset Prompts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                  {PRESET_PROMPTS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputPrompt(preset.prompt)}
                      className="p-3 rounded bg-[#111317] border border-[#222630] hover:border-[#2F3542] hover:bg-[#16191F] transition-colors text-left group"
                    >
                      <span className="text-xs font-semibold text-[#F1F3F5] group-hover:text-[#60A5FA] block mb-1">
                        {preset.title}
                      </span>
                      <p className="text-[11px] text-[#9CA3AF] line-clamp-2 leading-relaxed">
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
                    <div className="w-6 h-6 rounded bg-[#111317] border border-[#222630] flex items-center justify-center text-[#2563EB] shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`rounded px-4 py-3 max-w-[85%] text-xs transition-colors ${
                      message.role === 'user'
                        ? 'bg-[#16191F] border border-[#222630] text-[#F1F3F5]'
                        : 'bg-[#111317] border border-[#222630] text-[#D1D5DB]'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-3 mb-2 text-[11px] font-mono">
                      <span className="text-[#9CA3AF] uppercase text-[10px] font-semibold">
                        {message.role === 'user' ? 'User' : message.model || currentModel.name}
                      </span>
                      {message.latencyMs && (
                        <span className="flex items-center gap-1 text-[10px] text-[#64748B]">
                          <Clock className="w-3 h-3 text-[#2563EB]" />
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
                          <div className="flex items-center gap-2 text-xs text-[#9CA3AF] py-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                            <span>Streaming tokens...</span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Footer Metrics */}
                    <div className="mt-3 pt-2 border-t border-[#222630] flex items-center justify-between text-[10px] text-[#64748B] font-mono">
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
                        className="p-1 rounded hover:bg-[#16191F] text-[#64748B] hover:text-[#F1F3F5] transition-colors"
                        title="Copy text"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3 h-3 text-[#10B981]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-6 h-6 rounded bg-[#16191F] border border-[#222630] flex items-center justify-center text-[#9CA3AF] shrink-0 mt-1">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Error Notification */}
            {errorMessage && (
              <div className="max-w-3xl mx-auto p-3 rounded bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-start gap-2.5 text-xs text-[#EF4444]">
                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block mb-0.5 font-mono text-[10px] uppercase">Execution Failure</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Prompt Composer */}
          <div className="p-3.5 sm:p-4 border-t border-[#222630] bg-[#111317] shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="relative rounded bg-[#0B0C0E] border border-[#222630] focus-within:border-[#2563EB] transition-colors">
                <textarea
                  ref={textareaRef}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Send instruction to ${currentModel.name}... (Ctrl + Enter to execute)`}
                  rows={3}
                  className="w-full bg-transparent p-3 pr-12 text-xs text-[#F1F3F5] placeholder-[#64748B] resize-none focus:outline-none leading-relaxed font-sans"
                />

                <div className="absolute right-2.5 bottom-2.5">
                  {isGenerating ? (
                    <button
                      onClick={handleStopGenerating}
                      className="p-1.5 rounded bg-[#EF4444] hover:bg-[#DC2626] text-white transition-colors"
                      title="Halt Generation"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputPrompt.trim()}
                      className="p-1.5 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      title="Execute Prompt"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Monospace token info */}
              <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-[#64748B] font-mono">
                <span>ESTIMATED: ~{estimateTokens(inputPrompt)} tokens</span>
                <span className="hidden sm:inline">Ctrl + Enter to send</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inference Parameters Rail */}
        {showParameters && (
          <aside className="w-72 border-l border-[#222630] bg-[#111317] p-4 overflow-y-auto space-y-4 shrink-0 text-xs font-sans">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#222630]">
              <h3 className="text-xs font-bold text-[#F1F3F5] tracking-wide flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#2563EB]" />
                Inference Hyperparameters
              </h3>
              <button
                onClick={() => setShowParameters(false)}
                className="text-[11px] font-mono text-[#64748B] hover:text-[#F1F3F5]"
              >
                Close
              </button>
            </div>

            {/* System Prompt */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] block font-semibold">
                System Directive
              </label>
              <textarea
                value={parameters.systemPrompt}
                onChange={(e) => setParameters({ ...parameters, systemPrompt: e.target.value })}
                rows={3}
                className="w-full p-2.5 bg-[#0B0C0E] border border-[#222630] rounded text-xs text-[#F1F3F5] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] resize-none"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <label className="text-[#9CA3AF]">Temperature</label>
                <span className="text-[#60A5FA] font-semibold">{parameters.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={parameters.temperature}
                onChange={(e) => setParameters({ ...parameters, temperature: parseFloat(e.target.value) })}
                className="w-full accent-[#2563EB] bg-[#222630] rounded h-1 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#64748B] font-mono">
                <span>0.0 (Deterministic)</span>
                <span>1.5 (Creative)</span>
              </div>
            </div>

            {/* Max Output Tokens */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <label className="text-[#9CA3AF]">Max Completion Tokens</label>
                <span className="text-[#60A5FA] font-semibold">{parameters.maxTokens}</span>
              </div>
              <input
                type="range"
                min="128"
                max="4096"
                step="128"
                value={parameters.maxTokens}
                onChange={(e) => setParameters({ ...parameters, maxTokens: parseInt(e.target.value, 10) })}
                className="w-full accent-[#2563EB] bg-[#222630] rounded h-1 cursor-pointer"
              />
            </div>

            {/* Top P */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <label className="text-[#9CA3AF]">Top P Sampling</label>
                <span className="text-[#60A5FA] font-semibold">{parameters.topP}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={parameters.topP}
                onChange={(e) => setParameters({ ...parameters, topP: parseFloat(e.target.value) })}
                className="w-full accent-[#2563EB] bg-[#222630] rounded h-1 cursor-pointer"
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
              className="w-full py-1.5 text-xs text-[#9CA3AF] hover:text-[#F1F3F5] bg-[#16191F] hover:bg-[#21262F] border border-[#222630] rounded transition-colors"
            >
              Reset to Defaults
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
        <div className="flex items-center justify-center h-[calc(100vh-3.25rem)] bg-[#0B0C0E] text-[#64748B] text-xs font-mono">
          Loading Studio...
        </div>
      }
    >
      <PlaygroundContent />
    </React.Suspense>
  );
}