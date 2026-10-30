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
    <div className="prose prose-invert max-w-none text-zinc-100 text-sm leading-relaxed break-words space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && match) {
              return <CodeBlock language={match[1]} value={codeString} />;
            } else if (!inline && codeString.includes('\n')) {
              return <CodeBlock language="text" value={codeString} />;
            }

            return (
              <code
                className="bg-zinc-800/80 text-violet-300 px-1.5 py-0.5 rounded text-xs font-mono border border-zinc-700/50"
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-2.5 last:mb-0 leading-relaxed text-zinc-200">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 my-2 space-y-1 text-zinc-300">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 my-2 space-y-1 text-zinc-300">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-zinc-200">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold text-white mt-4 mb-2 pb-1 border-b border-zinc-800">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-semibold text-white mt-3 mb-1.5">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold text-violet-200 mt-2.5 mb-1">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-violet-500/50 bg-violet-950/20 px-3 py-1.5 my-2 rounded-r text-zinc-300 italic text-xs">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3 rounded border border-zinc-800">
                <table className="min-w-full divide-y divide-zinc-800 text-left text-xs">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return <th className="bg-zinc-900/80 px-3 py-2 text-zinc-300 font-semibold">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3 py-2 border-t border-zinc-800/60 text-zinc-300">{children}</td>;
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
    <div className="relative my-3 rounded-lg overflow-hidden border border-zinc-800 bg-[#0c1017]">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800/80 text-xs text-zinc-400 font-mono">
        <span className="uppercase tracking-wider font-semibold text-violet-400">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-xs">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto font-mono text-xs text-zinc-200 leading-relaxed">
        <pre>{value}</pre>
      </div>
    </div>
  );
}
