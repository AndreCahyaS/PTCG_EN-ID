import React, { useState, useEffect } from 'react';
import { MappedCard, IndonesianCardCandidate, SelectedCandidateItem } from '../types';
import { X, Check, AlertTriangle, Sparkles, Layers, Plus, Minus, RotateCcw, PlusCircle, CheckCircle2 } from 'lucide-react';

interface CandidateDrawerProps {
  card: MappedCard | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    cardId: string,
    selections: SelectedCandidateItem[],
    updatedCandidates: IndonesianCardCandidate[]
  ) => void;
}

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({
  card,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !card) return null;

  const requiredQuantity = card.parsed.quantity;
  const [candidates, setCandidates] = useState<IndonesianCardCandidate[]>(card.candidates || []);
  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>({});
  
  // Custom Card Input State
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customSetId, setCustomSetId] = useState('');
  const [customLocalId, setCustomLocalId] = useState('');
  const [customName, setCustomName] = useState(card.parsed.name);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sync state whenever drawer opens for a card
  useEffect(() => {
    if (card) {
      setCandidates(card.candidates || []);
      setCustomName(card.parsed.name);
      setCustomSetId('');
      setCustomLocalId('');
      setShowCustomForm(false);
      setFeedbackMsg(null);

      // If already confirmed or has selectedCandidates, load existing allocation
      if (card.selectedCandidates && card.selectedCandidates.length > 0) {
        const counts: Record<string, number> = {};
        card.selectedCandidates.forEach(sc => {
          counts[sc.candidate.id] = sc.quantity;
        });
        setSelectedCounts(counts);
      } else if (card.isConfirmed && card.selectedCandidate) {
        setSelectedCounts({ [card.selectedCandidate.id]: card.parsed.quantity });
      } else {
        // Unconfirmed card: start at 0 so user can click to allocate (e.g. 2 from sv6s, 2 from sv8a)
        setSelectedCounts({});
      }
    }
  }, [card, isOpen]);

  // Total cards selected so far
  const totalSelected = Object.values(selectedCounts).reduce((sum, count) => sum + count, 0);
  const remainingNeeded = Math.max(0, requiredQuantity - totalSelected);
  const isComplete = totalSelected === requiredQuantity;

  // Handle clicking a candidate card directly
  const handleCandidateClick = (candidate: IndonesianCardCandidate) => {
    if (totalSelected < requiredQuantity) {
      // Allocate 1 copy
      setSelectedCounts(prev => ({
        ...prev,
        [candidate.id]: (prev[candidate.id] || 0) + 1,
      }));
      setFeedbackMsg(null);
    } else {
      // Already reached required quantity
      setFeedbackMsg(`Sudah terpenuhi (${requiredQuantity}/${requiredQuantity} kartu). Kurangi salah satu kartu dengan tombol (-) jika ingin mengganti.`);
    }
  };

  const handleIncrement = (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalSelected < requiredQuantity) {
      setSelectedCounts(prev => ({
        ...prev,
        [candidateId]: (prev[candidateId] || 0) + 1,
      }));
      setFeedbackMsg(null);
    }
  };

  const handleDecrement = (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCounts(prev => {
      const current = prev[candidateId] || 0;
      if (current <= 1) {
        const updated = { ...prev };
        delete updated[candidateId];
        return updated;
      }
      return {
        ...prev,
        [candidateId]: current - 1,
      };
    });
    setFeedbackMsg(null);
  };

  const handleSelectAllForCandidate = (candidate: IndonesianCardCandidate, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCounts({ [candidate.id]: requiredQuantity });
    setFeedbackMsg(null);
  };

  const handleReset = () => {
    setSelectedCounts({});
    setFeedbackMsg(null);
  };

  // Add Custom Card to Stack
  const handleAddCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSet = customSetId.trim();
    const cleanNum = customLocalId.trim();
    const cleanName = customName.trim() || card.parsed.name;

    if (!cleanSet || !cleanNum) {
      setFeedbackMsg('Mohon isi Kode Set dan Nomor Kartu');
      return;
    }

    const customId = `${cleanSet}-${cleanNum}`;
    const newCandidate: IndonesianCardCandidate = {
      id: customId,
      localId: cleanNum,
      setId: cleanSet,
      setName: `Kustom (${cleanSet})`,
      name: cleanName,
      category: 'Pokemon',
      matchScore: 100,
      matchReason: 'Kartu Kustom Manual Pengguna',
    };

    // Add to candidates list / stack
    const updatedCandidates = [
      newCandidate,
      ...candidates.filter(c => c.id !== customId),
    ];
    setCandidates(updatedCandidates);

    // If slots are still open, select 1 copy of this custom card
    if (totalSelected < requiredQuantity) {
      setSelectedCounts(prev => ({
        ...prev,
        [customId]: (prev[customId] || 0) + 1,
      }));
    }

    setCustomSetId('');
    setCustomLocalId('');
    setFeedbackMsg(`Kartu kustom ${cleanSet} #${cleanNum} berhasil ditambahkan ke stack!`);
  };

  // Confirm selection
  const handleConfirm = () => {
    if (!isComplete) return;

    const selections: SelectedCandidateItem[] = [];
    for (const cand of candidates) {
      const count = selectedCounts[cand.id] || 0;
      if (count > 0) {
        selections.push({
          candidate: cand,
          quantity: count,
        });
      }
    }

    onConfirm(card.parsed.id, selections, candidates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {card.parsed.category}
              </span>
              <h3 className="text-lg font-bold text-white">
                Pilih Cetakan: {card.parsed.name}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Asal PTCGL: <span className="text-rose-400 font-mono font-bold">{card.parsed.setCode} #{card.parsed.cardNumber}</span> • Total Dibutuhkan: <span className="font-bold text-white">{requiredQuantity} Kartu</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection Status & Progress Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium">Progress Pemilihan:</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              isComplete
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {totalSelected} / {requiredQuantity} Kartu Terpilih
            </span>
            {isComplete ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Lengkap
              </span>
            ) : (
              <span className="text-xs text-amber-400 font-medium">
                (Klik {remainingNeeded}x lagi)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {totalSelected > 0 && (
              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Pilihan
              </button>
            )}
          </div>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <div className="px-6 py-2 bg-amber-950/40 border-b border-amber-900/60 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Custom Card Toggle & Form */}
          <div className="bg-slate-950/50 rounded-xl border border-slate-800/80 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold text-slate-200">Kartu Kustom / Seri Lainnya</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomForm(!showCustomForm)}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                {showCustomForm ? 'Tutup Form' : '+ Tambah Kartu Kustom ke Stack'}
              </button>
            </div>

            {showCustomForm && (
              <form onSubmit={handleAddCustomCard} className="pt-2 border-t border-slate-800/80 space-y-3 animate-fade-in">
                <p className="text-[11px] text-slate-400">
                  Tambahkan seri fisik Indonesia kartu ini secara manual jika tidak terdaftar di katalog resmi.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Kode Set ID</label>
                    <input
                      type="text"
                      value={customSetId}
                      onChange={e => setCustomSetId(e.target.value)}
                      placeholder="e.g. SV6s, SV8a, SV-P"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Nomor Kartu</label>
                    <input
                      type="text"
                      value={customLocalId}
                      onChange={e => setCustomLocalId(e.target.value)}
                      placeholder="e.g. 056, 128"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Nama Kartu (ID)</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      placeholder={card.parsed.name}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambahkan ke Stack Pokémon
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Candidate List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Daftar Cetakan Indonesia yang Tersedia ({candidates.length})
              </h4>
              <span className="text-[11px] text-slate-400">Klik kartu untuk menambah jumlah cetakan</span>
            </div>

            {candidates.length === 0 ? (
              <div className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-4 flex items-start gap-3 text-amber-300 text-xs">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <p className="font-semibold">Belum ditemukan cetakan Indonesia untuk kartu ini</p>
                  <p className="text-amber-400/80 mt-0.5">
                    Gunakan fitur Kartu Kustom di atas untuk memasukkan kode set dan nomor seri secara manual.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {candidates.map(candidate => {
                  const count = selectedCounts[candidate.id] || 0;
                  const isSelected = count > 0;

                  return (
                    <div
                      key={candidate.id}
                      onClick={() => handleCandidateClick(candidate)}
                      className={`relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-950/30 border-emerald-500/80 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Thumbnail Image */}
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

                      {/* Candidate Meta */}
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

                        {/* Quick pick all button if 0 chosen */}
                        {count === 0 && requiredQuantity > 1 && totalSelected === 0 && (
                          <button
                            type="button"
                            onClick={e => handleSelectAllForCandidate(candidate, e)}
                            className="mt-1 text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded transition-colors"
                          >
                            Pilih Semua (x{requiredQuantity})
                          </button>
                        )}
                      </div>

                      {/* Quantity Controls & Badge */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        {isSelected ? (
                          <div className="flex items-center gap-1 bg-emerald-900/60 border border-emerald-600/60 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={e => handleDecrement(candidate.id, e)}
                              className="w-6 h-6 flex items-center justify-center rounded bg-emerald-800 hover:bg-emerald-700 text-white transition-colors"
                              title="Kurangi 1 kartu"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <span className="font-mono font-bold text-xs text-emerald-200 px-1.5 min-w-[20px] text-center">
                              x{count}
                            </span>

                            <button
                              type="button"
                              disabled={totalSelected >= requiredQuantity}
                              onClick={e => handleIncrement(candidate.id, e)}
                              className="w-6 h-6 flex items-center justify-center rounded bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white transition-colors"
                              title="Tambah 1 kartu"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCandidateClick(candidate)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-colors"
                          >
                            + Pilih
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Confirm Button */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={!isComplete}
            onClick={handleConfirm}
            className={`flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg transition-all active:scale-95 cursor-pointer ${
              isComplete
                ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/50'
                : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
            }`}
          >
            <Check className="w-4 h-4" />
            {isComplete
              ? `Konfirmasi Pilihan (${requiredQuantity} Kartu)`
              : `Pilih ${remainingNeeded} Kartu Lagi untuk Konfirmasi`}
          </button>
        </div>
      </div>
    </div>
  );
};
