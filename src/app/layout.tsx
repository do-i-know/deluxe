import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Cinzel } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AudioPlayerProvider } from '@/context/AudioPlayerContext';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['600', '700', '900'],
});

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
};

export const metadata: Metadata = {
  title: 'Deluxe Music • High-Fidelity Audio & Studio Streamer',
  description:
    'Modern high-fidelity music streaming platform & Spotify-grade audio player with Supabase DB, Google Cloud Auth, and Supabase Storage bucket.',
  keywords: [
    'Deluxe Music',
    'Spotify Clone',
    'Supabase Music Player',
    'High Fidelity Audio',
    'Next.js Supabase',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${cinzel.variable} dark`}>
      <body className="min-h-screen bg-[#120806] text-white font-sans antialiased selection:bg-amber-500/30">
        <AuthProvider>
          <AudioPlayerProvider>{children}</AudioPlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
