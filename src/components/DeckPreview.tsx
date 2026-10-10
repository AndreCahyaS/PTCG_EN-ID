import React, { useState } from 'react';
import { MappedCard, CardCategory, IndonesianCardCandidate } from '../types';
import { Layers, Copy, Check, Filter, Search, Edit3, AlertCircle, Sparkles } from 'lucide-react';

interface DeckPreviewProps {
  mappedCards: MappedCard[];
  onOpenCandidateDrawer: (card: MappedCard) => void;
}

export const DeckPreview: React.FC<DeckPreviewProps> = ({
  mappedCards,
  onOpenCandidateDrawer,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | CardCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Filtered cards
  const filteredCards = mappedCards.filter(card => {
    const matchesCategory = selectedCategory === 'All' || card.parsed.category === selectedCategory;
    const nameMatch =
      card.parsed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.selectedCandidate?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesCategory && nameMatch;
  });

  // Export clean Indonesian text decklist
  const handleCopyTextList = () => {
    const grouped: Record<string, string[]> = {
      Pokémon: [],
      Trainer: [],
      Energy: [],
    };

    mappedCards.forEach(c => {
      const cat = c.parsed.category === 'Pokemon' ? 'Pokémon' : c.parsed.category;
      const idName = c.selectedCandidate?.name || c.parsed.name;
      const isPokemon = c.parsed.category === 'Pokemon';

      if (isPokemon) {
        const idSet = c.selectedCandidate?.setId && c.selectedCandidate?.localId
          ? `${c.selectedCandidate.setId} ${c.selectedCandidate.localId}`
          : `${c.parsed.setCode} ${c.parsed.cardNumber}`;
        grouped[cat].push(`${c.parsed.quantity} ${idName} ${idSet}`);
      } else {
        // RULE: Trainer and Energy do NOT need series code and collection number
        grouped[cat].push(`${c.parsed.quantity} ${idName}`);
      }
    });

    let exportText = `=== POKÉMON TCG DECKLIST INDONESIA ===\n\n`;
    for (const [section, lines] of Object.entries(grouped)) {
      if (lines.length > 0) {
        exportText += `${section}: ${lines.length}\n`;
        exportText += lines.join('\n') + '\n\n';
      }
    }

    navigator.clipboard.writeText(exportText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-rose-500" />
            2. Verifikasi Hasil Konversi Kartu Indonesia
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Format resmi: Kode set dan nomor hanya untuk Pokémon. Trainer & Energy hanya nama kartu.
          </p>
        </div>

        <button
          onClick={handleCopyTextList}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold px-4 py-2 rounded-xl border border-slate-700 text-xs shadow-sm transition-all active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Tersalin ke Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-300" />
              <span>Salin Daftar Teks ID</span>
            </>
          )}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 w-full sm:w-auto">
          {(['All', 'Pokemon', 'Trainer', 'Energy'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'All' ? 'Semua' : cat}
            </button>
          ))}
        </div>

        {/* Search Filter */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari kartu..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCards.map(card => {
          const isPokemon = card.parsed.category === 'Pokemon';
          const isAmbiguous = card.status === 'ambiguous';
          const candidate = card.selectedCandidate;

          return (
            <div
              key={card.parsed.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                isAmbiguous && isPokemon
                  ? 'bg-slate-950/80 border-amber-900/60 hover:border-amber-700/80 ring-1 ring-amber-500/20'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Thumbnail */}
              <div className="w-12 h-16 bg-slate-900 rounded-lg border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                {candidate?.image ? (
                  <img
                    src={candidate.image}
                    alt={candidate.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Layers className="w-5 h-5 text-slate-600" />
                )}
                {/* Quantity badge */}
                <span className="absolute bottom-0 right-0 bg-slate-900/90 text-white font-mono font-bold text-[10px] px-1 rounded-tl border-t border-l border-slate-700">
                  x{card.parsed.quantity}
                </span>
              </div>

              {/* Card Meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white truncate">
                    {candidate?.name || card.parsed.name}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  {isPokemon ? (
                    <>
                      <span className="text-xs font-mono font-bold text-rose-400">
                        {candidate?.setId && candidate?.localId ? `${candidate.setId} #${candidate.localId}` : 'Pilih Seri'}
                      </span>
                      {candidate?.setName && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          • {candidate.setName}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {card.parsed.category} (Standar ID)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    EN: {card.parsed.name}
                  </span>
                  {isAmbiguous && isPokemon && (
                    <span
                      onClick={() => onOpenCandidateDrawer(card)}
                      className="inline-flex items-center gap-1 text-[9px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-semibold px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      title="Klik untuk memilih cetakan seri kartu fisik"
                    >
                      <AlertCircle className="w-2.5 h-2.5" /> {card.candidates.length} Seri Tersedia
                    </span>
                  )}
                </div>
              </div>

              {/* Edit / Select Button */}
              {isPokemon && (
                <button
                  onClick={() => onOpenCandidateDrawer(card)}
                  className={`p-2 rounded-lg border text-xs font-medium transition-colors flex-shrink-0 ${
                    isAmbiguous
                      ? 'bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-900/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Pilih cetakan seri fisik kartu Pokémon"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
