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
    title: 'Deductive Logic',
    prompt: 'Solve this step by step: A farmer needs to cross a river with a wolf, a goat, and a cabbage. The boat can only carry the farmer and one item. If left alone, the wolf eats the goat, and the goat eats the cabbage. How does he cross?',
  },
  {
    title: 'System Architecture',
    prompt: 'Design a high-throughput webhook delivery system capable of processing 100,000 events/sec with guaranteed at-least-once delivery.',
  },
  {
    title: 'Data Engine Comparison',
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
    <div className="flex flex-col h-[calc(100vh-3rem)] bg-[#191919] text-[#F1F0EB] overflow-hidden">
      {/* Studio Top Control Strip */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-[#383733] bg-[#20201F] shrink-0 gap-3">
        {/* Model Selector */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="appearance-none bg-[#222220] border border-[#383733] hover:border-[#4A4843] text-xs font-medium text-[#F1F0EB] rounded-sm pl-7 pr-6 py-1 focus:outline-none focus:border-[#8CB2D4] cursor-pointer"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id} className="bg-[#20201F]">
                  {model.name} {model.isFree ? '(Free)' : ''}
                </option>
              ))}
            </select>
            <Cpu className="w-3.5 h-3.5 text-[#8CB2D4] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3 h-3 text-[#76746E] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono">
            <span className="px-1.5 py-0.5 rounded-sm text-[10px] bg-[#191919] text-[#A5A39D] border border-[#383733]">
              {currentModel.provider}
            </span>
            {currentModel.isFree && (
              <span className="px-1.5 py-0.5 rounded-sm text-[10px] text-[#48A977] bg-[#48A977]/10 border border-[#48A977]/30">
                Free
              </span>
            )}
            <span className="text-[10px] text-[#76746E]">
              {Math.round(currentModel.contextLength / 1000)}k ctx
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowParameters(!showParameters)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-sans transition-colors border ${
              showParameters
                ? 'bg-[#2F658E]/20 border-[#2F658E]/40 text-[#8CB2D4]'
                : 'bg-[#222220] border-[#383733] text-[#A5A39D] hover:text-[#F1F0EB] hover:bg-[#292927]'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span className="hidden sm:inline">Parameters</span>
          </button>

          <button
            onClick={handleClearChat}
            disabled={messages.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-sans text-[#A5A39D] hover:text-[#E06D67] hover:bg-[#E06D67]/10 border border-[#383733] transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title="Clear Chat"
          >
            <Trash2 className="w-3 h-3" />
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
              <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8">
                <div className="w-8 h-8 rounded-sm bg-[#20201F] border border-[#383733] flex items-center justify-center text-[#8CB2D4] mb-3">
                  <Terminal className="w-4 h-4" />
                </div>
                <h2 className="font-serif text-lg font-normal text-[#F1F0EB] mb-1 tracking-wide">
                  {currentModel.name}
                </h2>
                <p className="text-xs text-[#A5A39D] max-w-sm mb-6 leading-relaxed">
                  Enter an instruction or prompt below to evaluate output quality, observe real-time latency, and inspect token generation metrics.
                </p>

                {/* Preset Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                  {PRESET_PROMPTS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputPrompt(preset.prompt)}
                      className="p-3 rounded-sm bg-[#222220] border border-[#383733] hover:border-[#4A4843] hover:bg-[#252524] transition-colors text-left"
                    >
                      <span className="text-xs font-medium text-[#F1F0EB] block mb-0.5">
                        {preset.title}
                      </span>
                      <p className="text-[11px] text-[#A5A39D] line-clamp-2 leading-relaxed">
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
                    <div className="w-6 h-6 rounded-sm bg-[#20201F] border border-[#383733] flex items-center justify-center text-[#8CB2D4] shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`rounded-sm px-4 py-3 max-w-[85%] text-xs transition-colors ${
                      message.role === 'user'
                        ? 'bg-[#292927] border border-[#383733] text-[#F1F0EB]'
                        : 'bg-[#222220] border border-[#383733] text-[#DCDAD4]'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-3 mb-1.5 text-[11px] font-mono">
                      <span className="text-[#A5A39D] uppercase text-[10px]">
                        {message.role === 'user' ? 'User' : message.model || currentModel.name}
                      </span>
                      {message.latencyMs && (
                        <span className="flex items-center gap-1 text-[10px] text-[#76746E]">
                          <Clock className="w-3 h-3 text-[#8CB2D4]" />
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
                          <div className="flex items-center gap-2 text-xs text-[#A5A39D] py-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-sm bg-[#8CB2D4] animate-pulse" />
                            <span>Streaming tokens...</span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Footer Metrics */}
                    <div className="mt-2.5 pt-2 border-t border-[#383733] flex items-center justify-between text-[10px] text-[#76746E] font-mono">
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
                        className="p-1 rounded-sm hover:bg-[#292927] text-[#76746E] hover:text-[#F1F0EB] transition-colors"
                        title="Copy text"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3 h-3 text-[#48A977]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-6 h-6 rounded-sm bg-[#292927] border border-[#383733] flex items-center justify-center text-[#A5A39D] shrink-0 mt-1">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Error Notification */}
            {errorMessage && (
              <div className="max-w-3xl mx-auto p-3 rounded-sm bg-[#A84743]/10 border border-[#A84743]/30 flex items-start gap-2.5 text-xs text-[#E06D67]">
                <AlertCircle className="w-4 h-4 text-[#E06D67] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block mb-0.5 font-mono text-[10px] uppercase">Execution Failure</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Prompt Input Area */}
          <div className="p-3.5 sm:p-4 border-t border-[#383733] bg-[#20201F] shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="relative rounded-sm bg-[#191919] border border-[#383733] focus-within:border-[#8CB2D4] transition-colors">
                <textarea
                  ref={textareaRef}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Prompt ${currentModel.name}... (Ctrl + Enter to execute)`}
                  rows={3}
                  className="w-full bg-transparent p-3 pr-12 text-xs text-[#F1F0EB] placeholder-[#76746E] resize-none focus:outline-none leading-relaxed font-sans"
                />

                <div className="absolute right-2.5 bottom-2.5">
                  {isGenerating ? (
                    <button
                      onClick={handleStopGenerating}
                      className="p-1.5 rounded-sm bg-[#A84743] hover:bg-[#8B3B37] text-[#F1F0EB] transition-colors"
                      title="Halt Generation"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputPrompt.trim()}
                      className="p-1.5 rounded-sm bg-[#2F658E] hover:bg-[#255273] text-[#F1F0EB] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      title="Execute Prompt"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Monospace token info */}
              <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-[#76746E] font-mono">
                <span>ESTIMATED: ~{estimateTokens(inputPrompt)} tokens</span>
                <span className="hidden sm:inline">Ctrl + Enter to execute</span>
              </div>
            </div>
          </div>
        </div>

        {/* Parameters Sidebar */}
        {showParameters && (
          <aside className="w-72 border-l border-[#383733] bg-[#20201F] p-4 overflow-y-auto space-y-4 shrink-0 text-xs font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-[#383733]">
              <h3 className="font-serif text-sm font-normal text-[#F1F0EB] tracking-wide flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#8CB2D4]" />
                Inference Parameters
              </h3>
              <button
                onClick={() => setShowParameters(false)}
                className="text-[11px] font-mono text-[#76746E] hover:text-[#F1F0EB]"
              >
                Close
              </button>
            </div>

            {/* System Prompt */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#A5A39D] block">
                System Directive
              </label>
              <textarea
                value={parameters.systemPrompt}
                onChange={(e) => setParameters({ ...parameters, systemPrompt: e.target.value })}
                rows={3}
                className="w-full p-2 bg-[#191919] border border-[#383733] rounded-sm text-xs text-[#F1F0EB] placeholder-[#76746E] focus:outline-none focus:border-[#8CB2D4] resize-none"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <label className="text-[#A5A39D]">Temperature</label>
                <span className="text-[#8CB2D4]">{parameters.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={parameters.temperature}
                onChange={(e) => setParameters({ ...parameters, temperature: parseFloat(e.target.value) })}
                className="w-full accent-[#2F658E] bg-[#383733] rounded h-1 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#76746E] font-mono">
                <span>0.0 (Deterministic)</span>
                <span>1.5 (Creative)</span>
              </div>
            </div>

            {/* Max Output Tokens */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <label className="text-[#A5A39D]">Max Completion</label>
                <span className="text-[#8CB2D4]">{parameters.maxTokens}</span>
              </div>
              <input
                type="range"
                min="128"
                max="4096"
                step="128"
                value={parameters.maxTokens}
                onChange={(e) => setParameters({ ...parameters, maxTokens: parseInt(e.target.value, 10) })}
                className="w-full accent-[#2F658E] bg-[#383733] rounded h-1 cursor-pointer"
              />
            </div>

            {/* Top P */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <label className="text-[#A5A39D]">Top P</label>
                <span className="text-[#8CB2D4]">{parameters.topP}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={parameters.topP}
                onChange={(e) => setParameters({ ...parameters, topP: parseFloat(e.target.value) })}
                className="w-full accent-[#2F658E] bg-[#383733] rounded h-1 cursor-pointer"
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
              className="w-full py-1.5 text-xs text-[#A5A39D] hover:text-[#F1F0EB] bg-[#222220] hover:bg-[#292927] border border-[#383733] rounded-sm transition-colors"
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
        <div className="flex items-center justify-center h-[calc(100vh-3rem)] bg-[#191919] text-[#76746E] text-xs font-mono">
          Loading Studio...
        </div>
      }
    >
      <PlaygroundContent />
    </React.Suspense>
  );
}
