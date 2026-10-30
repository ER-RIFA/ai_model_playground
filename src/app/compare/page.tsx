'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Square, 
  Columns, 
  Zap, 
  Clock, 
  Hash, 
  AlertCircle, 
  Copy, 
  Check, 
  Trophy
} from 'lucide-react';
import { AIModel } from '@/types';
import { POPULAR_MODELS } from '@/data/models';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { estimateTokens } from '@/lib/utils';

function CompareArenaContent() {
  const searchParams = useSearchParams();
  const initialModelA = searchParams.get('modelA') || 'deepseek/deepseek-r1:free';
  const initialModelB = searchParams.get('modelB') || 'meta-llama/llama-3.3-70b-instruct:free';

  const [models, setModels] = useState<AIModel[]>(POPULAR_MODELS);
  const [modelAId, setModelAId] = useState(initialModelA);
  const [modelBId, setModelBId] = useState(initialModelB);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Results for Model A
  const [responseA, setResponseA] = useState('');
  const [latencyA, setLatencyA] = useState<number | null>(null);
  const [tokensA, setTokensA] = useState<number | null>(null);
  const [errorA, setErrorA] = useState<string | null>(null);

  // Results for Model B
  const [responseB, setResponseB] = useState('');
  const [latencyB, setLatencyB] = useState<number | null>(null);
  const [tokensB, setTokensB] = useState<number | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);

  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);

  const abortRefA = useRef<AbortController | null>(null);
  const abortRefB = useRef<AbortController | null>(null);

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

  const modelA = models.find((m) => m.id === modelAId) || models[0] || POPULAR_MODELS[0];
  const modelB = models.find((m) => m.id === modelBId) || models[1] || POPULAR_MODELS[1];

  const handleRunComparison = async () => {
    const input = prompt.trim();
    if (!input || isGenerating) return;

    setIsGenerating(true);
    setResponseA('');
    setLatencyA(null);
    setTokensA(null);
    setErrorA(null);

    setResponseB('');
    setLatencyB(null);
    setTokensB(null);
    setErrorB(null);

    const customApiKey = typeof window !== 'undefined'
      ? localStorage.getItem('ai_playground_openrouter_key') || ''
      : '';

    // Model A execution
    const runModelA = async () => {
      const abortA = new AbortController();
      abortRefA.current = abortA;
      const startTime = Date.now();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelA.id,
            messages: [{ role: 'user', content: input }],
            temperature: 0.7,
            customApiKey,
          }),
          signal: abortA.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let content = '';
        let buffer = '';

        while (reader) {
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
                content += data.text;
                setResponseA(content);
              } else if (data.type === 'done') {
                setLatencyA(data.latencyMs || Date.now() - startTime);
                setTokensA(data.tokenUsage?.total || estimateTokens(content));
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch {}
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setErrorA(err.message || 'Error occurred');
        }
      }
    };

    // Model B execution
    const runModelB = async () => {
      const abortB = new AbortController();
      abortRefB.current = abortB;
      const startTime = Date.now();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelB.id,
            messages: [{ role: 'user', content: input }],
            temperature: 0.7,
            customApiKey,
          }),
          signal: abortB.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let content = '';
        let buffer = '';

        while (reader) {
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
                content += data.text;
                setResponseB(content);
              } else if (data.type === 'done') {
                setLatencyB(data.latencyMs || Date.now() - startTime);
                setTokensB(data.tokenUsage?.total || estimateTokens(content));
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch {}
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setErrorB(err.message || 'Error occurred');
        }
      }
    };

    await Promise.allSettled([runModelA(), runModelB()]);
    setIsGenerating(false);
  };

  const handleStopAll = () => {
    abortRefA.current?.abort();
    abortRefB.current?.abort();
    setIsGenerating(false);
  };

  const copyResponseA = () => {
    navigator.clipboard.writeText(responseA);
    setCopiedA(true);
    setTimeout(() => setCopiedA(false), 2000);
  };

  const copyResponseB = () => {
    navigator.clipboard.writeText(responseB);
    setCopiedB(true);
    setTimeout(() => setCopiedB(false), 2000);
  };

  const fasterModel = latencyA && latencyB
    ? latencyA < latencyB ? 'A' : latencyB < latencyA ? 'B' : 'Tie'
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#07090e] text-zinc-100 overflow-hidden">
      {/* Compare Header Controls */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Side-by-Side Model Arena
              </h2>
              <p className="text-xs text-zinc-400">
                Benchmark two models on the exact same prompt concurrently
              </p>
            </div>
          </div>

          {/* Prompt input and submit */}
          <div className="flex items-center gap-2 flex-1 max-w-2xl">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunComparison()}
              placeholder="Enter benchmark prompt (e.g. Write a TypeScript memoize function)..."
              className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
            {isGenerating ? (
              <button
                onClick={handleStopAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                Stop
              </button>
            ) : (
              <button
                onClick={handleRunComparison}
                disabled={!prompt.trim()}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-violet-600/25 transition disabled:opacity-40 disabled:pointer-events-none"
              >
                <Zap className="w-3.5 h-3.5" />
                Benchmark
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Arena Split View */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800 overflow-hidden">
        {/* Model A Column */}
        <div className="flex flex-col h-full overflow-hidden bg-zinc-950/40">
          {/* Model A Header Selector */}
          <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-violet-600/20 text-violet-400 text-xs font-bold flex items-center justify-center border border-violet-500/30">
                A
              </span>
              <select
                value={modelAId}
                onChange={(e) => setModelAId(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.isFree ? '(Free)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
              {latencyA && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {latencyA}ms
                  {fasterModel === 'A' && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 ml-1">
                      <Trophy className="w-3 h-3" /> Faster
                    </span>
                  )}
                </span>
              )}
              {tokensA && (
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3 text-violet-400" />
                  {tokensA} tok
                </span>
              )}
              {responseA && (
                <button
                  onClick={copyResponseA}
                  className="p-1 hover:text-white transition"
                  title="Copy output"
                >
                  {copiedA ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Model A Output */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {errorA ? (
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900/50 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 mb-1" />
                {errorA}
              </div>
            ) : responseA ? (
              <div className="space-y-3">
                <MarkdownRenderer content={responseA} />
              </div>
            ) : isGenerating ? (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span>Streaming response from {modelA.name}...</span>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-xs text-zinc-400 py-12">
                Awaiting benchmark prompt...
              </div>
            )}
          </div>
        </div>

        {/* Model B Column */}
        <div className="flex flex-col h-full overflow-hidden bg-zinc-950/40">
          {/* Model B Header Selector */}
          <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-600/20 text-cyan-400 text-xs font-bold flex items-center justify-center border border-cyan-500/30">
                B
              </span>
              <select
                value={modelBId}
                onChange={(e) => setModelBId(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.isFree ? '(Free)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
              {latencyB && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {latencyB}ms
                  {fasterModel === 'B' && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 ml-1">
                      <Trophy className="w-3 h-3" /> Faster
                    </span>
                  )}
                </span>
              )}
              {tokensB && (
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3 text-violet-400" />
                  {tokensB} tok
                </span>
              )}
              {responseB && (
                <button
                  onClick={copyResponseB}
                  className="p-1 hover:text-white transition"
                  title="Copy output"
                >
                  {copiedB ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Model B Output */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {errorB ? (
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900/50 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 mb-1" />
                {errorB}
              </div>
            ) : responseB ? (
              <div className="space-y-3">
                <MarkdownRenderer content={responseB} />
              </div>
            ) : isGenerating ? (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Streaming response from {modelB.name}...</span>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-xs text-zinc-400 py-12">
                Awaiting benchmark prompt...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompareArenaPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-[#07090e] text-zinc-400 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
            <span>Loading Comparison Arena...</span>
          </div>
        </div>
      }
    >
      <CompareArenaContent />
    </React.Suspense>
  );
}

