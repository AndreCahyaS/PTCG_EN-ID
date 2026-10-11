import React, { useState } from 'react';
import { MappedCard, CardCategory, DecklistSummary } from '../types';
import { Layers, Copy, Check, Filter, Search, Edit3, AlertCircle, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DeckPreviewProps {
  mappedCards: MappedCard[];
  summary: DecklistSummary;
  onOpenCandidateDrawer: (card: MappedCard) => void;
  onConfirmAllDefault?: () => void;
}

export const DeckPreview: React.FC<DeckPreviewProps> = ({
  mappedCards,
  summary,
  onOpenCandidateDrawer,
  onConfirmAllDefault,
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

  // Export clean Indonesian text decklist respecting multi-print splits
  const handleCopyTextList = () => {
    const grouped: Record<string, string[]> = {
      Pokémon: [],
      Trainer: [],
      Energy: [],
    };

    mappedCards.forEach(c => {
      const cat = c.parsed.category === 'Pokemon' ? 'Pokémon' : c.parsed.category;
      const isPokemon = c.parsed.category === 'Pokemon';
      const idName = c.selectedCandidate?.name || c.parsed.name;

      if (isPokemon) {
        if (c.selectedCandidates && c.selectedCandidates.length > 0) {
          c.selectedCandidates.forEach(sc => {
            const printName = sc.candidate.name || idName;
            const printSet = sc.candidate.setId && sc.candidate.localId
              ? `${sc.candidate.setId} ${sc.candidate.localId}`
              : `${c.parsed.setCode} ${c.parsed.cardNumber}`;
            grouped[cat].push(`${sc.quantity} ${printName} ${printSet}`);
          });
        } else {
          const idSet = c.selectedCandidate?.setId && c.selectedCandidate?.localId
            ? `${c.selectedCandidate.setId} ${c.selectedCandidate.localId}`
            : `${c.parsed.setCode} ${c.parsed.cardNumber}`;
          grouped[cat].push(`${c.parsed.quantity} ${idName} ${idSet}`);
        }
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

  const allPokemonConfirmed =
    summary.totalPokemonTypes > 0 &&
    summary.confirmedPokemonCount === summary.totalPokemonTypes;

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
            Pilih seri kartu Pokémon fisik Anda, lalu klik Konfirmasi agar garis kartu menjadi hijau.
          </p>
        </div>

        <button
          onClick={handleCopyTextList}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold px-4 py-2 rounded-xl border border-slate-700 text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
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

      {/* Confirmation Status Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
        allPokemonConfirmed
          ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
          : 'bg-amber-950/30 border-amber-800/80 text-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            allPokemonConfirmed
              ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/60'
              : 'bg-amber-900/50 text-amber-300 border border-amber-700/60'
          }`}>
            {allPokemonConfirmed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Status Konfirmasi Pokémon:</span>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                allPokemonConfirmed
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {summary.confirmedPokemonCount} / {summary.totalPokemonTypes} Kartu Dikonfirmasi
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {allPokemonConfirmed
                ? 'Semua kartu Pokémon telah dikonfirmasi (garis hijau) dan siap dicetak ke lembar PDF turnamen.'
                : `Masih ada ${summary.totalPokemonTypes - summary.confirmedPokemonCount} kartu Pokémon dengan garis kuning yang belum dikonfirmasi.`}
            </p>
          </div>
        </div>

        {!allPokemonConfirmed && onConfirmAllDefault && (
          <button
            onClick={onConfirmAllDefault}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Konfirmasi Cepat Semua
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 w-full sm:w-auto">
          {(['All', 'Pokemon', 'Trainer', 'Energy'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
          const isConfirmed = isPokemon ? !!card.isConfirmed : true;
          const candidate = card.selectedCandidate;
          const hasMultipleSelections =
            isPokemon &&
            card.selectedCandidates &&
            card.selectedCandidates.length > 1;

          return (
            <div
              key={card.parsed.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                isPokemon
                  ? isConfirmed
                    ? 'bg-slate-950/70 border-emerald-500/80 ring-1 ring-emerald-500/30 hover:border-emerald-400 shadow-sm shadow-emerald-950/20'
                    : 'bg-slate-950/80 border-amber-500/80 ring-1 ring-amber-500/30 hover:border-amber-400 shadow-sm shadow-amber-950/20'
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-sm font-bold text-white truncate max-w-[150px]">
                    {candidate?.name || card.parsed.name}
                  </h4>
                  {isPokemon && (
                    <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                      isConfirmed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {isConfirmed ? (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          Terkonfirmasi
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                          Belum Dikonfirmasi
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* Set ID & Series Display */}
                <div className="mt-1">
                  {isPokemon ? (
                    hasMultipleSelections && card.selectedCandidates ? (
                      <div className="flex flex-wrap gap-1">
                        {card.selectedCandidates.map((sc, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-mono font-bold text-rose-300 bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-900/60"
                          >
                            {sc.quantity}x {sc.candidate.setId} #{sc.candidate.localId}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-mono font-bold text-rose-400">
                          {candidate?.setId && candidate?.localId
                            ? `${candidate.setId} #${candidate.localId}`
                            : 'Pilih Seri'}
                        </span>
                        {candidate?.setName && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            • {candidate.setName}
                          </span>
                        )}
                      </div>
                    )
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {card.parsed.category} (Standar ID)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    PTCGL: {card.parsed.setCode} #{card.parsed.cardNumber}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {isPokemon && (
                <button
                  onClick={() => onOpenCandidateDrawer(card)}
                  className={`p-2 rounded-lg border text-xs font-medium transition-colors flex-shrink-0 cursor-pointer ${
                    isConfirmed
                      ? 'bg-slate-900 border-emerald-900/60 text-emerald-300 hover:text-white hover:bg-emerald-950/60'
                      : 'bg-amber-950/50 border-amber-700/80 text-amber-300 hover:bg-amber-900/70 hover:text-white shadow-sm'
                  }`}
                  title={isConfirmed ? 'Ubah cetakan fisik kartu' : 'Klik untuk memilih dan konfirmasi cetakan seri'}
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
