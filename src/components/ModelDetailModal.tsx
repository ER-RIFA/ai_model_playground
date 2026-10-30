'use client';

import React from 'react';
import Link from 'next/link';
import { 
  X, 
  Zap, 
  Layers, 
  Coins, 
  Sparkles, 
  Calendar, 
  Cpu, 
  Terminal, 
  ArrowRight,
  Gauge
} from 'lucide-react';
import { AIModel } from '@/types';
import { formatNumber, formatPrice } from '@/lib/utils';

interface ModelDetailModalProps {
  model: AIModel | null;
  onClose: () => void;
}

export function ModelDetailModal({ model, onClose }: ModelDetailModalProps) {
  if (!model) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {model.name}
                {model.isFree && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Free Tier
                  </span>
                )}
              </h2>
              <p className="text-xs font-mono text-zinc-400">{model.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Overview
            </h4>
            <p className="text-sm text-zinc-200 leading-relaxed bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/80">
              {model.description}
            </p>
          </div>

          {/* Key Specs Grid */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Technical Specifications
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-400 mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Context Window</span>
                </div>
                <div className="text-base font-bold text-white font-mono">
                  {formatNumber(model.contextLength)} tokens
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-400 mb-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Max Output</span>
                </div>
                <div className="text-base font-bold text-white font-mono">
                  {formatNumber(model.maxCompletionTokens || 4096)} tokens
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-400 mb-1">
                  <Gauge className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Speed Rating</span>
                </div>
                <div className="text-base font-bold text-cyan-400 font-mono">
                  {model.speedRating || 'Fast'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-400 mb-1">
                  <Coins className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Prompt Cost</span>
                </div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {model.isFree ? 'Free' : formatPrice(model.pricing.prompt)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-400 mb-1">
                  <Coins className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Completion Cost</span>
                </div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {model.isFree ? 'Free' : formatPrice(model.pricing.completion)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-400 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Provider / Release</span>
                </div>
                <div className="text-sm font-bold text-white truncate">
                  {model.provider} {model.releaseDate ? `(${model.releaseDate})` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
              Supported Capabilities
            </h4>
            <div className="flex flex-wrap gap-2">
              {model.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {/* Sample Benchmark Prompt */}
          {model.samplePrompt && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Recommended Prompt
              </h4>
              <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-300 font-mono italic">
                &ldquo;{model.samplePrompt}&rdquo;
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <Link
              href={`/compare?modelA=${encodeURIComponent(model.id)}`}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
            >
              Compare
            </Link>
            <Link
              href={`/playground?model=${encodeURIComponent(model.id)}`}
              onClick={onClose}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25 transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Open in Playground</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
