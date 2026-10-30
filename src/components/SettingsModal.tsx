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
    }, 600);
  };

  const handleClear = () => {
    setApiKey('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ai_playground_openrouter_key');
    }
    onKeySaved('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none animate-fade-in">
      <div className="bg-[#13171f] border border-[#2e3545] rounded-lg w-full max-w-md overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222733] bg-[#10141b]">
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-[#3b82f6]" />
            <h2 className="text-sm font-semibold text-[#f1f3f7]">API Key Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8b94a0] hover:text-[#f1f3f7] hover:bg-[#181d26] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-medium text-[#f1f3f7]">
              OpenRouter API Key (Optional)
            </label>
            <input
              type="password"
              placeholder="sk-or-v1-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-[#0c0e12] border border-[#222733] rounded-md text-xs text-[#f1f3f7] placeholder-[#5c6470] focus:outline-none focus:border-[#3b82f6] font-mono transition-colors"
            />
            <p className="text-[11px] text-[#8b94a0] leading-relaxed">
              If left blank, the system utilizes the server default key or built-in model simulation.
            </p>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#0c0e12] border border-[#222733] text-[11px] text-[#8b94a0] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
            <span>
              Your API key is saved exclusively in your browser&apos;s local storage and passed directly via secure request headers. It is never logged in any database.
            </span>
          </div>

          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#3b82f6] hover:text-[#60a5fa] hover:underline"
          >
            Manage OpenRouter API Keys <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#10141b] border-t border-[#222733]">
          <button
            onClick={handleClear}
            disabled={!apiKey}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#ef4444] hover:text-[#f87171] hover:bg-[#ef4444]/10 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-[#8b94a0] hover:text-[#f1f3f7] hover:bg-[#181d26] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-medium rounded-md transition-colors"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
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
