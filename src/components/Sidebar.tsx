'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Compass, 
  Terminal, 
  Columns, 
  History, 
  Settings, 
  Cpu, 
  Menu, 
  X 
} from 'lucide-react';
import { SettingsModal } from './SettingsModal';

export function Sidebar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('ai_playground_openrouter_key');
      setHasCustomKey(Boolean(storedKey));
    }
  }, []);

  const handleKeySaved = (key: string) => {
    setHasCustomKey(Boolean(key));
  };

  const navItems = [
    {
      group: 'Workspace',
      items: [
        { href: '/', label: 'Model Directory', icon: Compass, exact: true },
        { href: '/playground', label: 'Playground Studio', icon: Terminal, exact: false },
        { href: '/compare', label: 'Comparison Arena', icon: Columns, exact: false },
        { href: '/history', label: 'Execution Logs', icon: History, exact: false },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#20201F] text-[#F1F0EB]">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-[#383733]">
        <Link href="/" className="block group">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-sm bg-[#2F658E] flex items-center justify-center text-[#F1F0EB]">
              <span className="font-serif font-semibold text-xs leading-none">P</span>
            </div>
            <span className="font-serif text-base font-normal tracking-wide text-[#F1F0EB]">
              Model Playground
            </span>
          </div>
          <span className="block text-[11px] font-sans text-[#A5A39D] mt-0.5 tracking-normal">
            Frontier Model Engineering
          </span>
        </Link>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.group} className="space-y-1">
            <span className="px-2 text-[10px] font-mono uppercase tracking-widest text-[#76746E]">
              {group.group}
            </span>
            <div className="space-y-0.5 pt-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href || pathname === '/models'
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-sm text-xs font-sans transition-colors ${
                      isActive
                        ? 'bg-[#292927] text-[#F1F0EB] font-medium border border-[#383733]'
                        : 'text-[#A5A39D] hover:text-[#F1F0EB] hover:bg-[#252524]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#8CB2D4]' : 'text-[#76746E]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <span className="w-1 h-1 rounded-sm bg-[#8CB2D4]" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Reference & Docs group */}
        <div className="space-y-1 pt-2 border-t border-[#383733]">
          <span className="px-2 text-[10px] font-mono uppercase tracking-widest text-[#76746E]">
            Platform Overview
          </span>
          <div className="px-2 py-2 text-[11px] font-sans text-[#A5A39D] leading-relaxed bg-[#222220] border border-[#383733] rounded-sm mt-1">
            <div className="flex items-center gap-1.5 text-[#F1F0EB] font-medium mb-1">
              <Cpu className="w-3.5 h-3.5 text-[#8CB2D4]" />
              <span>Multi-Provider Hub</span>
            </div>
            Unified inference across OpenRouter, DeepSeek, Meta, and OpenAI models with live token telemetry.
          </div>
        </div>
      </div>

      {/* Footer System Status & Key Manager */}
      <div className="p-3 border-t border-[#383733] bg-[#1E1E1D] space-y-2">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm bg-[#222220] hover:bg-[#292927] border border-[#383733] text-xs text-[#A5A39D] hover:text-[#F1F0EB] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-sm ${
                hasCustomKey ? 'bg-[#48A977]' : 'bg-[#8CB2D4]'
              }`}
            />
            <span className="text-[11px] font-mono truncate">
              {hasCustomKey ? 'BYOK Connected' : 'Default Key'}
            </span>
          </div>
          <Settings className="w-3.5 h-3.5 text-[#76746E]" />
        </button>

        <div className="flex items-center justify-between px-2 pt-1 text-[10px] font-mono text-[#76746E]">
          <span>PRISMA + SQLITE</span>
          <span>ONLINE</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[#383733] h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Top Toggle Bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 bg-[#20201F] border-b border-[#383733]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1 rounded-sm text-[#A5A39D] hover:text-[#F1F0EB] hover:bg-[#292927]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-serif text-sm font-normal text-[#F1F0EB]">
            Model Playground
          </span>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="px-2 py-1 rounded-sm text-[11px] font-mono border border-[#383733] bg-[#222220] text-[#A5A39D]"
        >
          {hasCustomKey ? 'BYOK' : 'Default'}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-xs h-full bg-[#20201F] z-10 border-r border-[#383733]">
            {sidebarContent}
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onKeySaved={handleKeySaved}
      />
    </>
  );
}
