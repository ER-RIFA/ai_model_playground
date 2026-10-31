'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-[#D1D5DB] space-y-3 break-words font-sans">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && match) {
              return <CodeBlock language={match[1]} value={codeString} />;
            } else if (!inline && codeString.includes('\n')) {
              return <CodeBlock language="text" value={codeString} />;
            }

            return (
              <code
                className="bg-[#16191F] text-[#F1F3F5] px-1.5 py-0.5 rounded text-[11px] font-mono border border-[#222630]"
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-2.5 last:mb-0 leading-relaxed text-[#D1D5DB]">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 my-2 space-y-1 text-[#9CA3AF]">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 my-2 space-y-1 text-[#9CA3AF]">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-[#D1D5DB] leading-relaxed">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-base font-bold text-[#F1F3F5] mt-4 mb-2 pb-1 border-b border-[#222630]">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-sm font-bold text-[#F1F3F5] mt-3.5 mb-1.5">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-xs font-semibold text-[#60A5FA] mt-2.5 mb-1">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-[#2563EB] bg-[#111317] px-3.5 py-2 my-2 text-[#9CA3AF] text-xs rounded-r">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3 rounded border border-[#222630]">
                <table className="min-w-full divide-y divide-[#222630] text-left text-xs font-mono">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return <th className="bg-[#111317] px-3.5 py-2 text-[#F1F3F5] font-semibold">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3.5 py-1.5 border-t border-[#222630] text-[#9CA3AF]">{children}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded overflow-hidden border border-[#222630] bg-[#0D0E12]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#16191F] border-b border-[#222630] text-[11px] text-[#9CA3AF] font-mono">
        <span className="uppercase text-[#38BDF8] text-[10px] tracking-wider font-semibold">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[#9CA3AF] hover:text-[#F1F3F5] hover:bg-[#21262F] transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#10B981]" />
              <span className="text-[#10B981] text-[10px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto font-mono text-xs text-[#F1F3F5] leading-relaxed">
        <pre>{value}</pre>
      </div>
    </div>
  );
}