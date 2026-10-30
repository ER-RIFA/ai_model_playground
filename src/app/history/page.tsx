'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  History, 
  Search, 
  Trash2, 
  Clock, 
  Hash, 
  Cpu, 
  Zap, 
  Download, 
  Eye, 
  X, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Activity 
} from 'lucide-react';
import { UsageRecord, HistoryStats } from '@/types';
import { formatDate, formatNumber } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export default function HistoryPage() {
  const [logs, setLogs] = useState<UsageRecord[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Inspection modal
  const [activeLog, setActiveLog] = useState<UsageRecord | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });
      if (search) params.append('search', search);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const res = await fetch(`/api/history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch history logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedStatus]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log entry?')) return;
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLogs((prev) => prev.filter((item) => item.id !== id));
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL usage history? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/history`, { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
        setTotalCount(0);
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ai_playground_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <History className="w-6 h-6 text-violet-400" />
              Usage History & Analytics
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Audit requests, response latency, token consumption, and model utilization persisted in SQLite
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition disabled:opacity-40 disabled:pointer-events-none"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
            <button
              onClick={handleClearAll}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-red-950 transition disabled:opacity-40 disabled:pointer-events-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          </div>
        </div>

        {/* Analytics Stats Overview Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Total Requests</span>
                <Activity className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {stats.totalRequests}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Total Tokens Processed</span>
                <Hash className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {formatNumber(stats.totalTokens)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Avg Generation Latency</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {stats.avgLatencyMs}ms
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Most Used Model</span>
                <Cpu className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-base font-bold text-white truncate font-mono">
                {stats.mostUsedModel}
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 mb-6">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search prompts or response text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </form>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>

            <button
              onClick={() => {
                setPage(1);
                fetchLogs();
              }}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* History Table / Records */}
        {logs.length > 0 ? (
          <div className="space-y-3">
            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 text-[11px] font-mono uppercase text-zinc-400 border-b border-zinc-800">
              <span className="col-span-2">Model & Provider</span>
              <span className="col-span-4">Prompt</span>
              <span className="col-span-2">Tokens</span>
              <span className="col-span-1">Latency</span>
              <span className="col-span-2">Timestamp</span>
              <span className="col-span-1 text-right">Actions</span>
            </div>

            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:bg-zinc-900/90 transition flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:items-center text-xs"
              >
                {/* Model & Provider */}
                <div className="lg:col-span-2 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${log.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <div>
                    <span className="font-semibold text-white block truncate" title={log.modelName}>
                      {log.modelName}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {log.provider}
                    </span>
                  </div>
                </div>

                {/* Prompt Preview */}
                <div className="lg:col-span-4">
                  <p className="text-zinc-300 line-clamp-2 leading-relaxed">
                    {log.prompt}
                  </p>
                </div>

                {/* Tokens */}
                <div className="lg:col-span-2 font-mono text-[11px] text-zinc-400">
                  <span className="text-white font-semibold">{log.totalTokens}</span> total ({log.promptTokens} in / {log.completionTokens} out)
                </div>

                {/* Latency */}
                <div className="lg:col-span-1 font-mono text-[11px] text-cyan-400">
                  {log.latencyMs}ms
                </div>

                {/* Date */}
                <div className="lg:col-span-2 text-zinc-400 text-[11px]">
                  {formatDate(log.createdAt)}
                </div>

                {/* Actions */}
                <div className="lg:col-span-1 flex items-center justify-end gap-1">
                  <button
                    onClick={() => setActiveLog(log)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <Link
                    href={`/playground?model=${encodeURIComponent(log.modelId)}`}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-400 hover:bg-zinc-800 transition"
                    title="Test in playground"
                  >
                    <Zap className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleDeleteRecord(log.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 px-2">
              <span className="text-xs text-zinc-400">
                Page {page} of {totalPages} ({totalCount} total entries)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-16 text-center rounded-2xl bg-zinc-900/30 border border-zinc-800">
            <History className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">No usage logs yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
              Requests made in the playground or arena are automatically recorded here with token and latency metrics.
            </p>
            <Link
              href="/playground"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition"
            >
              <Zap className="w-3.5 h-3.5" />
              Try Playground
            </Link>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {activeLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-violet-600/20 text-violet-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{activeLog.modelName}</h3>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {formatDate(activeLog.createdAt)} • {activeLog.latencyMs}ms • {activeLog.totalTokens} tokens
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveLog(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Prompt */}
              <div>
                <span className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold block mb-2">
                  User Prompt
                </span>
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {activeLog.prompt}
                </div>
              </div>

              {/* Response */}
              <div>
                <span className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold block mb-2">
                  Model Response
                </span>
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 text-sm">
                  {activeLog.response ? (
                    <MarkdownRenderer content={activeLog.response} />
                  ) : (
                    <span className="text-red-400 text-xs">
                      Error: {activeLog.errorMessage || 'No response generated'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/40">
              <button
                onClick={() => setActiveLog(null)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Close
              </button>

              <Link
                href={`/playground?model=${encodeURIComponent(activeLog.modelId)}`}
                onClick={() => setActiveLog(null)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition"
              >
                <Zap className="w-3.5 h-3.5" />
                Open in Playground
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
