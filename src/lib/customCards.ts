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

export interface CustomCardEntry {
  collectionNumber: string; // e.g. "090/123"
  name: string;             // Indonesian name (same as EN for Pokémon)
  series: string;           // e.g. "MA4"
  imageUrl: string;
}

// Friendly display names for each MA series
export const MA_SET_NAMES: Record<string, string> = {
  MA1: 'Master Battle Set 1 (MA1)',
  MA2: 'Master Battle Set 2 (MA2)',
  MA3: 'Master Battle Set 3 (MA3)',
  MA4: 'Master Battle Set 4 (MA4)',
  MA5: 'Master Battle Set 5 (MA5)',
};

// All custom cards merged, typed
const ALL_CUSTOM_CARDS: CustomCardEntry[] = [
  ...(MA1 as CustomCardEntry[]),
  ...(MA2 as CustomCardEntry[]),
  ...(MA3 as CustomCardEntry[]),
  ...(MA4 as CustomCardEntry[]),
  ...(MA5 as CustomCardEntry[]),
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
  matchScore: number,
  matchReason: string
): IndonesianCardCandidate {
  const localId = extractLocalId(entry.collectionNumber);
  return {
    id: `${entry.series}-${localId}`,
    localId,
    setId: entry.series,
    setName: MA_SET_NAMES[entry.series] ?? entry.series,
    name: entry.name,
    category: 'Pokemon',
    image: entry.imageUrl,
    // MA sets use their own regulation mark to bypass Standard H/I/J filtering
    regulationMark: 'MA',
    matchScore,
    matchReason,
  };
}

/**
 * Look up custom cards by EN Pokémon name (case-insensitive exact match).
 * For Pokémon cards, the EN name matches the Indonesian name
 * (e.g. "Meowth ex" EN → "Meowth ex" ID).
 * Returns candidates from ALL MA series that match.
 */
export function lookupCustomByEnName(enName: string): IndonesianCardCandidate[] {
  const lower = enName.trim().toLowerCase();
  return ALL_CUSTOM_CARDS
    .filter(e => e.name.trim().toLowerCase() === lower)
    .map(e =>
      toCandidate(
        e,
        95,
        `${MA_SET_NAMES[e.series] ?? e.series} #${extractLocalId(e.collectionNumber)}`
      )
    );
}
