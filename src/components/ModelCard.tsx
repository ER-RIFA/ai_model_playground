'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Info, Zap } from 'lucide-react';
import { AIModel } from '@/types';
import { formatNumber, formatPrice } from '@/lib/utils';

interface ModelCardProps {
  model: AIModel;
  onOpenDetails: (model: AIModel) => void;
}

export function ModelCard({ model, onOpenDetails }: ModelCardProps) {
  return (
    <div className="group flex flex-col justify-between p-5 rounded-md bg-[#16191F] border border-[#222630] hover:border-[#58C5B2]/50 hover:bg-[#181B22] transition-all duration-200">
      {/* Header Info */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#9CA3AF] bg-[#111317] border border-[#222630]">
              {model.provider}
            </span>
            {model.isFree && (
              <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-medium text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30">
                Free Tier
              </span>
            )}
            {model.featured && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/30">
                <Zap className="w-2.5 h-2.5 fill-current" />
                Featured
              </span>
            )}
          </div>

          <button
            onClick={() => onOpenDetails(model)}
            className="text-[#64748B] hover:text-[#F1F3F5] p-1 rounded hover:bg-[#21262F] transition-colors"
            title="Inspect Model Architecture & Specs"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-base font-semibold text-[#F1F3F5] tracking-tight mb-1">
          {model.name}
        </h3>
        <p className="text-[11px] font-mono text-[#64748B] mb-2.5 truncate" title={model.id}>
          {model.id}
        </p>

        <p className="text-xs text-[#9CA3AF] line-clamp-3 leading-relaxed mb-4">
          {model.description}
        </p>
      </div>

      {/* Metrics & Capabilities */}
      <div>
        <div className="grid grid-cols-2 gap-2 py-3 px-3 rounded bg-[#111317] border border-[#222630] mb-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-[#64748B] block uppercase tracking-wider">
              Context
            </span>
            <span className="font-semibold text-[#F1F3F5] text-[11px]">
              {formatNumber(model.contextLength)} tok
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] block uppercase tracking-wider">
              Prompt Cost
            </span>
            <span className={`font-semibold text-[11px] ${model.isFree ? 'text-[#10B981]' : 'text-[#F1F3F5]'}`}>
              {model.isFree ? 'Free' : formatPrice(model.pricing.prompt)}
            </span>
          </div>
        </div>

        {/* Capability Tags */}
        <div className="flex items-center gap-1 flex-wrap mb-4">
          {model.capabilities.map((cap) => (
            <span
              key={cap}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#111317] text-[#9CA3AF] border border-[#222630]"
            >
              {cap}
            </span>
          ))}
          {model.architecture && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#64748B] bg-[#111317] border border-[#222630] truncate max-w-[120px]">
              {model.architecture}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pt-2.5 border-t border-[#222630]">
          <Link
            href={`/playground?model=${encodeURIComponent(model.id)}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            href={`/compare?modelA=${encodeURIComponent(model.id)}`}
            className="px-3 py-1.5 rounded text-xs font-medium text-[#9CA3AF] hover:text-[#F1F3F5] bg-[#111317] hover:bg-[#21262F] border border-[#222630] transition-colors"
          >
            Arena
          </Link>
        </div>
      </div>
    </div>
  );
}