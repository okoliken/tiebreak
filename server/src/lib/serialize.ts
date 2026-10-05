/**
 * Turns database rows into the `Poll` shape from API.md. Every route that
 * returns a poll goes through toPoll, so the response shape lives in exactly
 * one place.
 */

export type Viewer = { userId?: string; voterToken?: string };

/**
 * toPoll(poll, viewer)
 *
 * 1. status: "open" when closedAt is null and closesAt > now, else "closed".
 * 2. options: count each option's choices as `votes`; sort by votes desc
 *    (tie -> lower position first). `voters` = the choosers' Voter rows,
 *    but ONLY when closed. While voting is open, null. Hiding who backed what
 *    until the reveal is the product decision.
 * 3. voterCount = number of Voter rows (people), not Choice rows (ticks).
 * 4. recentVoters: newest 5 voters. lastVoteAt: newest voter's createdAt.
 * 5. owner = { name, avatarSeed } of poll.owner (include it in the query).
 *    isOwner = viewer.userId === poll.ownerId.
 * 6. pendingSuggestions: the PENDING ones if isOwner, else [].
 * 7. myVote: hash viewer.voterToken, find that voter on this poll, and return
 *    { voterId, optionIds }. Otherwise null.
 * 8. Dates -> .toISOString().
 *
 * Tip: give `poll` a real type with Prisma.PollGetPayload<{ include: ... }>
 * so a typo in the include gets caught at compile time.
 */
export function toPoll(_poll: unknown, _viewer: Viewer): never {
  throw new Error("toPoll not built yet");
}
