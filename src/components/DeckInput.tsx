import React, { useState, useEffect } from 'react';
import { Clipboard, RotateCcw, Sparkles, BookOpen, Cookie, Trash2, Check, X } from 'lucide-react';
import {
  SavedTemplate,
  getSavedTemplatesFromCookie,
  saveTemplateToCookie,
  deleteSavedTemplateFromCookie,
  getLastPastedTemplateFromCookie,
  setLastPastedTemplateToCookie,
} from '../lib/cookies';

interface DeckInputProps {
  onConvert: (rawText: string) => void;
  isLoading: boolean;
  initialText?: string;
}

export const SAMPLE_DECKS: Record<string, string> = {
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

};

function autoDetectDeckName(text: string): string {
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^\d+\s+([A-Za-z0-9'\-\s]+?)(?:\s+[A-Z0-9]{3,}\s+\d+)?$/);
    if (match && match[1]) {
      const cardName = match[1].trim();
      if (!cardName.toLowerCase().includes('energy') && !cardName.toLowerCase().includes('ball')) {
        return `${cardName} Deck`;
      }
    }
  }
  return `Template Deck ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
}

export const DeckInput: React.FC<DeckInputProps> = ({ onConvert, isLoading, initialText }) => {
  const [deckText, setDeckText] = useState<string>(() => {
    if (initialText) return initialText;
    const lastCookie = getLastPastedTemplateFromCookie();
    if (lastCookie) return lastCookie;
    return SAMPLE_DECKS['Sample Tournament Deck (SampleData.txt)'];
  });

  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [templateNameInput, setTemplateNameInput] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load saved templates from cookie on mount
  useEffect(() => {
    refreshSavedTemplates();
  }, []);

  const refreshSavedTemplates = () => {
    const templates = getSavedTemplatesFromCookie();
    setSavedTemplates(templates);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setDeckText(text);
        // Automatically save pasted template to cookies
        setLastPastedTemplateToCookie(text);
        setSelectedKey('custom_pasted');
        showToast('Template ditempel & disimpan ke cookie! 🍪');
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  const handleSelectChange = (value: string) => {
    setSelectedKey(value);
    if (!value) return;

    if (value.startsWith('cookie:')) {
      const id = value.replace('cookie:', '');
      const found = savedTemplates.find(t => t.id === id);
      if (found) {
        setDeckText(found.content);
        setLastPastedTemplateToCookie(found.content);
      }
    } else if (SAMPLE_DECKS[value]) {
      setDeckText(SAMPLE_DECKS[value]);
    }
  };

  const openSavePanel = () => {
    setTemplateNameInput(autoDetectDeckName(deckText));
    setIsSaving(true);
  };

  const handleSaveToCookie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckText.trim()) return;

    const saved = saveTemplateToCookie(templateNameInput, deckText);
    refreshSavedTemplates();
    setSelectedKey(`cookie:${saved.id}`);
    setIsSaving(false);
    showToast(`Template "${saved.name}" berhasil disimpan di cookie! 🍪`);
  };

  const handleDeleteCurrentSavedTemplate = () => {
    if (!selectedKey.startsWith('cookie:')) return;
    const id = selectedKey.replace('cookie:', '');
    const found = savedTemplates.find(t => t.id === id);
    const confirmName = found ? found.name : 'template ini';

    if (window.confirm(`Hapus "${confirmName}" dari cookie browser?`)) {
      deleteSavedTemplateFromCookie(id);
      refreshSavedTemplates();
      setSelectedKey('');
      showToast('Template dihapus dari cookie.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deckText.trim()) {
      setLastPastedTemplateToCookie(deckText);
      onConvert(deckText);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-medium text-rose-300 animate-in fade-in slide-in-from-top duration-200">
          <Cookie className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header bar with Sample presets and Cookie status */}
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

        {/* Preset & Cookie Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Template:</span>
          <select
            value={selectedKey}
            onChange={e => handleSelectChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500 max-w-[210px] sm:max-w-[260px] truncate"
          >
            <option value="">Pilih Preset / Cookie...</option>
            {savedTemplates.length > 0 && (
              <optgroup label="🍪 Template Tersimpan (Cookie)">
                {savedTemplates.map(t => (
                  <option key={t.id} value={`cookie:${t.id}`}>
                    🍪 {t.name}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="📋 Contoh Deck Bawaan">
              {Object.keys(SAMPLE_DECKS).map(key => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Delete Cookie Template Button */}
          {selectedKey.startsWith('cookie:') && (
            <button
              type="button"
              onClick={handleDeleteCurrentSavedTemplate}
              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition-colors"
              title="Hapus template ini dari cookie"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Save Template Modal / Inline Form */}
      {isSaving && (
        <form
          onSubmit={handleSaveToCookie}
          className="p-4 bg-slate-950 border border-amber-500/30 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Cookie className="w-4 h-4" />
              <span>Simpan Template ke Cookie Browser</span>
            </div>
            <button
              type="button"
              onClick={() => setIsSaving(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              autoFocus
              value={templateNameInput}
              onChange={e => setTemplateNameInput(e.target.value)}
              placeholder="Beri nama template ini..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!templateNameInput.trim()}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSaving(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Template akan disimpan di cookie browser Anda dan siap dimuat kembali kapan saja bahkan setelah browser ditutup.
          </p>
        </form>
      )}

      {/* Textarea container */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={deckText}
            onChange={e => {
              setDeckText(e.target.value);
              setLastPastedTemplateToCookie(e.target.value);
            }}
            placeholder="Tempel decklist PTCGL di sini..."
            rows={12}
            className="w-full bg-slate-950 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-600 rounded-xl p-4 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all leading-relaxed"
          />

          {/* Action buttons inside textarea */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePaste}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 shadow-sm transition-colors"
              title="Tempel dari Clipboard & Simpan ke Cookie"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Tempel</span>
            </button>

            <button
              type="button"
              onClick={openSavePanel}
              disabled={!deckText.trim()}
              className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs px-2.5 py-1.5 rounded-lg border border-amber-500/30 shadow-sm transition-colors disabled:opacity-40"
              title="Simpan Template ini ke Cookie Browser"
            >
              <Cookie className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Simpan Template</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDeckText('');
                setSelectedKey('');
              }}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors"
              title="Bersihkan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Button & Meta info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>
              Total baris: <span className="text-slate-200 font-semibold">{deckText.split('\n').filter(Boolean).length}</span>
            </span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-500">
              <Cookie className="w-3 h-3 text-amber-500/70" />
              Tersinkron dengan cookie browser
            </span>
          </div>

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

export default DeckInput;
