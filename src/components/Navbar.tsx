'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Settings, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { SettingsModal } from './SettingsModal';

export function Navbar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('ai_playground_openrouter_key');
      setHasCustomKey(Boolean(storedKey));
    }
  }, []);

  const handleKeySaved = (key: string) => {
    setHasCustomKey(Boolean(key));
  };

  const navLinks = [
    { href: '/', label: 'Models' },
    { href: '/playground', label: 'Playground' },
    { href: '/compare', label: 'Arena Compare' },
    { href: '/history', label: 'Usage Logs' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#222733] bg-[#0c0e12]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand Identity */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-md bg-[#1d4ed8] flex items-center justify-center text-white">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm tracking-tight text-[#f1f3f7]">
                  ModelPlayground
                </span>
                <span className="text-[11px] font-mono text-[#8b94a0] border border-[#222733] bg-[#13171f] px-1.5 py-0.2 rounded">
                  v1.0
                </span>
              </div>
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#181d26] text-[#f1f3f7] border border-[#2e3545]'
                        : 'text-[#8b94a0] hover:text-[#f1f3f7] hover:bg-[#13171f]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Utility Tools */}
          <div className="flex items-center gap-3">
            {/* Status / BYOK Config Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono border border-[#222733] bg-[#13171f] hover:bg-[#181d26] hover:border-[#2e3545] text-[#8b94a0] hover:text-[#f1f3f7] transition-colors"
              title="Configure API key"
            >
              <span
                className={`w-1.5 h-1.5 rounded-sm ${
                  hasCustomKey ? 'bg-[#10b981]' : 'bg-[#3b82f6]'
                }`}
              />
              <span className="text-[11px]">{hasCustomKey ? 'BYOK Connected' : 'Default Key'}</span>
              <Settings className="w-3.5 h-3.5 ml-0.5 text-[#5c6470]" />
            </button>

            {/* Launch CTA */}
            <Link
              href="/playground"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-colors"
            >
              <span>Playground</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around px-2 py-1.5 border-t border-[#222733] bg-[#13171f]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`py-1 px-3 text-xs font-medium rounded transition-colors ${
                  isActive ? 'text-[#f1f3f7] bg-[#181d26]' : 'text-[#8b94a0]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </header>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onKeySaved={handleKeySaved}
      />
    </>
  );
}
