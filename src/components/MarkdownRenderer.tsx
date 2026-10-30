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
    <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-[#e1e4ea] space-y-2.5 break-words">
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
                className="bg-[#181d26] text-[#cbd5e1] px-1.5 py-0.5 rounded text-[11px] font-mono border border-[#222733]"
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0 leading-relaxed text-[#e1e4ea]">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 my-2 space-y-1 text-[#cbd5e1]">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 my-2 space-y-1 text-[#cbd5e1]">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-[#cbd5e1] leading-relaxed">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-base font-semibold text-[#f1f3f7] mt-3.5 mb-1.5 pb-1 border-b border-[#222733]">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-sm font-semibold text-[#f1f3f7] mt-3 mb-1">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-xs font-semibold text-[#93c5fd] mt-2 mb-1">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-[#3b82f6] bg-[#13171f] px-3 py-1.5 my-2 text-[#94a3b8] text-xs">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3 rounded border border-[#222733]">
                <table className="min-w-full divide-y divide-[#222733] text-left text-xs">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return <th className="bg-[#13171f] px-3 py-2 text-[#cbd5e1] font-medium">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3 py-1.5 border-t border-[#222733] text-[#94a3b8]">{children}</td>;
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
    <div className="relative my-2.5 rounded-md overflow-hidden border border-[#222733] bg-[#0c0e12]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#13171f] border-b border-[#222733] text-[11px] text-[#8b94a0] font-mono">
        <span className="uppercase font-medium text-[#93c5fd]">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[#8b94a0] hover:text-[#f1f3f7] hover:bg-[#181d26] transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#10b981]" />
              <span className="text-[#10b981] text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3 overflow-x-auto font-mono text-xs text-[#e1e4ea] leading-relaxed">
        <pre>{value}</pre>
      </div>
    </div>
  );
}
