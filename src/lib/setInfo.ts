/**
 * setInfo.ts
 *
 * Provides helpers for Indonesian PTCG set metadata, including the official
 * card count used to build the "NNN/TTT" collection number display format.
 *
 * Data is sourced from:
 *  - src/config/setCardCounts.json  (TCGDex API data + custom entries)
 *
 * For sets without a known official count (e.g. upcoming SV10s / SV11s),
 * the official field is empty string (""), in which case formatCollectionNumber
 * returns just the padded local ID without a slash denominator.
 */

import setCardCountsData from "../config/setCardCounts.json";

export interface SetCardCountEntry {
  name: string;
  official: number | string; // number when known, "" when pending
  total: number | string;
}

const SET_CARD_COUNTS: Record<string, SetCardCountEntry> =
  setCardCountsData as Record<string, SetCardCountEntry>;

/**
 * Returns the official (base set) card count for a given Indonesian set ID.
 * Returns null when the count is unknown (upcoming sets).
 */
export function getOfficialCount(setId: string): number | null {
  const entry = SET_CARD_COUNTS[setId];
  if (!entry) return null;
  const v = entry.official;
  if (typeof v === "number" && v > 0) return v;
  return null;
}

/**
 * Formats a collection number in the official "NNN/TTT" style.
 *
 * Examples:
 *   formatCollectionNumber("098", "SV7s")  → "098/166"
 *   formatCollectionNumber("1",   "SV7s")  → "001/166"
 *   formatCollectionNumber("098", "SV10s") → "098"       (count unknown)
 *   formatCollectionNumber("",    "SV7s")  → ""          (no localId)
 *
 * For custom MA-series sets the localId already comes in the form "090/193"
 * (full collectionNumber), so we pass it through as-is.
 */
export function formatCollectionNumber(
  localId: string,
  setId: string
): string {
  if (!localId) return "";

  // MA-series custom cards already carry the full "NNN/TTT" string
  if (/^MA\d/.test(setId)) return localId;

  // Pad the numeric part to 3 digits
  const numericOnly = localId.replace(/\D/g, "");
  const padded = numericOnly.padStart(3, "0") || localId;

  const official = getOfficialCount(setId);
  if (official === null) return padded; // unknown count — show bare number

  return `${padded}/${official}`;
}

