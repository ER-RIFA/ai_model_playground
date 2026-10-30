import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'AI Model Playground | Explore, Benchmark & Test LLMs',
  description: 'Explore the world’s leading AI models with real-time streaming, latency benchmarks, side-by-side arena comparison, and full usage metrics.',
  keywords: ['AI Models', 'LLM Playground', 'DeepSeek R1', 'Llama 3.3', 'GPT-4o', 'OpenRouter', 'AI Arena'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#07090e] text-zinc-100 min-h-screen flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200`}
      >
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
