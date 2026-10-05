import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";

const server = createApp().listen(env.PORT, () => {
  console.log(`tiebreak api on http://localhost:${env.PORT}  [${env.NODE_ENV}]`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    // Open SSE streams keep server.close() waiting forever; don't let them.
    server.closeAllConnections();
  });
}
