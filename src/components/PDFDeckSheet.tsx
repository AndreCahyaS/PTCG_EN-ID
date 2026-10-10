import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MappedCard, PlayerTournamentInfo, DecklistSummary } from '../types';
import { Download, Printer, FileText, CheckCircle2 } from 'lucide-react';

interface PDFDeckSheetProps {
  mappedCards: MappedCard[];
  summary: DecklistSummary;
  playerInfo: PlayerTournamentInfo;
  onUpdatePlayerInfo: (info: PlayerTournamentInfo) => void;
}

export const PDFDeckSheet: React.FC<PDFDeckSheetProps> = ({
  mappedCards,
  summary,
  playerInfo,
  onUpdatePlayerInfo,
}) => {
  const pokemonCards = mappedCards.filter(c => c.parsed.category === 'Pokemon');
  const trainerCards = mappedCards.filter(c => c.parsed.category === 'Trainer');
  const energyCards = mappedCards.filter(c => c.parsed.category === 'Energy');

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 14;

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(220, 38, 38); // Pokemon Red
    doc.text('POKÉMON TRADING CARD GAME', pageWidth / 2, currentY, { align: 'center' });

    currentY += 6;
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('LEMBAR REGISTRASI DECK RESMI (INDONESIA)', pageWidth / 2, currentY, { align: 'center' });

    currentY += 8;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, currentY, pageWidth - 14, currentY);

    currentY += 5;

    // Player Information Grid
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);

    const leftCol = 14;
    const midCol = 80;
    const rightCol = 145;

    doc.text(`NAMA PEMAIN:`, leftCol, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(playerInfo.playerName || '____________________', leftCol + 26, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`ID PEMAIN:`, midCol, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(playerInfo.playerID || '________________', midCol + 20, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`DIVISI:`, rightCol, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(playerInfo.division || 'Master', rightCol + 15, currentY);

    currentY += 6;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`NAMA DECK:`, leftCol, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(playerInfo.deckName || '____________________', leftCol + 26, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`TAHUN LAHIR:`, midCol, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(playerInfo.birthYear || '____', midCol + 26, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`TANGGAL:`, rightCol, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(playerInfo.date || new Date().toLocaleDateString('id-ID'), rightCol + 18, currentY);

    currentY += 8;

    // Helper to format table rows according to official Indonesian tournament rules
    const formatPokemonRows = (cards: MappedCard[]) => {
      return cards.map(c => [
        c.parsed.quantity.toString(),
        c.selectedCandidate?.name || c.parsed.name,
        c.selectedCandidate?.setId && c.selectedCandidate?.localId ? `${c.selectedCandidate.setId} ${c.selectedCandidate.localId}` : '-',
        c.parsed.name,
      ]);
    };

    const formatTrainerEnergyRows = (cards: MappedCard[]) => {
      return cards.map(c => [
        c.parsed.quantity.toString(),
        c.selectedCandidate?.name || c.parsed.name,
        '-', // RULE: Trainer and Energy do NOT need series code and collection number
        c.parsed.name,
      ]);
    };

    const pokemonRows = formatPokemonRows(pokemonCards);
    const trainerRows = formatTrainerEnergyRows(trainerCards);
    const energyRows = formatTrainerEnergyRows(energyCards);

    // Build Combined Table Data
    const combinedData: any[] = [];
    
    // Add Pokemon Header Row
    combinedData.push([{ content: `POKÉMON (${summary.pokemonCount} kartu)`, colSpan: 4, styles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold' } }]);
    pokemonRows.forEach(r => combinedData.push(r));

    // Add Trainer Header Row
    combinedData.push([{ content: `TRAINER (${summary.trainerCount} kartu)`, colSpan: 4, styles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' } }]);
    trainerRows.forEach(r => combinedData.push(r));

    // Add Energy Header Row
    combinedData.push([{ content: `ENERGY (${summary.energyCount} kartu)`, colSpan: 4, styles: { fillColor: [234, 179, 8], textColor: [15, 23, 42], fontStyle: 'bold' } }]);
    energyRows.forEach(r => combinedData.push(r));

    autoTable(doc, {
      startY: currentY,
      head: [['JML', 'NAMA KARTU (INDONESIA)', 'KODE & NO. SET ID', 'ASAL KARTU (EN)']],
      body: combinedData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 1.5,
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 45 },
        3: { cellWidth: 55 },
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;

    // Deck Total Validation Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(summary.totalCards === 60 ? 22 : 220, summary.totalCards === 60 ? 101 : 38, summary.totalCards === 60 ? 52 : 38);
    doc.text(`TOTAL KARTU: ${summary.totalCards} / 60 ${summary.totalCards === 60 ? '✔ (LENGKAP & VALID)' : '⚠ (HARUS TEPAT 60 KARTU)'}`, 14, finalY);

    // Signatures
    const sigY = finalY + 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    doc.text('Tanda Tangan Pemain: _______________________', 14, sigY);
    doc.text('Pemeriksa Turnamen / Judge: _______________________', 110, sigY);

    doc.save(`${playerInfo.playerName || 'PTCG'}_Decklist_${playerInfo.deckName || 'Deck'}.pdf`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-500" />
            Official Tournament Deck Sheet (A4 PDF)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Format resmi sesuai standar lembar turnamen Pokémon TCG Indonesia
          </p>
        </div>

        <button
          onClick={generatePDF}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-rose-950/40 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          Download Printable PDF (A4)
        </button>
      </div>

      {/* Tournament Info Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Nama Pemain (Player Name)</label>
          <input
            type="text"
            value={playerInfo.playerName}
            onChange={e => onUpdatePlayerInfo({ ...playerInfo, playerName: e.target.value })}
            placeholder="Contoh: Budi Santoso"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">ID Pemain (Player POP ID)</label>
          <input
            type="text"
            value={playerInfo.playerID}
            onChange={e => onUpdatePlayerInfo({ ...playerInfo, playerID: e.target.value })}
            placeholder="Contoh: 1234567"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Nama Deck (Deck Archetype)</label>
          <input
            type="text"
            value={playerInfo.deckName}
            onChange={e => onUpdatePlayerInfo({ ...playerInfo, deckName: e.target.value })}
            placeholder="Contoh: Charizard ex / Pidgeot"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Divisi (Tournament Division)</label>
          <select
            value={playerInfo.division}
            onChange={e => onUpdatePlayerInfo({ ...playerInfo, division: e.target.value as any })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="Master">Master</option>
            <option value="Senior">Senior</option>
            <option value="Junior">Junior</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Tahun Lahir (Birth Year)</label>
          <input
            type="text"
            value={playerInfo.birthYear}
            onChange={e => onUpdatePlayerInfo({ ...playerInfo, birthYear: e.target.value })}
            placeholder="Contoh: 2002"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Tanggal (Date)</label>
          <input
            type="text"
            value={playerInfo.date}
            onChange={e => onUpdatePlayerInfo({ ...playerInfo, date: e.target.value })}
            placeholder="DD/MM/YYYY"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>
    </div>
  );
};
