/**
 * LifeXP — Log de auditoria.
 * Registra operações relevantes sem armazenar senhas, tokens ou dados sensíveis.
 */

import { PrismaClient } from "@prisma/client";
import { db } from "./db.js";

export async function auditLog(args: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  tx?: PrismaClient;
}) {
  const tx = args.tx ?? db;
  await tx.auditLog.create({
    data: {
      userId: args.userId ?? null,
      action: args.action,
      entity: args.entity,
      entityId: args.entityId ?? null,
      metadata: (args.metadata ?? undefined) as any,
      ip: args.ip ?? null,
    },
  });
}
