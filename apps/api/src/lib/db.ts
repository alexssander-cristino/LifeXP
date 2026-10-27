/**
 * LifeXP — Clientes Prisma.
 *
 * db (write) -> primary: todas as gravacoes.
 * readDb -> replica de leitura quando ENABLE_READ_REPLICA=true, senão cai de volta no primary.
 * NUNCA enviar gravacoes para a replica.
 */

import { PrismaClient } from "@prisma/client";
import { config } from "../config.js";

const isDev = config.nodeEnv === "development";

const baseLog = isDev ? ["query", "error", "warn"] : ["error"];

export const db = new PrismaClient({
  log: baseLog as any,
});

export const readDb = new PrismaClient({
  log: baseLog as any,
  datasources: {
    db: {
      url: config.readDatabaseUrl || config.databaseUrl,
    },
  },
});

export function isReadReplicaEnabled(): boolean {
  return config.enableReadReplica && Boolean(config.readDatabaseUrl);
}

export function dbForRead() {
  return isReadReplicaEnabled() ? readDb : db;
}

export async function disconnectDb(): Promise<void> {
  await db.$disconnect();
  await readDb.$disconnect();
}
