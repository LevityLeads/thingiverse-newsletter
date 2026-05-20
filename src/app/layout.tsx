import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Thingiverse Newsletter',
  description: 'Create, schedule, and track Thingiverse newsletters',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-gray-50">
        <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
          <Link href="/" className="text-lg font-bold text-tv-blue">
            Thingiverse Newsletter
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-tv-blue">
              Dashboard
            </Link>
            <Link href="/create" className="text-sm font-medium text-gray-600 hover:text-tv-blue">
              Create
            </Link>
            <Link href="/sends" className="text-sm font-medium text-gray-600 hover:text-tv-blue">
              Sends
            </Link>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
