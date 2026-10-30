'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Sparkles, 
  Eye, 
  ArrowRight
} from 'lucide-react';
import { AIModel } from '@/types';
import { formatNumber, formatPrice } from '@/lib/utils';

interface ModelCardProps {
  model: AIModel;
  onOpenDetails: (model: AIModel) => void;
}

const PROVIDER_COLORS: Record<string, { badge: string; border: string }> = {
  DeepSeek: { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', border: 'hover:border-blue-500/40' },
  Meta: { badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20', border: 'hover:border-sky-500/40' },
  Google: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', border: 'hover:border-emerald-500/40' },
  OpenAI: { badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20', border: 'hover:border-teal-500/40' },
  Anthropic: { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', border: 'hover:border-amber-500/40' },
  Mistral: { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', border: 'hover:border-orange-500/40' },
  Alibaba: { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', border: 'hover:border-purple-500/40' },
};

export function ModelCard({ model, onOpenDetails }: ModelCardProps) {
  const providerStyle = PROVIDER_COLORS[model.provider] || {
    badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    border: 'hover:border-zinc-700',
  };

  return (
    <div className={`group flex flex-col justify-between p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 ${providerStyle.border} hover:bg-zinc-900/90 transition-all duration-200 shadow-md hover:shadow-xl`}>
      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${providerStyle.badge}`}>
              {model.provider}
            </span>
            {model.isFree && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Free Tier
              </span>
            )}
            {model.featured && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Featured
              </span>
            )}
          </div>

          <button
            onClick={() => onOpenDetails(model)}
            className="text-xs text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition"
            title="Inspect model specs"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-base font-semibold text-white group-hover:text-violet-300 transition-colors">
          {model.name}
        </h3>
        <p className="text-xs text-zinc-400 font-mono mt-0.5 mb-3 truncate" title={model.id}>
          {model.id}
        </p>

        <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed mb-4">
          {model.description}
        </p>
      </div>

      {/* Card Specs & Capabilities */}
      <div>
        <div className="grid grid-cols-2 gap-2 py-3 px-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 mb-3.5 text-xs">
          <div>
            <span className="text-[10px] text-zinc-400 block uppercase font-mono tracking-wider">
              Context Window
            </span>
            <span className="font-semibold text-white font-mono">
              {formatNumber(model.contextLength)} tokens
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block uppercase font-mono tracking-wider">
              Pricing
            </span>
            <span className={`font-semibold font-mono ${model.isFree ? 'text-emerald-400' : 'text-zinc-200'}`}>
              {model.isFree ? '100% Free' : formatPrice(model.pricing.prompt)}
            </span>
          </div>
        </div>

        {/* Capability Tags */}
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          {model.capabilities.map((cap) => (
            <span
              key={cap}
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60"
            >
              {cap}
            </span>
          ))}
          {model.architecture && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-zinc-950/80 border border-zinc-800 truncate max-w-[120px]">
              {model.architecture}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/70">
          <Link
            href={`/playground?model=${encodeURIComponent(model.id)}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-600/20 transition"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Try in Playground</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>

          <Link
            href={`/compare?modelA=${encodeURIComponent(model.id)}`}
            className="px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700/60 transition"
            title="Benchmark in Arena"
          >
            Compare
          </Link>
        </div>
      </div>
    </div>
  );
}
