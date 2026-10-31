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
  ChevronDown,
  Sparkles,
  ArrowRight,
  Zap,
  Gauge
} from 'lucide-react';
import { AIModel } from '@/types';
import { POPULAR_MODELS } from '@/data/models';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { estimateTokens } from '@/lib/utils';

const SUGGESTED_PROMPTS = [
  'Explain Raft consensus protocol concisely in 3 bullet points.',
  'Write a TypeScript function to debounce an async callback with generics.',
  'Analyze the architectural trade-offs between REST and GraphQL.',
  'Solve the 2-Sum problem in Rust with optimal O(n) space and time.'
];

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

  const handleRunComparison = async (overridePrompt?: string) => {
    const input = (overridePrompt || prompt).trim();
    if (!input || isGenerating) return;

    if (overridePrompt) {
      setPrompt(overridePrompt);
    }

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

            const data = JSON.parse(dataStr);
            if (data.type === 'chunk' && data.text) {
              content += data.text;
              setResponseA(content);
            } else if (data.type === 'done') {
              setLatencyA(data.latencyMs || Date.now() - startTime);
              setTokensA(data.tokenUsage?.total || estimateTokens(content));
            } else if (data.type === 'error') {
              throw new Error(data.message || 'Provider stream failed.');
            }
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

            const data = JSON.parse(dataStr);
            if (data.type === 'chunk' && data.text) {
              content += data.text;
              setResponseB(content);
            } else if (data.type === 'done') {
              setLatencyB(data.latencyMs || Date.now() - startTime);
              setTokensB(data.tokenUsage?.total || estimateTokens(content));
            } else if (data.type === 'error') {
              throw new Error(data.message || 'Provider stream failed.');
            }
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
    <div className="flex flex-col h-[calc(100vh-4.25rem)] bg-[#0B0C0E] text-[#F1F3F5] overflow-hidden">
      {/* Benchmark Control Bar */}
      <div className="px-4 py-2.5 border-b border-[#222630] bg-[#111317] shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#16191F] border border-[#222630] flex items-center justify-center text-[#2563EB]">
              <Columns className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-tight text-[#F1F3F5]">Arena Benchmark</h1>
                <span className="text-[10px] font-mono font-medium text-[#9CA3AF] px-1.5 py-0.5 rounded bg-[#16191F] border border-[#222630]">
                  Dual-Stream
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] hidden sm:block">
                Execute identical prompts simultaneously across two models to evaluate latency and response fidelity.
              </p>
            </div>
          </div>

          {/* Prompt Input & Trigger */}
          <div className="flex items-center gap-2 flex-1 max-w-2xl">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunComparison()}
              placeholder="Enter benchmark prompt to execute against both models concurrently..."
              className="flex-1 px-3 py-1.5 bg-[#0B0C0E] border border-[#222630] rounded text-xs text-[#F1F3F5] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] transition-colors"
            />
            {isGenerating ? (
              <button
                onClick={handleStopAll}
                className="px-3.5 py-1.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Square className="w-3 h-3 fill-white" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={() => handleRunComparison()}
                disabled={!prompt.trim()}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:pointer-events-none shrink-0"
              >
                <span>Run Arena</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Arena Split Panes */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#222630] overflow-hidden">
        {/* Model A Pane */}
        <div className="flex flex-col h-full overflow-hidden bg-[#0B0C0E]">
          <div className="p-2.5 border-b border-[#222630] flex items-center justify-between bg-[#111317]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#16191F] text-[#60A5FA] text-[11px] font-mono font-bold flex items-center justify-center border border-[#222630]">
                A
              </span>
              <div className="relative">
                <select
                  value={modelAId}
                  onChange={(e) => setModelAId(e.target.value)}
                  className="appearance-none bg-[#16191F] border border-[#222630] text-xs font-semibold text-[#F1F3F5] rounded pl-2.5 pr-6 py-1 focus:outline-none focus:border-[#2563EB] cursor-pointer"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#111317]">
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-2.5 text-[11px] font-mono text-[#9CA3AF]">
              {latencyA !== null && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#2563EB]" />
                  <span>{latencyA}ms</span>
                  {fasterModel === 'A' && (
                    <span className="text-[10px] text-[#10B981] font-semibold px-1.5 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30 ml-0.5">
                      Faster
                    </span>
                  )}
                </span>
              )}
              {tokensA !== null && (
                <span className="flex items-center gap-1 text-[#64748B]">
                  <Hash className="w-3 h-3 text-[#64748B]" />
                  <span>{tokensA} tok</span>
                </span>
              )}
              {responseA && (
                <button
                  onClick={copyResponseA}
                  className="p-1 hover:text-[#F1F3F5] rounded transition-colors"
                  title="Copy output"
                >
                  {copiedA ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Model A Output Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {errorA ? (
              <div className="p-3.5 rounded bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
                <div className="flex items-center gap-1.5 mb-1 font-mono uppercase text-[10px] font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Execution Failure</span>
                </div>
                {errorA}
              </div>
            ) : responseA ? (
              <MarkdownRenderer content={responseA} />
            ) : isGenerating ? (
              <div className="flex items-center gap-2 text-xs text-[#9CA3AF] py-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                <span className="font-mono">Streaming response from {modelA.name}...</span>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#9CA3AF]">
                <div className="w-8 h-8 rounded bg-[#111317] border border-[#222630] flex items-center justify-center text-[#64748B] mb-2 font-mono text-xs">
                  A
                </div>
                <p className="text-sm font-semibold text-[#F1F3F5] mb-1">Model A Ready</p>
                <p className="text-xs text-[#64748B] max-w-xs font-sans">
                  Select a model above and enter a prompt in the top control bar to stream output.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Model B Pane */}
        <div className="flex flex-col h-full overflow-hidden bg-[#0B0C0E]">
          <div className="p-2.5 border-b border-[#222630] flex items-center justify-between bg-[#111317]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#16191F] text-[#34D399] text-[11px] font-mono font-bold flex items-center justify-center border border-[#222630]">
                B
              </span>
              <div className="relative">
                <select
                  value={modelBId}
                  onChange={(e) => setModelBId(e.target.value)}
                  className="appearance-none bg-[#16191F] border border-[#222630] text-xs font-semibold text-[#F1F3F5] rounded pl-2.5 pr-6 py-1 focus:outline-none focus:border-[#2563EB] cursor-pointer"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#111317]">
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-2.5 text-[11px] font-mono text-[#9CA3AF]">
              {latencyB !== null && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#10B981]" />
                  <span>{latencyB}ms</span>
                  {fasterModel === 'B' && (
                    <span className="text-[10px] text-[#10B981] font-semibold px-1.5 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30 ml-0.5">
                      Faster
                    </span>
                  )}
                </span>
              )}
              {tokensB !== null && (
                <span className="flex items-center gap-1 text-[#64748B]">
                  <Hash className="w-3 h-3 text-[#64748B]" />
                  <span>{tokensB} tok</span>
                </span>
              )}
              {responseB && (
                <button
                  onClick={copyResponseB}
                  className="p-1 hover:text-[#F1F3F5] rounded transition-colors"
                  title="Copy output"
                >
                  {copiedB ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Model B Output Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {errorB ? (
              <div className="p-3.5 rounded bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
                <div className="flex items-center gap-1.5 mb-1 font-mono uppercase text-[10px] font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Execution Failure</span>
                </div>
                {errorB}
              </div>
            ) : responseB ? (
              <MarkdownRenderer content={responseB} />
            ) : isGenerating ? (
              <div className="flex items-center gap-2 text-xs text-[#9CA3AF] py-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span className="font-mono">Streaming response from {modelB.name}...</span>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#9CA3AF]">
                <div className="w-8 h-8 rounded bg-[#111317] border border-[#222630] flex items-center justify-center text-[#64748B] mb-2 font-mono text-xs">
                  B
                </div>
                <p className="text-sm font-semibold text-[#F1F3F5] mb-1">Model B Ready</p>
                <p className="text-xs text-[#64748B] max-w-xs font-sans">
                  Select a second model above to compare output quality side-by-side.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggested prompts strip when empty */}
      {!responseA && !responseB && !isGenerating && (
        <div className="px-4 py-2 border-t border-[#222630] bg-[#111317] shrink-0">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto text-xs py-0.5">
            <span className="flex items-center gap-1 text-[11px] font-mono text-[#64748B] shrink-0 mr-1">
              <Sparkles className="w-3 h-3 text-[#2563EB]" />
              Quick prompts:
            </span>
            {SUGGESTED_PROMPTS.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleRunComparison(suggestion)}
                className="px-2.5 py-1 rounded bg-[#16191F] hover:bg-[#21262F] border border-[#222630] text-[11px] text-[#9CA3AF] hover:text-[#F1F3F5] shrink-0 transition-colors truncate max-w-xs text-left"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompareArenaPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-3.25rem)] bg-[#0B0C0E] text-[#64748B] text-xs font-mono">
          Loading Arena...
        </div>
      }
    >
      <CompareArenaContent />
    </React.Suspense>
  );
}