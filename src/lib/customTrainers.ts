/**
 * Custom Trainers Database
 *
 * Scans all card datasets in src/custom/ to find the latest available
 * picture for any given Trainer card (Item, Supporter, Stadium, Tool).
 */

interface CustomCardRaw {
  cardId?: string;
  name?: string;
  series?: string;
  type?: string;
  regulation?: string;
  collectionNumber?: string;
  imageUrl?: string;
}

export interface TrainerImageInfo {
  name: string;
  series: string;
  cardId?: string;
  collectionNumber?: string;
  imageUrl: string;
  regulation?: string;
}

// Normalize strings for fuzzy exact matching:
// - Strips diacritics (e.g. PokéPad -> pokepad)
// - Strips invisible zero-width characters (e.g. \u200c in Tandu Malam‌)
// - Normalizes quotes/apostrophes
// - Strips whitespace and non-alphanumeric chars
export function normalizeTrainerKey(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2018\u2019\u02BC\uFF07]/g, "'")
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

/**
 * Computes recency score for sorting. Higher score = newer card.
 * Cards with official numeric cardId from asia.pokemon-card.com get that numeric value.
 * Cards from MA1-MA5 (which don't have cardId) get an assigned high score
 * corresponding to their release era.
 */
function getRecencyScore(card: CustomCardRaw): number {
  const cid = parseInt(card.cardId || '0', 10);
  if (!isNaN(cid) && cid > 0) {
    return cid;
  }
  const s = card.series || '';
  if (s === 'MA5') return 19500;
  if (s === 'MA4') return 19400;
  if (s === 'MA3') return 19300;
  if (s === 'MA2') return 19200;
  if (s === 'MA1') return 19100;
  if (s.startsWith('MAT')) return 19000;
  return 0;
}

// Load all custom card datasets eagerly via Vite
const customFiles = import.meta.glob<CustomCardRaw[]>('../custom/*.json', { eager: true });

// Pre-index trainer entries by normalized key
interface IndexedTrainerCard extends CustomCardRaw {
  normKey: string;
  recencyScore: number;
}

const TRAINER_MAP = new Map<string, IndexedTrainerCard[]>();
const ALL_INDEXED_TRAINERS: IndexedTrainerCard[] = [];

for (const [filePath, moduleContent] of Object.entries(customFiles)) {
  const rawList: CustomCardRaw[] = Array.isArray(moduleContent)
    ? moduleContent
    : (moduleContent as any)?.default || [];

  const fileSeriesFallback = filePath.split('/').pop()?.replace('-cards.json', '') || '';

  for (const card of rawList) {
    if (!card || !card.name) continue;
    if (!card.imageUrl || !card.imageUrl.trim()) continue;

    const t = (card.type || '').toLowerCase();
    // Exclude pokemon and energy
    if (t === 'pokemon' || t.startsWith('energi')) continue;

    const series = card.series || fileSeriesFallback;
    const entry: IndexedTrainerCard = {
      ...card,
      series,
      normKey: normalizeTrainerKey(card.name),
      recencyScore: getRecencyScore({ ...card, series }),
    };

    ALL_INDEXED_TRAINERS.push(entry);

    if (!TRAINER_MAP.has(entry.normKey)) {
      TRAINER_MAP.set(entry.normKey, []);
    }
    TRAINER_MAP.get(entry.normKey)!.push(entry);
  }
}

// Sort each list in descending order of recency score so the first item is always the latest
for (const list of TRAINER_MAP.values()) {
  list.sort((a, b) => b.recencyScore - a.recencyScore);
}

ALL_INDEXED_TRAINERS.sort((a, b) => b.recencyScore - a.recencyScore);

/**
 * Find the latest picture available from src/custom for a trainer card.
 * @param enName English name from decklist (e.g. "Buddy-Buddy Poffin")
 * @param idName Translated Indonesian name if known (e.g. "Poffin Bersahabat")
 * @returns imageUrl string or undefined if not found
 */
export function getLatestTrainerImageUrl(enName: string, idName?: string): string | undefined {
  const keys = [
    idName ? normalizeTrainerKey(idName) : '',
    enName ? normalizeTrainerKey(enName) : '',
  ].filter(Boolean);

  if (keys.length === 0) return undefined;

  // 1. Direct match on normalized key
  for (const key of keys) {
    const list = TRAINER_MAP.get(key);
    if (list && list.length > 0 && list[0].imageUrl) {
      return list[0].imageUrl;
    }
  }

  // 2. Prefix / partial match (e.g. "Perintah Bos(Ghetsis)" when looking for "Perintah Bos")
  for (const key of keys) {
    if (key.length < 3) continue;
    const match = ALL_INDEXED_TRAINERS.find(c =>
      c.normKey.startsWith(key) || key.startsWith(c.normKey)
    );
    if (match && match.imageUrl) {
      return match.imageUrl;
    }
  }

  return undefined;
}
