// An in-browser fake of the Express API, so the client works before the
// server does. State lives in localStorage and changes are broadcast to other
// tabs -- open the vote page in a second window to watch "live" results.

import { samplePolls } from "./sample-data";
import {
  ApiError,
  type Api,
  type Option,
  type Poll,
  type PollSummary,
  type Suggestion,
  type User,
  type Voter,
} from "./types";
import { session } from "@/lib/session";

type MUser = User & { password: string | null };
type MVoter = Voter & { token: string; choices: string[]; createdAt: string };
type MOption = { id: string; label: string; position: number; suggestedById: string | null };
type MSuggestion = {
  id: string;
  label: string;
  voterId: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  createdAt: string;
};
type MPoll = {
  id: string;
  slug: string;
  question: string;
  multiChoice: boolean;
  closesAt: string;
  closedAt: string | null;
  createdAt: string;
  ownerId: string;
  options: MOption[];
  voters: MVoter[];
  suggestions: MSuggestion[];
};
type DB = { users: MUser[]; polls: MPoll[]; tokens: Record<string, string> };

const DB_KEY = "tiebreak:mock-db";
const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("tiebreak-mock");
const localListeners = new Set<(slug: string) => void>();

const id = () => crypto.randomUUID();
const iso = (ms: number) => new Date(ms).toISOString();
const delay = () => new Promise((r) => setTimeout(r, 120 + Math.random() * 180));

function load(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    // fall through to an empty db
  }
  return { users: [], polls: [], tokens: {} };
}

function save(db: DB, changedSlug?: string) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // storage full or blocked; the change lives until reload
  }
  if (changedSlug) {
    channel?.postMessage(changedSlug);
    localListeners.forEach((fn) => fn(changedSlug));
  }
}

function fail(status: number, code: string, message: string): never {
  throw new ApiError(status, code, message);
}

function seedPollsFor(ownerId: string): MPoll[] {
  const now = Date.now();
  return samplePolls.map((s) => {
    const voters: MVoter[] = s.voters.map((sv) => ({
      id: id(),
      name: sv.name,
      avatarSeed: sv.avatarSeed,
      token: id(),
      choices: [],
      createdAt: iso(now - sv.minsAgo * 60_000),
    }));
    const options: MOption[] = s.options.map((o, position) => ({
      id: id(),
      label: o.label,
      position,
      suggestedById: o.suggestedBy ? (voters.find((x) => x.name === o.suggestedBy)?.id ?? null) : null,
    }));
    s.voters.forEach((sv, i) => {
      voters[i]!.choices = sv.picks.map((p) => options[p]!.id);
    });
    const suggestions: MSuggestion[] = s.pendingSuggestions.map((p) => ({
      id: id(),
      label: p.label,
      voterId: voters.find((x) => x.name === p.by)!.id,
      status: "PENDING",
      createdAt: iso(now - p.minsAgo * 60_000),
    }));
    return {
      id: id(),
      slug: s.slug,
      question: s.question,
      multiChoice: s.multiChoice,
      closesAt: iso(now + s.closesInMs),
      closedAt: s.closedMinsAgo ? iso(now - s.closedMinsAgo * 60_000) : null,
      createdAt: iso(now - s.createdHoursAgo * 3_600_000),
      ownerId,
      options,
      voters,
      suggestions,
    };
  });
}

const isOpen = (p: MPoll) => p.closedAt === null && Date.parse(p.closesAt) > Date.now();
const publicVoter = (v: MVoter): Voter => ({ id: v.id, name: v.name, avatarSeed: v.avatarSeed });
const publicUser = ({ password: _password, ...u }: MUser): User => u;

function currentUserId(db: DB): string | undefined {
  const token = session.authToken;
  return token ? db.tokens[token] : undefined;
}

function ownerOf(db: DB, p: MPoll) {
  const u = db.users.find((x) => x.id === p.ownerId);
  return { name: u?.name ?? "Someone", avatarSeed: u?.avatarSeed ?? "someone" };
}

