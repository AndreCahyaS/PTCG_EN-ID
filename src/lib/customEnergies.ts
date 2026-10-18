/**
 * Custom Basic Energies Database
 *
 * Provides official Indonesian basic energy card images sourced from MA6 (30th Celebration).
 */

import MA6 from '../custom/MA6-cards.json';

export interface BasicEnergyEntry {
  cardId?: string;
  name: string;
  series: string;
  collectionNumber: string;
  imageUrl: string;
  regulation?: string;
  type?: string;
}

// Map collection number (e.g. "FIR", "WAT") to MA6 energy entry
export const MA6_BASIC_ENERGY_BY_CODE: Record<string, BasicEnergyEntry> = {};

// Map lowercase names (with & without braces) to MA6 energy entry
export const MA6_BASIC_ENERGY_BY_NAME: Record<string, BasicEnergyEntry> = {};

// All basic energy entries from MA6
export const MA6_BASIC_ENERGIES: BasicEnergyEntry[] = [];

for (const raw of MA6 as any[]) {
  if (
    raw.series === 'MA6' &&
    ((raw.type || '').toLowerCase() === 'energi dasar' ||
      raw.name?.startsWith('Energi Dasar'))
  ) {
    const entry: BasicEnergyEntry = {
      cardId: raw.cardId,
      name: raw.name,
      series: raw.series,
      collectionNumber: raw.collectionNumber,
      imageUrl: raw.imageUrl,
      regulation: raw.regulation,
      type: raw.type,
    };

    MA6_BASIC_ENERGIES.push(entry);

    if (raw.collectionNumber) {
      MA6_BASIC_ENERGY_BY_CODE[raw.collectionNumber.toUpperCase()] = entry;
    }

    if (raw.name) {
      // Direct raw lowercase, e.g. "energi dasar {api}"
      MA6_BASIC_ENERGY_BY_NAME[raw.name.toLowerCase().trim()] = entry;
      // Stripped braces lowercase, e.g. "energi dasar api"
      const cleanName = raw.name.replace(/[{}]/g, '').toLowerCase().trim();
      MA6_BASIC_ENERGY_BY_NAME[cleanName] = entry;
    }
  }
}

/**
 * Returns the MA6 basic energy card image URL given an energy card's raw or translated name.
 *
 * Supports:
 * - Decklist English names: "Basic Fire Energy", "Basic {R} Energy", "Fire Energy", "Psychic Energy"
 * - Decklist Indonesian names: "Energi Dasar Api", "Energi Dasar {Api}", "Energi Dasar Psychic"
 * - Collection codes: "FIR", "WAT", "GRA", "LIG", "PSY", "FIG", "DAR", "MET"
 * - Single letter codes / symbols: "{R}", "{W}", "{G}", "{L}", "{P}", "{F}", "{D}", "{M}"
 */
export function getBasicEnergyImageUrl(rawName: string, resolvedName?: string): string | undefined {
  const candidates = [rawName, resolvedName].filter(Boolean) as string[];

  // 1. Direct name lookup
  for (const name of candidates) {
    const trimmed = name.trim();
    const lower = trimmed.toLowerCase();
    if (MA6_BASIC_ENERGY_BY_NAME[lower]?.imageUrl) {
      return MA6_BASIC_ENERGY_BY_NAME[lower].imageUrl;
    }

    const cleanLower = lower.replace(/[{}]/g, '').trim();
    if (MA6_BASIC_ENERGY_BY_NAME[cleanLower]?.imageUrl) {
      return MA6_BASIC_ENERGY_BY_NAME[cleanLower].imageUrl;
    }

    // Direct collection code lookup (e.g. "FIR", "WAT")
    const upper = trimmed.toUpperCase();
    if (MA6_BASIC_ENERGY_BY_CODE[upper]?.imageUrl) {
      return MA6_BASIC_ENERGY_BY_CODE[upper].imageUrl;
    }
  }

  // 2. Keyword & type symbol matching
  const combined = candidates.join(' ').toLowerCase();

  // Fire / Api / {R}
  if (/\{r\}/i.test(combined) || /\b(fire|api)\b/i.test(combined)) {
    return MA6_BASIC_ENERGY_BY_CODE['FIR']?.imageUrl;
  }
  // Water / Air / {W}
  if (/\{w\}/i.test(combined) || /\b(water|air)\b/i.test(combined)) {
    return MA6_BASIC_ENERGY_BY_CODE['WAT']?.imageUrl;
  }
  // Grass / Daun / {G}
  if (/\{g\}/i.test(combined) || /\b(grass|daun)\b/i.test(combined)) {
    return MA6_BASIC_ENERGY_BY_CODE['GRA']?.imageUrl;
  }
  // Lightning / Listrik / {L}
  if (/\{l\}/i.test(combined) || /\b(lightning|listrik)\b/i.test(combined)) {
    return MA6_BASIC_ENERGY_BY_CODE['LIG']?.imageUrl;
  }
  // Psychic / {P}
  if (/\{p\}/i.test(combined) || /\b(psychic)\b/i.test(combined)) {
    return MA6_BASIC_ENERGY_BY_CODE['PSY']?.imageUrl;
  }
  // Fighting / Petarung / {F}
  if (/\{f\}/i.test(combined) || /\b(fight|fighting|petarung)\b/i.test(combined)) {
    return MA6_BASIC_ENERGY_BY_CODE['FIG']?.imageUrl;
  }
  // Darkness / Kegelapan / {D}
  if (/\{d\}/i.test(combined) || /\b(dark|darkness|kegelapan)\b/i.test(combined)) {
    return MA6_BASIC_ENERGY_BY_CODE['DAR']?.imageUrl;
  }
  // Metal / Logam / {M}
  if (/\{m\}/i.test(combined) || /\b(metal|logam)\b/i.test(combined)) {
    return MA6_BASIC_ENERGY_BY_CODE['MET']?.imageUrl;
  }

  return undefined;
}
