/**
 * One shared PrismaClient for the whole process -- it owns the connection pool.
 *
 * Prisma 7 talks to Postgres through a driver adapter (node-postgres here)
 * instead of the old bundled Rust engine, so the client is handed one.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "../config/env.js";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
    log: env.isProduction ? ["error"] : ["warn", "error"],
  });

if (!env.isProduction) globalForPrisma.prisma = prisma;
