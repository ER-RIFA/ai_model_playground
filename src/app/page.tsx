'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Zap, 
  ArrowUpDown, 
  Layers, 
  Cpu, 
  CheckCircle2,
  Columns
} from 'lucide-react';
import { AIModel } from '@/types';
import { POPULAR_MODELS, PROVIDERS, CAPABILITY_TAGS } from '@/data/models';
import { ModelCard } from '@/components/ModelCard';
import { ModelDetailModal } from '@/components/ModelDetailModal';

export default function ModelDiscoveryPage() {
  const [models, setModels] = useState<AIModel[]>(POPULAR_MODELS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('All Providers');
  const [selectedCapability, setSelectedCapability] = useState('All Capabilities');
  const [sortBy, setSortBy] = useState<'featured' | 'context-desc' | 'price-asc' | 'name-asc'>('featured');
  const [inspectingModel, setInspectingModel] = useState<AIModel | null>(null);
  const [sourceNote, setSourceNote] = useState<string>('curated');

  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models) && data.models.length > 0) {
            setModels(data.models);
            setSourceNote(data.source || 'openrouter');
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic models, using curated dataset:', err);
      }
    }

    fetchModels();
  }, []);

  const filteredModels = useMemo(() => {
    return models
      .filter((model) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = model.name.toLowerCase().includes(q);
          const matchesId = model.id.toLowerCase().includes(q);
          const matchesDesc = model.description.toLowerCase().includes(q);
          const matchesArch = (model.architecture || '').toLowerCase().includes(q);
          if (!matchesName && !matchesId && !matchesDesc && !matchesArch) return false;
        }

        // Provider filter
        if (selectedProvider !== 'All Providers') {
          if (model.provider !== selectedProvider) return false;
        }

        // Capability filter
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
    <div className="min-h-screen bg-[#07090e] text-zinc-100 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-800/80 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent pt-12 pb-14">
        {/* Glow orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-medium text-violet-300 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen AI Catalog & Playground</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto leading-tight">
            Explore, Benchmark & Test the World&apos;s Best <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">AI Models</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            Discover leading models across OpenAI, Anthropic, DeepSeek, Meta, Google, and Mistral. Compare context windows, token pricing, and stream responses with real-time benchmarks.
          </p>

          {/* Quick Stat Badges */}
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap text-xs font-mono">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300">
              <Cpu className="w-3.5 h-3.5 text-violet-400" />
              <span><strong>{models.length}</strong> Available Models</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span><strong>{freeModelsCount}</strong> Free-Tier Models</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Up to <strong>1M+</strong> Context Window</span>
            </div>
          </div>

          {/* Direct CTA links */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/playground"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 transition"
            >
              <Zap className="w-4 h-4" />
              Launch Playground
            </Link>
            <Link
              href="/compare"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
            >
              <Columns className="w-4 h-4" />
              Side-by-Side Arena
            </Link>
          </div>
        </div>
      </section>

      {/* Main Catalog & Search / Filter Controls */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Search & Sort Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 mb-6 backdrop-blur">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by model name, description, architecture, or provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-4 h-4 text-zinc-400" />
            <span className="text-xs text-zinc-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="featured">Featured First</option>
              <option value="context-desc">Context Window: High to Low</option>
              <option value="price-asc">Price: Low to High (Free First)</option>
              <option value="name-asc">Model Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filters Group: Providers and Capabilities */}
        <div className="space-y-3 mb-8">
          {/* Provider Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs text-zinc-400 font-medium shrink-0 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Provider:
            </span>
            {PROVIDERS.map((provider) => {
              const active = selectedProvider === provider;
              return (
                <button
                  key={provider}
                  onClick={() => setSelectedProvider(provider)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                    active
                      ? 'bg-violet-600 text-white border-violet-500 shadow-sm shadow-violet-600/30'
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-zinc-800'
                  }`}
                >
                  {provider}
                </button>
              );
            })}
          </div>

          {/* Capability Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs text-zinc-400 font-medium shrink-0 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5" /> Capability:
            </span>
            {CAPABILITY_TAGS.map((cap) => {
              const active = selectedCapability === cap;
              return (
                <button
                  key={cap}
                  onClick={() => setSelectedCapability(cap)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                    active
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm shadow-cyan-600/30'
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-zinc-800'
                  }`}
                >
                  {cap}
                </button>
              );
            })}
          </div>
        </div>

        {/* Models Counter and Results Info */}
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-4 px-1">
          <span>
            Showing <strong className="text-zinc-200">{filteredModels.length}</strong> of {models.length} models
            {selectedProvider !== 'All Providers' && ` for ${selectedProvider}`}
            {selectedCapability !== 'All Capabilities' && ` with ${selectedCapability}`}
          </span>
          {sourceNote === 'openrouter' && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live Synced via OpenRouter Catalog
            </span>
          )}
        </div>

        {/* Models Grid */}
        {filteredModels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onOpenDetails={(m) => setInspectingModel(m)}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-zinc-900/30 border border-zinc-800/60">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">No matching models found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
              Try adjusting your search keywords, clear filters, or reset to all providers.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedProvider('All Providers');
                setSelectedCapability('All Capabilities');
              }}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Model Spec Modal */}
      <ModelDetailModal
        model={inspectingModel}
        onClose={() => setInspectingModel(null)}
      />
    </div>
  );
}
