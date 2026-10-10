import React from 'react';
import { Flame, Shield, Trash2, Smartphone } from 'lucide-react';
import { clearAllCache } from '../lib/cache';

interface NavbarProps {
  onCacheCleared: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onCacheCleared }) => {
  const handleClearCache = async () => {
    if (window.confirm('Bersihkan data cache lokal?')) {
      await clearAllCache();
      onCacheCleared();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/50">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">
                PTCG EN→ID
              </span>
              <span className="bg-rose-500/20 text-rose-400 font-semibold text-[10px] px-2 py-0.5 rounded-full border border-rose-500/30">
                Turnamen Indonesia
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Konverter Decklist Resmi Pokémon TCG Live ke Set Indonesia
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleClearCache}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
            title="Bersihkan Cache IndexedDB"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Cache</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-800/50 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>PWA Siap</span>
          </div>
        </div>
      </div>
    </header>
  );
};
