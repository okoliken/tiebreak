// Who this browser is: a creator's JWT, plus one voter token per poll voted on.

const AUTH_KEY = "tiebreak:auth";
const VOTER_KEY = "tiebreak:voters";
const PROFILE_KEY = "tiebreak:voter-profile";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / blocked storage: the session just won't persist.
  }
}

export const session = {
  get authToken(): string | null {
    return read<string | null>(AUTH_KEY, null);
  },
  set authToken(token: string | null) {
    write(AUTH_KEY, token);
  },

  voterToken(slug: string): string | null {
    return read<Record<string, string>>(VOTER_KEY, {})[slug] ?? null;
  },
  setVoterToken(slug: string, token: string) {
    write(VOTER_KEY, { ...read<Record<string, string>>(VOTER_KEY, {}), [slug]: token });
  },

  /** Last name + avatar a voter used, so the next poll's form is pre-filled. */
  get voterProfile(): { name: string; avatarSeed: string } | null {
    return read(PROFILE_KEY, null);
  },
  set voterProfile(profile: { name: string; avatarSeed: string } | null) {
    write(PROFILE_KEY, profile);
  },
};
