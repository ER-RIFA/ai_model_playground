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
        console.error('Failed to load dynamic models, using fallback catalog:', err);
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
    <div className="min-h-screen bg-[#0c0e12] text-[#f1f3f7] pb-16">
      {/* Top Header & Metrics Strip */}
      <section className="border-b border-[#222733] bg-[#10141b] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#3b82f6] font-medium">
                  Catalog Directory
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f1f3f7]">
                AI Model Directory
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#8b94a0] max-w-2xl leading-relaxed">
                Explore supported frontier and open-weight models. Compare context windows, token pricing, and latency across providers.
              </p>
            </div>

            {/* Structured Metric Badges */}
            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="px-3 py-2 rounded-md bg-[#13171f] border border-[#222733]">
                <div className="text-[10px] text-[#5c6470] uppercase">Models</div>
                <div className="text-sm font-semibold text-[#f1f3f7]">{models.length}</div>
              </div>
              <div className="px-3 py-2 rounded-md bg-[#13171f] border border-[#222733]">
                <div className="text-[10px] text-[#5c6470] uppercase">Free Tier</div>
                <div className="text-sm font-semibold text-[#10b981]">{freeModelsCount}</div>
              </div>
              <div className="px-3 py-2 rounded-md bg-[#13171f] border border-[#222733]">
                <div className="text-[10px] text-[#5c6470] uppercase">Max Context</div>
                <div className="text-sm font-semibold text-[#38bdf8]">1M tokens</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Filtering & Search Toolbar */}
        <div className="p-3.5 rounded-lg bg-[#13171f] border border-[#222733] mb-5 space-y-3">
          {/* Top Row: Search + Sort + View Mode */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#5c6470] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search models by name, architecture, provider, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-[#0c0e12] border border-[#222733] rounded-md text-xs text-[#f1f3f7] placeholder-[#5c6470] focus:outline-none focus:border-[#3b82f6] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8b94a0] hover:text-[#f1f3f7]"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Sort selector */}
              <div className="flex items-center gap-1.5 bg-[#0c0e12] border border-[#222733] rounded-md px-2.5 py-1.5 text-xs text-[#8b94a0]">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#5c6470]" />
                <span className="text-[11px]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs text-[#f1f3f7] focus:outline-none cursor-pointer"
                >
                  <option value="featured" className="bg-[#13171f]">Featured</option>
                  <option value="context-desc" className="bg-[#13171f]">Context: High to Low</option>
                  <option value="price-asc" className="bg-[#13171f]">Price: Low to High</option>
                  <option value="name-asc" className="bg-[#13171f]">Name (A-Z)</option>
                </select>
              </div>

              {/* View toggle (Grid / Table) */}
              <div className="flex items-center border border-[#222733] rounded-md bg-[#0c0e12] p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#181d26] text-[#f1f3f7]'
                      : 'text-[#5c6470] hover:text-[#8b94a0]'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1 rounded transition-colors ${
                    viewMode === 'table'
                      ? 'bg-[#181d26] text-[#f1f3f7]'
                      : 'text-[#5c6470] hover:text-[#8b94a0]'
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Provider and Capability Filter Tabs */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pt-2 border-t border-[#222733]/60 text-xs">
            {/* Providers */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full md:w-auto">
              <span className="text-[11px] text-[#5c6470] font-mono mr-1 shrink-0">Provider:</span>
              {PROVIDERS.map((provider) => {
                const active = selectedProvider === provider;
                return (
                  <button
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
                      active
                        ? 'bg-[#181d26] text-[#f1f3f7] border-[#2e3545]'
                        : 'bg-transparent text-[#8b94a0] hover:text-[#f1f3f7] border-transparent'
                    }`}
                  >
                    {provider}
                  </button>
                );
              })}
            </div>

            {/* Capabilities */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full md:w-auto">
              <span className="text-[11px] text-[#5c6470] font-mono mr-1 shrink-0">Type:</span>
              {CAPABILITY_TAGS.map((cap) => {
                const active = selectedCapability === cap;
                return (
                  <button
                    key={cap}
                    onClick={() => setSelectedCapability(cap)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
                      active
                        ? 'bg-[#1e293b] text-[#38bdf8] border-[#0284c7]/40'
                        : 'bg-transparent text-[#8b94a0] hover:text-[#f1f3f7] border-transparent'
                    }`}
                  >
                    {cap}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Counter Info */}
        <div className="flex items-center justify-between text-xs text-[#8b94a0] mb-3 px-1">
          <span>
            Showing <strong className="text-[#f1f3f7]">{filteredModels.length}</strong> of {models.length} models
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/compare"
              className="text-xs text-[#3b82f6] hover:text-[#60a5fa] hover:underline flex items-center gap-1"
            >
              <span>Compare Models</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Content Display: Grid or Table */}
        {filteredModels.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onOpenDetails={(m) => setInspectingModel(m)}
                />
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="rounded-lg border border-[#222733] bg-[#13171f] overflow-x-auto">
              <table className="min-w-full divide-y divide-[#222733] text-left text-xs">
                <thead className="bg-[#10141b] text-[11px] font-mono uppercase text-[#5c6470]">
                  <tr>
                    <th className="px-4 py-2.5">Model</th>
                    <th className="px-4 py-2.5">Provider</th>
                    <th className="px-4 py-2.5">Context</th>
                    <th className="px-4 py-2.5">Prompt Price</th>
                    <th className="px-4 py-2.5">Capabilities</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222733]/60">
                  {filteredModels.map((model) => (
                    <tr key={model.id} className="hover:bg-[#151922] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#f1f3f7]">{model.name}</div>
                        <div className="text-[11px] font-mono text-[#5c6470]">{model.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#181d26] text-[#cbd5e1] border border-[#222733]">
                          {model.provider}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#cbd5e1]">
                        {formatNumber(model.contextLength)} tok
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className={model.isFree ? 'text-[#10b981]' : 'text-[#cbd5e1]'}>
                          {model.isFree ? 'Free' : formatPrice(model.pricing.prompt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {model.capabilities.slice(0, 3).map((cap) => (
                            <span key={cap} className="px-1.5 py-0.5 rounded text-[10px] bg-[#181d26] text-[#8b94a0] border border-[#222733]">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectingModel(model)}
                            className="px-2 py-1 rounded text-xs text-[#8b94a0] hover:text-[#f1f3f7] hover:bg-[#181d26] border border-[#222733] transition-colors"
                          >
                            Details
                          </button>
                          <Link
                            href={`/playground?model=${encodeURIComponent(model.id)}`}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-colors"
                          >
                            Try
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
          <div className="p-12 text-center rounded-lg bg-[#13171f] border border-[#222733]">
            <h3 className="text-sm font-semibold text-[#f1f3f7] mb-1">No matching models found</h3>
            <p className="text-xs text-[#8b94a0] max-w-sm mx-auto mb-3">
              Try adjusting your query or resetting provider and capability filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedProvider('All Providers');
                setSelectedCapability('All Capabilities');
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#181d26] hover:bg-[#222733] text-[#f1f3f7] border border-[#222733] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Model Detail Drawer / Modal */}
      <ModelDetailModal
        model={inspectingModel}
        onClose={() => setInspectingModel(null)}
      />
    </div>
  );
}
