// Guest-mode content. server/prisma/seed.ts should create the same polls.

const MIN = 60_000;
const HOUR = 60 * MIN;

export type SeedVoter = { name: string; avatarSeed: string; picks: number[]; minsAgo: number };
export type SeedPoll = {
  slug: string;
  question: string;
  multiChoice: boolean;
  /** Relative to now: positive = still open. */
  closesInMs: number;
  /** Set for polls the creator ended early. */
  closedMinsAgo?: number;
  createdHoursAgo: number;
  options: { label: string; suggestedBy?: string }[];
  voters: SeedVoter[];
  pendingSuggestions: { label: string; by: string; minsAgo: number }[];
};

const v = (name: string, picks: number[], minsAgo: number): SeedVoter => ({
  name,
  avatarSeed: name.toLowerCase(),
  picks,
  minsAgo,
});

export const samplePolls: SeedPoll[] = [
  {
    slug: "pizza-night",
    question: "Pizza night: what are we ordering?",
    multiChoice: false,
    closesInMs: 3 * HOUR,
    createdHoursAgo: 4,
    options: [
      { label: "Pepperoni from Slice House" },
      { label: "Margherita from Lupa" },
      { label: "Detroit-style from Emmy’s", suggestedBy: "Priya" },
      { label: "Veggie supreme from Nino’s", suggestedBy: "Jonah" },
    ],
    voters: [
      v("Priya", [2], 190),
      v("Jonah", [3], 170),
      v("Leo", [0], 150),
      v("Tomi", [1], 120),
      v("Ade", [2], 95),
      v("Zara", [3], 80),
      v("Noah", [0], 61),
      v("Maya", [2], 40),
      v("Sam", [0], 22),
      v("Kemi", [2], 9),
      v("Ivy", [2], 2),
    ],
    pendingSuggestions: [{ label: "Just order salads", by: "Sam", minsAgo: 6 }],
  },
  {
    slug: "film-night",
    question: "Film night: pick everything you’d happily watch",
    multiChoice: true,
    closesInMs: 26 * HOUR,
    createdHoursAgo: 1,
    options: [
      { label: "Paddington 2" },
      { label: "Spirited Away" },
      { label: "The Grand Budapest Hotel" },
      { label: "Knives Out" },
    ],
    voters: [],
    pendingSuggestions: [],
  },
  {
    slug: "offsite-spot",
    question: "Where’s the team offsite this spring?",
    multiChoice: false,
    closesInMs: -2 * 24 * HOUR,
    createdHoursAgo: 6 * 24,
    options: [
      { label: "Cabin by the lake" },
      { label: "City food crawl" },
      { label: "Surf camp", suggestedBy: "Ola" },
    ],
    voters: [
      v("Ola", [2], 5 * 24 * 60),
      v("Ben", [0], 5 * 24 * 60 - 30),
      v("Chi", [1], 4 * 24 * 60),
      v("Dami", [0], 4 * 24 * 60 - 90),
      v("Efe", [1], 3 * 24 * 60),
      v("Femi", [0], 3 * 24 * 60 - 45),
      v("Grace", [1], 2 * 24 * 60 + 60),
    ],
    pendingSuggestions: [],
  },
];
