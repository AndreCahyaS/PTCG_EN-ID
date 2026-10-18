/**
 * Custom Card Database
 *
 * Scans and indexes all card datasets in src/custom/*.json (75 sets, 3800+ cards).
 * Provides instantaneous, 100% offline card and image lookups directly from official
 * Indonesian card assets (https://asia.pokemon-card.com/id/card-img/...).
 */

import { IndonesianCardCandidate } from '../types';
import setMappingData from '../config/setMapping.json';

export interface CustomCardRaw {
  cardId?: string;
  name?: string;
  series?: string;
  type?: string;
  regulation?: string;
  collectionNumber?: string;
  imageUrl?: string;
}

export interface CustomCardEntry {
  cardId?: string;
  name: string;
  series: string;
  type?: string;
  regulation?: string;
  collectionNumber: string;
  localId: string;
  numericId: string;
  imageUrl: string;
  normName: string;
  recencyScore: number;
  isSecretRare?: boolean;
}

// Comprehensive mapping of Indonesian set series codes to friendly names
export const ALL_SET_NAMES: Record<string, string> = {
  // Scarlet & Violet Main Expansions
  SV1S: 'Scarlet ex',
  SV1V: 'Violet ex',
  SV1a: 'Hantaman Triplet',
  SV2D: 'Letusan Tanah',
  SV2P: 'Mara Bahaya Salju',
  SV2a: 'Kartu Pokemon 151',
  SV3s: 'Kilau Hitam',
  SV4s: 'Pertemuan Paradoks',
  SV4a: 'Harta Berkilau ex',
  SV5s: 'Paradoks Andalan',
  SV6s: 'Topeng Transfigurasi',
  SV7s: 'Bimbingan Rasi',
  SV8s: 'Kilat Rasi',
  SV8a: 'Festival Terastal ex',
  SV9s: 'Ikatan Takdir',
  SV10s: 'Kehadiran Juara',
  SV11s: 'Hitam Putih',

  // Master Battle Set Series
  MA1: 'Mega Evolusi',
  MA2: 'Kobaran Biru',
  MA3: 'Mega Impian',
  MA4: 'Ledakan Peniada',
  MA5: 'Ancaman Bayangan',
  MA6: '30th Celebration',
  MATL: 'Deck Taktik Mega Charizard ex',
  MATS: 'Deck Taktik Mega Gardevoir ex',
  MATH: 'Deck Taktik Mega Sharpedo ex',
  MATK: 'Deck Taktik Mega Dragonite ex',

  // Starter Decks & Special Sets
  SVAL: 'Sprigatito & Lucario ex',
  SVAM: 'Fuecoco & Ampharos ex',
  SVAW: 'Quaxly & Mimikyu ex',
  SVDs: 'Deck Ringkas ex',
  SVHK: 'Koraidon ex Purba',
  SVHM: 'Miraidon ex Futur',
  SVI: 'Deck Starter SVI',
  SVK: 'Deck Starter SVK',
  SVM: 'Deck Starter SVM',
  SVTG: 'Deck Taktik Garchomp',
  SVTH: 'Deck Taktik Houndstone',
  SVTL: 'Deck Taktik Lucario',
  SVTM: 'Deck Taktik Mabosstiff',
  SVTR: 'Deck Taktik Revavroom',
  SVTS: 'Deck Taktik Scizor',

  // Promos
  'SV-P': 'Kartu Promo Scarlet & Violet',
  'M-P': 'Kartu Promo Mega',
  'S-P': 'Kartu Promo Pedang & Perisai',

  // Sword & Shield Reprints
  S10b: 'Pokemon GO',
  S11a: 'Arkana Memuncak',
  S12a: 'VSTAR Semesta',
  S5R: 'Master Serangan Beruntun',
  S7R: 'Arus Langit Biru',
  S8a: 'Koleksi Perayaan 25 Tahun',
  S8b: 'VMAX Klimaks',
  S9: 'Star Birth',
  SC1a: 'Pedang & Perisai SET A',
  SC1b: 'Pedang & Perisai SET B',
  SC1D: 'Pedang & Perisai',
  SC3a: 'Koleksi VMAX Berkilau A',
  SCA: 'V Starter Deck Teman',
  SCB: 'Tantangan',
  SCC: 'Evolusi',
  SCD: 'V Starter Deck Kekuatan',
  SCE: 'Kebangkitan',
  SCF: 'Transformasi',
  AC3a: 'Koleksi Tag Team A',
  AC3b: 'Koleksi Tag Team B',
  AC3D: 'Deck Tag Team',
  AS1a: 'Bayangan Ganda A',
  AS1b: 'Bayangan Ganda B',
  AS1D: 'First Challenge Starter',
  AS2b: 'Kebangkitan Legenda B',
  AS2D: 'GX Starter Deck',
  AS3a: 'Penguasa Langit A',
  AS3b: 'Penguasa Langit B',
  AS3D: 'GX Starter Deck Tag Team',
  AS4D: 'GX Starter Deck Perdana',
};

