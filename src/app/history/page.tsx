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
    <div className="min-h-screen bg-[#191919] text-[#F1F0EB] pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#383733]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A5A39D] px-2 py-0.5 rounded-sm bg-[#222220] border border-[#383733]">
                Database Telemetry
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#F1F0EB] tracking-tight">
              Execution Logs & Analytics
            </h1>
            <p className="text-xs text-[#A5A39D] mt-1 max-w-xl">
              Persistent execution records, latency metrics, and token accounting stored via SQLite.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium bg-[#222220] border border-[#383733] text-[#F1F0EB] hover:bg-[#292927] transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <Download className="w-3.5 h-3.5 text-[#A5A39D]" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handleClearAll}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium text-[#E58B8B] hover:bg-[#852C2C]/20 border border-[#383733] transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Analytics Summary Tiles */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-6">
            <div className="p-4 rounded-sm bg-[#222220] border border-[#383733]">
              <div className="flex items-center justify-between text-[#A5A39D] text-[10px] font-mono uppercase tracking-wider mb-2">
                <span>Total Requests</span>
                <Activity className="w-3.5 h-3.5 text-[#8CB2D4]" />
              </div>
              <div className="text-2xl font-normal text-[#F1F0EB] font-mono">
                {stats.totalRequests}
              </div>
            </div>

            <div className="p-4 rounded-sm bg-[#222220] border border-[#383733]">
              <div className="flex items-center justify-between text-[#A5A39D] text-[10px] font-mono uppercase tracking-wider mb-2">
                <span>Tokens Processed</span>
                <Hash className="w-3.5 h-3.5 text-[#8CB2D4]" />
              </div>
              <div className="text-2xl font-normal text-[#F1F0EB] font-mono">
                {formatNumber(stats.totalTokens)}
              </div>
            </div>

            <div className="p-4 rounded-sm bg-[#222220] border border-[#383733]">
              <div className="flex items-center justify-between text-[#A5A39D] text-[10px] font-mono uppercase tracking-wider mb-2">
                <span>Average Latency</span>
                <Clock className="w-3.5 h-3.5 text-[#78A890]" />
              </div>
              <div className="text-2xl font-normal text-[#F1F0EB] font-mono">
                {stats.avgLatencyMs}ms
              </div>
            </div>

            <div className="p-4 rounded-sm bg-[#222220] border border-[#383733]">
              <div className="flex items-center justify-between text-[#A5A39D] text-[10px] font-mono uppercase tracking-wider mb-2">
                <span>Most Utilized</span>
                <Cpu className="w-3.5 h-3.5 text-[#8CB2D4]" />
              </div>
              <div className="text-xs font-medium text-[#F1F0EB] truncate font-mono mt-1">
                {stats.mostUsedModel || 'None'}
              </div>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-sm bg-[#20201F] border border-[#383733] mb-6">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#A5A39D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search prompts or output responses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[#191919] border border-[#383733] rounded-sm text-xs text-[#F1F0EB] placeholder-[#A5A39D]/50 focus:outline-none focus:border-[#2F658E] transition-colors"
            />
          </form>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#191919] border border-[#383733] text-xs text-[#F1F0EB] rounded-sm px-2.5 py-1.5 focus:outline-none focus:border-[#2F658E] cursor-pointer"
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
              className="p-1.5 rounded-sm bg-[#191919] border border-[#383733] text-[#A5A39D] hover:text-[#F1F0EB] hover:bg-[#292927] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        {logs.length > 0 ? (
          <div className="rounded-sm border border-[#383733] bg-[#222220] overflow-x-auto">
            <table className="min-w-full divide-y divide-[#383733] text-left text-xs">
              <thead className="bg-[#20201F] text-[10px] font-mono uppercase tracking-wider text-[#A5A39D]">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Prompt</th>
                  <th className="px-4 py-3">Tokens</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#383733]/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#20201F] transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block w-2 h-2 rounded-sm ${
                          log.status === 'success' ? 'bg-[#78A890]' : 'bg-[#E58B8B]'
                        }`}
                        title={log.status}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#F1F0EB]">{log.modelName}</div>
                      <div className="text-[10px] font-mono text-[#A5A39D]">{log.provider}</div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-[#F1F0EB]/90 truncate">{log.prompt}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#A5A39D]">
                      {log.totalTokens}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#8CB2D4]">
                      {log.latencyMs}ms
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-[#A5A39D]">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setActiveLog(log)}
                          className="p-1 rounded-sm text-[#A5A39D] hover:text-[#F1F0EB] hover:bg-[#292927] transition-colors"
                          title="Inspect payload"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/playground?model=${encodeURIComponent(log.modelId)}`}
                          className="p-1 rounded-sm text-[#A5A39D] hover:text-[#8CB2D4] hover:bg-[#292927] transition-colors"
                          title="Replay in playground"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteRecord(log.id)}
                          className="p-1 rounded-sm text-[#A5A39D] hover:text-[#E58B8B] hover:bg-[#292927] transition-colors"
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#383733] text-xs text-[#A5A39D] font-mono bg-[#20201F]">
              <span>
                Page {page} of {totalPages} ({totalCount} entries)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1 rounded-sm bg-[#191919] border border-[#383733] text-[#A5A39D] hover:text-[#F1F0EB] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1 rounded-sm bg-[#191919] border border-[#383733] text-[#A5A39D] hover:text-[#F1F0EB] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-sm bg-[#222220] border border-[#383733]">
            <h3 className="font-serif text-base text-[#F1F0EB] mb-1">No execution history recorded</h3>
            <p className="text-xs text-[#A5A39D] max-w-sm mx-auto mb-4">
              Requests executed in the playground or arena will automatically be logged here with token metrics and latency.
            </p>
            <Link
              href="/playground"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2F658E] hover:bg-[#3B7BA8] text-[#F1F0EB] text-xs font-medium rounded-sm transition-colors"
            >
              <span>Open Playground</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {activeLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-none animate-fade-in">
          <div className="bg-[#20201F] border border-[#383733] rounded-sm w-full max-w-2xl overflow-hidden shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#383733] bg-[#222220]">
              <div>
                <h3 className="font-serif text-base font-normal text-[#F1F0EB]">{activeLog.modelName}</h3>
                <span className="text-[11px] text-[#A5A39D] font-mono">
                  {formatDate(activeLog.createdAt)} • {activeLog.latencyMs}ms • {activeLog.totalTokens} tokens
                </span>
              </div>
              <button
                onClick={() => setActiveLog(null)}
                className="p-1 rounded-sm text-[#A5A39D] hover:text-[#F1F0EB] hover:bg-[#292927] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#A5A39D] font-medium block mb-1.5">
                  User Prompt
                </span>
                <div className="p-3 rounded-sm bg-[#191919] border border-[#383733] text-[#F1F0EB] whitespace-pre-wrap leading-relaxed">
                  {activeLog.prompt}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#A5A39D] font-medium block mb-1.5">
                  Model Output
                </span>
                <div className="p-3 rounded-sm bg-[#191919] border border-[#383733]">
                  {activeLog.response ? (
                    <MarkdownRenderer content={activeLog.response} />
                  ) : (
                    <span className="text-[#E58B8B]">
                      Error: {activeLog.errorMessage || 'No response returned.'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-[#383733] bg-[#222220]">
              <button
                onClick={() => setActiveLog(null)}
                className="px-3 py-1.5 text-xs text-[#A5A39D] hover:text-[#F1F0EB] rounded-sm transition-colors"
              >
                Close
              </button>

              <Link
                href={`/playground?model=${encodeURIComponent(activeLog.modelId)}`}
                onClick={() => setActiveLog(null)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-xs font-medium bg-[#2F658E] hover:bg-[#3B7BA8] text-[#F1F0EB] transition-colors"
              >
                <span>Replay in Playground</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
