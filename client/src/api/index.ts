import { createHttpApi } from "./http";
import { createMockApi } from "./mock";

const baseUrl = import.meta.env.VITE_API_URL as string | undefined;

/** The whole app imports this. Mock until VITE_API_URL points at the server. */
export const api = baseUrl ? createHttpApi(baseUrl) : createMockApi();
export const usingMock = !baseUrl;

export * from "./types";