// Backwards compatibility alias
export const MA_SERIES_BASE_NAMES = ALL_SET_NAMES;
export const MA_SET_NAMES = ALL_SET_NAMES;

/**
 * Returns a friendly, formatted set name with regulation mark if available.
 * e.g. "Topeng Transfigurasi (Reg H)" or "Mega Impian (Reg J)".
 */
export function getCustomSetName(series: string, regulation?: string | null): string {
  const baseName = ALL_SET_NAMES[series] || series;
  const reg = regulation?.trim();
  if (reg) {
    const regLabel = reg.startsWith('Reg ') ? reg : `Reg ${reg}`;
    return `${baseName} (${regLabel})`;
  }
  return `${baseName} (${series})`;
}

/**
 * Normalizes Pokemon name for matching:
 * - Unescapes HTML entities (&lt; &gt; &amp;)
 * - Strips diacritics, invisible zero-width chars, quotes
 * - Converts to lower-case alphanumeric words
 */
export function normalizePokemonName(s: string): string {
  return (s || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2018\u2019\u02BC\uFF07]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes recency score for sorting. Higher score = newer card.
 */
function getRecencyScore(card: CustomCardRaw): number {
  const cid = parseInt(card.cardId || '0', 10);
  if (!isNaN(cid) && cid > 0) {
    return cid;
  }
  const s = card.series || '';
  if (s === 'MA6') return 19600;
  if (s === 'MA5') return 19500;
  if (s === 'MA4') return 19400;
  if (s === 'MA3') return 19300;
  if (s === 'MA2') return 19200;
  if (s === 'MA1') return 19100;
  if (s.startsWith('MAT')) return 19000;
  return 0;
}

export function extractLocalId(collectionNumber: string): string {
  if (!collectionNumber) return '';
  return collectionNumber.split('/')[0] || collectionNumber;
}

export function extractNumericId(collectionNumber: string): string {
  if (!collectionNumber) return '';
  const first = collectionNumber.split('/')[0] || collectionNumber;
  return first.replace(/\D/g, '');
}

// Load all custom card datasets eagerly via Vite
const customFiles = import.meta.glob<CustomCardRaw[]>('../custom/*.json', { eager: true });

export const ALL_CUSTOM_CARDS: CustomCardEntry[] = [];
export const ALL_CUSTOM_POKEMON: CustomCardEntry[] = [];
const POKEMON_BY_NORM_NAME = new Map<string, CustomCardEntry[]>();

for (const [filePath, moduleContent] of Object.entries(customFiles)) {
  const rawList: CustomCardRaw[] = Array.isArray(moduleContent)
    ? moduleContent
    : (moduleContent as any)?.default || [];

  const fileSeriesFallback = filePath.split('/').pop()?.replace('-cards.json', '') || '';

  for (const card of rawList) {
    if (!card || !card.name) continue;
    if (!card.imageUrl || !card.imageUrl.trim()) continue;

    const series = card.series || fileSeriesFallback;
    const collNum = card.collectionNumber || '';
    const localId = extractLocalId(collNum);
    const numericId = extractNumericId(collNum);
    const norm = normalizePokemonName(card.name);
    const recency = getRecencyScore({ ...card, series });

    const denomMatch = collNum.match(/\/(\d+)/);
    const denom = denomMatch ? parseInt(denomMatch[1], 10) : 0;
    const numVal = parseInt(numericId, 10);
    const isSecretRare = denom > 0 && numVal > denom;

    const entry: CustomCardEntry = {
      cardId: card.cardId,
      name: card.name.replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
      series,
      type: card.type,
      regulation: card.regulation,
      collectionNumber: collNum,
      localId: collNum || localId,
      numericId,
      imageUrl: card.imageUrl,
      normName: norm,
      recencyScore: recency,
      isSecretRare,
    };

    ALL_CUSTOM_CARDS.push(entry);

    const t = (card.type || '').toLowerCase();
    const isPokemon = (t === 'pokemon' || !t || t === '') && !t.startsWith('energi');
    if (isPokemon) {
      ALL_CUSTOM_POKEMON.push(entry);

      if (!POKEMON_BY_NORM_NAME.has(norm)) {
        POKEMON_BY_NORM_NAME.set(norm, []);
      }
      POKEMON_BY_NORM_NAME.get(norm)!.push(entry);
    }
  }
}

// Sort each pokemon list in descending order of recency
for (const list of POKEMON_BY_NORM_NAME.values()) {
  list.sort((a, b) => b.recencyScore - a.recencyScore);
}
ALL_CUSTOM_POKEMON.sort((a, b) => b.recencyScore - a.recencyScore);

// Re-export custom energies for convenience
export * from './customEnergies';

/**
 * Finds all Indonesian prints of a Pokemon matching the given name and decklist set/number info.
 * Scores matches so the target set and collection number are chosen first, while making all
 * alternate prints available as candidates.
 */
export function lookupCustomPokemon(
  enName: string,
  expectedExactNames: string[] = [],
  preferredSetCode?: string,
  preferredCardNumber?: string
): IndonesianCardCandidate[] {
  const normSearchNames = new Set([
    normalizePokemonName(enName),
    ...expectedExactNames.map(normalizePokemonName),
  ]);

  const setConfig = (setMappingData as any).setCodes || {};
  const targetSets: string[] = (preferredSetCode && setConfig[preferredSetCode]?.targetIdSets) || [];
  const prefNum = preferredCardNumber ? parseInt(preferredCardNumber.replace(/\D/g, ''), 10) : null;
  const inputHasEx = /\bex\b/i.test(enName);

  const matchedEntries: CustomCardEntry[] = [];
  const seenIds = new Set<string>();

  for (const name of normSearchNames) {
    if (!name) continue;
    const entries = POKEMON_BY_NORM_NAME.get(name);
    if (entries) {
      for (const e of entries) {
        const idKey = `${e.series}-${e.collectionNumber || e.localId}`;
        if (!seenIds.has(idKey)) {
          seenIds.add(idKey);
          matchedEntries.push(e);
        }
      }
    }
  }

  // Fallback suffix match (e.g. "ex" stripped or added)
  if (matchedEntries.length === 0) {
    for (const name of normSearchNames) {
      if (!name) continue;
      for (const [normKey, entries] of POKEMON_BY_NORM_NAME.entries()) {
        if (normKey === name || normKey === `${name} ex` || `${normKey} ex` === name) {
          for (const e of entries) {
            const idKey = `${e.series}-${e.collectionNumber || e.localId}`;
            if (!seenIds.has(idKey)) {
              seenIds.add(idKey);
              matchedEntries.push(e);
            }
          }
        }
      }
    }
  }

  if (matchedEntries.length === 0) {
    return [];
  }

  const candidates: IndonesianCardCandidate[] = matchedEntries.map(e => {
    let score = 90;
    const isTargetSet = targetSets.includes(e.series);
    const cardNum = parseInt(e.numericId, 10);
    const isSameNum = prefNum !== null && !isNaN(cardNum) && cardNum === prefNum;

    if (isTargetSet && isSameNum) {
      score = 100;
    } else if (isSameNum) {
      score = 97;
    } else if (isTargetSet) {
      score = 96;
    }

    const matchHasEx = /\bex\b/i.test(e.name);
    if (inputHasEx === matchHasEx) {
      score += 2;
    }

    if (e.isSecretRare && score > 90) {
      score -= 2;
    }

    const setName = getCustomSetName(e.series, e.regulation);
    return {
      id: `${e.series}-${e.localId}`,
      localId: e.localId,
      setId: e.series,
      setName,
      name: e.name,
      category: 'Pokemon',
      image: e.imageUrl,
      regulationMark: e.regulation?.trim() || 'H',
      matchScore: Math.min(score, 100),
      matchReason: `${setName} #${e.collectionNumber || e.localId}`,
    };
  });

  candidates.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    const aRecency = (matchedEntries.find(m => `${m.series}-${m.localId}` === a.id)?.recencyScore || 0);
    const bRecency = (matchedEntries.find(m => `${m.series}-${m.localId}` === b.id)?.recencyScore || 0);
    return bRecency - aRecency;
  });

  return candidates;
}

