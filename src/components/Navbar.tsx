'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, 
  Compass, 
  Terminal, 
  Columns, 
  History, 
  Settings, 
  Zap
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
    { href: '/', label: 'Models', icon: Compass },
    { href: '/playground', label: 'Playground', icon: Terminal },
    { href: '/compare', label: 'Compare Arena', icon: Columns },
    { href: '/history', label: 'Usage History', icon: History },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#090d16]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-violet-600/25 group-hover:shadow-violet-600/40 transition">
                <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  AI Model Playground
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    Pro
                  </span>
                </span>
                <span className="block text-[10px] text-zinc-400 -mt-0.5">
                  Explore, Benchmark & Test LLMs
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l border-zinc-800">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-400' : 'text-zinc-400'}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono border transition bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 text-zinc-300"
              title="Click to configure API Key"
            >
              <span className={`w-2 h-2 rounded-full ${hasCustomKey ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
              <span>{hasCustomKey ? 'BYOK Active' : 'Ready'}</span>
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Try in Playground Quick Link */}
            <Link
              href="/playground"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm shadow-violet-600/20 transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Launch Playground</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-zinc-800/60 bg-zinc-950/70">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-medium transition ${
                  isActive ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
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
