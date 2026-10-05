import { Router } from "express";
import { notImplemented } from "../middleware/errors.js";

export const pollsRouter = Router();

// ── Creator routes ── (put requireUser in front of each) ─────────────────────

/**
 * GET /polls?status=open|closed -> PollSummary[]
 *
 * 1. Find the caller's polls (where ownerId = req.userId).
 * 2. Filter by derived status. Prisma can do it in the `where`:
 *      open:   { closedAt: null, closesAt: { gt: new Date() } }
 *      closed: { OR: [{ closedAt: { not: null } }, { closesAt: { lte: new Date() } }] }
 * 3. Include what a summary needs (option labels + choice counts, voter
 *    count, pending suggestion count) and map each poll to a PollSummary.
 *    Hint: `_count: { select: { choices: true } }` inside an include.
 */
pollsRouter.get("/", () => {
  throw notImplemented("list polls");
});

/**
 * POST /polls { question, options: string[], closesAt, multiChoice } -> Poll
 *
 * 1. Zod: question 1-120 chars; options array of 2-10 trimmed non-empty
 *    strings with no duplicates (case-insensitive); closesAt a future date.
 * 2. Make the slug: slugify(question).slice(0, 40) + "-" + nanoid(4).
 * 3. Create the poll AND its options in one call with a nested write:
 *      options: { create: options.map((label, position) => ({ label, position })) }
 * 4. Return toPoll(...) (lib/serialize.ts).
 */
pollsRouter.post("/", () => {
  throw notImplemented("create poll");
});

/**
 * POST /polls/:slug/close -> Poll
 * 1. Load the poll; 404 if missing, 403 if req.userId isn't the owner.
 * 2. Already closed? Just return it (closing twice should be harmless).
 * 3. Set closedAt = now. live.notify(slug). Return toPoll.
 */
pollsRouter.post("/:slug/close", () => {
  throw notImplemented("close poll");
});

/**
 * POST /polls/:slug/reopen { closesAt } -> Poll
 * Owner check, then closedAt = null and closesAt = the new future time.
 * Votes cast before closing are kept. live.notify. Return toPoll.
 */
pollsRouter.post("/:slug/reopen", () => {
  throw notImplemented("reopen poll");
});

/**
 * POST /polls/:slug/suggestions/:id/approve -> Poll
 * 1. Owner check. The suggestion must belong to this poll and be PENDING.
 * 2. If the poll already has 10 options -> 409 TOO_MANY_OPTIONS.
 * 3. In ONE prisma.$transaction: mark it APPROVED and create the Option
 *    (suggestedById = suggestion.voterId, position = last + 1). Either both
 *    happen or neither does.
 * 4. live.notify. Return toPoll.
 */
pollsRouter.post("/:slug/suggestions/:id/approve", () => {
  throw notImplemented("approve suggestion");
});

/** POST /polls/:slug/suggestions/:id/decline -> Poll  (mark it DECLINED) */
pollsRouter.post("/:slug/suggestions/:id/decline", () => {
  throw notImplemented("decline suggestion");
});

/** DELETE /polls/:slug -> 204  (owner only; Cascade removes everything else) */
pollsRouter.delete("/:slug", () => {
  throw notImplemented("delete poll");
});

// ── Public routes ── (optionalUser in front, no account needed) ──────────────

/**
 * GET /polls/:slug -> Poll
 * Load the poll with everything toPoll needs and return toPoll(poll, viewer),
 * where viewer = { userId: req.userId, voterToken: req.header("x-voter-token") }.
 */
pollsRouter.get("/:slug", () => {
  throw notImplemented("get poll");
});

/**
 * POST /polls/:slug/votes { name, avatarSeed, optionIds } -> { voterToken, poll }
 *
 * 1. Zod: name 1-30 chars, avatarSeed string, optionIds min 1.
 * 2. 409 POLL_CLOSED if not open. 422 if the poll is single-choice and
 *    optionIds.length !== 1, or if any optionId isn't one of THIS poll's
 *    options (never trust ids from the client).
 * 3. Already voted? Hash the X-Voter-Token and look up the Voter. If found,
 *    in a transaction: delete their old Choices, create the new ones.
 *    Re-voting replaces the ballot.
 * 4. New voter? token = randomBytes(24).toString("base64url"); create the
 *    Voter with tokenHash = sha256(token), plus their Choices.
 * 5. live.notify(slug). Return the RAW token (for a returning voter, the
 *    one they sent) and toPoll. The raw token only ever exists here.
 */
pollsRouter.post("/:slug/votes", () => {
  throw notImplemented("vote");
});

/**
 * POST /polls/:slug/suggestions { label } + X-Voter-Token -> Poll
 * 1. Find the voter by token hash; 401 without one (you vote before you suggest).
 * 2. 409 if the poll is closed, or if label matches an existing option.
 * 3. Create a PENDING Suggestion. live.notify. Return toPoll.
 */
pollsRouter.post("/:slug/suggestions", () => {
  throw notImplemented("suggest option");
});

/**
 * GET /polls/:slug/events -> Server-Sent Events
 * Hand the response to live.subscribe(slug, res). See lib/live.ts.
 */
pollsRouter.get("/:slug/events", () => {
  throw notImplemented("poll events");
});