/**
 * Backwards-compatible lookup helper for older code.
 */
export function lookupCustomByEnName(enName: string, additionalNames: string[] = []): IndonesianCardCandidate[] {
  return lookupCustomPokemon(enName, additionalNames);
}

/**
 * Searches local Pokemon database directly by query string (substring match).
 * Instant, offline search for CandidateDrawer.
 */
export function searchCustomPokemonDirectly(query: string): IndonesianCardCandidate[] {
  const normQuery = normalizePokemonName(query);
  if (!normQuery || normQuery.length < 2) return [];

  const results: IndonesianCardCandidate[] = [];
  const seen = new Set<string>();

  for (const card of ALL_CUSTOM_POKEMON) {
    if (card.normName.includes(normQuery)) {
      const idKey = `${card.series}-${card.localId}`;
      if (!seen.has(idKey)) {
        seen.add(idKey);
        const setName = getCustomSetName(card.series, card.regulation);
        results.push({
          id: idKey,
          localId: card.localId,
          setId: card.series,
          setName,
          name: card.name,
          category: 'Pokemon',
          image: card.imageUrl,
          regulationMark: card.regulation?.trim() || 'H',
          matchScore: card.normName === normQuery ? 100 : (card.normName.startsWith(normQuery) ? 95 : 90),
          matchReason: `Pencarian Lokal: "${query}"`,
        });
      }
    }
  }

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
}

/**
 * Helper to find a card entry by series and local numeric id.
 */
export function findCustomCard(series: string, localId: string): CustomCardEntry | undefined {
  const cleanSet = series.trim().toLowerCase();
  const cleanNum = localId.trim().replace(/\D/g, '');
  return ALL_CUSTOM_CARDS.find(
    c => c.series.toLowerCase() === cleanSet && c.numericId === cleanNum
  );
}
