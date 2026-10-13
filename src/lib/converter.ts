import { ParsedCard, MappedCard, IndonesianCardCandidate, MappingStatus, CardCategory } from '../types';
import setMappingData from '../config/setMapping.json';
import { getCachedItem, setCachedItem, getCachedCandidates, setCachedCandidates } from './cache';
import { lookupCustomByEnName } from './customCards';

interface SetMappingConfig {
  setCodes: Record<string, { tcgdexEn: string; name: string; targetIdSets: string[] }>;
  trainerTranslations: Record<string, string>;
  energyTranslations: Record<string, string>;
  quickOverrides: Array<{
    enKey: string;
    idSet: string;
    idLocalId: string;
    nameId: string;
    setName: string;
    regMark?: string;
    image?: string;
  }>;
}

const config = setMappingData as SetMappingConfig;

/**
 * Normalize apostrophes/quotes so lookup works regardless of curly vs straight quotes
 */
function normalizeApostrophe(s: string): string {
  return s.replace(/[\u2018\u2019\u02BC\uFF07]/g, "'").trim();
}

/**
 * Look up a trainer translation with apostrophe-normalized key
 */
function lookupTrainer(name: string): string {
  const normalized = normalizeApostrophe(name);
  // Direct match first
  if (config.trainerTranslations[normalized]) return config.trainerTranslations[normalized];
  // Try original as-is
  if (config.trainerTranslations[name]) return config.trainerTranslations[name];
  // Case-insensitive fallback
  const lowerNorm = normalized.toLowerCase();
  const found = Object.entries(config.trainerTranslations).find(
    ([k]) => normalizeApostrophe(k).toLowerCase() === lowerNorm
  );
  return found ? found[1] : normalized;
}

// Legal Standard Sets for Regulations H, I, J (G regulation is finished!)
export const LEGAL_H_I_J_SETS = new Set([
  'SV5s',  // Paradoks Andalan (Reg H)
  'SV6s',  // Topeng Transfigurasi (Reg H)
  'SV7s',  // Bimbingan Rasi (Reg H)
  'SV8s',  // Kilat Rasi (Reg H)
  'SV8a',  // Festival Terastal ex (Reg H)
  'SV9s',  // Ikatan Takdir (Reg I)
  'SV10s', // Future (Reg I / J)
  'SVHM',  // Miraidon ex Futur
  'SVHK',  // Koraidon ex Purba
  'SVAM',  // Fuecoco & Ampharos ex
  'SVAW',  // Quaxly & Mimikyu ex
  'SVAL',  // Sprigatito & Lucario ex
  'SV-P',  // Promo cards
]);

export const LEGAL_REGULATION_MARKS = new Set(['H', 'I', 'J']);

// Set name lookup
const SET_NAMES: Record<string, string> = {
  'SV5s': 'Paradoks Andalan (Reg H)',
  'SV6s': 'Topeng Transfigurasi (Reg H)',
  'SV7s': 'Bimbingan Rasi (Reg H)',
  'SV8s': 'Kilat Rasi (Reg H)',
  'SV8a': 'Festival Terastal ex (Reg H)',
  'SV9s': 'Ikatan Takdir (Reg I)',
  'SV10s': 'Destined Rivals (Reg I/J)',
  'SVHM': 'Miraidon Futur Deck',
  'SVHK': 'Koraidon Purba Deck',
  'SVAM': 'Fuecoco & Ampharos',
  'SVAW': 'Quaxly & Mimikyu',
  'SVAL': 'Sprigatito & Lucario',
  'SV-P': 'Kartu Promo',
};

// Owner translations: Trainer names used in owner Pokémon
const OWNER_TRANSLATIONS: Record<string, string> = {
  'Iono': 'Mistika',
  'N': 'N',
  'Lillie': 'Lillie',
  'Hop': 'Hop',
  'Cynthia': 'Shirona',
  'Ethan': 'Hibiki',
  'Steven': 'Steven',
  'Marnie': 'Marnie',
  'Red': 'Red',
};

/**
 * Resolves standard Indonesian energy names reliably
 */
