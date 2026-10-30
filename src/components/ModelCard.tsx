'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight,
  Info
} from 'lucide-react';
import { AIModel } from '@/types';
import { formatNumber, formatPrice } from '@/lib/utils';

interface ModelCardProps {
  model: AIModel;
  onOpenDetails: (model: AIModel) => void;
}

const PROVIDER_STYLES: Record<string, { badge: string }> = {
  DeepSeek: { badge: 'bg-[#1e293b] text-[#60a5fa] border-[#2563eb]/30' },
  Meta: { badge: 'bg-[#0c4a6e]/40 text-[#38bdf8] border-[#0284c7]/30' },
  Google: { badge: 'bg-[#064e3b]/40 text-[#34d399] border-[#059669]/30' },
  OpenAI: { badge: 'bg-[#134e4a]/40 text-[#2dd4bf] border-[#0d9488]/30' },
  Anthropic: { badge: 'bg-[#451a03]/40 text-[#fbbf24] border-[#d97706]/30' },
  Mistral: { badge: 'bg-[#431407]/40 text-[#fb923c] border-[#ea580c]/30' },
  Alibaba: { badge: 'bg-[#1e293b] text-[#94a3b8] border-[#475569]/30' },
};

export function ModelCard({ model, onOpenDetails }: ModelCardProps) {
  const providerStyle = PROVIDER_STYLES[model.provider] || {
    badge: 'bg-[#181d26] text-[#94a3b8] border-[#2e3545]',
  };

  return (
    <div className="flex flex-col justify-between p-4 rounded-lg bg-[#13171f] border border-[#222733] hover:border-[#2e3545] hover:bg-[#151922] transition-colors duration-150">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${providerStyle.badge}`}>
              {model.provider}
            </span>
            {model.isFree && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#064e3b]/30 text-[#34d399] border border-[#059669]/30">
                Free
              </span>
            )}
            {model.featured && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1e293b] text-[#93c5fd] border border-[#3b82f6]/30">
                Featured
              </span>
            )}
          </div>

          <button
            onClick={() => onOpenDetails(model)}
            className="text-[#8b94a0] hover:text-[#f1f3f7] p-1 rounded hover:bg-[#181d26] transition-colors"
            title="View specifications"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="text-sm font-semibold text-[#f1f3f7] tracking-tight">
          {model.name}
        </h3>
        <p className="text-[11px] font-mono text-[#5c6470] mt-0.5 mb-2 truncate" title={model.id}>
          {model.id}
        </p>

        <p className="text-xs text-[#8b94a0] line-clamp-2 leading-relaxed mb-3">
          {model.description}
        </p>
      </div>

      {/* Metrics & Capabilities */}
      <div>
        <div className="grid grid-cols-2 gap-2 py-2 px-2.5 rounded-md bg-[#0c0e12] border border-[#222733] mb-3 text-xs">
          <div>
            <span className="text-[10px] text-[#5c6470] block font-mono uppercase tracking-wider">
              Context
            </span>
            <span className="font-medium text-[#f1f3f7] font-mono text-[11px]">
              {formatNumber(model.contextLength)} tok
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#5c6470] block font-mono uppercase tracking-wider">
              Prompt Cost
            </span>
            <span className={`font-medium font-mono text-[11px] ${model.isFree ? 'text-[#10b981]' : 'text-[#cbd5e1]'}`}>
              {model.isFree ? 'Free' : formatPrice(model.pricing.prompt)}
            </span>
          </div>
        </div>

        {/* Capability Tags */}
        <div className="flex items-center gap-1 flex-wrap mb-3">
          {model.capabilities.map((cap) => (
            <span
              key={cap}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#181d26] text-[#8b94a0] border border-[#222733]"
            >
              {cap}
            </span>
          ))}
          {model.architecture && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#5c6470] bg-[#0c0e12] border border-[#222733] truncate max-w-[110px]">
              {model.architecture}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-[#222733]">
          <Link
            href={`/playground?model=${encodeURIComponent(model.id)}`}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-colors"
          >
            <span>Playground</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <Link
            href={`/compare?modelA=${encodeURIComponent(model.id)}`}
            className="px-2.5 py-1.5 rounded-md text-xs font-medium text-[#8b94a0] hover:text-[#f1f3f7] bg-[#181d26] hover:bg-[#222733] border border-[#222733] transition-colors"
          >
            Compare
          </Link>
        </div>
      </div>
    </div>
  );
}
