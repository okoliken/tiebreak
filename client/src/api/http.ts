// The real client: talks to the Express server described in API.md.

import { session } from "@/lib/session";
import { ApiError, type Api } from "./types";

export function createHttpApi(baseUrl: string): Api {
  async function request<T>(method: string, path: string, body?: unknown, slug?: string): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const auth = session.authToken;
    if (auth) headers["Authorization"] = `Bearer ${auth}`;
    const voter = slug ? session.voterToken(slug) : null;
    if (voter) headers["X-Voter-Token"] = voter;

    const res = await fetch(baseUrl + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 204) return undefined as T;

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = data?.error ?? {};
      throw new ApiError(res.status, err.code ?? "HTTP_ERROR", err.message ?? res.statusText);
    }
    return data as T;
  }

  const poll = (slug: string) => `/polls/${encodeURIComponent(slug)}`;

  return {
    signup: (input) => request("POST", "/auth/signup", input),
    login: (input) => request("POST", "/auth/login", input),
    guest: () => request("POST", "/auth/guest", {}),
    me: () => request("GET", "/auth/me"),

    listPolls: (status) => request("GET", `/polls?status=${status}`),
    createPoll: (input) => request("POST", "/polls", input),
    getPoll: (slug) => request("GET", poll(slug), undefined, slug),
    closePoll: (slug) => request("POST", `${poll(slug)}/close`, {}, slug),
    reopenPoll: (slug, closesAt) => request("POST", `${poll(slug)}/reopen`, { closesAt }, slug),
    approveSuggestion: (slug, id) =>
      request("POST", `${poll(slug)}/suggestions/${id}/approve`, {}, slug),
    declineSuggestion: (slug, id) =>
      request("POST", `${poll(slug)}/suggestions/${id}/decline`, {}, slug),
    deletePoll: (slug) => request("DELETE", poll(slug)),

    vote: (slug, input) => request("POST", `${poll(slug)}/votes`, input, slug),
    suggest: (slug, label) => request("POST", `${poll(slug)}/suggestions`, { label }, slug),

    subscribe(slug, onChange) {
      const source = new EventSource(`${baseUrl}${poll(slug)}/events`);
      source.addEventListener("changed", onChange);
      return () => source.close();
    },
  };
}
