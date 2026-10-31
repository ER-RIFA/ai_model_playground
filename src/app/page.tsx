'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  ArrowUpDown, 
  LayoutGrid,
  List,
  ArrowRight,
  ExternalLink,
  Zap,
  Cpu,
  Layers,
  Coins
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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
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
    <div className="flex-1 bg-[#0B0C0E] text-[#F1F3F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Title and Strategic Telemetry Strip */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F1F3F5]">
                Find the right model for the work
              </h1>
              <p className="text-sm text-[#9CA3AF] mt-2 max-w-2xl leading-relaxed">
                A practical catalog for comparing capability, context, speed, and cost before you open an inference session.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/compare"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#16191F] hover:bg-[#21262F] border border-[#222630] text-[#F1F3F5] transition-colors"
              >
                <span>Compare two models</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
              </Link>
            </div>
          </div>

          {/* Integrated hairline metric strip (No cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y md:divide-y-0 divide-[#222630] border border-[#222630] rounded-md bg-[#111317] overflow-hidden text-xs">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-[#9CA3AF]">Models indexed</span>
              <span className="font-mono font-semibold text-[#F1F3F5]">{models.length}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-[#9CA3AF]">Free to try</span>
              <span className="font-mono font-semibold text-[#10B981]">{freeModelsCount}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-[#9CA3AF]">Largest context</span>
              <span className="font-mono font-semibold text-[#38BDF8]">1.04M tok</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-[#9CA3AF]">Routing layer</span>
              <span className="font-mono font-semibold text-[#F1F3F5]">OpenRouter v1</span>
            </div>
          </div>
        </div>

        {/* Filter and Query Toolbar */}
        <div className="p-3.5 rounded-md bg-[#111317] border border-[#222630] space-y-3">
          {/* Top Control Line: Search + Sort + View */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search models by name, architecture, provider, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-[#0B0C0E] border border-[#222630] rounded text-xs text-[#F1F3F5] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] hover:text-[#F1F3F5]"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 bg-[#0B0C0E] border border-[#222630] rounded px-2.5 py-1 text-xs text-[#9CA3AF]">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B]" />
                <span className="text-[11px] font-mono">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs text-[#F1F3F5] focus:outline-none cursor-pointer"
                >
                  <option value="featured" className="bg-[#111317]">Featured First</option>
                  <option value="context-desc" className="bg-[#111317]">Context Length (High-Low)</option>
                  <option value="price-asc" className="bg-[#111317]">Prompt Cost (Low-High)</option>
                  <option value="name-asc" className="bg-[#111317]">Name (A-Z)</option>
                </select>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center border border-[#222630] rounded bg-[#0B0C0E] p-0.5">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1 rounded text-xs transition-colors ${
                    viewMode === 'table'
                      ? 'bg-[#21262F] text-[#F1F3F5]'
                      : 'text-[#64748B] hover:text-[#9CA3AF]'
                  }`}
                  title="Matrix Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded text-xs transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#21262F] text-[#F1F3F5]'
                      : 'text-[#64748B] hover:text-[#9CA3AF]'
                  }`}
                  title="Card Deck View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Chips: Providers & Capabilities */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 pt-2 border-t border-[#222630] text-xs">
            {/* Provider Filter */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full md:w-auto">
              <span className="text-[10px] font-mono text-[#64748B] uppercase mr-1 shrink-0">Provider:</span>
              {PROVIDERS.map((provider) => {
                const active = selectedProvider === provider;
                return (
                  <button
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors border ${
                      active
                        ? 'bg-[#21262F] text-[#F1F3F5] border-[#2F3542] font-medium'
                        : 'bg-transparent text-[#9CA3AF] hover:text-[#F1F3F5] border-transparent'
                    }`}
                  >
                    {provider}
                  </button>
                );
              })}
            </div>

            {/* Capability Filter */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full md:w-auto">
              <span className="text-[10px] font-mono text-[#64748B] uppercase mr-1 shrink-0">Capability:</span>
              {CAPABILITY_TAGS.map((cap) => {
                const active = selectedCapability === cap;
                return (
                  <button
                    key={cap}
                    onClick={() => setSelectedCapability(cap)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors border ${
                      active
                        ? 'bg-[#2563EB]/20 text-[#60A5FA] border-[#2563EB]/40 font-medium'
                        : 'bg-transparent text-[#9CA3AF] hover:text-[#F1F3F5] border-transparent'
                    }`}
                  >
                    {cap}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Header Counter */}
        <div className="flex items-center justify-between text-xs font-mono text-[#9CA3AF] px-1">
          <span>
            SHOWING <strong className="text-[#F1F3F5]">{filteredModels.length}</strong> OF {models.length} MODELS
          </span>
          <span className="text-[11px] text-[#64748B]">Click any model to inspect architectural specifications</span>
        </div>

        {/* Results: Table Matrix or Card Deck */}
        {filteredModels.length > 0 ? (
          viewMode === 'table' ? (
            <div className="rounded-md border border-[#222630] bg-[#111317] overflow-x-auto">
              <table className="min-w-full divide-y divide-[#222630] text-left text-xs">
                <thead className="bg-[#0B0C0E] text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                  <tr>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Context Window</th>
                    <th className="px-4 py-3">Input Cost</th>
                    <th className="px-4 py-3">Throughput</th>
                    <th className="px-4 py-3">Capabilities</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222630]/60">
                  {filteredModels.map((model) => (
                    <tr key={model.id} className="hover:bg-[#16191F] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#F1F3F5]">{model.name}</div>
                        <div className="text-[10px] font-mono text-[#64748B] truncate max-w-xs">{model.id}</div>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-[#0B0C0E] text-[#9CA3AF] border border-[#222630]">
                          {model.provider}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#F1F3F5]">
                        {formatNumber(model.contextLength)} tok
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className={model.isFree ? 'font-medium text-[#10B981]' : 'text-[#F1F3F5]'}>
                          {model.isFree ? 'Free' : formatPrice(model.pricing.prompt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#9CA3AF]">
                        {model.speedRating || 'Fast'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {model.capabilities.slice(0, 3).map((cap) => (
                            <span key={cap} className="px-1.5 py-0.5 rounded text-[10px] bg-[#0B0C0E] text-[#9CA3AF] border border-[#222630]">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectingModel(model)}
                            className="px-2.5 py-1 rounded text-xs font-medium text-[#9CA3AF] hover:text-[#F1F3F5] bg-[#0B0C0E] hover:bg-[#21262F] border border-[#222630] transition-colors"
                          >
                            Specs
                          </button>
                          <Link
                            href={`/playground?model=${encodeURIComponent(model.id)}`}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors"
                          >
                            Studio
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onOpenDetails={(m) => setInspectingModel(m)}
                />
              ))}
            </div>
          )
        ) : (
          <div className="p-12 text-center rounded-md bg-[#111317] border border-[#222630]">
            <h3 className="text-sm font-semibold text-[#F1F3F5] mb-1">No models match your filter</h3>
            <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto mb-4">
              Try adjusting your search query or selecting &quot;All Providers&quot; and &quot;All Capabilities&quot;.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedProvider('All Providers');
                setSelectedCapability('All Capabilities');
              }}
              className="px-3 py-1.5 text-xs rounded bg-[#16191F] hover:bg-[#21262F] text-[#F1F3F5] border border-[#222630] transition-colors"
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
    </div>
  );
}