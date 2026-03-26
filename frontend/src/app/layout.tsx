import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Viralpostify - AI Social Media Automation',
  description: 'AI-powered social media automation platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-dark-950 text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
