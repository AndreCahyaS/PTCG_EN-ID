import React, { useState } from 'react';
import { Clipboard, Play, RotateCcw, Sparkles, BookOpen } from 'lucide-react';

interface DeckInputProps {
  onConvert: (rawText: string) => void;
  isLoading: boolean;
}

const SAMPLE_DECKS: Record<string, string> = {
  'Sample Tournament Deck (SampleData.txt)': `Pokémon: 20
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
2 Darkness Energy MEE 15`,

  'Charizard ex (Standard Meta)': `Pokémon: 8
2 Charmander MEW 4
1 Charmeleon MEW 5
2 Charizard ex OBF 125
1 Pidgey MEW 16
1 Pidgeot ex OBF 164
1 Lumineon V BRS 40
1 Rotom V LOR 58
1 Radiant Charizard PGO 11

Trainer: 12
4 Arven OBF 186
3 Boss's Orders PAL 172
4 Ultra Ball SVI 196
4 Rare Candy SVI 191
2 Nest Ball SVI 181
2 Super Rod PAL 188
1 Counter Catcher PAR 160
1 Prime Catcher TEF 157
1 Lost Vacuum CRZ 135
2 Iono PAL 185
1 Professor's Research SVI 189
1 Collapsed Stadium BRS 137

Energy: 1
6 Basic {R} Energy SVE 2`,

  'Raging Bolt ex / Ogerpon': `Pokémon: 4
4 Raging Bolt ex TEF 123
4 Teal Mask Ogerpon ex TWM 25
1 Fezandipiti ex SFA 38
1 Radiant Greninja ASR 46

Trainer: 11
4 Professor Sada's Vitality PAR 170
4 Pokégear 3.0 SVI 186
4 Earthen Vessel PAR 163
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
3 Energy Retrieval SVI 171
2 Superior Energy Retrieval PAL 189
2 Switch Cart ASR 154
1 Prime Catcher TEF 157
1 Night Stretcher SFA 61
2 PokéStop PGO 68

Energy: 3
6 Basic {G} Energy SVE 1
4 Basic {F} Energy SVE 6
4 Basic {L} Energy SVE 4`
};

export const DeckInput: React.FC<DeckInputProps> = ({ onConvert, isLoading }) => {
  const [deckText, setDeckText] = useState(SAMPLE_DECKS['Sample Tournament Deck (SampleData.txt)']);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setDeckText(text);
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  const handleSampleSelect = (deckName: string) => {
    setDeckText(SAMPLE_DECKS[deckName]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deckText.trim()) {
      onConvert(deckText);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      {/* Header bar with Sample presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" />
            1. Masukkan Decklist English (PTCGL / Limitless)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Salin langsung dari Pokémon TCG Live atau Limitless TCG
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Contoh:</span>
          <select
            onChange={e => handleSampleSelect(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            {Object.keys(SAMPLE_DECKS).map(key => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Textarea container */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={deckText}
            onChange={e => setDeckText(e.target.value)}
            placeholder="Tempel decklist PTCGL di sini..."
            rows={12}
            className="w-full bg-slate-950 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-600 rounded-xl p-4 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all leading-relaxed"
          />

          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePaste}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 shadow-sm transition-colors"
              title="Tempel dari Clipboard"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Tempel</span>
            </button>
            <button
              type="button"
              onClick={() => setDeckText('')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors"
              title="Bersihkan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Total baris: <span className="text-slate-200 font-semibold">{deckText.split('\n').filter(Boolean).length}</span>
          </span>

          <button
            type="submit"
            disabled={isLoading || !deckText.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 disabled:opacity-50 text-white font-bold px-7 py-3 rounded-xl shadow-lg shadow-rose-950/50 transition-all active:scale-95"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Mencari di Katalog Indonesia...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Konversi ke Set & Nomor Indonesia</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
