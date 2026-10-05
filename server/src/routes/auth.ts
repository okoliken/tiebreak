import { Router } from "express";
import { notImplemented } from "../middleware/errors.js";

export const authRouter = Router();

/**
 * POST /auth/signup  { name, email, password } -> { token, user }
 *
 * 1. Validate the body with a Zod schema: name 1-40 chars, z.email(),
 *    password min 8.
 * 2. Hash the password with `hash` from @node-rs/argon2.
 * 3. prisma.user.create. If the email is taken, Prisma throws error code
 *    P2002 (unique constraint). Catch it and turn it into a 409.
 * 4. Sign a JWT: jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_TTL })
 * 5. Respond with { token, user } -- and leave passwordHash out of `user`.
 *    Write a toUser() helper once and use it in every route.
 */
authRouter.post("/signup", () => {
  throw notImplemented("signup");
});

/**
 * POST /auth/login  { email, password } -> { token, user }
 *
 * 1. Find the user by email.
 * 2. `verify(user.passwordHash, password)` from argon2.
 * 3. Wrong email and wrong password must get the SAME 401 and message.
 *    Different errors would tell an attacker which emails have accounts.
 */
authRouter.post("/login", () => {
  throw notImplemented("login");
});

/**
 * POST /auth/guest -> { token, user }
 *
 * 1. Create a User with isGuest: true, a fun name, and a random avatarSeed.
 * 2. Seed their account with the sample polls (reuse the seed module from
 *    prisma/seed.ts, so the guest content and the dev seed stay identical).
 * 3. Sign and return a token like signup does.
 */
authRouter.post("/guest", () => {
  throw notImplemented("guest");
});

/** GET /auth/me -> { user }   (requireUser, then look the user up) */
authRouter.get("/me", () => {
  throw notImplemented("me");
});