function toPoll(db: DB, p: MPoll): Poll {
  const open = isOpen(p);
  const isOwner = currentUserId(db) === p.ownerId;
  const voterById = new Map(p.voters.map((v) => [v.id, v]));

  const options: Option[] = p.options
    .map((o) => {
      const backers = p.voters.filter((v) => v.choices.includes(o.id));
      const suggester = o.suggestedById ? voterById.get(o.suggestedById) : undefined;
      return {
        option: {
          id: o.id,
          label: o.label,
          suggestedBy: suggester ? publicVoter(suggester) : null,
          votes: backers.length,
          voters: open ? null : backers.map(publicVoter),
        },
        position: o.position,
      };
    })
    .sort((a, b) => b.option.votes - a.option.votes || a.position - b.position)
    .map((x) => x.option);

  const newestFirst = [...p.voters].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const voterToken = session.voterToken(p.slug);
  const me = voterToken ? p.voters.find((v) => v.token === voterToken) : undefined;

  const pendingSuggestions: Suggestion[] = isOwner
    ? p.suggestions
        .filter((s) => s.status === "PENDING")
        .map((s) => ({
          id: s.id,
          label: s.label,
          voter: publicVoter(voterById.get(s.voterId)!),
          createdAt: s.createdAt,
        }))
    : [];

  return {
    id: p.id,
    slug: p.slug,
    question: p.question,
    multiChoice: p.multiChoice,
    status: open ? "open" : "closed",
    closesAt: p.closesAt,
    closedAt: p.closedAt ?? (open ? null : p.closesAt),
    createdAt: p.createdAt,
    options,
    voterCount: p.voters.length,
    recentVoters: newestFirst.slice(0, 5).map(publicVoter),
    lastVoteAt: newestFirst[0]?.createdAt ?? null,
    owner: ownerOf(db, p),
    isOwner,
    pendingSuggestions,
    myVote: me ? { voterId: me.id, optionIds: me.choices } : null,
  };
}

function findPoll(db: DB, slug: string): MPoll {
  return db.polls.find((p) => p.slug === slug) ?? fail(404, "NOT_FOUND", "That poll doesn’t exist.");
}

function ownPoll(db: DB, slug: string): MPoll {
  const p = findPoll(db, slug);
  const uid = currentUserId(db) ?? fail(401, "UNAUTHENTICATED", "Sign in first.");
  if (p.ownerId !== uid) fail(403, "FORBIDDEN", "Only the poll’s creator can do that.");
  return p;
}

