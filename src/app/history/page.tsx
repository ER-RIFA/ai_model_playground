'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
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
  ArrowRight,
  Database
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
    if (!confirm('Delete this telemetry record?')) return;
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
    if (!confirm('Clear all SQLite usage logs? This action cannot be undone.')) return;
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
    downloadAnchor.setAttribute('download', `frontier_telemetry_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 bg-[#0B0C0E] text-[#F1F3F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F1F3F5]">
              Execution Telemetry & Observability
            </h1>
            <p className="text-xs text-[#9CA3AF] mt-1 max-w-xl">
              Persistent inference audit trail, latency tracking, and token accounting backed by SQLite.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#111317] border border-[#222630] text-[#F1F3F5] hover:bg-[#16191F] transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <Download className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handleClearAll}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/10 border border-[#222630] transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Integrated KPI Metric Ribbon (No cards) */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y md:divide-y-0 divide-[#222630] border border-[#222630] rounded-md bg-[#111317] overflow-hidden text-xs">
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-[#9CA3AF] text-[11px] block uppercase font-mono">Total Inferences</span>
                <span className="font-mono text-base font-bold text-[#F1F3F5] mt-0.5 block">{stats.totalRequests}</span>
              </div>
              <Activity className="w-4 h-4 text-[#2563EB]" />
            </div>

            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-[#9CA3AF] text-[11px] block uppercase font-mono">Tokens Processed</span>
                <span className="font-mono text-base font-bold text-[#F1F3F5] mt-0.5 block">{formatNumber(stats.totalTokens)}</span>
              </div>
              <Hash className="w-4 h-4 text-[#38BDF8]" />
            </div>

            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-[#9CA3AF] text-[11px] block uppercase font-mono">Average Latency</span>
                <span className="font-mono text-base font-bold text-[#10B981] mt-0.5 block">{stats.avgLatencyMs}ms</span>
              </div>
              <Clock className="w-4 h-4 text-[#10B981]" />
            </div>

            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-[#9CA3AF] text-[11px] block uppercase font-mono">Most Utilized</span>
                <span className="font-mono text-xs font-semibold text-[#F1F3F5] mt-0.5 block truncate max-w-[130px]">{stats.mostUsedModel || 'None'}</span>
              </div>
              <Cpu className="w-4 h-4 text-[#2563EB]" />
            </div>
          </div>
        )}

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-md bg-[#111317] border border-[#222630]">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search telemetry by prompt keywords or response content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[#0B0C0E] border border-[#222630] rounded text-xs text-[#F1F3F5] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] transition-colors"
            />
          </form>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#0B0C0E] border border-[#222630] text-xs text-[#F1F3F5] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="all">All Executions</option>
              <option value="success">Success Only</option>
              <option value="error">Errors Only</option>
            </select>

            <button
              onClick={() => {
                setPage(1);
                fetchLogs();
              }}
              className="p-1.5 rounded bg-[#0B0C0E] border border-[#222630] text-[#9CA3AF] hover:text-[#F1F3F5] hover:bg-[#16191F] transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        {logs.length > 0 ? (
          <div className="rounded-md border border-[#222630] bg-[#111317] overflow-x-auto">
            <table className="min-w-full divide-y divide-[#222630] text-left text-xs">
              <thead className="bg-[#0B0C0E] text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Prompt Excerpt</th>
                  <th className="px-4 py-3">Tokens</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222630]/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#16191F] transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          log.status === 'success' ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                        }`}
                        title={log.status}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#F1F3F5]">{log.modelName}</div>
                      <div className="text-[10px] font-mono text-[#64748B]">{log.provider}</div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-[#D1D5DB] truncate">{log.prompt}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#9CA3AF]">
                      {log.totalTokens}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#2563EB] font-semibold">
                      {log.latencyMs}ms
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-[#64748B]">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setActiveLog(log)}
                          className="p-1.5 rounded text-[#9CA3AF] hover:text-[#F1F3F5] hover:bg-[#21262F] transition-colors"
                          title="Inspect Telemetry Payload"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/playground?model=${encodeURIComponent(log.modelId)}`}
                          className="p-1.5 rounded text-[#9CA3AF] hover:text-[#2563EB] hover:bg-[#21262F] transition-colors"
                          title="Replay in Studio"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteRecord(log.id)}
                          className="p-1.5 rounded text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#21262F] transition-colors"
                          title="Delete Record"
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#222630] text-xs text-[#9CA3AF] font-mono bg-[#0B0C0E]">
              <span>
                Page {page} of {totalPages} ({totalCount} entries)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1 rounded bg-[#111317] border border-[#222630] text-[#9CA3AF] hover:text-[#F1F3F5] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1 rounded bg-[#111317] border border-[#222630] text-[#9CA3AF] hover:text-[#F1F3F5] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-md bg-[#111317] border border-[#222630]">
            <h3 className="text-sm font-semibold text-[#F1F3F5] mb-1">No execution history recorded</h3>
            <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto mb-4">
              Requests dispatched in the Playground Studio or Comparison Arena will automatically be captured here.
            </p>
            <Link
              href="/playground"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium rounded transition-colors"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {activeLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-none">
          <div className="bg-[#111317] border border-[#222630] rounded-md w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#222630] bg-[#0B0C0E]">
              <div>
                <h3 className="text-sm font-semibold text-[#F1F3F5]">{activeLog.modelName}</h3>
                <span className="text-[11px] text-[#64748B] font-mono">
                  {formatDate(activeLog.createdAt)} • {activeLog.latencyMs}ms • {activeLog.totalTokens} tokens
                </span>
              </div>
              <button
                onClick={() => setActiveLog(null)}
                className="p-1 rounded text-[#9CA3AF] hover:text-[#F1F3F5] hover:bg-[#16191F] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#64748B] font-semibold block mb-1.5">
                  User Prompt
                </span>
                <div className="p-3 rounded bg-[#0B0C0E] border border-[#222630] text-[#F1F3F5] whitespace-pre-wrap leading-relaxed font-mono text-xs">
                  {activeLog.prompt}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#64748B] font-semibold block mb-1.5">
                  Model Output Payload
                </span>
                <div className="p-3 rounded bg-[#0B0C0E] border border-[#222630]">
                  {activeLog.response ? (
                    <MarkdownRenderer content={activeLog.response} />
                  ) : (
                    <span className="text-[#EF4444]">
                      Error: {activeLog.errorMessage || 'No response returned.'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#222630] bg-[#0B0C0E]">
              <button
                onClick={() => setActiveLog(null)}
                className="px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F1F3F5] rounded transition-colors"
              >
                Close
              </button>

              <Link
                href={`/playground?model=${encodeURIComponent(activeLog.modelId)}`}
                onClick={() => setActiveLog(null)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors"
              >
                <span>Replay in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}