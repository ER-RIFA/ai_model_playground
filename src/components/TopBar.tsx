'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Terminal } from 'lucide-react';

export function TopBar() {
  const pathname = usePathname();

  let pageTitle = 'Model Directory';
  let pageCategory = 'Explore';

  if (pathname.startsWith('/playground')) {
    pageTitle = 'Playground Studio';
    pageCategory = 'Inference';
  } else if (pathname.startsWith('/compare')) {
    pageTitle = 'Comparison Arena';
    pageCategory = 'Benchmarking';
  } else if (pathname.startsWith('/history')) {
    pageTitle = 'Execution Telemetry';
    pageCategory = 'Audit';
  }

  return (
    <header className="h-12 border-b border-[#383733] bg-[#191919] px-4 sm:px-6 flex items-center justify-between shrink-0">
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-mono text-[#76746E] uppercase text-[10px] tracking-wider">
          {pageCategory}
        </span>
        <span className="text-[#383733]">/</span>
        <h1 className="font-serif text-sm font-normal text-[#F1F0EB] tracking-wide">
          {pageTitle}
        </h1>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2.5">
        <a
          href="https://github.com/ER-RIFA/ai_model_playground"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#A5A39D] hover:text-[#F1F0EB] transition-colors"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span className="hidden sm:inline font-mono text-[11px]">Repository</span>
        </a>

        {pathname !== '/playground' && (
          <Link
            href="/playground"
            className="flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-medium bg-[#2F658E] hover:bg-[#255273] text-[#F1F0EB] transition-colors"
          >
            <Terminal className="w-3 h-3" />
            <span>Open Studio</span>
          </Link>
        )}
      </div>
    </header>
  );
}
