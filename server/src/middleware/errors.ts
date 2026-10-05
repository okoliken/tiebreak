/**
 * Every error leaves the API in the same shape (see API.md):
 *   { "error": { "code": "POLL_CLOSED", "message": "..." } }
 *
 * Throw an HttpError anywhere in a route -- Express 5 forwards errors from
 * async handlers to errorHandler on its own, no try/catch needed.
 */

import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError, z } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const notImplemented = (what: string) =>
  new HttpError(501, "NOT_IMPLEMENTED", `${what} is not built yet`);

export const notFound: RequestHandler = (req) => {
  throw new HttpError(404, "NOT_FOUND", `No route for ${req.method} ${req.path}`);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(422).json({ error: { code: "VALIDATION", message: z.prettifyError(err) } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL", message: "Something went wrong" } });
};
