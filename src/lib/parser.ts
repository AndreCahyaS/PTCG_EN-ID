import { ParsedCard, CardCategory } from '../types';

/**
 * Regex to parse standard PTCGL card line:
 * Examples:
 * "2 Charizard ex OBF 125"
 * "* 4 Arven OBF 186 PH"
 * "4 Ultra Ball (SVI) 196"
 * "6 Basic {R} Energy SVE 2"
 * "1 Lumineon V BRS 40"
 * "1 Rotom V LOR 58"
 */
const CARD_LINE_REGEX = /^\s*(?:\*\s*)?(\d+)\s+(.+)\s+(?:\(?([A-Za-z0-9\-]{2,6})\)?)\s+([A-Za-z0-9]+)(?:\s+.*)?$/;

/** Fallback regex for lines without a set code: "4 Ultra Ball" */
const CARD_FALLBACK_REGEX = /^\s*(?:\*\s*)?(\d+)\s+(.+)$/;

export function parsePTCGLDecklist(rawText: string): ParsedCard[] {
  const lines = rawText.split(/\r?\n/);
  const parsedCards: ParsedCard[] = [];

  let currentCategory: CardCategory = 'Pokemon';
  let counter = 0;

  for (let rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Detect section headers
    const lower = trimmed.toLowerCase();
    if (/^(pokémon|pokemon|pokemons)\s*:\s*\d*/i.test(lower)) {
      currentCategory = 'Pokemon';
      continue;
    }
    if (/^(trainer|trainers|trainer cards)\s*:\s*\d*/i.test(lower)) {
      currentCategory = 'Trainer';
      continue;
    }
    if (/^(energy|energies|energy cards)\s*:\s*\d*/i.test(lower)) {
      currentCategory = 'Energy';
      continue;
    }
    if (lower.startsWith('total cards:') || lower.startsWith('deck list')) {
      continue;
    }

    // Attempt standard regex match
    const match = trimmed.match(CARD_LINE_REGEX);
    if (match) {
      counter++;
      const quantity = parseInt(match[1], 10);
      let name = match[2].trim();
      let setCode = match[3].trim().toUpperCase();
      let cardNumber = match[4].trim();

      // Clean up brackets from name if any
      name = name.replace(/^\[.*?\]\s*/, '').trim();

      // Infer category if headers were absent
      let category = currentCategory;
      if (isLikelyEnergy(name)) {
        category = 'Energy';
      } else if (isLikelyTrainer(name) && category === 'Pokemon') {
        category = 'Trainer';
      }

      parsedCards.push({
        id: `card_${counter}_${setCode}_${cardNumber}`,
        rawLine: trimmed,
        quantity,
        name,
        setCode,
        cardNumber,
        category,
      });
      continue;
    }

    // Attempt fallback match
    const fallbackMatch = trimmed.match(CARD_FALLBACK_REGEX);
    if (fallbackMatch) {
      counter++;
      const quantity = parseInt(fallbackMatch[1], 10);
      const name = fallbackMatch[2].trim();
      let category = currentCategory;
      if (isLikelyEnergy(name)) category = 'Energy';
      else if (isLikelyTrainer(name)) category = 'Trainer';

      parsedCards.push({
        id: `card_${counter}_generic`,
        rawLine: trimmed,
        quantity,
        name,
        setCode: '',
        cardNumber: '',
        category,
      });
    }
  }

  return parsedCards;
}

function isLikelyEnergy(name: string): boolean {
  return /energy$/i.test(name) || /basic\s*\{.*\}\s*energy/i.test(name);
}

function isLikelyTrainer(name: string): boolean {
  const commonTrainers = [
    'ball', 'candy', 'catcher', 'research', 'orders', 'pad', 'rod', 'vessel', 'poffin',
    'switch', 'iono', 'arven', 'boss', 'professor', 'stretcher', 'belt', 'cape', 'stamp',
    'stadium', 'pokestop', 'artazon', 'vacuum', 'charm', 'band', 'stone'
  ];
  const lower = name.toLowerCase();
  return commonTrainers.some(t => lower.includes(t));
}
