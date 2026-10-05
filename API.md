# Tiebreak API contract

The handshake between `client/` and `server/`. The client's TypeScript version
of these shapes lives in `client/src/api/types.ts`. If you change a shape here,
change it there too.

Base URL: `http://localhost:8010` in dev. Request and response bodies are JSON.
Every timestamp is an ISO 8601 string.

## Auth

Creators have accounts. Voters never do.

Creator auth uses a JWT sent as `Authorization: Bearer <token>`. A voter
gets a **voter token** (an opaque random string) the first time they vote on a
poll. The client stores it per poll and sends it back as `X-Voter-Token`, which
is how "you already voted" and "change my vote" work without an account.

| Method | Path            | Body                          | Returns                 |
| ------ | --------------- | ----------------------------- | ----------------------- |
| POST   | `/auth/signup`  | `{ name, email, password }`   | `{ token, user }`       |
| POST   | `/auth/login`   | `{ email, password }`         | `{ token, user }`       |
| POST   | `/auth/guest`   | –                             | `{ token, user }`       |
| GET    | `/auth/me`      | –                             | `{ user }`              |

`/auth/guest` creates a throwaway creator whose account is seeded with the
sample polls, so anyone can try the deployed app.

## Shapes

```ts
type User = { id: string; name: string; email: string | null; avatarSeed: string; isGuest: boolean }

type Voter = { id: string; name: string; avatarSeed: string }

type Option = {
  id: string
  label: string
  suggestedBy: Voter | null   // null = the creator wrote it
  votes: number
  voters: Voter[] | null      // only filled once the poll is closed (the reveal), else null
}

type Suggestion = { id: string; label: string; voter: Voter; createdAt: string }

type Poll = {
  id: string
  slug: string                // used in the share link: /p/:slug
  question: string
  multiChoice: boolean
  status: 'open' | 'closed'
  closesAt: string
  closedAt: string | null
  createdAt: string
  options: Option[]           // sorted by votes, highest first
  voterCount: number          // people, not ballots (one person can tick 3 boxes on a multi-choice poll)
  recentVoters: Voter[]       // newest first, at most 5
  lastVoteAt: string | null
  owner: { name: string; avatarSeed: string }  // shown to voters: "Priya asked the crew"
  isOwner: boolean            // true when the Bearer token belongs to the creator
  pendingSuggestions: Suggestion[]  // the creator only; [] for everyone else
  myVote: { voterId: string; optionIds: string[] } | null  // from X-Voter-Token
}

type PollSummary = Pick<Poll, 'id' | 'slug' | 'question' | 'status' | 'closesAt' | 'closedAt' | 'voterCount'> & {
  leader: { label: string; votes: number } | null
  pendingSuggestionCount: number
}
```

## Creator endpoints (Bearer token required)

| Method | Path                                   | Body                                                | Returns          |
| ------ | -------------------------------------- | --------------------------------------------------- | ---------------- |
| GET    | `/polls?status=open\|closed`           | –                                                   | `PollSummary[]`  |
| POST   | `/polls`                               | `{ question, options: string[], closesAt, multiChoice }` | `Poll`      |
| POST   | `/polls/:slug/close`                   | –                                                   | `Poll`           |
| POST   | `/polls/:slug/reopen`                  | `{ closesAt }`                                      | `Poll`           |
| POST   | `/polls/:slug/suggestions/:id/approve` | –                                                   | `Poll`           |
| POST   | `/polls/:slug/suggestions/:id/decline` | –                                                   | `Poll`           |
| DELETE | `/polls/:slug`                         | –                                                   | `204`            |

Rules: 2–10 options when creating. `closesAt` must be in the future. Approving
a suggestion that would push the poll past 10 options is a `409`.

## Public endpoints (no account)

| Method | Path                         | Body                                            | Returns                    |
| ------ | ---------------------------- | ----------------------------------------------- | -------------------------- |
| GET    | `/polls/:slug`               | –                                               | `Poll`                     |
| POST   | `/polls/:slug/votes`         | `{ name, avatarSeed, optionIds: string[] }`     | `{ voterToken, poll }`     |
| POST   | `/polls/:slug/suggestions`   | `{ label }` + `X-Voter-Token`                   | `Poll`                     |
| GET    | `/polls/:slug/events`        | – (Server-Sent Events)                          | stream of `event: changed` |

- Voting on a closed poll is a `409`.
- A single-choice poll takes exactly one `optionIds` entry.
- Posting a vote again with the same `X-Voter-Token` **replaces** that voter's
  ballot instead of adding a second one.
- Only someone who has voted can suggest an option (they need a voter token).
- `/events`: send `event: changed\ndata: {}\n\n` every time the poll changes
  (votes, suggestions, close, reopen). The client then refetches
  `GET /polls/:slug`. It is only a ping, for two reasons: a browser
  `EventSource` can't send the Bearer or voter-token headers, and the Poll
  differs per viewer (`isOwner`, `myVote`, `pendingSuggestions`).

## Errors

Every error looks like this:

```json
{ "error": { "code": "POLL_CLOSED", "message": "Voting has ended for this poll." } }
```
