import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MappedCard, PlayerTournamentInfo, DecklistSummary } from '../types';
import { Download, Printer, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatCollectionNumber } from '../lib/setInfo';

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
    try {
      // Helper to format table rows according to official Indonesian tournament rules
      const formatPokemonRows = (cards: MappedCard[]) => {
        const rows: any[] = [];
        cards.forEach(c => {
          if (c.selectedCandidates && c.selectedCandidates.length > 0) {
            c.selectedCandidates.forEach(sc => {
              const collNum = sc.candidate.setId && sc.candidate.localId
                ? formatCollectionNumber(sc.candidate.localId, sc.candidate.setId)
                : '-';
              rows.push([
                sc.quantity.toString(),
                sc.candidate.name || c.parsed.name,
                sc.candidate.setId || '-',
                collNum,
              ]);
            });
          } else {
            const collNum = c.selectedCandidate?.setId && c.selectedCandidate?.localId
              ? formatCollectionNumber(c.selectedCandidate.localId, c.selectedCandidate.setId)
              : '-';
            rows.push([
              c.parsed.quantity.toString(),
              c.selectedCandidate?.name || c.parsed.name,
              c.selectedCandidate?.setId || '-',
              collNum,
            ]);
          }
        });
        return rows;
      };

      const formatTrainerEnergyRows = (cards: MappedCard[]) => {
        return cards.map(c => [
          c.parsed.quantity.toString(),
          c.selectedCandidate?.name || c.parsed.name,
          '-', // RULE: Trainer and Energy do NOT need series code and collection number
          '-',
        ]);
      };

      const pokemonRows = formatPokemonRows(pokemonCards);
      const trainerRows = formatTrainerEnergyRows(trainerCards);
      const energyRows = formatTrainerEnergyRows(energyCards);

      // Build Combined Table Data
      const combinedData: any[] = [];
      
      // Add Pokemon Header Row
      combinedData.push([{
        content: `POKÉMON (${summary.pokemonCount} kartu)`,
        colSpan: 4,
        styles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' }
      }]);
      pokemonRows.forEach(r => combinedData.push(r));

      // Add Trainer Header Row
      combinedData.push([{
        content: `TRAINER (${summary.trainerCount} kartu)`,
        colSpan: 4,
        styles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' }
      }]);
      trainerRows.forEach(r => combinedData.push(r));

      // Add Energy Header Row
      combinedData.push([{
        content: `ENERGY (${summary.energyCount} kartu)`,
        colSpan: 4,
        styles: { fillColor: [234, 179, 8], textColor: [15, 23, 42], fontStyle: 'bold', halign: 'left' }
      }]);
      energyRows.forEach(r => combinedData.push(r));

      const renderDeckSheet = (targetDoc: jsPDF, fontSize: number, cellPadding: number) => {
        const pageWidth = targetDoc.internal.pageSize.getWidth();
        let currentY = 12;

        // Header Title
        targetDoc.setFont('helvetica', 'bold');
        targetDoc.setFontSize(15);
        targetDoc.setTextColor(220, 38, 38); // Pokemon Red
        targetDoc.text('POKÉMON TRADING CARD GAME', pageWidth / 2, currentY, { align: 'center' });

        currentY += 5.5;
        targetDoc.setFontSize(10);
        targetDoc.setTextColor(30, 41, 59);
        targetDoc.text('LEMBAR REGISTRASI DECK RESMI (INDONESIA)', pageWidth / 2, currentY, { align: 'center' });

        currentY += 5;
        targetDoc.setDrawColor(203, 213, 225);
        targetDoc.setLineWidth(0.3);
        targetDoc.line(14, currentY, pageWidth - 14, currentY);

        currentY += 5.5;

        // Player Information Grid (Only ID Pemain and Nama Panggilan)
        targetDoc.setFontSize(9);
        const leftCol = 14;
        const rightCol = 110;

        targetDoc.setFont('helvetica', 'bold');
        targetDoc.setTextColor(71, 85, 105);
        targetDoc.text('ID PEMAIN:', leftCol, currentY);
        targetDoc.setFont('helvetica', 'normal');
        targetDoc.setTextColor(15, 23, 42);
        targetDoc.text(playerInfo.playerID || '____________________', leftCol + 22, currentY);

        targetDoc.setFont('helvetica', 'bold');
        targetDoc.setTextColor(71, 85, 105);
        targetDoc.text('NAMA PANGGILAN:', rightCol, currentY);
        targetDoc.setFont('helvetica', 'normal');
        targetDoc.setTextColor(15, 23, 42);
        targetDoc.text(playerInfo.playerName || '____________________', rightCol + 35, currentY);

        currentY += 5.5;

        autoTable(targetDoc, {
          startY: currentY,
          head: [['JML', 'NAMA KARTU', 'SERI', 'NO. KOLEKSI']],
          body: combinedData,
          theme: 'grid',
          pageBreak: 'avoid',
          rowPageBreak: 'avoid',
          margin: { left: 14, right: 14, top: 10, bottom: 12 },
          styles: {
            fontSize: fontSize,
            cellPadding: cellPadding,
            textColor: [15, 23, 42],
            lineColor: [226, 232, 240],
            lineWidth: 0.2,
          },
          headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: fontSize,
          },
          columnStyles: {
            0: { cellWidth: 14, halign: 'center' },
            1: { cellWidth: 106, halign: 'left' },
            2: { cellWidth: 28, halign: 'center' },
            3: { cellWidth: 34, halign: 'center' },
          },
        });

        const tableFinalY = (targetDoc as any).lastAutoTable?.finalY || (currentY + 140);
        const footerY = Math.min(tableFinalY + 5.5, 289);

        // Deck Total Box
        targetDoc.setFont('helvetica', 'bold');
        targetDoc.setFontSize(9.5);
        targetDoc.setTextColor(
          summary.totalCards === 60 ? 22 : 220,
          summary.totalCards === 60 ? 101 : 38,
          summary.totalCards === 60 ? 52 : 38
        );
        targetDoc.text(`TOTAL KARTU: ${summary.totalCards} / 60`, 14, footerY);
      };

      // Base font size and padding calculation depending on deck row count to guarantee 1 page
      const totalTableRows = combinedData.length + 1;
      let baseFontSize = 8;
      let basePadding = 1.35;

      if (totalTableRows > 32) {
        baseFontSize = 7.5;
        basePadding = 1.0;
      }
      if (totalTableRows > 38) {
        baseFontSize = 7.0;
        basePadding = 0.8;
      }
      if (totalTableRows > 44) {
        baseFontSize = 6.4;
        basePadding = 0.6;
      }

      // Auto-fit loop: ensure strictly 1 single page on A4 paper
      let doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      let currentFontSize = baseFontSize;
      let currentPadding = basePadding;

      for (let attempt = 0; attempt < 5; attempt++) {
        const testDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        renderDeckSheet(testDoc, currentFontSize, currentPadding);

        if (testDoc.getNumberOfPages() === 1) {
          doc = testDoc;
          break;
        }

        currentFontSize = Math.max(5.5, currentFontSize - 0.4);
        currentPadding = Math.max(0.4, currentPadding - 0.15);
        doc = testDoc;
      }

      // Safety assurance: Ensure strictly 1 page in output
      while (doc.getNumberOfPages() > 1) {
        doc.deletePage(doc.getNumberOfPages());
      }

      // Clean sanitized filename
      const cleanId = (playerInfo.playerID || 'Player').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanNick = (playerInfo.playerName || 'PTCG').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Decklist_${cleanId}_${cleanNick}.pdf`;

      // Reliable browser download via Blob and explicit <a> click
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error('Gagal membuat PDF:', err);
      alert('Terjadi kesalahan saat memproses PDF. Silakan coba lagi.');
    }
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
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-rose-950/40 transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download Printable PDF (A4)
        </button>
      </div>

      {summary.confirmedPokemonCount < summary.totalPokemonTypes && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-3 text-xs text-amber-300 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Perhatian:</strong> Masih ada {summary.totalPokemonTypes - summary.confirmedPokemonCount} kartu Pokémon dengan garis kuning yang belum dikonfirmasi serinya. Disarankan untuk memverifikasi cetakan fisik agar sesuai dengan lembar registrasi turnamen.
          </span>
        </div>
      )}

      {/* Tournament Info Inputs: Only ID Pemain & Nama Panggilan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">ID Pemain (Player ID)</label>
          <input
            type="text"
            value={playerInfo.playerID}
            onChange={e => onUpdatePlayerInfo({ ...playerInfo, playerID: e.target.value })}
            placeholder="Contoh: 1234567"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Nama Panggilan (Nickname)</label>
          <input
            type="text"
            value={playerInfo.playerName}
            onChange={e => onUpdatePlayerInfo({ ...playerInfo, playerName: e.target.value })}
            placeholder="Contoh: Andre"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>
    </div>
  );
};

