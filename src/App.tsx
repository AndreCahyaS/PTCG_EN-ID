import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { DeckInput } from './components/DeckInput';
import { DeckPreview } from './components/DeckPreview';
import { DeckStats } from './components/DeckStats';
import { CandidateDrawer } from './components/CandidateDrawer';
import { PDFDeckSheet } from './components/PDFDeckSheet';
import { parsePTCGLDecklist } from './lib/parser';
import { convertDecklist } from './lib/converter';
import { MappedCard, IndonesianCardCandidate, PlayerTournamentInfo, DecklistSummary, SelectedCandidateItem } from './types';
import { Sparkles } from 'lucide-react';

export function App() {
  const [mappedCards, setMappedCards] = useState<MappedCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeDrawerCard, setActiveDrawerCard] = useState<MappedCard | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const [playerInfo, setPlayerInfo] = useState<PlayerTournamentInfo>({
    playerName: '',
    playerID: '',
  });

  // Calculate summary metrics
  const summary: DecklistSummary = useMemo(() => {
    let totalCards = 0;
    let pokemonCount = 0;
    let trainerCount = 0;
    let energyCount = 0;
    let mappedCount = 0;
    let ambiguousCount = 0;
    let unmappedCount = 0;
    let confirmedPokemonCount = 0;
    let totalPokemonTypes = 0;

    for (const card of mappedCards) {
      const q = card.parsed.quantity;
      totalCards += q;

      if (card.parsed.category === 'Pokemon') {
        pokemonCount += q;
        totalPokemonTypes++;
        if (card.isConfirmed) {
          confirmedPokemonCount++;
        }
      } else if (card.parsed.category === 'Trainer') {
        trainerCount += q;
      } else if (card.parsed.category === 'Energy') {
        energyCount += q;
      }

      if (card.status === 'mapped') mappedCount++;
      else if (card.status === 'ambiguous') ambiguousCount++;
      else unmappedCount++;
    }

    return {
      totalCards,
      pokemonCount,
      trainerCount,
      energyCount,
      mappedCount,
      ambiguousCount,
      unmappedCount,
      isValidCount: totalCards === 60,
      confirmedPokemonCount,
      totalPokemonTypes,
    };
  }, [mappedCards]);

  const handleConvert = async (rawText: string) => {
    setIsLoading(true);
    try {
      const parsed = parsePTCGLDecklist(rawText);
      const converted = await convertDecklist(parsed);
      setMappedCards(converted);
    } catch (err) {
      console.error('Error during conversion:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert default sample deck on initial load
  useEffect(() => {
    const defaultDeck = `Pokémon: 20
4 Dreepy TWM 128
4 Drakloak TWM 129
3 Dragapult ex TWM 130
2 Munkidori TWM 95
2 Budew ASC 16
1 Dunsparce JTG 120
1 Dudunsparce TEF 129
1 Dudunsparce ex JTG 121
1 Meowth ex POR 62
1 Fezandipiti ex ASC 142

Trainer: 32
4 Lillie's Determination MEG 119
3 Boss's Orders MEG 114
2 Crispin SCR 133
1 Rosa's Encouragement POR 84
4 Buddy-Buddy Poffin TEF 144
4 Crushing Hammer POR 71
4 Poké Pad POR 81
3 Night Stretcher ASC 196
3 Ultra Ball MEG 131
1 Special Red Card CRI 82
1 Unfair Stamp TWM 165
2 Risky Ruins MEG 127

Energy: 8
3 Psychic Energy MEE 13
3 Fire Energy MEE 10
2 Darkness Energy MEE 15`;

    handleConvert(defaultDeck);
  }, []);

  const handleConfirmCard = (
    cardId: string,
    selections: SelectedCandidateItem[],
    updatedCandidates: IndonesianCardCandidate[]
  ) => {
    setMappedCards(prev =>
      prev.map(c => {
        if (c.parsed.id === cardId) {
          const primaryCandidate = selections[0]?.candidate || c.selectedCandidate;
          return {
            ...c,
            status: 'mapped',
            selectedCandidate: primaryCandidate,
            selectedCandidates: selections,
            candidates: updatedCandidates,
            manualOverride: true,
            isConfirmed: true,
          };
        }
        return c;
      })
    );
  };

  const handleConfirmAllDefault = () => {
    setMappedCards(prev =>
      prev.map(c => {
        if (c.parsed.category === 'Pokemon' && !c.isConfirmed) {
          const primary = c.selectedCandidate || c.candidates[0];
          return {
            ...c,
            status: 'mapped',
            selectedCandidate: primary,
            selectedCandidates: primary
              ? [{ candidate: primary, quantity: c.parsed.quantity }]
              : [],
            isConfirmed: true,
          };
        }
        return c;
      })
    );
  };

  const openDrawer = (card: MappedCard) => {
    setActiveDrawerCard(card);
    setIsDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar onCacheCleared={() => handleConvert('')} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-900/40 p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Official Tournament Format Ready</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Konversi Decklist Pokémon TCG <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-rose-300">
                English ke Kode & Nomor Set Indonesia
              </span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Ekspor daftar kartu langsung dari Pokémon TCG Live, konversi ke padanan nama kartu dan kode set resmi Indonesia, lalu unduh Lembar Registrasi Turnamen (A4 PDF) siap cetak.
            </p>
          </div>
        </section>

        {/* Deck Balance & Statistics */}
        <section>
          <DeckStats summary={summary} />
        </section>

        {/* Input & Conversion Engine */}
        <section>
          <DeckInput onConvert={handleConvert} isLoading={isLoading} />
        </section>

        {/* Live Deck Cards Preview & Disambiguation */}
        {mappedCards.length > 0 && (
          <section className="space-y-8">
            <DeckPreview
              mappedCards={mappedCards}
              summary={summary}
              onOpenCandidateDrawer={openDrawer}
              onConfirmAllDefault={handleConfirmAllDefault}
            />

            {/* Official PDF Tournament Sheet Generator */}
            <PDFDeckSheet
              mappedCards={mappedCards}
              summary={summary}
              playerInfo={playerInfo}
              onUpdatePlayerInfo={setPlayerInfo}
            />
          </section>
        )}
      </main>

      {/* Candidate Verification Drawer */}
      <CandidateDrawer
        card={activeDrawerCard}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onConfirm={handleConfirmCard}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>© 2026 Pokémon TCG EN→ID Deck Converter PWA. Bukan aplikasi resmi dari Nintendo / The Pokémon Company / Salim Group.</p>
          <p>Ditenagai oleh TCGdex API & database padanan set kartu Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