export function resolveEnergyName(rawName: string): string {
  const clean = rawName.trim();
  if (config.energyTranslations[clean]) return config.energyTranslations[clean];

  if (/fire/i.test(clean) || /\{r\}/i.test(clean)) return 'Energi Dasar Api';
  if (/psychic/i.test(clean) || /\{p\}/i.test(clean)) return 'Energi Dasar Psychic';
  if (/dark/i.test(clean) || /\{d\}/i.test(clean)) return 'Energi Dasar Kegelapan';
  if (/grass/i.test(clean) || /\{g\}/i.test(clean)) return 'Energi Dasar Daun';
  if (/water/i.test(clean) || /\{w\}/i.test(clean)) return 'Energi Dasar Air';
  if (/lightning/i.test(clean) || /\{l\}/i.test(clean)) return 'Energi Dasar Listrik';
  if (/fight/i.test(clean) || /\{f\}/i.test(clean)) return 'Energi Dasar Petarung';
  if (/metal/i.test(clean) || /\{m\}/i.test(clean)) return 'Energi Dasar Logam';

  return clean;
}

/**
 * Transforms English card names to potential Indonesian search terms
 * Exact Pokémon rule:
 * - Normal Pokémon: Exact matching target
 * - Trainer's Pokémon: "[Trainer]'s [Pokemon]" -> "[Pokemon] [TrainerId]" (e.g. Iono's Bellibolt -> Bellibolt Mistika)
 */
export function transformSearchNames(rawName: string, category: CardCategory): { primaryQueries: string[]; expectedExactNames: string[] } {
  const cleanName = rawName.trim();

  // 1. Trainer Cards
  if (category === 'Trainer') {
    const idName = config.trainerTranslations[cleanName] || cleanName;
    return {
      primaryQueries: [idName, cleanName],
      expectedExactNames: [idName.toLowerCase(), cleanName.toLowerCase()]
    };
  }

  // 2. Energy Cards
  if (category === 'Energy') {
    const idEnergy = resolveEnergyName(cleanName);
    return {
      primaryQueries: [idEnergy],
      expectedExactNames: [idEnergy.toLowerCase()]
    };
  }

  // 3. Pokémon Cards
  // Check for Trainer's Pokémon (e.g., "Iono's Bellibolt", "N's Zoroark ex", "Lillie's Clefairy")
  const ownerMatch = cleanName.match(/^([A-Za-z]+)'s\s+(.+)$/i);
  if (ownerMatch) {
    const ownerEn = ownerMatch[1];
    const pokemonPart = ownerMatch[2].trim(); // e.g. "Bellibolt" or "Zoroark ex"
    const ownerId = OWNER_TRANSLATIONS[ownerEn] || ownerEn;

    const suffixMatch = pokemonPart.match(/\s+(ex|v|vstar|vmax)$/i);
    const suffix = suffixMatch ? suffixMatch[0].trim() : '';
    const basePokemon = pokemonPart.replace(/\s+(ex|v|vstar|vmax)$/i, '').trim();

    const expectedNames: string[] = [];
    if (suffix) {
      expectedNames.push(`${basePokemon} ${ownerId} ${suffix}`.toLowerCase());
      expectedNames.push(`${basePokemon} <${ownerId}> ${suffix}`.toLowerCase());
      expectedNames.push(`${basePokemon} ${ownerEn} ${suffix}`.toLowerCase());
      expectedNames.push(`${basePokemon} <${ownerEn}> ${suffix}`.toLowerCase());
    } else {
      expectedNames.push(`${pokemonPart} ${ownerId}`.toLowerCase());
      expectedNames.push(`${pokemonPart} <${ownerId}>`.toLowerCase());
      expectedNames.push(`${pokemonPart} ${ownerEn}`.toLowerCase());
      expectedNames.push(`${pokemonPart} <${ownerEn}>`.toLowerCase());
    }

    return {
      primaryQueries: [basePokemon, pokemonPart],
      expectedExactNames: expectedNames
    };
  }

  // Normal Pokémon: MUST BE EXACT SAME NAME
  return {
    primaryQueries: [cleanName, cleanName.replace(/\s+(ex|v|vstar|vmax)$/i, '').trim()],
    expectedExactNames: [cleanName.toLowerCase()]
  };
}

/**
 * Queries TCGdex ID API for cards matching a name
 */
export async function searchIndonesianCardsByName(searchTerm: string): Promise<any[]> {
  const cacheKey = `tcgdex_search_${encodeURIComponent(searchTerm.toLowerCase().trim())}`;
  const cached = await getCachedItem<any[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`https://api.tcgdex.net/v2/id/cards?name=${encodeURIComponent(searchTerm.trim())}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        await setCachedItem(cacheKey, data);
        return data;
      }
    }
  } catch (err) {
    console.warn(`Failed to search cards by name "${searchTerm}":`, err);
  }

  return [];
}

/**
 * Public search helper for live search in CandidateDrawer
 */
export async function searchCardsDirectly(query: string): Promise<IndonesianCardCandidate[]> {
  if (!query || query.trim().length < 2) return [];

  const rawCards = await searchIndonesianCardsByName(query.trim());
  const candidates: IndonesianCardCandidate[] = [];

  for (const card of rawCards) {
    const parts = (card.id || '').split('-');
    const rawLocalId = card.localId || '';
    const rawSetId = (rawLocalId && card.id && card.id.endsWith('-' + rawLocalId))
      ? card.id.slice(0, card.id.length - rawLocalId.length - 1)
      : (parts[0] || '');
    const setName = SET_NAMES[rawSetId] || rawSetId;

    candidates.push({
      id: card.id,
      localId: rawLocalId,
      setId: rawSetId,
      setName,
      name: card.name,
      category: 'Pokemon',
      image: card.image ? `${card.image}/high.webp` : `https://assets.tcgdex.net/id/SV/${rawSetId}/${rawLocalId}/high.webp`,
      matchScore: 90,
      matchReason: `Pencarian Langsung: "${query}"`,
    });
  }

  return candidates;
}

