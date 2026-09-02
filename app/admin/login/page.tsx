import type { Metadata } from 'next';
import Link from 'next/link';
import { loginAdmin } from '@/app/actions/admin';

export const metadata: Metadata = {
  title: 'Admin Login — Sports Week 2026',
  description: 'Official tournament administration portal login.',
};

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative">
      {/* Background Ghosting */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1600&q=80')`,
        }}
      />

      <div className="w-full max-w-md bg-surface-container border border-outline-variant/30 shadow-2xl p-6 sm:p-8 relative z-10 border-t-4 border-t-gold-accent">
        {error && (
          <div className="mb-4 p-3 bg-live-red/20 border border-live-red/40 rounded text-xs font-caps-label text-live-red">
            {error}
          </div>
        )}
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-navy-mid mx-auto flex items-center justify-center text-gold-accent mb-3 border border-gold-accent/40 font-display text-xl">
            SW
          </div>
          <h1 className="font-display text-white text-2xl uppercase tracking-wider">
            ADMIN PORTAL
          </h1>
          <p className="font-caps-label text-xs text-fog-text uppercase mt-1">
            SES Sports Week 2026 &bull; Officials
          </p>
        </div>

        {/* Credentials Form */}
        <form action={loginAdmin} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="block font-caps-label text-xs uppercase text-fog-text mb-1.5 font-semibold"
            >
              Official Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="admin@muet.edu.pk"
              defaultValue="admin@muet.edu.pk"
              required
              className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-sm focus:border-gold-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-caps-label text-xs uppercase text-fog-text mb-1.5 font-semibold"
            >
              Security Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              defaultValue="admin123"
              required
              className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-sm focus:border-gold-accent focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gold-accent text-navy-deep font-caps-label uppercase py-3 font-bold text-xs tracking-wider hover:bg-white transition-colors cursor-pointer shadow-md mt-2"
          >
            Authenticate &amp; Access
          </button>
        </form>

        {/* Quick Demo Access Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant/30" />
          </div>
          <span className="relative px-3 bg-surface-container text-[11px] font-caps-label uppercase text-on-surface-variant">
            Or Quick Test Access
          </span>
        </div>

        {/* Demo 1-Click Login */}
        <form action={loginAdmin}>
          <input type="hidden" name="is_demo" value="true" />
          <button
            type="submit"
            className="w-full border border-gold-accent/50 text-gold-accent font-caps-label uppercase py-2.5 text-xs font-bold hover:bg-gold-accent/15 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">key</span>
            Demo Admin Login (1-Click)
          </button>
        </form>

        {/* Public site link */}
        <div className="text-center mt-6 pt-4 border-t border-outline-variant/20">
          <Link
            href="/"
            className="text-xs text-fog-text hover:text-white flex items-center justify-center gap-1 font-caps-label uppercase"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Public Scoreboard
          </Link>
        </div>
      </div>
    </main>
  );
}
