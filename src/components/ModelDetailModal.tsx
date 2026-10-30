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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-none">
      <div className="bg-[#20201F] border border-[#383733] rounded-sm w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#383733] bg-[#1C1C1B]">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-[#8CB2D4]" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base font-normal tracking-wide text-[#F1F0EB]">{model.name}</h2>
                {model.isFree && (
                  <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-mono text-[#48A977] bg-[#48A977]/10 border border-[#48A977]/30">
                    Free
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-[#76746E]">{model.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-[#A5A39D] hover:text-[#F1F0EB] hover:bg-[#292927] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Description */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#76746E] mb-1.5">
              Model Description
            </h4>
            <p className="text-xs text-[#DCDAD4] leading-relaxed bg-[#191919] p-3 rounded-sm border border-[#383733]">
              {model.description}
            </p>
          </div>

          {/* Technical Specifications */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#76746E] mb-2">
              Architecture & Limits
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-sm bg-[#191919] border border-[#383733]">
                <div className="flex items-center gap-1.5 text-[#A5A39D] mb-1 font-mono text-[10px]">
                  <Layers className="w-3 h-3 text-[#8CB2D4]" />
                  <span>Context Window</span>
                </div>
                <div className="text-xs font-semibold text-[#F1F0EB] font-mono">
                  {formatNumber(model.contextLength)} tok
                </div>
              </div>

              <div className="p-2.5 rounded-sm bg-[#191919] border border-[#383733]">
                <div className="flex items-center gap-1.5 text-[#A5A39D] mb-1 font-mono text-[10px]">
                  <Terminal className="w-3 h-3 text-[#8CB2D4]" />
                  <span>Max Completion</span>
                </div>
                <div className="text-xs font-semibold text-[#F1F0EB] font-mono">
                  {formatNumber(model.maxCompletionTokens || 4096)} tok
                </div>
              </div>

              <div className="p-2.5 rounded-sm bg-[#191919] border border-[#383733]">
                <div className="flex items-center gap-1.5 text-[#A5A39D] mb-1 font-mono text-[10px]">
                  <Gauge className="w-3 h-3 text-[#8CB2D4]" />
                  <span>Throughput Tier</span>
                </div>
                <div className="text-xs font-semibold text-[#F1F0EB] font-mono">
                  {model.speedRating || 'Standard'}
                </div>
              </div>

              <div className="p-2.5 rounded-sm bg-[#191919] border border-[#383733]">
                <div className="flex items-center gap-1.5 text-[#A5A39D] mb-1 font-mono text-[10px]">
                  <Coins className="w-3 h-3 text-[#8CB2D4]" />
                  <span>Prompt Price</span>
                </div>
                <div className="text-xs font-semibold text-[#48A977] font-mono">
                  {model.isFree ? 'Free' : formatPrice(model.pricing.prompt)}
                </div>
              </div>

              <div className="p-2.5 rounded-sm bg-[#191919] border border-[#383733]">
                <div className="flex items-center gap-1.5 text-[#A5A39D] mb-1 font-mono text-[10px]">
                  <Coins className="w-3 h-3 text-[#8CB2D4]" />
                  <span>Completion Price</span>
                </div>
                <div className="text-xs font-semibold text-[#48A977] font-mono">
                  {model.isFree ? 'Free' : formatPrice(model.pricing.completion)}
                </div>
              </div>

              <div className="p-2.5 rounded-sm bg-[#191919] border border-[#383733]">
                <div className="flex items-center gap-1.5 text-[#A5A39D] mb-1 font-mono text-[10px]">
                  <Calendar className="w-3 h-3 text-[#8CB2D4]" />
                  <span>Provider</span>
                </div>
                <div className="text-xs font-semibold text-[#F1F0EB] truncate">
                  {model.provider}
                </div>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#76746E] mb-1.5">
              Supported Capabilities
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {model.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="px-2 py-0.5 rounded-sm text-[11px] font-sans bg-[#292927] text-[#DCDAD4] border border-[#383733]"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {/* Recommended Prompt */}
          {model.samplePrompt && (
            <div>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#76746E] mb-1.5">
                Benchmark Prompt
              </h4>
              <div className="p-3 bg-[#191919] border border-[#383733] rounded-sm text-xs text-[#A5A39D] font-mono leading-relaxed">
                &ldquo;{model.samplePrompt}&rdquo;
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#383733] bg-[#1C1C1B]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#A5A39D] hover:text-[#F1F0EB] hover:bg-[#292927] rounded-sm transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <Link
              href={`/compare?modelA=${encodeURIComponent(model.id)}`}
              onClick={onClose}
              className="px-3 py-1.5 rounded-sm text-xs font-medium bg-[#292927] hover:bg-[#383733] text-[#F1F0EB] border border-[#383733] transition-colors"
            >
              Compare
            </Link>
            <Link
              href={`/playground?model=${encodeURIComponent(model.id)}`}
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-xs font-medium bg-[#2F658E] hover:bg-[#255273] text-[#F1F0EB] transition-colors"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
