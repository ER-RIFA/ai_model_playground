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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-none">
      <div className="bg-[#20201F] border border-[#383733] rounded-sm w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#383733] bg-[#1C1C1B]">
          <div className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-[#8CB2D4]" />
            <h2 className="font-serif text-sm font-normal tracking-wide text-[#F1F0EB]">
              Inference Credentials
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-[#A5A39D] hover:text-[#F1F0EB] hover:bg-[#292927] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A5A39D]">
              OpenRouter API Key (BYOK)
            </label>
            <input
              type="password"
              placeholder="sk-or-v1-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-[#191919] border border-[#383733] rounded-sm text-xs text-[#F1F0EB] placeholder-[#76746E] focus:outline-none focus:border-[#8CB2D4] font-mono transition-colors"
            />
            <p className="text-[11px] text-[#A5A39D] leading-relaxed">
              Optional. If not provided, the workbench operates via server configuration or offline simulated benchmarking.
            </p>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2.5 p-3 rounded-sm bg-[#191919] border border-[#383733] text-[11px] text-[#A5A39D] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#48A977] shrink-0 mt-0.5" />
            <span>
              Keys are strictly persisted to client <code className="text-[#F1F0EB] font-mono">localStorage</code> and forwarded through encrypted request headers. No credentials are saved in SQLite or persistent logs.
            </span>
          </div>

          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#8CB2D4] hover:underline"
          >
            Retrieve OpenRouter API key <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#1C1C1B] border-t border-[#383733]">
          <button
            onClick={handleClear}
            disabled={!apiKey}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#E06D67] hover:bg-[#E06D67]/10 rounded-sm transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#A5A39D] hover:text-[#F1F0EB] hover:bg-[#292927] rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2F658E] hover:bg-[#255273] text-[#F1F0EB] text-xs font-medium rounded-sm transition-colors"
            >
              {saved ? (
                <>
                  <Check className="w-3 h-3 text-[#F1F0EB]" />
                  Saved
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
