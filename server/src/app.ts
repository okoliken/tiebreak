/**
 * Builds the Express app: middleware, routes, error handling.
 * Kept apart from index.ts so tests can import it without binding a port.
 */

import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { pollsRouter } from "./routes/polls.js";
import { errorHandler, notFound } from "./middleware/errors.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigins,
      // The client reads/sends these custom headers, so CORS must allow them.
      allowedHeaders: ["Content-Type", "Authorization", "X-Voter-Token"],
    }),
  );
  app.use(express.json({ limit: "50kb" }));

  app.use(healthRouter);
  app.use("/auth", authRouter);
  app.use("/polls", pollsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
