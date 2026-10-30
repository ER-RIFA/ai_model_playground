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
    <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-[#DCDAD4] space-y-2.5 break-words font-sans">
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
                className="bg-[#222220] text-[#F1F0EB] px-1.5 py-0.5 rounded-sm text-[11px] font-mono border border-[#383733]"
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0 leading-relaxed text-[#DCDAD4]">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 my-2 space-y-1 text-[#A5A39D]">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 my-2 space-y-1 text-[#A5A39D]">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-[#DCDAD4] leading-relaxed">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="font-serif text-base font-normal text-[#F1F0EB] mt-3.5 mb-1.5 pb-1 border-b border-[#383733]">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="font-serif text-sm font-normal text-[#F1F0EB] mt-3 mb-1">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="font-serif text-xs font-normal text-[#8CB2D4] mt-2 mb-1">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-[#2F658E] bg-[#20201F] px-3 py-1.5 my-2 text-[#A5A39D] text-xs">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3 rounded-sm border border-[#383733]">
                <table className="min-w-full divide-y divide-[#383733] text-left text-xs font-mono">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return <th className="bg-[#20201F] px-3 py-2 text-[#F1F0EB] font-medium">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3 py-1.5 border-t border-[#383733] text-[#A5A39D]">{children}</td>;
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
    <div className="relative my-2.5 rounded-sm overflow-hidden border border-[#383733] bg-[#151514]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#20201F] border-b border-[#383733] text-[11px] text-[#A5A39D] font-mono">
        <span className="uppercase text-[#8CB2D4] text-[10px] tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[#A5A39D] hover:text-[#F1F0EB] hover:bg-[#292927] transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#48A977]" />
              <span className="text-[#48A977] text-[10px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3 overflow-x-auto font-mono text-xs text-[#F1F0EB] leading-relaxed">
        <pre>{value}</pre>
      </div>
    </div>
  );
}
