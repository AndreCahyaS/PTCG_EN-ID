import { ParsedCard, MappedCard, IndonesianCardCandidate, MappingStatus, CardCategory } from '../types';
import setMappingData from '../config/setMapping.json';
import { getCachedItem, setCachedItem, getCachedCandidates, setCachedCandidates } from './cache';
import { lookupCustomPokemon, searchCustomPokemonDirectly, getBasicEnergyImageUrl } from './customCards';
import { getLatestTrainerImageUrl } from './customTrainers';

interface SetMappingConfig {
  setCodes: Record<string, { tcgdexEn: string; name: string; targetIdSets: string[] }>;
  pokemonTranslations?: Record<string, string>;
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
 * Look up a Pokémon translation from config.pokemonTranslations.
 * Supports exact match, case-insensitive match, and suffix matching (e.g. "ex", "v", "vstar", "vmax").
 */
export function lookupPokemon(name: string): string | undefined {
  if (!config.pokemonTranslations) return undefined;
  const clean = name.trim();
  const normalized = normalizeApostrophe(clean);

  // 1. Direct match
  if (config.pokemonTranslations[normalized]) return config.pokemonTranslations[normalized];
  if (config.pokemonTranslations[clean]) return config.pokemonTranslations[clean];

  // 2. Case-insensitive match
  const lowerNorm = normalized.toLowerCase();
  const found = Object.entries(config.pokemonTranslations).find(
    ([k]) => normalizeApostrophe(k).toLowerCase() === lowerNorm
  );
  if (found) return found[1];

  // 3. Suffix match (ex, v, vstar, vmax)
  const suffixMatch = clean.match(/\s+(ex|v|vstar|vmax)$/i);
  if (suffixMatch) {
    const suffix = suffixMatch[1];
    const base = clean.replace(/\s+(ex|v|vstar|vmax)$/i, '').trim();
    const baseTranslated = lookupPokemon(base);
    if (baseTranslated) {
      const regexSuffix = new RegExp(`\\s+${suffix}$`, 'i');
      if (regexSuffix.test(baseTranslated)) {
        return baseTranslated;
      }
      return `${baseTranslated} ${suffix}`;
    }
  }

  return undefined;
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

  // Check for mapped Pokémon translations (e.g. Ogerpon masks)
  const translatedPokemon = lookupPokemon(cleanName);
  if (translatedPokemon) {
    const primaryQueries: string[] = [
      translatedPokemon,
      cleanName,
    ];

    const baseTranslated = translatedPokemon.replace(/\s+(ex|v|vstar|vmax)$/i, '').trim();
    if (baseTranslated !== translatedPokemon) {
      primaryQueries.push(baseTranslated);
    }
    const baseClean = cleanName.replace(/\s+(ex|v|vstar|vmax)$/i, '').trim();
    if (baseClean !== cleanName) {
      primaryQueries.push(baseClean);
    }

    // Add first word (e.g. "Ogerpon") if multi-word so TCGdex returns all prints
    const words = baseTranslated.split(/\s+/);
    if (words.length > 1) {
      primaryQueries.push(words[0]);
    }

    const expectedExactNames = [
      translatedPokemon.toLowerCase(),
      cleanName.toLowerCase()
    ];

    // Include base and ex forms if applicable for flexible matching
    const baseLower = baseTranslated.toLowerCase();
    if (!expectedExactNames.includes(baseLower)) expectedExactNames.push(baseLower);
    const withEx = `${baseLower} ex`;
    if (!expectedExactNames.includes(withEx)) expectedExactNames.push(withEx);

    return {
      primaryQueries: [...new Set(primaryQueries.filter(Boolean))],
      expectedExactNames: [...new Set(expectedExactNames)]
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

  // 1. Search local custom database first (offline, 0ms latency, official images)
  const localResults = searchCustomPokemonDirectly(query);
  if (localResults.length > 0) {
    return localResults;
  }

  const trimmed = query.trim();
  const translated = lookupPokemon(trimmed);
  const searchQueries = [trimmed];
  if (translated && !searchQueries.includes(translated)) {
    searchQueries.push(translated);
  }

  const rawCardsMap = new Map<string, any>();
  for (const q of searchQueries) {
    const rawCards = await searchIndonesianCardsByName(q);
    for (const card of rawCards) {
      if (card.id && !rawCardsMap.has(card.id)) {
        rawCardsMap.set(card.id, card);
      }
    }
  }

  const candidates: IndonesianCardCandidate[] = [];

  for (const card of rawCardsMap.values()) {
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
    const energyImage = getBasicEnergyImageUrl(card.name, energyName);
    const energyCandidate: IndonesianCardCandidate = {
      id: `energy_${card.id}`,
      localId: '', // Blank by rule!
      setId: '',   // Blank by rule!
      setName: '',
      name: energyName,
      category: 'Energy',
      image: energyImage,
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

    // Look up latest picture available from src/custom
    let trainerImage = getLatestTrainerImageUrl(card.name, idTrainerName);

    // Fallback: If not found in src/custom, search TCGdex by Indonesian name
    if (!trainerImage) {
      try {
        const tcgdexResults = await searchIndonesianCardsByName(idTrainerName);
        const cardWithImage = tcgdexResults.find(c => c.image);
        if (cardWithImage) {
          trainerImage = `${cardWithImage.image}/high.webp`;
        }
      } catch {
        // Ignore fallback errors
      }
    }

    const trainerCandidate: IndonesianCardCandidate = {
      id: `trainer_${card.id}`,
      localId: '', // Blank by rule!
      setId: '',   // Blank by rule!
      setName: '',
      name: idTrainerName,
      category: 'Trainer',
      image: trainerImage,
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
  // - MUST match exact name (or inverted owner name / translated name)
  // - MUST be limited to Regulation H, I, J (G is finished!) OR custom MA sets

  const { primaryQueries, expectedExactNames } = transformSearchNames(card.name, 'Pokemon');

  // 3a. LOCAL LOOKUP: Search across all 75 sets in local custom database.
  // Instantaneous (0ms network), 100% offline, with official Indonesian high-res card images.
  const localCandidates = lookupCustomPokemon(
    card.name,
    expectedExactNames,
    card.setCode,
    card.cardNumber
  );

  if (localCandidates.length > 0) {
    await setCachedCandidates(cardKey, localCandidates);
    const status: MappingStatus = localCandidates.length > 1 ? 'ambiguous' : 'mapped';
    return {
      parsed: card,
      status,
      selectedCandidate: localCandidates[0],
      selectedCandidates: [{ candidate: localCandidates[0], quantity: card.quantity }],
      candidates: localCandidates,
      isConfirmed: false,
    };
  }

  // 3b. Cache fallback
  const cached = await getCachedCandidates(cardKey);
  if (cached && cached.length > 0) {
    const legalCached = cached.filter(c =>
      LEGAL_H_I_J_SETS.has(c.setId) ||
      c.setId.startsWith('MA') ||
      (c.regulationMark && (LEGAL_REGULATION_MARKS.has(c.regulationMark) || c.regulationMark === 'MA'))
    );
    if (legalCached.length > 0) {
      legalCached.sort((a, b) => b.matchScore - a.matchScore);
      return {
        parsed: card,
        status: legalCached.length > 1 ? 'ambiguous' : 'mapped',
        selectedCandidate: legalCached[0],
        selectedCandidates: [{ candidate: legalCached[0], quantity: card.quantity }],
        candidates: legalCached,
        isConfirmed: false,
      };
    }
  }

  const candidates: IndonesianCardCandidate[] = [];

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

      // If card name has 'ex', prefer candidate that also has 'ex' (and vice versa)
      const inputHasEx = /\bex\b/i.test(card.name);
      const matchHasEx = /\bex\b/i.test(match.name);
      if (inputHasEx === matchHasEx) {
        score += 2;
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

  // Merge local candidates into the API results if any (dedup by id)
  for (const cc of localCandidates) {
    if (!candidates.some(c => c.id === cc.id)) {
      candidates.push(cc);
    }
  }

  // Fallback if neither API nor custom data found anything
  if (candidates.length === 0) {
    // Default to newest standard set SV6s or SV8a
    const defaultSet = 'SV6s';
    const fallbackName = lookupPokemon(card.name) || card.name;
    candidates.push({
      id: `${defaultSet}-${card.cardNumber || '001'}`,
      localId: card.cardNumber || '001',
      setId: defaultSet,
      setName: SET_NAMES[defaultSet] || defaultSet,
      name: fallbackName,
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
