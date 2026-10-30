'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Square, 
  Columns, 
  Clock, 
  Hash, 
  AlertCircle, 
  Copy, 
  Check, 
  ChevronDown
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

  // Model A
  const [responseA, setResponseA] = useState('');
  const [latencyA, setLatencyA] = useState<number | null>(null);
  const [tokensA, setTokensA] = useState<number | null>(null);
  const [errorA, setErrorA] = useState<string | null>(null);

  // Model B
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
          setErrorA(err.message || 'Generation failed');
        }
      }
    };

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
          setErrorB(err.message || 'Generation failed');
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
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#0c0e12] text-[#f1f3f7] overflow-hidden">
      {/* Benchmark Control Bar */}
      <div className="px-4 py-2.5 border-b border-[#222733] bg-[#10141b] shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Columns className="w-4 h-4 text-[#3b82f6]" />
            <span className="text-xs font-semibold text-[#f1f3f7]">Model Arena</span>
            <span className="text-[11px] font-mono text-[#5c6470] hidden sm:inline">
              Concurrent Benchmarking
            </span>
          </div>

          {/* Benchmark Prompt Input */}
          <div className="flex items-center gap-2 flex-1 max-w-2xl">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunComparison()}
              placeholder="Enter benchmark prompt to execute against both models concurrently..."
              className="flex-1 px-3 py-1.5 bg-[#0c0e12] border border-[#222733] rounded-md text-xs text-[#f1f3f7] placeholder-[#5c6470] focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
            {isGenerating ? (
              <button
                onClick={handleStopAll}
                className="px-3 py-1.5 bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-medium rounded-md flex items-center gap-1 transition-colors"
              >
                <Square className="w-3 h-3 fill-white" />
                Stop
              </button>
            ) : (
              <button
                onClick={handleRunComparison}
                disabled={!prompt.trim()}
                className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-medium rounded-md flex items-center gap-1 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                Benchmark
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Arena Split Panes */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#222733] overflow-hidden">
        {/* Model A Pane */}
        <div className="flex flex-col h-full overflow-hidden bg-[#0c0e12]">
          <div className="p-2.5 border-b border-[#222733] flex items-center justify-between bg-[#10141b]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#181d26] text-[#3b82f6] text-[11px] font-mono font-bold flex items-center justify-center border border-[#222733]">
                A
              </span>
              <div className="relative">
                <select
                  value={modelAId}
                  onChange={(e) => setModelAId(e.target.value)}
                  className="appearance-none bg-[#13171f] border border-[#222733] text-xs font-medium text-[#f1f3f7] rounded-md pl-2.5 pr-6 py-1 focus:outline-none focus:border-[#3b82f6] cursor-pointer"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#13171f]">
                      {m.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#5c6470] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-2.5 text-[11px] font-mono text-[#8b94a0]">
              {latencyA && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#38bdf8]" />
                  {latencyA}ms
                  {fasterModel === 'A' && (
                    <span className="text-[10px] text-[#10b981] font-semibold px-1 rounded bg-[#064e3b]/30 border border-[#059669]/30 ml-0.5">
                      Faster
                    </span>
                  )}
                </span>
              )}
              {tokensA && (
                <span className="flex items-center gap-1 text-[#5c6470]">
                  <Hash className="w-3 h-3" />
                  {tokensA} tok
                </span>
              )}
              {responseA && (
                <button
                  onClick={copyResponseA}
                  className="p-1 hover:text-[#f1f3f7] transition-colors"
                  title="Copy output"
                >
                  {copiedA ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>

          {/* Model A Output Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {errorA ? (
              <div className="p-3 rounded-md bg-[#ef4444]/10 border border-[#ef4444]/30 text-xs text-[#fca5a5]">
                <AlertCircle className="w-4 h-4 text-[#ef4444] mb-1" />
                {errorA}
              </div>
            ) : responseA ? (
              <MarkdownRenderer content={responseA} />
            ) : isGenerating ? (
              <div className="flex items-center gap-2 text-xs text-[#8b94a0]">
                <span className="w-1.5 h-1.5 rounded-sm bg-[#3b82f6] animate-pulse" />
                <span>Generating response from {modelA.name}...</span>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#5c6470] font-mono">
                Awaiting benchmark prompt...
              </div>
            )}
          </div>
        </div>

        {/* Model B Pane */}
        <div className="flex flex-col h-full overflow-hidden bg-[#0c0e12]">
          <div className="p-2.5 border-b border-[#222733] flex items-center justify-between bg-[#10141b]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#181d26] text-[#38bdf8] text-[11px] font-mono font-bold flex items-center justify-center border border-[#222733]">
                B
              </span>
              <div className="relative">
                <select
                  value={modelBId}
                  onChange={(e) => setModelBId(e.target.value)}
                  className="appearance-none bg-[#13171f] border border-[#222733] text-xs font-medium text-[#f1f3f7] rounded-md pl-2.5 pr-6 py-1 focus:outline-none focus:border-[#3b82f6] cursor-pointer"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#13171f]">
                      {m.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#5c6470] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-2.5 text-[11px] font-mono text-[#8b94a0]">
              {latencyB && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#38bdf8]" />
                  {latencyB}ms
                  {fasterModel === 'B' && (
                    <span className="text-[10px] text-[#10b981] font-semibold px-1 rounded bg-[#064e3b]/30 border border-[#059669]/30 ml-0.5">
                      Faster
                    </span>
                  )}
                </span>
              )}
              {tokensB && (
                <span className="flex items-center gap-1 text-[#5c6470]">
                  <Hash className="w-3 h-3" />
                  {tokensB} tok
                </span>
              )}
              {responseB && (
                <button
                  onClick={copyResponseB}
                  className="p-1 hover:text-[#f1f3f7] transition-colors"
                  title="Copy output"
                >
                  {copiedB ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>

          {/* Model B Output Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {errorB ? (
              <div className="p-3 rounded-md bg-[#ef4444]/10 border border-[#ef4444]/30 text-xs text-[#fca5a5]">
                <AlertCircle className="w-4 h-4 text-[#ef4444] mb-1" />
                {errorB}
              </div>
            ) : responseB ? (
              <MarkdownRenderer content={responseB} />
            ) : isGenerating ? (
              <div className="flex items-center gap-2 text-xs text-[#8b94a0]">
                <span className="w-1.5 h-1.5 rounded-sm bg-[#38bdf8] animate-pulse" />
                <span>Generating response from {modelB.name}...</span>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#5c6470] font-mono">
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
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[#0c0e12] text-[#8b94a0] text-xs font-mono">
          Loading Arena...
        </div>
      }
    >
      <CompareArenaContent />
    </React.Suspense>
  );
}
