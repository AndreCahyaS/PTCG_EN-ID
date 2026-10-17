/**
 * Custom Card Database
 *
 * Loads Indonesian card data from src/custom/MA*.json files for sets
 * that are not available in the TCGdex API (e.g. MA1–MA5 Master Battle Set series).
 *
 * Each custom JSON entry has the shape:
 *   { collectionNumber: "090/123", name: "Meowth ex", series: "MA4", imageUrl: "..." }
 *
 * EN set codes are always EN-specific (POR, TWM, etc.) and never match MA series codes.
 * Resolution is purely name-based: lookupCustomByEnName(name) returns all MA-series
 * prints whose Indonesian name matches the given EN Pokémon name.
 */

import { IndonesianCardCandidate } from '../types';

import MA1 from '../custom/MA1-cards.json';
import MA2 from '../custom/MA2-cards.json';
import MA3 from '../custom/MA3-cards.json';
import MA4 from '../custom/MA4-cards.json';
import MA5 from '../custom/MA5-cards.json';
import MA6 from '../custom/MA6-cards.json';
import MATL from '../custom/MATL-cards.json';
import MATS from '../custom/MATS-cards.json';
import MATH from '../custom/MATH-cards.json';
import MATK from '../custom/MATK-cards.json';

export interface CustomCardEntry {
  collectionNumber: string; // e.g. "090/123"
  name: string;             // Indonesian name (same as EN for Pokémon)
  series: string;           // e.g. "MA4"
  regulation?: string;      // e.g. "I", "J"
  imageUrl: string;
}

// Base series names for MA sets
export const MA_SERIES_BASE_NAMES: Record<string, string> = {
  MA1:  'Mega Evolusi',
  MA2:  'Kobaran Biru',
  MA3:  'Mega Impian',
  MA4:  'Ledakan Peniada',
  MA5:  'Ancaman Bayangan',
  MA6:  '30th Celebration',
  MATL: 'Deck Taktik Mega Charizard ex',
  MATS: 'Deck Taktik Mega Gardevoir ex',
  MATH: 'Deck Taktik Mega Sharpedo ex',
  MATK: 'Deck Taktik Mega Dragonite ex',
};

// Friendly display names for each MA series (fallback arrangement when regulation is missing/empty)
export const MA_SET_NAMES: Record<string, string> = {
  MA1:  'Mega Evolusi (MA1)',
  MA2:  'Kobaran Biru (MA2)',
  MA3:  'Mega Impian (MA3)',
  MA4:  'Ledakan Peniada (MA4)',
  MA5:  'Ancaman Bayangan (MA5)',
  MA6:  '30th Celebration (MA6)',
  MATL: 'Deck Taktik Mega Charizard ex (MATL)',
  MATS: 'Deck Taktik Mega Gardevoir ex (MATS)',
  MATH: 'Deck Taktik Mega Sharpedo ex (MATH)',
  MATK: 'Deck Taktik Mega Dragonite ex (MATK)',
};

/**
 * Returns formatted set name. If regulation attribute exists and is non-empty,
 * formats like the other available sets: "<Base Name> (Reg <Regulation>)" (e.g. "Ancaman Bayangan (Reg J)").
 * If regulation does not exist, or is empty/null, falls back to the current arrangement (e.g. "Mega Impian (MA3)").
 */
export function getCustomSetName(series: string, regulation?: string | null): string {
  const baseName = MA_SERIES_BASE_NAMES[series] ?? series;
  const reg = regulation?.trim();
  if (reg) {
    const regLabel = reg.startsWith('Reg ') ? reg : `Reg ${reg}`;
    return `${baseName} (${regLabel})`;
  }
  return MA_SET_NAMES[series] ?? `${baseName} (${series})`;
}

// All custom cards merged, typed
const ALL_CUSTOM_CARDS: CustomCardEntry[] = [
  ...(MA1  as CustomCardEntry[]),
  ...(MA2  as CustomCardEntry[]),
  ...(MA3  as CustomCardEntry[]),
  ...(MA4  as CustomCardEntry[]),
  ...(MA5  as CustomCardEntry[]),
  ...(MA6  as CustomCardEntry[]),
  ...(MATL as CustomCardEntry[]),
  ...(MATS as CustomCardEntry[]),
  ...(MATH as CustomCardEntry[]),
  ...(MATK as CustomCardEntry[]),
];

/**
 * Convert a raw collectionNumber like "090/123" to just the numeric part "090"
 * so it can be used as a localId in the candidate.
 */
function extractLocalId(collectionNumber: string): string {
  return collectionNumber.split('/')[0] ?? collectionNumber;
}

/**
 * Convert a CustomCardEntry to an IndonesianCardCandidate suitable for the converter.
 */
function toCandidate(
  entry: CustomCardEntry,
  matchScore: number
): IndonesianCardCandidate {
  const localId = extractLocalId(entry.collectionNumber);
  const setName = getCustomSetName(entry.series, entry.regulation);
  const regTrimmed = entry.regulation?.trim();
  return {
    id: `${entry.series}-${localId}`,
    localId,
    setId: entry.series,
    setName,
    name: entry.name,
    category: 'Pokemon',
    image: entry.imageUrl,
    // Use regulation from entry if present, otherwise fallback to 'MA'
    regulationMark: regTrimmed || 'MA',
    matchScore,
    matchReason: `${setName} #${localId}`,
  };
}

/**
 * Look up custom cards by EN Pokémon name or translated Indonesian names (case-insensitive exact match).
 * Returns candidates from ALL MA series that match.
 */
export function lookupCustomByEnName(enName: string, additionalNames: string[] = []): IndonesianCardCandidate[] {
  const names = new Set([
    enName.trim().toLowerCase(),
    ...additionalNames.map(n => n.trim().toLowerCase())
  ]);
  return ALL_CUSTOM_CARDS
    .filter(e => names.has(e.name.trim().toLowerCase()))
    .map(e => toCandidate(e, 95));
}
