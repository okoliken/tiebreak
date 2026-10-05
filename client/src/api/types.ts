// Mirror of API.md. Change both together.

export type User = {
  id: string;
  name: string;
  email: string | null;
  avatarSeed: string;
  isGuest: boolean;
};

export type Voter = { id: string; name: string; avatarSeed: string };

export type Option = {
  id: string;
  label: string;
  suggestedBy: Voter | null;
  votes: number;
  voters: Voter[] | null;
};

export type Suggestion = { id: string; label: string; voter: Voter; createdAt: string };

export type PollStatus = "open" | "closed";

export type Poll = {
  id: string;
  slug: string;
  question: string;
  multiChoice: boolean;
  status: PollStatus;
  closesAt: string;
  closedAt: string | null;
  createdAt: string;
  options: Option[];
  voterCount: number;
  recentVoters: Voter[];
  lastVoteAt: string | null;
  owner: { name: string; avatarSeed: string };
  isOwner: boolean;
  pendingSuggestions: Suggestion[];
  myVote: { voterId: string; optionIds: string[] } | null;
};

export type PollSummary = Pick<
  Poll,
  "id" | "slug" | "question" | "status" | "closesAt" | "closedAt" | "voterCount"
> & {
  leader: { label: string; votes: number } | null;
  pendingSuggestionCount: number;
};

export type AuthResult = { token: string; user: User };

export type CreatePollInput = {
  question: string;
  options: string[];
  closesAt: string;
  multiChoice: boolean;
};

export type VoteInput = { name: string; avatarSeed: string; optionIds: string[] };

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface Api {
  signup(input: { name: string; email: string; password: string }): Promise<AuthResult>;
  login(input: { email: string; password: string }): Promise<AuthResult>;
  guest(): Promise<AuthResult>;
  me(): Promise<{ user: User }>;

  listPolls(status: PollStatus): Promise<PollSummary[]>;
  createPoll(input: CreatePollInput): Promise<Poll>;
  getPoll(slug: string): Promise<Poll>;
  closePoll(slug: string): Promise<Poll>;
  reopenPoll(slug: string, closesAt: string): Promise<Poll>;
  approveSuggestion(slug: string, id: string): Promise<Poll>;
  declineSuggestion(slug: string, id: string): Promise<Poll>;
  deletePoll(slug: string): Promise<void>;

  vote(slug: string, input: VoteInput): Promise<{ voterToken: string; poll: Poll }>;
  suggest(slug: string, label: string): Promise<Poll>;

  /** Calls onChange whenever the poll changes. Returns an unsubscribe function. */
  subscribe(slug: string, onChange: () => void): () => void;
}
