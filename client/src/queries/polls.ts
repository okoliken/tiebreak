import { onScopeDispose, ref, watch, type Ref } from "vue";
import { defineQueryOptions, useMutation, useQuery, useQueryCache } from "@pinia/colada";
import { api, type CreatePollInput, type Poll, type PollStatus, type VoteInput } from "@/api";
import { session } from "@/lib/session";

// Hierarchical keys: invalidating ["polls", "list"] hits both dashboard tabs,
// ["polls"] hits everything poll-related.
export const POLL_KEYS = {
  root: ["polls"],
  lists: () => ["polls", "list"],
  list: (status: PollStatus) => ["polls", "list", status],
  detail: (slug: string) => ["polls", "detail", slug],
};

export const pollListQuery = defineQueryOptions((status: PollStatus) => ({
  key: POLL_KEYS.list(status),
  query: () => api.listPolls(status),
}));

export const pollQuery = defineQueryOptions((slug: string) => ({
  key: POLL_KEYS.detail(slug),
  query: () => api.getPoll(slug),
}));

/**
 * A poll that stays fresh by itself: refetched when the server (or, on the
 * mock, another tab) says it changed, and again the moment closesAt passes
 * so the page flips to "closed" with nobody touching it.
 */
export function useLivePoll(slug: Ref<string>) {
  const cache = useQueryCache();
  const query = useQuery(() => pollQuery(slug.value));
  const refresh = () => cache.invalidateQueries({ key: POLL_KEYS.detail(slug.value), exact: true });

  let unsubscribe = () => {};
  watch(
    slug,
    (s) => {
      unsubscribe();
      unsubscribe = api.subscribe(s, refresh);
    },
    { immediate: true },
  );

  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  watch(query.data, (p) => {
    clearTimeout(closeTimer);
    if (p?.status !== "open") return;
    const ms = Date.parse(p.closesAt) - Date.now();
    // setTimeout overflows past ~24.8 days; long polls refetch on their next change anyway.
    if (ms < 2 ** 31) closeTimer = setTimeout(refresh, Math.max(ms, 0) + 500);
  });

  // Ticks so "last one 2 min ago" keeps counting.
  const now = ref(Date.now());
  const tick = setInterval(() => (now.value = Date.now()), 30_000);

  onScopeDispose(() => {
    unsubscribe();
    clearTimeout(closeTimer);
    clearInterval(tick);
  });

  return { ...query, now };
}

/** Every write returns the fresh poll: put it straight in the cache. */
function usePollWrite<TVars>(run: (vars: TVars) => Promise<Poll>) {
  const cache = useQueryCache();
  return useMutation({
    mutation: run,
    onSuccess(poll) {
      cache.setQueryData(POLL_KEYS.detail(poll.slug), poll);
      cache.invalidateQueries({ key: POLL_KEYS.lists() });
    },
  });
}

export function usePollActions(slug: Ref<string>) {
  return {
    close: usePollWrite(() => api.closePoll(slug.value)),
    reopen: usePollWrite((closesAt: string) => api.reopenPoll(slug.value, closesAt)),
    approve: usePollWrite((id: string) => api.approveSuggestion(slug.value, id)),
    decline: usePollWrite((id: string) => api.declineSuggestion(slug.value, id)),
    suggest: usePollWrite((label: string) => api.suggest(slug.value, label)),
    vote: usePollWrite(async (input: VoteInput) => {
      const { voterToken, poll } = await api.vote(slug.value, input);
      // Saved before the cache update, so every refetch after this sends it.
      session.setVoterToken(slug.value, voterToken);
      return poll;
    }),
  };
}

export function useCreatePoll() {
  return usePollWrite((input: CreatePollInput) => api.createPoll(input));
}
