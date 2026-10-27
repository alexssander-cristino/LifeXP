/**
 * LifeXP — Motor de progressao (XP e niveis).
 *
 * Toda a calculacao ocorre no servidor. O cliente nunca envia XP para ser aceito.
 *
 * Formula (documentada em docs/level-formula.md):
 *   - Custo para subir do nivel n para n+1 = round(100 * (n + 1) ^ 1.4)
 *   - XP acumulado necessario para atingir o nivel L = soma dos custos de 1 ate L-1
 *   - Nivel de um usuario = maior L tal que XP_acumulado(L) <= XP_total
 */

import { Prisma, PrismaClient, User } from "@prisma/client";
import { db } from "./db.js";

export const LEVEL_BASE = 100;
export const LEVEL_EXPONENT = 1.4;

/** XP necessario para ir do nivel `level` para o proximo. */
export function xpCostForLevel(level: number): number {
  return Math.round(LEVEL_BASE * Math.pow(Math.max(1, level) + 1, LEVEL_EXPONENT));
}

/** XP acumulado necessario para atingir o nivel alvo (partindo do 1). */
export function xpRequiredForLevel(targetLevel: number): number {
  let total = 0;
  for (let l = 1; l < Math.max(1, targetLevel); l += 1) {
    total += xpCostForLevel(l);
  }
  return total;
}

/** Descobre o nivel a partir do XP total. */
export function levelForXp(totalXp: number): {
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
} {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= xp) {
    level += 1;
  }
  return {
    level,
    xpForCurrentLevel: xpRequiredForLevel(level),
    xpForNextLevel: xpRequiredForLevel(level + 1),
  };
}

/** Contexto de transacao (Prisma client ou transaction client). */
type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/** Concede XP de forma atomica: atualiza saldo/nivel do usuario e registra ledger imutavel. */
export async function awardXp(args: {
  userId: string;
  amount: number;
  reason: string;
  referenceId?: string | null;
  referenceType?: string | null;
  tx?: Tx;
}): Promise<{
  user: User;
  entry: Prisma.XpLedgerGetPayload<{}>;
  leveledUp: boolean;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
}> {
  const { tx = db } = args;
  if (!Number.isFinite(args.amount) || args.amount === 0) {
    throw new Error("Valor de XP invalido");
  }

  const user = await tx.user.findUnique({ where: { id: args.userId } });
  if (!user) {
    throw new Error("Usuario nao encontrado");
  }
  if (user.deletedAt) {
    throw new Error("Usuario desativado");
  }

  const beforeXp = user.xp;
  const beforeLevel = user.level;
  const afterXp = Math.max(0, beforeXp + args.amount);
  const { level: afterLevel, xpForCurrentLevel, xpForNextLevel } = levelForXp(afterXp);

  // Quando ja estamos dentro de uma transacao (tx fornecido), operamos diretamente.
  // Caso contrario, usamos db.$transaction para atomicidade.
  if (tx !== db) {
    const [updated, entry] = await Promise.all([
      tx.user.update({
        where: { id: args.userId },
        data: { xp: afterXp, level: afterLevel },
      }),
      tx.xpLedger.create({
        data: {
          userId: args.userId,
          amount: args.amount,
          reason: args.reason,
          referenceId: args.referenceId ?? null,
          referenceType: args.referenceType ?? null,
          levelBefore: beforeLevel,
          levelAfter: afterLevel,
          xpBefore: beforeXp,
          xpAfter: afterXp,
        },
      }),
    ]);
    return {
      user: updated,
      entry,
      leveledUp: afterLevel > beforeLevel,
      xpForCurrentLevel,
      xpForNextLevel,
    };
  }

  const [updated, entry] = await db.$transaction([
    db.user.update({
      where: { id: args.userId },
      data: { xp: afterXp, level: afterLevel },
    }),
    db.xpLedger.create({
      data: {
        userId: args.userId,
        amount: args.amount,
        reason: args.reason,
        referenceId: args.referenceId ?? null,
        referenceType: args.referenceType ?? null,
        levelBefore: beforeLevel,
        levelAfter: afterLevel,
        xpBefore: beforeXp,
        xpAfter: afterXp,
      },
    }),
  ]);

  return {
    user: updated,
    entry,
    leveledUp: afterLevel > beforeLevel,
    xpForCurrentLevel,
    xpForNextLevel,
  };
}

/** Recalcula progressao a partir do ledger imutavel (correcao de consistencia). */
export async function recalculateProgress(args: {
  userId: string;
  tx?: Tx;
}): Promise<{
  userId: string;
  xp: number;
  level: number;
  eventsProcessed: number;
}> {
  const { tx = db } = args;
  const total = await tx.xpLedger.aggregate({
    where: { userId: args.userId },
    _sum: { amount: true },
  });
  const count = await tx.xpLedger.count({ where: { userId: args.userId } });
  const totalXp = Math.max(0, Math.floor(Number(total._sum.amount ?? 0)));
  const { level } = levelForXp(totalXp);

  const user = await tx.user.update({
    where: { id: args.userId },
    data: { xp: totalXp, level },
  });

  return {
    userId: user.id,
    xp: user.xp,
    level: user.level,
    eventsProcessed: count,
  };
}

export type TxType = Tx;
