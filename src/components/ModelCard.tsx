'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { AIModel } from '@/types';
import { formatNumber, formatPrice } from '@/lib/utils';

interface ModelCardProps {
  model: AIModel;
  onOpenDetails: (model: AIModel) => void;
}

export function ModelCard({ model, onOpenDetails }: ModelCardProps) {
  return (
    <div className="flex flex-col justify-between p-4 rounded-sm bg-[#222220] border border-[#383733] hover:border-[#4A4843] transition-colors duration-150">
      {/* Header Info */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-wider bg-[#20201F] text-[#A5A39D] border border-[#383733]">
              {model.provider}
            </span>
            {model.isFree && (
              <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-mono text-[#48A977] bg-[#48A977]/10 border border-[#48A977]/30">
                Free Tier
              </span>
            )}
            {model.featured && (
              <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-mono text-[#8CB2D4] bg-[#2F658E]/20 border border-[#2F658E]/40">
                Benchmark
              </span>
            )}
          </div>

          <button
            onClick={() => onOpenDetails(model)}
            className="text-[#76746E] hover:text-[#F1F0EB] p-1 rounded-sm hover:bg-[#292927] transition-colors"
            title="Inspect Model Architecture"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="font-serif text-base font-normal tracking-wide text-[#F1F0EB]">
          {model.name}
        </h3>
        <p className="text-[11px] font-mono text-[#76746E] mt-0.5 mb-2 truncate" title={model.id}>
          {model.id}
        </p>

        <p className="text-xs text-[#A5A39D] line-clamp-2 leading-relaxed mb-3">
          {model.description}
        </p>
      </div>

      {/* Metrics & Capabilities */}
      <div>
        <div className="grid grid-cols-2 gap-2 py-2 px-2.5 rounded-sm bg-[#191919] border border-[#383733] mb-3 text-xs font-mono">
          <div>
            <span className="text-[10px] text-[#76746E] block uppercase tracking-wider">
              Context
            </span>
            <span className="font-medium text-[#F1F0EB] text-[11px]">
              {formatNumber(model.contextLength)} tok
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#76746E] block uppercase tracking-wider">
              Prompt Cost
            </span>
            <span className={`font-medium text-[11px] ${model.isFree ? 'text-[#48A977]' : 'text-[#F1F0EB]'}`}>
              {model.isFree ? 'Free' : formatPrice(model.pricing.prompt)}
            </span>
          </div>
        </div>

        {/* Capability Tags */}
        <div className="flex items-center gap-1 flex-wrap mb-3">
          {model.capabilities.map((cap) => (
            <span
              key={cap}
              className="px-1.5 py-0.5 rounded-sm text-[10px] font-sans bg-[#20201F] text-[#A5A39D] border border-[#383733]"
            >
              {cap}
            </span>
          ))}
          {model.architecture && (
            <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-mono text-[#76746E] bg-[#191919] border border-[#383733] truncate max-w-[110px]">
              {model.architecture}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-[#383733]">
          <Link
            href={`/playground?model=${encodeURIComponent(model.id)}`}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-sm text-xs font-medium bg-[#2F658E] hover:bg-[#255273] text-[#F1F0EB] transition-colors"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <Link
            href={`/compare?modelA=${encodeURIComponent(model.id)}`}
            className="px-2.5 py-1.5 rounded-sm text-xs font-medium text-[#A5A39D] hover:text-[#F1F0EB] bg-[#20201F] hover:bg-[#292927] border border-[#383733] transition-colors"
          >
            Compare
          </Link>
        </div>
      </div>
    </div>
  );
}
