'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Send, 
  Square, 
  Trash2, 
  Sliders, 
  Sparkles, 
  Copy, 
  Check, 
  AlertCircle, 
  Cpu, 
  Bot, 
  User, 
  ChevronDown, 
  Clock, 
  Hash, 
  SlidersHorizontal
} from 'lucide-react';
import { AIModel, ChatMessage, ModelParameters } from '@/types';
import { POPULAR_MODELS } from '@/data/models';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { estimateTokens } from '@/lib/utils';

const PRESET_PROMPTS = [
  {
    title: '🧠 Logic Puzzle',
    prompt: 'Solve this step by step: A farmer needs to cross a river with a wolf, a goat, and a cabbage. The boat can only carry the farmer and one item. If left alone, the wolf eats the goat, and the goat eats the cabbage. How does he cross?',
  },
  {
    title: '💻 TypeScript Refactor',
    prompt: 'Write an asynchronous retry function in TypeScript with exponential backoff and jitter. Include type generics and cancellation token support.',
  },
  {
    title: '🏗️ System Architecture',
    prompt: 'Design a high-throughput webhook delivery system capable of processing 100,000 events/sec with guaranteed at-least-once delivery.',
  },
  {
    title: '📊 SQL vs NoSQL Analysis',
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
    systemPrompt: 'You are a helpful, expert AI assistant. Answer accurately, thoughtfully, and clearly.',
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load models from API or keep fallback
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

  // Update selected model if URL query changes
  useEffect(() => {
    const m = searchParams.get('model');
    if (m) {
      setSelectedModelId(m);
    }
  }, [searchParams]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Current selected model object
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

    // Prepare assistant placeholder for streaming
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
        throw new Error('ReadableStream not supported on this browser.');
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
        // User aborted, keep partial stream
      } else {
        const msg = err.message || 'An unexpected error occurred during generation.';
        setErrorMessage(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  error: msg,
                  content: m.content || `⚠️ Generation Failed: ${msg}`,
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
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#07090e] text-zinc-100 overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur shrink-0 gap-3">
        {/* Model Selection Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="appearance-none bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-sm font-semibold text-white rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition cursor-pointer"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} {model.isFree ? '(Free)' : ''}
                </option>
              ))}
            </select>
            <Cpu className="w-4 h-4 text-violet-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Model Badges */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
              {currentModel.provider}
            </span>
            {currentModel.isFree && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Free
              </span>
            )}
            <span className="text-xs text-zinc-400 font-mono">
              Ctx: {Math.round(currentModel.contextLength / 1000)}k
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Parameters Toggle */}
          <button
            onClick={() => setShowParameters(!showParameters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
              showParameters
                ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Parameters</span>
          </button>

          {/* Clear Chat */}
          <button
            onClick={handleClearChat}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-950/20 border border-zinc-800 transition disabled:opacity-40 disabled:pointer-events-none"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Main Container: Chat + Parameters Drawer */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.length === 0 ? (
              /* Empty State */
              <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-12">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4 shadow-xl">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Ready to test with {currentModel.name}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-8">
                  Enter a prompt below or pick one of the sample benchmarks to explore responses, measure tokens, and observe generation latency.
                </p>

                {/* Preset Prompts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                  {PRESET_PROMPTS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputPrompt(preset.prompt)}
                      className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-violet-500/40 hover:bg-zinc-900 transition text-left group"
                    >
                      <span className="text-xs font-semibold text-violet-300 block mb-1">
                        {preset.title}
                      </span>
                      <p className="text-xs text-zinc-400 line-clamp-2 group-hover:text-zinc-300">
                        {preset.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message Thread */
              messages.map((message, idx) => (
                <div
                  key={message.id}
                  className={`flex gap-3 sm:gap-4 max-w-4xl mx-auto ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Assistant Avatar */}
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`group relative rounded-2xl px-4 py-3 sm:px-5 sm:py-4 max-w-[85%] sm:max-w-[78%] transition-all ${
                      message.role === 'user'
                        ? 'bg-violet-600 text-white rounded-tr-sm shadow-md'
                        : 'bg-zinc-900/90 border border-zinc-800 rounded-tl-sm text-zinc-200 shadow-md'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-3 mb-1.5 text-[11px] opacity-80">
                      <span className="font-semibold flex items-center gap-1">
                        {message.role === 'user' ? 'You' : message.model || currentModel.name}
                      </span>
                      {message.latencyMs && (
                        <span className="font-mono flex items-center gap-1 text-[10px] text-zinc-400">
                          <Clock className="w-3 h-3" />
                          {message.latencyMs}ms
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    {message.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    ) : (
                      <div>
                        {message.content ? (
                          <MarkdownRenderer content={message.content} />
                        ) : isGenerating ? (
                          <div className="flex items-center gap-2 text-xs text-zinc-400 py-1">
                            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                            <span>Generating response...</span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Footer Stats & Actions */}
                    <div className="mt-2.5 pt-2 border-t border-zinc-700/40 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                      <div className="flex items-center gap-2">
                        {message.tokenUsage?.total && (
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {message.tokenUsage.total} tokens
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyMessage(message.content, idx)}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                          title="Copy text"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* User Avatar */}
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Error Notification Banner */}
            {errorMessage && (
              <div className="max-w-4xl mx-auto p-4 rounded-xl bg-red-950/30 border border-red-900/50 flex items-start gap-3 text-xs text-red-300 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block mb-0.5">Generation Error:</span>
                  <span>{errorMessage}</span>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Tip: If using rate-limited models or external keys, verify credentials in Settings or choose another model from the dropdown.
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Input Box */}
          <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-950/90 shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 focus-within:border-violet-500/70 focus-within:ring-2 focus-within:ring-violet-500/20 transition shadow-lg">
                <textarea
                  ref={textareaRef}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask ${currentModel.name} anything... (Ctrl + Enter to send)`}
                  rows={3}
                  className="w-full bg-transparent p-4 pr-14 text-sm text-white placeholder-zinc-500 resize-none focus:outline-none"
                />

                {/* Send / Stop Buttons */}
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  {isGenerating ? (
                    <button
                      onClick={handleStopGenerating}
                      className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md transition"
                      title="Stop generating"
                    >
                      <Square className="w-4 h-4 fill-white" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputPrompt.trim()}
                      className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/30 transition disabled:opacity-40 disabled:pointer-events-none"
                      title="Send prompt"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom input info hints */}
              <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-zinc-400 font-mono">
                <div className="flex items-center gap-2">
                  <span>~{estimateTokens(inputPrompt)} tokens</span>
                  <span>•</span>
                  <span>Model: {currentModel.name}</span>
                </div>
                <div className="hidden sm:block">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">Enter</kbd> to submit
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Parameters Sidebar (Drawer) */}
        {showParameters && (
          <aside className="w-80 border-l border-zinc-800 bg-zinc-950 p-5 overflow-y-auto space-y-6 shrink-0 animate-slide-left">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-violet-400" />
                Parameters
              </h3>
              <button
                onClick={() => setShowParameters(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300 block">
                System Prompt
              </label>
              <textarea
                value={parameters.systemPrompt}
                onChange={(e) => setParameters({ ...parameters, systemPrompt: e.target.value })}
                rows={3}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
                placeholder="Direct assistant behavior..."
              />
            </div>

            {/* Temperature Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="text-zinc-300 font-medium">Temperature</label>
                <span className="font-mono text-violet-400">{parameters.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={parameters.temperature}
                onChange={(e) => setParameters({ ...parameters, temperature: parseFloat(e.target.value) })}
                className="w-full accent-violet-600 bg-zinc-800 rounded-lg h-1.5 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>0.0 (Deterministic)</span>
                <span>1.5 (Creative)</span>
              </div>
            </div>

            {/* Max Output Tokens */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="text-zinc-300 font-medium">Max Output Tokens</label>
                <span className="font-mono text-violet-400">{parameters.maxTokens}</span>
              </div>
              <input
                type="range"
                min="128"
                max="4096"
                step="128"
                value={parameters.maxTokens}
                onChange={(e) => setParameters({ ...parameters, maxTokens: parseInt(e.target.value, 10) })}
                className="w-full accent-violet-600 bg-zinc-800 rounded-lg h-1.5 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>128</span>
                <span>4096</span>
              </div>
            </div>

            {/* Top P Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="text-zinc-300 font-medium">Top P (Nucleus Sampling)</label>
                <span className="font-mono text-violet-400">{parameters.topP}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={parameters.topP}
                onChange={(e) => setParameters({ ...parameters, topP: parseFloat(e.target.value) })}
                className="w-full accent-violet-600 bg-zinc-800 rounded-lg h-1.5 cursor-pointer"
              />
            </div>

            {/* Reset to Defaults */}
            <button
              onClick={() =>
                setParameters({
                  temperature: 0.7,
                  maxTokens: 2048,
                  topP: 1.0,
                  systemPrompt: 'You are a helpful, expert AI assistant. Answer accurately, thoughtfully, and clearly.',
                })
              }
              className="w-full py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition"
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
        <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-[#07090e] text-zinc-400 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
            <span>Loading AI Playground...</span>
          </div>
        </div>
      }
    >
      <PlaygroundContent />
    </React.Suspense>
  );
}

