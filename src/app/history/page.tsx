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
  Download, 
  Eye, 
  X, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Activity,
  ArrowRight
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
    if (!confirm('Delete this history record?')) return;
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
    if (!confirm('Clear all usage logs? This action cannot be undone.')) return;
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
    downloadAnchor.setAttribute('download', `usage_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#0c0e12] text-[#f1f3f7] pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#222733]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <History className="w-4 h-4 text-[#3b82f6]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#3b82f6] font-medium">
                Telemetry & Logs
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f1f3f7]">
              Usage History & Analytics
            </h1>
            <p className="text-xs text-[#8b94a0] mt-0.5">
              Persistent execution records, latency metrics, and token accounting stored via SQLite.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#13171f] border border-[#222733] text-[#cbd5e1] hover:text-[#f1f3f7] hover:bg-[#181d26] transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
            <button
              onClick={handleClearAll}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#ef4444] hover:text-[#f87171] hover:bg-[#ef4444]/10 border border-[#222733] transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Analytics Summary Tiles */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-5">
            <div className="p-3.5 rounded-lg bg-[#13171f] border border-[#222733]">
              <div className="flex items-center justify-between text-[#8b94a0] text-[11px] font-mono mb-1">
                <span>TOTAL REQUESTS</span>
                <Activity className="w-3.5 h-3.5 text-[#3b82f6]" />
              </div>
              <div className="text-xl font-bold text-[#f1f3f7] font-mono">
                {stats.totalRequests}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#13171f] border border-[#222733]">
              <div className="flex items-center justify-between text-[#8b94a0] text-[11px] font-mono mb-1">
                <span>TOKENS PROCESSED</span>
                <Hash className="w-3.5 h-3.5 text-[#38bdf8]" />
              </div>
              <div className="text-xl font-bold text-[#f1f3f7] font-mono">
                {formatNumber(stats.totalTokens)}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#13171f] border border-[#222733]">
              <div className="flex items-center justify-between text-[#8b94a0] text-[11px] font-mono mb-1">
                <span>AVG LATENCY</span>
                <Clock className="w-3.5 h-3.5 text-[#10b981]" />
              </div>
              <div className="text-xl font-bold text-[#f1f3f7] font-mono">
                {stats.avgLatencyMs}ms
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#13171f] border border-[#222733]">
              <div className="flex items-center justify-between text-[#8b94a0] text-[11px] font-mono mb-1">
                <span>MOST UTILIZED</span>
                <Cpu className="w-3.5 h-3.5 text-[#fbbf24]" />
              </div>
              <div className="text-xs font-semibold text-[#f1f3f7] truncate font-mono mt-1">
                {stats.mostUsedModel}
              </div>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-lg bg-[#13171f] border border-[#222733] mb-5">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#5c6470] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search prompts or response content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[#0c0e12] border border-[#222733] rounded-md text-xs text-[#f1f3f7] placeholder-[#5c6470] focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </form>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#0c0e12] border border-[#222733] text-xs text-[#cbd5e1] rounded-md px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success Only</option>
              <option value="error">Errors Only</option>
            </select>

            <button
              onClick={() => {
                setPage(1);
                fetchLogs();
              }}
              className="p-1.5 rounded-md bg-[#0c0e12] border border-[#222733] text-[#8b94a0] hover:text-[#f1f3f7] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        {logs.length > 0 ? (
          <div className="rounded-lg border border-[#222733] bg-[#13171f] overflow-x-auto">
            <table className="min-w-full divide-y divide-[#222733] text-left text-xs">
              <thead className="bg-[#10141b] text-[11px] font-mono uppercase text-[#5c6470]">
                <tr>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Model</th>
                  <th className="px-4 py-2.5">Prompt</th>
                  <th className="px-4 py-2.5">Tokens</th>
                  <th className="px-4 py-2.5">Latency</th>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222733]/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#151922] transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block w-2 h-2 rounded-sm ${
                          log.status === 'success' ? 'bg-[#10b981]' : 'bg-[#ef4444]'
                        }`}
                        title={log.status}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#f1f3f7]">{log.modelName}</div>
                      <div className="text-[10px] font-mono text-[#5c6470]">{log.provider}</div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-[#cbd5e1] truncate">{log.prompt}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#cbd5e1]">
                      {log.totalTokens}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#38bdf8]">
                      {log.latencyMs}ms
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#8b94a0]">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setActiveLog(log)}
                          className="p-1 rounded text-[#8b94a0] hover:text-[#f1f3f7] hover:bg-[#181d26] transition-colors"
                          title="Inspect"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/playground?model=${encodeURIComponent(log.modelId)}`}
                          className="p-1 rounded text-[#8b94a0] hover:text-[#3b82f6] hover:bg-[#181d26] transition-colors"
                          title="Replay in playground"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteRecord(log.id)}
                          className="p-1 rounded text-[#8b94a0] hover:text-[#ef4444] hover:bg-[#181d26] transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#222733] text-xs text-[#8b94a0] font-mono">
              <span>
                Page {page} of {totalPages} ({totalCount} total)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1 rounded bg-[#0c0e12] border border-[#222733] text-[#8b94a0] hover:text-[#f1f3f7] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1 rounded bg-[#0c0e12] border border-[#222733] text-[#8b94a0] hover:text-[#f1f3f7] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-lg bg-[#13171f] border border-[#222733]">
            <h3 className="text-sm font-semibold text-[#f1f3f7] mb-1">No execution history recorded</h3>
            <p className="text-xs text-[#8b94a0] max-w-sm mx-auto mb-3">
              Requests made in the playground or arena will automatically be logged here with metrics.
            </p>
            <Link
              href="/playground"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-medium rounded-md transition-colors"
            >
              <span>Open Playground</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {activeLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none animate-fade-in">
          <div className="bg-[#13171f] border border-[#2e3545] rounded-lg w-full max-w-2xl overflow-hidden shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#222733] bg-[#10141b]">
              <div>
                <h3 className="text-sm font-semibold text-[#f1f3f7]">{activeLog.modelName}</h3>
                <span className="text-[11px] text-[#5c6470] font-mono">
                  {formatDate(activeLog.createdAt)} • {activeLog.latencyMs}ms • {activeLog.totalTokens} tokens
                </span>
              </div>
              <button
                onClick={() => setActiveLog(null)}
                className="p-1 rounded text-[#8b94a0] hover:text-[#f1f3f7] hover:bg-[#181d26] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <span className="text-[11px] uppercase font-mono tracking-wider text-[#5c6470] font-medium block mb-1">
                  User Prompt
                </span>
                <div className="p-3 rounded-md bg-[#0c0e12] border border-[#222733] text-[#cbd5e1] whitespace-pre-wrap leading-relaxed">
                  {activeLog.prompt}
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase font-mono tracking-wider text-[#5c6470] font-medium block mb-1">
                  Response
                </span>
                <div className="p-3 rounded-md bg-[#0c0e12] border border-[#222733]">
                  {activeLog.response ? (
                    <MarkdownRenderer content={activeLog.response} />
                  ) : (
                    <span className="text-[#ef4444]">
                      Error: {activeLog.errorMessage || 'No response returned.'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-2.5 border-t border-[#222733] bg-[#10141b]">
              <button
                onClick={() => setActiveLog(null)}
                className="px-3 py-1.5 text-xs text-[#8b94a0] hover:text-[#f1f3f7] rounded-md transition-colors"
              >
                Close
              </button>

              <Link
                href={`/playground?model=${encodeURIComponent(activeLog.modelId)}`}
                onClick={() => setActiveLog(null)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-colors"
              >
                <span>Replay in Playground</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
