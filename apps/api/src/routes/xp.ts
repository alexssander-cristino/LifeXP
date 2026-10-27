import { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { XpLedgerQuery } from "@lifexp/contracts";
import { HttpError } from "../middleware/types.js";
import { authenticate } from "../middleware/auth.js";
import { db } from "../lib/db.js";
import { levelForXp, recalculateProgress } from "../lib/xp.js";
import { auditLog } from "../lib/audit.js";

export default async function xpRoutes(app: FastifyInstance) {
  app.get("/xp/me", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, xp: true, level: true },
    });
    if (!user) throw new HttpError(404, "NOT_FOUND", "Usuario nao encontrado");

    const { xpForCurrentLevel, xpForNextLevel } = levelForXp(user.xp);
    const xpToNextLevel = Math.max(0, xpForNextLevel - user.xp);
    const progressPercent = Number(
      (((user.xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100).toFixed(2),
    );

    return reply.send({
      userId,
      xp: user.xp,
      level: user.level,
      xpForCurrentLevel,
      xpForNextLevel,
      progressPercent,
      xpToNextLevel,
    });
  });

  app.get("/xp/ledger", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { page, limit, reason, from, to } = XpLedgerQuery.parse(request.query);

    const where: any = { userId };
    if (reason) where.reason = reason;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [data, total] = await db.$transaction([
      db.xpLedger.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.xpLedger.count({ where }),
    ]);

    return reply.send({
      data: data.map((e: any) => ({
        id: e.id,
        userId: e.userId,
        amount: e.amount,
        reason: e.reason,
        referenceId: e.referenceId,
        referenceType: e.referenceType,
        levelBefore: e.levelBefore,
        levelAfter: e.levelAfter,
        xpBefore: e.xpBefore,
        xpAfter: e.xpAfter,
        createdAt: e.createdAt.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page < Math.ceil(total / limit), hasPrev: page > 1 },
    });
  });

  app.post("/xp/recalc", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const result = await recalculateProgress({ userId });
    await auditLog({ userId, action: "xp.recalculate", entity: "User", entityId: userId });
    return reply.send(result);
  });
}
