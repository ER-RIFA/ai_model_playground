'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Terminal, 
  Columns, 
  History, 
  Grid, 
  Key, 
  Check, 
  Menu, 
  X,
  ExternalLink
} from 'lucide-react';
import { SettingsModal } from './SettingsModal';

export function Header() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { href: '/', label: 'Directory', icon: Grid, exact: true },
    { href: '/playground', label: 'Studio', icon: Terminal, exact: false },
    { href: '/compare', label: 'Arena', icon: Columns, exact: false },
    { href: '/history', label: 'Telemetry', icon: History, exact: false },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#222630] bg-[#111317]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-[4.25rem] flex items-center justify-between gap-4">
          {/* Brand & Status */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9 rounded-md bg-[#16191F] border border-[#222630] flex items-center justify-center text-[#2563EB] font-mono text-sm font-bold tracking-tighter">
                <span className="absolute inset-1 rounded border border-[#2563EB]/40" />
                F
              </div>
              <div>
                <span className="block font-semibold text-sm tracking-tight text-[#F1F3F5] group-hover:text-white transition-colors">
                  Frontier Workbench
                </span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#64748B] hidden sm:block mt-0.5">
                  Model research console
                </span>
              </div>
            </Link>

            {/* Engine Status Indicator */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-[#16191F] border border-[#222630] text-[10px] uppercase tracking-wider text-[#9CA3AF]">
              <span className={`w-1.5 h-1.5 rounded-full ${hasCustomKey ? 'bg-[#10B981]' : 'bg-[#2563EB]'}`} />
              <span>{hasCustomKey ? 'BYOK Engine' : 'Live Inference'}</span>
            </div>
          </div>

          {/* Center Navigation Segment */}
          <nav className="hidden sm:flex items-center gap-0.5 p-1 rounded-md bg-[#16191F] border border-[#222630]">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href || pathname === '/models'
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#21262F] text-[#F1F3F5] shadow-xs'
                      : 'text-[#9CA3AF] hover:text-[#F1F3F5] hover:bg-[#1D2129]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded bg-[#16191F] hover:bg-[#21262F] border border-[#222630] text-xs font-medium text-[#9CA3AF] hover:text-[#F1F3F5] transition-colors"
              title="Configure API Keys"
            >
              <Key className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="font-mono text-[11px] hidden sm:inline">
                {hasCustomKey ? 'API Key Active' : 'API Key'}
              </span>
            </button>

            <a
              href="https://github.com/ER-RIFA/ai_model_playground"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded text-[#9CA3AF] hover:text-[#F1F3F5] hover:bg-[#16191F] transition-colors"
              title="GitHub Repository"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-1.5 rounded text-[#9CA3AF] hover:text-[#F1F3F5] hover:bg-[#16191F]"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-[#222630] bg-[#111317] px-4 py-3 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium ${
                    isActive
                      ? 'bg-[#21262F] text-[#F1F3F5]'
                      : 'text-[#9CA3AF] hover:text-[#F1F3F5] hover:bg-[#16191F]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onKeySaved={handleKeySaved}
      />
    </>
  );
}