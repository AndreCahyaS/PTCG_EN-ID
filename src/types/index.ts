export type CardCategory = 'Pokemon' | 'Trainer' | 'Energy';

export interface ParsedCard {
  id: string; // unique key in list
  rawLine: string;
  quantity: number;
  name: string;
  setCode: string; // e.g., OBF, MEW, SVI, PAL
  cardNumber: string; // e.g., 125, 014, 186
  category: CardCategory;
}

export interface IndonesianCardCandidate {
  id: string; // e.g., "SV3s-098"
  localId: string; // e.g., "098"
  setId: string; // e.g., "SV3s"
  setName: string; // e.g., "Kilau Hitam"
  name: string; // e.g., "Charizard ex" or "Dafin"
  category: CardCategory;
  image?: string;
  hp?: number;
  types?: string[];
  stage?: string;
  regulationMark?: string;
  rarity?: string;
  matchScore: number; // 0 - 100
  matchReason: string;
}

export type MappingStatus = 'mapped' | 'ambiguous' | 'unmapped';

export interface MappedCard {
  parsed: ParsedCard;
  status: MappingStatus;
  selectedCandidate?: IndonesianCardCandidate;
  candidates: IndonesianCardCandidate[];
  manualOverride?: boolean;
}

export interface DecklistSummary {
  totalCards: number;
  pokemonCount: number;
  trainerCount: number;
  energyCount: number;
  mappedCount: number;
  ambiguousCount: number;
  unmappedCount: number;
  isValidCount: boolean; // standard 60
}

export interface PlayerTournamentInfo {
  playerName: string;
  playerID: string;
  birthYear: string;
  division: 'Junior' | 'Senior' | 'Master';
  deckName: string;
  date: string;
}
