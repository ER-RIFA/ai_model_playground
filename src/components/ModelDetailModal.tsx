'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  X, 
  Layers, 
  Coins, 
  Calendar, 
  Cpu, 
  Terminal, 
  ArrowRight,
  Gauge,
  Copy,
  Check
} from 'lucide-react';
import { AIModel } from '@/types';
import { formatNumber, formatPrice } from '@/lib/utils';

interface ModelDetailModalProps {
  model: AIModel | null;
  onClose: () => void;
}

export function ModelDetailModal({ model, onClose }: ModelDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!model) return null;

  const handleCopyPrompt = () => {
    if (model.samplePrompt) {
      navigator.clipboard.writeText(model.samplePrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-none">
      <div className="bg-[#111317] border border-[#222630] rounded-md w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222630] bg-[#0B0C0E]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#16191F] border border-[#222630] flex items-center justify-center text-[#2563EB]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#F1F3F5] tracking-tight">{model.name}</h2>
                {model.isFree && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30">
                    Free Tier
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-[#64748B]">{model.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#9CA3AF] hover:text-[#F1F3F5] hover:bg-[#16191F] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Description */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mb-1.5">
              Overview
            </h4>
            <p className="text-xs text-[#9CA3AF] leading-relaxed bg-[#0B0C0E] p-3 rounded border border-[#222630]">
              {model.description}
            </p>
          </div>

          {/* Technical Specifications */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mb-2">
              Architecture & Limits
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded bg-[#0B0C0E] border border-[#222630]">
                <div className="flex items-center gap-1.5 text-[#64748B] mb-1 font-mono text-[10px]">
                  <Layers className="w-3 h-3 text-[#2563EB]" />
                  <span>Context Window</span>
                </div>
                <div className="text-xs font-semibold text-[#F1F3F5] font-mono">
                  {formatNumber(model.contextLength)} tok
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#0B0C0E] border border-[#222630]">
                <div className="flex items-center gap-1.5 text-[#64748B] mb-1 font-mono text-[10px]">
                  <Terminal className="w-3 h-3 text-[#2563EB]" />
                  <span>Max Completion</span>
                </div>
                <div className="text-xs font-semibold text-[#F1F3F5] font-mono">
                  {formatNumber(model.maxCompletionTokens || 4096)} tok
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#0B0C0E] border border-[#222630]">
                <div className="flex items-center gap-1.5 text-[#64748B] mb-1 font-mono text-[10px]">
                  <Gauge className="w-3 h-3 text-[#2563EB]" />
                  <span>Throughput Tier</span>
                </div>
                <div className="text-xs font-semibold text-[#F1F3F5] font-mono">
                  {model.speedRating || 'Fast'}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#0B0C0E] border border-[#222630]">
                <div className="flex items-center gap-1.5 text-[#64748B] mb-1 font-mono text-[10px]">
                  <Coins className="w-3 h-3 text-[#10B981]" />
                  <span>Prompt Cost / 1M</span>
                </div>
                <div className="text-xs font-semibold text-[#10B981] font-mono">
                  {model.isFree ? 'Free' : formatPrice(model.pricing.prompt)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#0B0C0E] border border-[#222630]">
                <div className="flex items-center gap-1.5 text-[#64748B] mb-1 font-mono text-[10px]">
                  <Coins className="w-3 h-3 text-[#10B981]" />
                  <span>Completion / 1M</span>
                </div>
                <div className="text-xs font-semibold text-[#10B981] font-mono">
                  {model.isFree ? 'Free' : formatPrice(model.pricing.completion)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#0B0C0E] border border-[#222630]">
                <div className="flex items-center gap-1.5 text-[#64748B] mb-1 font-mono text-[10px]">
                  <Calendar className="w-3 h-3 text-[#64748B]" />
                  <span>Provider</span>
                </div>
                <div className="text-xs font-semibold text-[#F1F3F5] truncate">
                  {model.provider}
                </div>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mb-1.5">
              Supported Capabilities
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {model.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#16191F] text-[#9CA3AF] border border-[#222630]"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {/* Benchmark Prompt */}
          {model.samplePrompt && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                  Benchmark Evaluation Prompt
                </h4>
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1 text-[11px] text-[#2563EB] hover:text-[#3B82F6]"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 bg-[#0B0C0E] border border-[#222630] rounded text-xs text-[#9CA3AF] font-mono leading-relaxed">
                &ldquo;{model.samplePrompt}&rdquo;
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#222630] bg-[#0B0C0E]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F1F3F5] rounded transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <Link
              href={`/compare?modelA=${encodeURIComponent(model.id)}`}
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-medium bg-[#16191F] hover:bg-[#21262F] text-[#F1F3F5] border border-[#222630] transition-colors"
            >
              Arena Compare
            </Link>
            <Link
              href={`/playground?model=${encodeURIComponent(model.id)}`}
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors"
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