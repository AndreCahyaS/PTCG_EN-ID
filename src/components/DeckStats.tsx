import React from 'react';
import { DecklistSummary } from '../types';
import { CheckCircle2, AlertCircle, ShieldCheck, Flame, Cpu, Zap } from 'lucide-react';

interface DeckStatsProps {
  summary: DecklistSummary;
}

export const DeckStats: React.FC<DeckStatsProps> = ({ summary }) => {
  const allConfirmed =
    summary.totalPokemonTypes > 0 &&
    summary.confirmedPokemonCount === summary.totalPokemonTypes;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
      {/* 60 Cards Total Card */}
      <div className={`p-4 rounded-xl border flex flex-col justify-between ${
        summary.isValidCount
          ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
          : 'bg-amber-950/20 border-amber-800/60 text-amber-300'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Total Kartu</span>
          {summary.isValidCount ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black">{summary.totalCards}</span>
          <span className="text-xs text-slate-400 font-medium ml-1">/ 60</span>
        </div>
        <p className="text-[10px] mt-1 font-medium">
          {summary.isValidCount ? 'Format Valid (Tepat 60)' : 'Harus tepat 60 kartu'}
        </p>
      </div>

      {/* Pokemon Count */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Pokémon</span>
          <Flame className="w-4 h-4 text-rose-500" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black text-white">{summary.pokemonCount}</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Kartu Petarung ({summary.totalPokemonTypes} jenis)</p>
      </div>

      {/* Trainer Count */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Trainer</span>
          <Cpu className="w-4 h-4 text-blue-500" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black text-white">{summary.trainerCount}</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Item, Supporter, Stadium</p>
      </div>

      {/* Energy Count */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Energy</span>
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black text-white">{summary.energyCount}</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Dasar & Khusus</p>
      </div>

      {/* Confirmed Pokémon Status */}
      <div className={`col-span-2 sm:col-span-4 lg:col-span-1 p-4 rounded-xl border flex flex-col justify-between transition-colors ${
        allConfirmed
          ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
          : 'bg-amber-950/20 border-amber-800/60 text-amber-300'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Konfirmasi Pokémon</span>
          {allConfirmed ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black">{summary.confirmedPokemonCount}</span>
          <span className="text-xs text-slate-400 font-medium ml-1">/ {summary.totalPokemonTypes}</span>
        </div>
        <p className="text-[10px] mt-1 font-medium">
          {summary.totalPokemonTypes === 0
            ? 'Tidak ada Pokémon'
            : allConfirmed
              ? '✓ Semua Pokémon Siap'
              : `${summary.totalPokemonTypes - summary.confirmedPokemonCount} kartu belum dikonfirmasi`}
        </p>
      </div>
    </div>
  );
};
