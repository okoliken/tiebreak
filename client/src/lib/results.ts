import type { Option, Poll } from "@/api/types";

export const percent = (votes: number, voterCount: number) =>
  voterCount === 0 ? 0 : Math.round((votes / voterCount) * 100);

export type Standing =
  | { kind: "empty" }
  | { kind: "tie"; leaders: Option[] }
  | { kind: "close"; leader: Option; margin: number }
  | { kind: "clear"; leader: Option; margin: number };

/**
 * How the race looks. "close" = the runner-up could catch up with a couple
 * more votes, so we don't call it yet.
 */
export function standing(poll: Poll): Standing {
  const [first, second] = poll.options;
  if (!first || first.votes === 0) return { kind: "empty" };
  const top = poll.options.filter((o) => o.votes === first.votes);
  if (top.length > 1) return { kind: "tie", leaders: top };
  const margin = first.votes - (second?.votes ?? 0);
  const close = margin <= 2 || margin / Math.max(poll.voterCount, 1) < 0.2;
  return { kind: close ? "close" : "clear", leader: first, margin };
}

/**
 * What goes in the big card vs. the list below it.
 * Open: the hero is the sole leader; in a tie nobody gets it, because
 * featuring one of two level options would be picking a side.
 * Closed: RevealCard shows the winner, or every tied option, so the list
 * gets whatever is left over.
 */
export function splitResults(poll: Poll) {
  const r = standing(poll);
  const leaders = r.kind === "tie" ? r.leaders : r.kind === "empty" ? [] : [r.leader];
  const hero =
    poll.status === "open" && (r.kind === "close" || r.kind === "clear")
      ? { option: r.leader, margin: r.margin }
      : null;
  const featured = poll.status === "open" ? (hero ? [hero.option] : []) : leaders;
  return { race: r, hero, rest: poll.options.filter((o) => !featured.includes(o)) };
}
