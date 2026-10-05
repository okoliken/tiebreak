/**
 * Sample content: the dev seed and every guest account use the same polls.
 *
 * The client's mock (client/src/api/sample-data.ts) has the same polls, so
 * copy the questions, options and voters from there.
 *
 * 1. Export `seedPollsFor(userId: string)` that creates the sample polls for
 *    one user: one open poll with votes plus a pending suggestion ("Pizza
 *    night"), one open poll with no votes yet, and one closed poll with a tie
 *    (so the reveal's tie state is visible).
 * 2. Make closesAt relative to now (e.g. now + 3h) so "open" polls are
 *    still open whenever someone tries the guest mode.
 * 3. At the bottom: when run directly (`pnpm db:seed`), upsert a demo user
 *    (demo@tiebreak.test) and call seedPollsFor on it.
 */

export {};
