import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./common/logger";
import { prisma } from "./config/db";
import { startReservationExpirationJob } from "./jobs/reservation-expiration.job";

async function main() {
  await prisma.$connect();
  logger.info("Connected to PostgreSQL");

  const app = createApp();

  startReservationExpirationJob();

  const server = app.listen(env.port, () => {
    logger.info(`PDPMRS backend listening on port ${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error("Fatal startup error", { error: err instanceof Error ? err.message : err });
  process.exit(1);
});
