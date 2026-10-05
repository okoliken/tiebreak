import {
  defineQueryOptions,
  useMutation,
  useQuery,
  useQueryCache,
} from "@pinia/colada";
import { api, type AuthResult } from "@/api";
import { session } from "@/lib/session";
import { POLL_KEYS } from "./polls";

/** The signed-in creator, or null. Never stale: only sign in/out changes it. */
export const meQuery = defineQueryOptions({
  key: ["me"],
  query: async () => {
    if (!session.authToken) return null;
    try {
      return (await api.me()).user;
    } catch {
      session.authToken = null;
      return null;
    }
  },
  staleTime: Infinity,
});

/** For the router guard, which runs outside any component. */
export async function loadUser() {
  const cache = useQueryCache();
  const state = await cache.refresh(cache.ensure(meQuery));
  return state.data ?? null;
}

export function useAuth() {
  const cache = useQueryCache();
  const { data: user } = useQuery(meQuery);

  // A different person means different polls: drop everything cached for the last one.
  function resetFor(result: AuthResult | null) {
    session.authToken = result?.token ?? null;
    cache.getEntries({ key: POLL_KEYS.root }).forEach((e) => cache.remove(e));
    cache.setQueryData(meQuery.key, result?.user ?? null);
  }

  const signup = useMutation({ mutation: api.signup, onSuccess: resetFor });
  const login = useMutation({ mutation: api.login, onSuccess: resetFor });
  const guest = useMutation({
    mutation: () => api.guest(),
    onSuccess: resetFor,
  });

  return { user, signup, login, guest, signOut: () => resetFor(null) };
}
