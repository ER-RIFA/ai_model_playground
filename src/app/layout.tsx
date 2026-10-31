import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Header } from '@/components/Header';

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
  title: 'Frontier Workbench — LLM Evaluation & Inference Suite',
  description: 'Industrial-grade exploration, benchmarking, and streaming inference across frontier language models.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0B0C0E] text-[#F1F3F5] min-h-screen selection:bg-[#2563EB]/30 selection:text-white`}
      >
        <div className="flex flex-col min-h-screen bg-[#0B0C0E] text-[#F1F3F5]">
          <Header />
          <main className="flex-1 flex flex-col min-w-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