function issueToken(db: DB, user: MUser) {
  const token = id();
  db.tokens[token] = user.id;
  return { token, user: publicUser(user) };
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function createMockApi(): Api {
  return {
    async signup({ name, email, password }) {
      await delay();
      const db = load();
      if (db.users.some((u) => u.email === email.toLowerCase()))
        fail(409, "EMAIL_TAKEN", "There’s already an account with that email.");
      const user: MUser = {
        id: id(),
        name,
        email: email.toLowerCase(),
        password,
        avatarSeed: name.toLowerCase(),
        isGuest: false,
      };
      db.users.push(user);
      const result = issueToken(db, user);
      save(db);
      return result;
    },

    async login({ email, password }) {
      await delay();
      const db = load();
      const user = db.users.find((u) => u.email === email.toLowerCase());
      if (!user || user.password !== password)
        fail(401, "BAD_CREDENTIALS", "That email and password don’t match.");
      const result = issueToken(db, user);
      save(db);
      return result;
    },

    async guest() {
      await delay();
      const db = load();
      // One browser = one mock world, so reuse the guest instead of
      // stacking copies of the sample polls with clashing slugs.
      let user = db.users.find((u) => u.isGuest);
      if (!user) {
        user = { id: id(), name: "Bisi", email: null, password: null, avatarSeed: "bisi", isGuest: true };
        db.users.push(user);
        db.polls.push(...seedPollsFor(user.id));
      }
      const result = issueToken(db, user);
      save(db);
      return result;
    },

    async me() {
      await delay();
      const db = load();
      const uid = currentUserId(db);
      const user = db.users.find((u) => u.id === uid) ?? fail(401, "UNAUTHENTICATED", "Sign in first.");
      return { user: publicUser(user) };
    },

    async listPolls(status) {
      await delay();
      const db = load();
      const uid = currentUserId(db) ?? fail(401, "UNAUTHENTICATED", "Sign in first.");
      return db.polls
        .filter((p) => p.ownerId === uid && (status === "open") === isOpen(p))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((p): PollSummary => {
          const full = toPoll(db, p);
          const top = full.options[0];
          return {
            id: full.id,
            slug: full.slug,
            question: full.question,
            status: full.status,
            closesAt: full.closesAt,
            closedAt: full.closedAt,
            voterCount: full.voterCount,
            leader: top && top.votes > 0 ? { label: top.label, votes: top.votes } : null,
            pendingSuggestionCount: full.pendingSuggestions.length,
          };
        });
    },

    async createPoll(input) {
      await delay();
      const db = load();
      const uid = currentUserId(db) ?? fail(401, "UNAUTHENTICATED", "Sign in first.");
      const labels = input.options.map((o) => o.trim()).filter(Boolean);
      if (labels.length < 2 || labels.length > 10) fail(422, "VALIDATION", "Polls need 2–10 options.");
      if (new Set(labels.map((l) => l.toLowerCase())).size !== labels.length)
        fail(422, "VALIDATION", "Two options have the same name.");
      if (Date.parse(input.closesAt) <= Date.now()) fail(422, "VALIDATION", "Pick a closing time in the future.");
      const poll: MPoll = {
        id: id(),
        slug: `${slugify(input.question) || "poll"}-${id().slice(0, 4)}`,
        question: input.question.trim(),
        multiChoice: input.multiChoice,
        closesAt: input.closesAt,
        closedAt: null,
        createdAt: new Date().toISOString(),
        ownerId: uid,
        options: labels.map((label, position) => ({ id: id(), label, position, suggestedById: null })),
        voters: [],
        suggestions: [],
      };
      db.polls.push(poll);
      save(db, poll.slug);
      return toPoll(db, poll);
    },

    async getPoll(slug) {
      await delay();
      const db = load();
      return toPoll(db, findPoll(db, slug));
    },

    async closePoll(slug) {
      await delay();
      const db = load();
      const p = ownPoll(db, slug);
      if (isOpen(p)) p.closedAt = new Date().toISOString();
      save(db, slug);
      return toPoll(db, p);
    },

    async reopenPoll(slug, closesAt) {
      await delay();
      const db = load();
      const p = ownPoll(db, slug);
      if (Date.parse(closesAt) <= Date.now()) fail(422, "VALIDATION", "Pick a closing time in the future.");
      p.closedAt = null;
      p.closesAt = closesAt;
      save(db, slug);
      return toPoll(db, p);
    },

    async approveSuggestion(slug, suggestionId) {
      await delay();
      const db = load();
      const p = ownPoll(db, slug);
      const s = p.suggestions.find((x) => x.id === suggestionId && x.status === "PENDING");
      if (!s) fail(404, "NOT_FOUND", "That suggestion was already handled.");
      if (p.options.length >= 10) fail(409, "TOO_MANY_OPTIONS", "Polls max out at 10 options.");
      s.status = "APPROVED";
      p.options.push({
        id: id(),
        label: s.label,
        position: Math.max(...p.options.map((o) => o.position)) + 1,
        suggestedById: s.voterId,
      });
      save(db, slug);
      return toPoll(db, p);
    },

    async declineSuggestion(slug, suggestionId) {
      await delay();
      const db = load();
      const p = ownPoll(db, slug);
      const s = p.suggestions.find((x) => x.id === suggestionId && x.status === "PENDING");
      if (!s) fail(404, "NOT_FOUND", "That suggestion was already handled.");
      s.status = "DECLINED";
      save(db, slug);
      return toPoll(db, p);
    },

    async deletePoll(slug) {
      await delay();
      const db = load();
      const p = ownPoll(db, slug);
      db.polls = db.polls.filter((x) => x !== p);
      save(db, slug);
    },

    async vote(slug, { name, avatarSeed, optionIds }) {
      await delay();
      const db = load();
      const p = findPoll(db, slug);
      if (!isOpen(p)) fail(409, "POLL_CLOSED", "Voting has ended for this poll.");
      if (!name.trim()) fail(422, "VALIDATION", "Add your name so the crew knows who voted.");
      if (optionIds.length === 0) fail(422, "VALIDATION", "Pick an option first.");
      if (!p.multiChoice && optionIds.length !== 1) fail(422, "VALIDATION", "This poll takes one pick.");
      if (optionIds.some((oid) => !p.options.some((o) => o.id === oid)))
        fail(422, "VALIDATION", "That option isn’t on this poll.");

      const existing = session.voterToken(slug);
      let voter = existing ? p.voters.find((v) => v.token === existing) : undefined;
      if (voter) {
        voter.name = name.trim();
        voter.avatarSeed = avatarSeed;
        voter.choices = [...optionIds];
      } else {
        voter = {
          id: id(),
          name: name.trim(),
          avatarSeed,
          token: id(),
          choices: [...optionIds],
          createdAt: new Date().toISOString(),
        };
        p.voters.push(voter);
      }
      save(db, slug);
      return { voterToken: voter.token, poll: toPoll(db, p) };
    },

    async suggest(slug, label) {
      await delay();
      const db = load();
      const p = findPoll(db, slug);
      const token = session.voterToken(slug);
      const voter = token ? p.voters.find((v) => v.token === token) : undefined;
      if (!voter) fail(401, "NOT_A_VOTER", "Vote first, then you can suggest an option.");
      if (!isOpen(p)) fail(409, "POLL_CLOSED", "Voting has ended for this poll.");
      const clean = label.trim();
      if (!clean) fail(422, "VALIDATION", "Type a suggestion first.");
      const taken = [...p.options.map((o) => o.label), ...p.suggestions.map((s) => s.label)];
      if (taken.some((l) => l.toLowerCase() === clean.toLowerCase()))
        fail(409, "DUPLICATE", "That one’s already on the list.");
      p.suggestions.push({
        id: id(),
        label: clean,
        voterId: voter.id,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      });
      save(db, slug);
      return toPoll(db, p);
    },

    subscribe(slug, onChange) {
      const handler = (changed: string) => changed === slug && onChange();
      const onMessage = (e: MessageEvent<string>) => handler(e.data);
      localListeners.add(handler);
      channel?.addEventListener("message", onMessage);
      return () => {
        localListeners.delete(handler);
        channel?.removeEventListener("message", onMessage);
      };
    },
  };
}
