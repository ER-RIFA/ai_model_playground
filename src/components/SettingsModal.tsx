'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Trash2, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export function SettingsModal({ isOpen, onClose, onKeySaved }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('ai_playground_openrouter_key') || '';
      setApiKey(storedKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem('ai_playground_openrouter_key', trimmed);
      } else {
        localStorage.removeItem('ai_playground_openrouter_key');
      }
    }
    onKeySaved(trimmed);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 500);
  };

  const handleClear = () => {
    setApiKey('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ai_playground_openrouter_key');
    }
    onKeySaved('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-none">
      <div className="bg-[#111317] border border-[#222630] rounded-md w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222630] bg-[#0B0C0E]">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-semibold tracking-tight text-[#F1F3F5]">
              Inference Credentials
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#9CA3AF] hover:text-[#F1F3F5] hover:bg-[#16191F] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#9CA3AF]">
              OpenRouter API Key (BYOK)
            </label>
            <input
              type="password"
              placeholder="sk-or-v1-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0C0E] border border-[#222630] rounded text-xs text-[#F1F3F5] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] font-mono transition-colors"
            />
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Bring Your Own Key. If omitted, the workbench operates via server environment keys or intelligent simulated benchmarking.
            </p>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2.5 p-3 rounded bg-[#0B0C0E] border border-[#222630] text-[11px] text-[#9CA3AF] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
            <span>
              Credentials are saved strictly in your client <code className="text-[#F1F3F5] font-mono">localStorage</code> and forwarded as an auth header. Never stored on disk or server databases.
            </span>
          </div>

          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#2563EB] hover:text-[#3B82F6] hover:underline"
          >
            <span>Generate an OpenRouter API key</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0B0C0E] border-t border-[#222630]">
          <button
            onClick={handleClear}
            disabled={!apiKey}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F1F3F5] rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium rounded transition-colors"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                'Save Key'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}