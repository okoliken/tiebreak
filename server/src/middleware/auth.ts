/**
 * Who is calling? Two kinds of caller, two headers (see API.md):
 *   Authorization: Bearer <jwt>  -> a creator (User)
 *   X-Voter-Token: <token>       -> a voter on one poll
 */

import type { RequestHandler } from "express";
import { notImplemented } from "./errors.js";

// Lets every route read req.userId with types instead of `any`.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * For routes that work for anyone but act differently for the owner
 * (GET /polls/:slug sets isOwner from this).
 *
 * 1. Read req.headers.authorization. No header, or not "Bearer ...": call next().
 * 2. jwt.verify(token, env.JWT_SECRET) inside try/catch. A bad or expired
 *    token here is NOT an error, the caller just counts as anonymous.
 * 3. On success set req.userId = payload.sub, then next().
 */
export const optionalUser: RequestHandler = (_req, _res, next) => {
  next();
};

/**
 * For creator-only routes.
 * 1. Run the same logic as optionalUser (pull it into a shared helper).
 * 2. If there is still no req.userId, throw HttpError(401, "UNAUTHENTICATED", ...).
 */
export const requireUser: RequestHandler = () => {
  throw notImplemented("requireUser");
};
