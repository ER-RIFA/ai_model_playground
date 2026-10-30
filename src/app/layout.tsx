import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';

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
  title: 'AI Model Playground | Frontier Model Engineering',
  description: 'A developer-focused exploration, benchmarking, and inference suite for frontier language models.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#191919] text-[#F1F0EB] min-h-screen selection:bg-[#2F658E]/30 selection:text-[#F1F0EB]`}
      >
        <div className="flex min-h-screen bg-[#191919] text-[#F1F0EB]">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
