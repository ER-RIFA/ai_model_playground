'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  ArrowUpDown, 
  LayoutGrid,
  List,
  ArrowRight
} from 'lucide-react';
import { AIModel } from '@/types';
import { POPULAR_MODELS, PROVIDERS, CAPABILITY_TAGS } from '@/data/models';
import { ModelCard } from '@/components/ModelCard';
import { ModelDetailModal } from '@/components/ModelDetailModal';
import { formatNumber, formatPrice } from '@/lib/utils';

export default function ModelDiscoveryPage() {
  const [models, setModels] = useState<AIModel[]>(POPULAR_MODELS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('All Providers');
  const [selectedCapability, setSelectedCapability] = useState('All Capabilities');
  const [sortBy, setSortBy] = useState<'featured' | 'context-desc' | 'price-asc' | 'name-asc'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [inspectingModel, setInspectingModel] = useState<AIModel | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models) && data.models.length > 0) {
            setModels(data.models);
          }
        }
      } catch (err) {
        console.error('Failed to load models:', err);
      }
    }
    fetchModels();
  }, []);

  const filteredModels = useMemo(() => {
    return models
      .filter((model) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = model.name.toLowerCase().includes(q);
          const matchesId = model.id.toLowerCase().includes(q);
          const matchesDesc = model.description.toLowerCase().includes(q);
          const matchesArch = (model.architecture || '').toLowerCase().includes(q);
          if (!matchesName && !matchesId && !matchesDesc && !matchesArch) return false;
        }

        if (selectedProvider !== 'All Providers' && model.provider !== selectedProvider) {
          return false;
        }

        if (selectedCapability !== 'All Capabilities') {
          if (selectedCapability === 'Free') {
            if (!model.isFree) return false;
          } else {
            if (!model.capabilities.includes(selectedCapability as any)) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'featured') {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        }
        if (sortBy === 'context-desc') {
          return b.contextLength - a.contextLength;
        }
        if (sortBy === 'price-asc') {
          return a.pricing.prompt - b.pricing.prompt;
        }
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [models, searchQuery, selectedProvider, selectedCapability, sortBy]);

  const freeModelsCount = useMemo(() => models.filter((m) => m.isFree).length, [models]);

  return (
    <div className="flex-1 bg-[#191919] text-[#F1F0EB] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Section: Title & Metrics */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#383733]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#76746E]">
            Model Catalog
          </span>
          <h2 className="font-serif text-2xl font-normal tracking-wide text-[#F1F0EB] mt-0.5">
            Frontier AI Models
          </h2>
          <p className="text-xs text-[#A5A39D] mt-1 max-w-xl leading-relaxed">
            Index of frontier models, parameter weights, context windows, and cost profiles. Select any model to benchmark or run interactive inference.
          </p>
        </div>

        {/* Compact KPI Tiles */}
        <div className="flex items-center gap-2.5 font-mono text-xs shrink-0">
          <div className="px-3 py-1.5 rounded-sm bg-[#222220] border border-[#383733]">
            <div className="text-[9px] text-[#76746E] uppercase">Index</div>
            <div className="text-xs font-semibold text-[#F1F0EB]">{models.length} models</div>
          </div>
          <div className="px-3 py-1.5 rounded-sm bg-[#222220] border border-[#383733]">
            <div className="text-[9px] text-[#76746E] uppercase">Free Tier</div>
            <div className="text-xs font-semibold text-[#48A977]">{freeModelsCount} models</div>
          </div>
          <div className="px-3 py-1.5 rounded-sm bg-[#222220] border border-[#383733]">
            <div className="text-[9px] text-[#76746E] uppercase">Context Ceiling</div>
            <div className="text-xs font-semibold text-[#8CB2D4]">1M tokens</div>
          </div>
        </div>
      </div>

      {/* Filter and Query Toolbar */}
      <div className="p-3.5 rounded-sm bg-[#20201F] border border-[#383733] space-y-3">
        {/* Top Control Line: Search + Sort + View */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#76746E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by model name, architecture, ID, or provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-[#191919] border border-[#383733] rounded-sm text-xs text-[#F1F0EB] placeholder-[#76746E] focus:outline-none focus:border-[#8CB2D4] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#A5A39D] hover:text-[#F1F0EB]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-[#191919] border border-[#383733] rounded-sm px-2.5 py-1 text-xs text-[#A5A39D]">
              <ArrowUpDown className="w-3 h-3 text-[#76746E]" />
              <span className="text-[11px] font-mono">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-[#F1F0EB] focus:outline-none cursor-pointer"
              >
                <option value="featured" className="bg-[#20201F]">Featured First</option>
                <option value="context-desc" className="bg-[#20201F]">Context (High to Low)</option>
                <option value="price-asc" className="bg-[#20201F]">Price (Low to High)</option>
                <option value="name-asc" className="bg-[#20201F]">Model Name (A-Z)</option>
              </select>
            </div>

            {/* View Switcher */}
            <div className="flex items-center border border-[#383733] rounded-sm bg-[#191919] p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-sm transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#292927] text-[#F1F0EB]'
                    : 'text-[#76746E] hover:text-[#A5A39D]'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded-sm transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#292927] text-[#F1F0EB]'
                    : 'text-[#76746E] hover:text-[#A5A39D]'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Segment Tabs */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pt-2 border-t border-[#383733] text-xs">
          {/* Provider Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full md:w-auto">
            <span className="text-[10px] font-mono text-[#76746E] uppercase mr-1 shrink-0">Provider:</span>
            {PROVIDERS.map((provider) => {
              const active = selectedProvider === provider;
              return (
                <button
                  key={provider}
                  onClick={() => setSelectedProvider(provider)}
                  className={`px-2 py-0.5 rounded-sm text-xs transition-colors border ${
                    active
                      ? 'bg-[#292927] text-[#F1F0EB] border-[#383733] font-medium'
                      : 'bg-transparent text-[#A5A39D] hover:text-[#F1F0EB] border-transparent'
                  }`}
                >
                  {provider}
                </button>
              );
            })}
          </div>

          {/* Capabilities */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full md:w-auto">
            <span className="text-[10px] font-mono text-[#76746E] uppercase mr-1 shrink-0">Capability:</span>
            {CAPABILITY_TAGS.map((cap) => {
              const active = selectedCapability === cap;
              return (
                <button
                  key={cap}
                  onClick={() => setSelectedCapability(cap)}
                  className={`px-2 py-0.5 rounded-sm text-xs transition-colors border ${
                    active
                      ? 'bg-[#2F658E]/20 text-[#8CB2D4] border-[#2F658E]/40 font-medium'
                      : 'bg-transparent text-[#A5A39D] hover:text-[#F1F0EB] border-transparent'
                  }`}
                >
                  {cap}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[#A5A39D] font-mono px-1">
        <span>
          INDEX: <strong className="text-[#F1F0EB]">{filteredModels.length}</strong> / {models.length}
        </span>
        <Link
          href="/compare"
          className="text-[#8CB2D4] hover:underline flex items-center gap-1"
        >
          <span>Side-by-Side Arena</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Models Presentation: Grid vs Table */}
      {filteredModels.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onOpenDetails={(m) => setInspectingModel(m)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-sm border border-[#383733] bg-[#222220] overflow-x-auto">
            <table className="min-w-full divide-y divide-[#383733] text-left text-xs font-sans">
              <thead className="bg-[#20201F] text-[10px] font-mono uppercase text-[#76746E]">
                <tr>
                  <th className="px-4 py-2.5">Model</th>
                  <th className="px-4 py-2.5">Provider</th>
                  <th className="px-4 py-2.5">Context</th>
                  <th className="px-4 py-2.5">Prompt Cost</th>
                  <th className="px-4 py-2.5">Capabilities</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#383733]/60 font-mono">
                {filteredModels.map((model) => (
                  <tr key={model.id} className="hover:bg-[#252524] transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="font-serif text-sm font-normal text-[#F1F0EB]">{model.name}</div>
                      <div className="text-[10px] text-[#76746E]">{model.id}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 rounded-sm text-[10px] bg-[#20201F] text-[#A5A39D] border border-[#383733]">
                        {model.provider}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#DCDAD4]">
                      {formatNumber(model.contextLength)} tok
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={model.isFree ? 'text-[#48A977]' : 'text-[#DCDAD4]'}>
                        {model.isFree ? 'Free' : formatPrice(model.pricing.prompt)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-sans">
                      <div className="flex items-center gap-1 flex-wrap">
                        {model.capabilities.slice(0, 3).map((cap) => (
                          <span key={cap} className="px-1.5 py-0.5 rounded-sm text-[10px] bg-[#20201F] text-[#A5A39D] border border-[#383733]">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectingModel(model)}
                          className="px-2 py-1 rounded-sm text-xs text-[#A5A39D] hover:text-[#F1F0EB] bg-[#20201F] hover:bg-[#292927] border border-[#383733] transition-colors"
                        >
                          Specs
                        </button>
                        <Link
                          href={`/playground?model=${encodeURIComponent(model.id)}`}
                          className="px-2.5 py-1 rounded-sm text-xs font-medium bg-[#2F658E] hover:bg-[#255273] text-[#F1F0EB] transition-colors"
                        >
                          Launch
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="p-12 text-center rounded-sm bg-[#222220] border border-[#383733]">
          <h3 className="font-serif text-base font-normal text-[#F1F0EB] mb-1">No matching models</h3>
          <p className="text-xs text-[#A5A39D] max-w-sm mx-auto mb-3">
            Try adjusting your query or resetting provider and capability filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedProvider('All Providers');
              setSelectedCapability('All Capabilities');
            }}
            className="px-3 py-1.5 text-xs rounded-sm bg-[#292927] hover:bg-[#383733] text-[#F1F0EB] border border-[#383733] transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Model Spec Modal */}
      <ModelDetailModal
        model={inspectingModel}
        onClose={() => setInspectingModel(null)}
      />
    </div>
  );
}
