import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'Helix Core — Clinical Intelligence Platform',
  description: 'Unified longitudinal patient timelines, real-time risk alerts, and AI-driven clinical insights across all healthcare providers.',
};


import Providers from './providers';




export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} min-h-full`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
