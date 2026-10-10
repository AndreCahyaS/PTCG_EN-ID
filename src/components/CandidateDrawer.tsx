import React from 'react';
import { MappedCard, IndonesianCardCandidate } from '../types';
import { X, Check, AlertTriangle, Sparkles, Layers } from 'lucide-react';

interface CandidateDrawerProps {
  card: MappedCard | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectCandidate: (candidate: IndonesianCardCandidate) => void;
}

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({
  card,
  isOpen,
  onClose,
  onSelectCandidate,
}) => {
  if (!isOpen || !card) return null;

  const candidates = card.candidates || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {card.parsed.category}
              </span>
              <h3 className="text-lg font-bold text-white">
                Pilih Cetakan Indonesia: {card.parsed.name}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Asal PTCGL: <span className="text-rose-400 font-mono font-bold">{card.parsed.setCode} #{card.parsed.cardNumber}</span> (Jml: {card.parsed.quantity})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: ONLY Daftar Cetakan Indonesia yang Tersedia */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Daftar Cetakan Indonesia yang Tersedia ({candidates.length})
            </h4>
            <span className="text-xs text-slate-400">Pilih cetakan fisik yang Anda miliki</span>
          </div>

          {candidates.length === 0 ? (
            <div className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-4 flex items-start gap-3 text-amber-300 text-xs">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold">Belum ditemukan cetakan Indonesia untuk kartu ini</p>
                <p className="text-amber-400/80 mt-0.5">
                  Pastikan nama kartu sesuai dengan edisi resmi Pokémon Indonesia.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {candidates.map(candidate => {
                const isSelected = card.selectedCandidate?.id === candidate.id;
                return (
                  <div
                    key={candidate.id}
                    onClick={() => {
                      onSelectCandidate(candidate);
                      onClose();
                    }}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-950/30 border-rose-500 shadow-md shadow-rose-950/40 ring-1 ring-rose-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Image Thumbnail */}
                    <div className="w-12 h-16 bg-slate-900 rounded border border-slate-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {candidate.image ? (
                        <img
                          src={candidate.image}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                          onError={e => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Layers className="w-6 h-6 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-white truncate block">
                        {candidate.name}
                      </span>
                      <p className="text-xs text-rose-400 font-mono font-bold mt-0.5">
                        {candidate.setId} #{candidate.localId}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {candidate.setName}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded truncate max-w-[190px]">
                          {candidate.matchReason}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="p-1 rounded-full bg-rose-500 text-white flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