/**
 * Converts a single parsed card following official Indonesian tournament rules
 */
export async function convertCard(card: ParsedCard): Promise<MappedCard> {
  // Include name in cache key to avoid stale mismatches from parser bugs
  const cardKey = `v3_${card.setCode}_${card.cardNumber}_${normalizeApostrophe(card.name)}`;

  // 1. RULE: ENERGY CARDS DO NOT NEED SERIES CODE OR CARD COLLECTION NUMBER
  if (card.category === 'Energy') {
    const energyName = resolveEnergyName(card.name);
    const energyCandidate: IndonesianCardCandidate = {
      id: `energy_${card.id}`,
      localId: '', // Blank by rule!
      setId: '',   // Blank by rule!
      setName: '',
      name: energyName,
      category: 'Energy',
      matchScore: 100,
      matchReason: 'Energi Resmi Turnamen (Tanpa Kode & Nomor)',
    };

    return {
      parsed: card,
      status: 'mapped',
      selectedCandidate: energyCandidate,
      selectedCandidates: [{ candidate: energyCandidate, quantity: card.quantity }],
      candidates: [energyCandidate],
      isConfirmed: true,
    };
  }

  // 2. RULE: TRAINER CARDS DO NOT NEED SERIES CODE OR CARD COLLECTION NUMBER
  if (card.category === 'Trainer') {
    // Use apostrophe-normalized lookup to handle smart-quote vs straight-quote mismatches
    const idTrainerName = lookupTrainer(card.name);

    const trainerCandidate: IndonesianCardCandidate = {
      id: `trainer_${card.id}`,
      localId: '', // Blank by rule!
      setId: '',   // Blank by rule!
      setName: '',
      name: idTrainerName,
      category: 'Trainer',
      matchScore: 100,
      matchReason: 'Trainer Resmi Turnamen (Tanpa Kode & Nomor)',
    };

    return {
      parsed: card,
      status: 'mapped',
      selectedCandidate: trainerCandidate,
      selectedCandidates: [{ candidate: trainerCandidate, quantity: card.quantity }],
      candidates: [trainerCandidate],
      isConfirmed: true,
    };
  }

  // 3. POKÉMON CARDS:
  // - MUST have Series Code & Card Collection Number
  // - MUST match exact name (or inverted owner name)
  // - MUST be limited to Regulation H, I, J (G is finished!) OR custom MA sets

  // 3a. CUSTOM LOOKUP: check local MA-series data before hitting the API.
  // EN set codes are always EN-specific (e.g. POR, TWM) — never MA1/MA4/etc.
  // We match purely by Pokémon name across all MA series.
  const customCandidates = lookupCustomByEnName(card.name);
  if (customCandidates.length > 0) {
    customCandidates.sort((a, b) => b.matchScore - a.matchScore);
    return {
      parsed: card,
      status: customCandidates.length === 1 ? 'mapped' : 'ambiguous',
      selectedCandidate: customCandidates[0],
      selectedCandidates: [{ candidate: customCandidates[0], quantity: card.quantity }],
      candidates: customCandidates,
      isConfirmed: false,
    };
  }

  const cached = await getCachedCandidates(cardKey);
  if (cached && cached.length > 0) {
    // Ensure cached candidates respect H/I/J (or MA custom sets)
    const legalCached = cached.filter(c =>
      LEGAL_H_I_J_SETS.has(c.setId) ||
      (c.regulationMark && (LEGAL_REGULATION_MARKS.has(c.regulationMark) || c.regulationMark === 'MA'))
    );
    if (legalCached.length > 0) {
      return {
        parsed: card,
        status: legalCached.length === 1 ? 'mapped' : 'ambiguous',
        selectedCandidate: legalCached[0],
        selectedCandidates: [{ candidate: legalCached[0], quantity: card.quantity }],
        candidates: legalCached,
        isConfirmed: false,
      };
    }
  }

  const candidates: IndonesianCardCandidate[] = [];
  const { primaryQueries, expectedExactNames } = transformSearchNames(card.name, 'Pokemon');

  // De-duplicate queries so we don't search the same term twice
  const uniqueQueries = [...new Set(primaryQueries)];

  // Search TCGdex ID for all Indonesian prints with matching name
  for (const query of uniqueQueries) {
    const rawMatches = await searchIndonesianCardsByName(query);
    if (!rawMatches || rawMatches.length === 0) continue;

    for (const match of rawMatches) {
      const matchNameLower = (match.name || '').trim().toLowerCase();

      // RULE: EXACT POKÉMON NAME COMPARISON ONLY
      const isExactMatch = expectedExactNames.some(expected => matchNameLower === expected);
      if (!isExactMatch) {
        continue; // Skip non-exact matches (e.g. Dudunsparce vs Dudunsparce ex)
      }

      // Parse setId and localId from card ID (format: "SETID-LOCALID")
      // Using localId from API prevents mis-splitting set codes like "SV-P" that contain hyphens
      const localId = match.localId || '';
      const setId = (localId && match.id && match.id.endsWith('-' + localId))
        ? match.id.slice(0, match.id.length - localId.length - 1)
        : ((match.id || '').split('-')[0] || '');
      const setName = SET_NAMES[setId] || setId;

      // RULE: LIMIT TO REGULATION H, I, J ONLY (Filter out expired G regulations)
      if (!LEGAL_H_I_J_SETS.has(setId)) {
        continue; // Discard G regulation sets!
      }

      // Avoid duplicate card IDs
      if (candidates.some(c => c.id === match.id)) continue;

      // Score: prefer card whose number matches the EN original
      let score = 90;
      if (card.cardNumber && parseInt(localId, 10) === parseInt(card.cardNumber, 10)) {
        score = 97; // Same collection number is a strong indicator
      }

      // Build image URL: TCGdex uses /id/SV/<setId>/<localId>/high.webp
      const imageUrl = match.image
        ? `${match.image}/high.webp`
        : `https://assets.tcgdex.net/id/SV/${setId}/${localId}/high.webp`;

      candidates.push({
        id: match.id,
        localId,
        setId,
        setName,
        name: match.name,
        category: 'Pokemon',
        image: imageUrl,
        regulationMark: match.regulationMark || 'H',
        matchScore: Math.min(score, 100),
        matchReason: `${setName} #${localId}`,
      });
    }
  }

  // Fallback if no online API results found for legal sets: provide initial legal set candidate
  if (candidates.length === 0) {
    // Default to newest standard set SV6s or SV8a
    const defaultSet = 'SV6s';
    candidates.push({
      id: `${defaultSet}-${card.cardNumber || '001'}`,
      localId: card.cardNumber || '001',
      setId: defaultSet,
      setName: SET_NAMES[defaultSet] || defaultSet,
      name: card.name,
      category: 'Pokemon',
      regulationMark: 'H',
      matchScore: 70,
      matchReason: 'Estimasi Seri Standar (Reg H/I/J)',
    });
  }

  // Sort candidates by matchScore descending and set release order
  candidates.sort((a, b) => b.matchScore - a.matchScore);

  if (candidates.length > 0) {
    await setCachedCandidates(cardKey, candidates);
  }

  // RULE: If multiple card series prints exist, user will need to choose their physical series print!
  const status: MappingStatus = candidates.length > 1 ? 'ambiguous' : 'mapped';

  return {
    parsed: card,
    status,
    selectedCandidate: candidates[0],
    selectedCandidates: candidates[0] ? [{ candidate: candidates[0], quantity: card.quantity }] : [],
    candidates,
    isConfirmed: false,
  };
}

/**
 * Converts decklist with progress callback
 */
export async function convertDecklist(
  parsedCards: ParsedCard[],
  onProgress?: (completed: number, total: number) => void
): Promise<MappedCard[]> {
  const results: MappedCard[] = [];
  let done = 0;

  for (const card of parsedCards) {
    const mapped = await convertCard(card);
    results.push(mapped);
    done++;
    if (onProgress) {
      onProgress(done, parsedCards.length);
    }
  }

  return results;
}
