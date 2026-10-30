'use client';

import React from 'react';
import Link from 'next/link';
import { 
  X, 
  Layers, 
  Coins, 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none animate-fade-in">
      <div className="bg-[#13171f] border border-[#2e3545] rounded-lg w-full max-w-xl overflow-hidden shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222733] bg-[#10141b]">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-[#3b82f6]" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#f1f3f7]">{model.name}</h2>
                {model.isFree && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#064e3b]/30 text-[#34d399] border border-[#059669]/30">
                    Free
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-[#5c6470]">{model.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8b94a0] hover:text-[#f1f3f7] hover:bg-[#181d26] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Overview */}
          <div>
            <h4 className="text-[11px] font-medium uppercase font-mono tracking-wider text-[#5c6470] mb-1.5">
              Description
            </h4>
            <p className="text-xs text-[#cbd5e1] leading-relaxed bg-[#0c0e12] p-3 rounded-md border border-[#222733]">
              {model.description}
            </p>
          </div>

          {/* Technical Specifications */}
          <div>
            <h4 className="text-[11px] font-medium uppercase font-mono tracking-wider text-[#5c6470] mb-2">
              Specifications
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-md bg-[#0c0e12] border border-[#222733]">
                <div className="flex items-center gap-1.5 text-[#8b94a0] mb-1">
                  <Layers className="w-3 h-3 text-[#3b82f6]" />
                  <span className="text-[11px]">Context Window</span>
                </div>
                <div className="text-xs font-semibold text-[#f1f3f7] font-mono">
                  {formatNumber(model.contextLength)} tokens
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-[#0c0e12] border border-[#222733]">
                <div className="flex items-center gap-1.5 text-[#8b94a0] mb-1">
                  <Terminal className="w-3 h-3 text-[#3b82f6]" />
                  <span className="text-[11px]">Max Output</span>
                </div>
                <div className="text-xs font-semibold text-[#f1f3f7] font-mono">
                  {formatNumber(model.maxCompletionTokens || 4096)} tokens
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-[#0c0e12] border border-[#222733]">
                <div className="flex items-center gap-1.5 text-[#8b94a0] mb-1">
                  <Gauge className="w-3 h-3 text-[#3b82f6]" />
                  <span className="text-[11px]">Throughput</span>
                </div>
                <div className="text-xs font-semibold text-[#38bdf8] font-mono">
                  {model.speedRating || 'Standard'}
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-[#0c0e12] border border-[#222733]">
                <div className="flex items-center gap-1.5 text-[#8b94a0] mb-1">
                  <Coins className="w-3 h-3 text-[#3b82f6]" />
                  <span className="text-[11px]">Prompt Price</span>
                </div>
                <div className="text-xs font-semibold text-[#10b981] font-mono">
                  {model.isFree ? 'Free' : formatPrice(model.pricing.prompt)}
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-[#0c0e12] border border-[#222733]">
                <div className="flex items-center gap-1.5 text-[#8b94a0] mb-1">
                  <Coins className="w-3 h-3 text-[#3b82f6]" />
                  <span className="text-[11px]">Completion Price</span>
                </div>
                <div className="text-xs font-semibold text-[#10b981] font-mono">
                  {model.isFree ? 'Free' : formatPrice(model.pricing.completion)}
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-[#0c0e12] border border-[#222733]">
                <div className="flex items-center gap-1.5 text-[#8b94a0] mb-1">
                  <Calendar className="w-3 h-3 text-[#3b82f6]" />
                  <span className="text-[11px]">Provider</span>
                </div>
                <div className="text-xs font-semibold text-[#f1f3f7] truncate">
                  {model.provider}
                </div>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <h4 className="text-[11px] font-medium uppercase font-mono tracking-wider text-[#5c6470] mb-1.5">
              Capabilities
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {model.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#181d26] text-[#cbd5e1] border border-[#222733]"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {/* Recommended Prompt */}
          {model.samplePrompt && (
            <div>
              <h4 className="text-[11px] font-medium uppercase font-mono tracking-wider text-[#5c6470] mb-1.5">
                Benchmark Prompt
              </h4>
              <div className="p-3 bg-[#0c0e12] border border-[#222733] rounded-md text-xs text-[#8b94a0] font-mono leading-relaxed">
                &ldquo;{model.samplePrompt}&rdquo;
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#222733] bg-[#10141b]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-[#8b94a0] hover:text-[#f1f3f7] hover:bg-[#181d26] rounded-md transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <Link
              href={`/compare?modelA=${encodeURIComponent(model.id)}`}
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#181d26] hover:bg-[#222733] text-[#f1f3f7] border border-[#222733] transition-colors"
            >
              Compare
            </Link>
            <Link
              href={`/playground?model=${encodeURIComponent(model.id)}`}
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-colors"
            >
              <span>Try in Playground</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
