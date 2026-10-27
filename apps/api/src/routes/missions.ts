import { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import {
  CreateMissionSchema,
  UpdateMissionSchema,
  CompleteMissionSchema,
  MissionsQuery,
} from "@lifexp/contracts";
import { HttpError } from "../middleware/types.js";
import { authenticate } from "../middleware/auth.js";
import { db } from "../lib/db.js";
import { awardXp } from "../lib/xp.js";
import { grantAchievements } from "../lib/achievements.js";
import { auditLog } from "../lib/audit.js";

function toMissionResponse(m: any) {
  return {
    id: m.id,
    userId: m.userId,
    title: m.title,
    description: m.description,
    category: m.category,
    difficulty: String(m.difficulty).toLowerCase(),
    type: String(m.type).toLowerCase(),
    recurrence: m.recurrence,
    dueAt: m.dueAt?.toISOString?.() ?? null,
    xpReward: m.xpReward,
    goldReward: m.goldReward,
    isActive: m.isActive,
    archivedAt: m.archivedAt?.toISOString?.() ?? null,
    createdAt: m.createdAt?.toISOString?.() ?? null,
    updatedAt: m.updatedAt?.toISOString?.() ?? null,
  };
}

function toOccurrenceResponse(o: any) {
  return {
    id: o.id,
    missionId: o.missionId,
    userId: o.userId,
    dueDate: o.dueDate.toISOString?.() ?? null,
    status: String(o.status).toLowerCase(),
    completedAt: o.completedAt?.toISOString() ?? null,
    mission: o.mission ? toMissionResponse(o.mission) : null,
  };
}

function toCompletionResponse(c: any) {
  return {
    id: c.id,
    userId: c.userId,
    missionId: c.missionId,
    occurrenceId: c.occurrenceId,
    completedAt: c.completedAt.toISOString?.() ?? null,
    xpAwarded: c.xpAwarded,
    idempotencyKey: c.idempotencyKey,
  };
}

export default async function missionRoutes(app: FastifyInstance) {
  app.get("/missions", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { page, limit, status, type, category, from, to } = MissionsQuery.parse(request.query);

    const where: any = { userId };
    if (type) where.type = type.toUpperCase();
    if (category) where.category = category;
    if (from || to) {
      where.dueAt = {};
      if (from) where.dueAt.gte = new Date(from);
      if (to) where.dueAt.lte = new Date(to);
    }

    const [data, total] = await db.$transaction([
      db.mission.findMany({
        where,
        orderBy: [{ isActive: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.mission.count({ where }),
    ]);

    return reply.send({
      data: data.map(toMissionResponse),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page < Math.ceil(total / limit), hasPrev: page > 1 },
    });
  });

  app.post("/missions", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const input = CreateMissionSchema.parse(request.body);

    const capRow = await db.systemConfig.findUnique({ where: { key: "xp_rewards" } });
    const cap = capRow ? Number((capRow.value as any)?.MAX_CAP ?? 500) : 500;
    if (input.xpReward < 0 || input.xpReward > cap) {
      throw new HttpError(400, "BAD_REQUEST", `Recompensa de XP deve estar entre 0 e ${cap}`);
    }

    const mission = await db.mission.create({
      data: {
        userId,
        title: input.title,
        description: input.description || null,
        category: input.category,
        difficulty: input.difficulty.toUpperCase() as any,
        type: input.type.toUpperCase() as any,
        recurrence: Object.keys(input.recurrence).length ? input.recurrence : (null as any),
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        xpReward: input.xpReward,
        goldReward: input.goldReward ?? null,
      },
    });

    await auditLog({
      userId,
      action: "mission.create",
      entity: "Mission",
      entityId: mission.id,
      metadata: { title: mission.title, difficulty: mission.difficulty, xpReward: mission.xpReward },
    });
    return reply.code(201).send(toMissionResponse(mission));
  });

  app.get("/missions/:id", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params;
    const mission = await db.mission.findFirst({ where: { id, userId } });
    if (!mission) throw new HttpError(404, "NOT_FOUND", "Missao nao encontrada");
    return reply.send(toMissionResponse(mission));
  });

  app.patch("/missions/:id", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params;
    const mission = await db.mission.findFirst({ where: { id, userId } });
    if (!mission) throw new HttpError(404, "NOT_FOUND", "Missao nao encontrada");

    const input = UpdateMissionSchema.parse(request.body);

    const capRow = await db.systemConfig.findUnique({ where: { key: "xp_rewards" } });
    const cap = capRow ? Number((capRow.value as any)?.MAX_CAP ?? 500) : 500;
    const data: any = { ...input };
    if (data.xpReward !== undefined && (data.xpReward < 0 || data.xpReward > cap)) {
      throw new HttpError(400, "BAD_REQUEST", `Recompensa de XP deve estar entre 0 e ${cap}`);
    }
    if (data.dueAt !== undefined) data.dueAt = data.dueAt ? new Date(data.dueAt) : null;
    if (data.recurrence && Object.keys(data.recurrence).length === 0) data.recurrence = null;

    const updated = await db.mission.update({ where: { id: mission.id }, data });
    await auditLog({ userId, action: "mission.update", entity: "Mission", entityId: mission.id });
    return reply.send(toMissionResponse(updated));
  });

  app.delete("/missions/:id", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params;
    const mission = await db.mission.findFirst({ where: { id, userId } });
    if (!mission) throw new HttpError(404, "NOT_FOUND", "Missao nao encontrada");
    const updated = await db.mission.update({ where: { id: mission.id }, data: { isActive: false, archivedAt: new Date() } });
    await auditLog({ userId, action: "mission.archive", entity: "Mission", entityId: mission.id });
    return reply.send(toMissionResponse(updated));
  });

  app.post("/missions/:id/complete", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id: missionId } = request.params;
    const input = CompleteMissionSchema.parse(request.body);
    const { idempotencyKey } = input;

    return await db.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(`SELECT id FROM "missions" WHERE id = $1 FOR UPDATE`, missionId);

      if (idempotencyKey) {
        const existing = await tx.missionCompletion.findUnique({ where: { idempotencyKey } });
        if (existing) {
          if (existing.userId !== userId) {
            throw new HttpError(409, "CONFLICT", "Chave de idempotencia ja utilizada");
          }
          await auditLog({ userId, action: "mission.complete_idempotent_repeat", entity: "MissionCompletion", entityId: existing.id });
          const mission = await tx.mission.findUnique({ where: { id: missionId } });
          return reply.send({ completion: toCompletionResponse(existing), duplicate: true, mission: toMissionResponse(mission) });
        }
      }

      const mission = await tx.mission.findUnique({ where: { id: missionId } });
      if (!mission || mission.userId !== userId) {
        throw new HttpError(404, "NOT_FOUND", "Missao nao encontrada");
      }
      if (!mission.isActive) {
        throw new HttpError(400, "BAD_REQUEST", "Missao inativa");
      }

      const existingCompletion = await tx.missionCompletion.findFirst({
        where: { userId, missionId, occurrenceId: null },
      });
      if (existingCompletion) {
        throw new HttpError(409, "CONFLICT", "Missao ja concluida");
      }

      const completion = await tx.missionCompletion.create({
        data: {
          userId,
          missionId,
          occurrenceId: null,
          completedAt: new Date(),
          xpAwarded: mission.xpReward,
          idempotencyKey: idempotencyKey ?? null,
        },
      });

      const result = await awardXp({
        userId,
        amount: mission.xpReward,
        reason: "MISSION_COMPLETION",
        referenceId: completion.id,
        referenceType: "MissionCompletion",
        tx,
      });

      await tx.notification.create({
        data: { userId, type: "mission_completed", title: "Missao concluida!", body: mission.title, channel: "IN_APP" },
      });
      await auditLog({
        userId,
        action: "mission.complete",
        entity: "Mission",
        entityId: missionId,
        metadata: { xpAwarded: mission.xpReward, levelBefore: result.user.level - (result.leveledUp ? 1 : 0), levelAfter: result.user.level },
      });

      await grantAchievements({ userId, tx });

      return reply.send({
        completion: toCompletionResponse(completion),
        duplicate: false,
        xpAwarded: mission.xpReward,
        leveledUp: result.leveledUp,
        level: result.user.level,
        xp: result.user.xp,
        xpForNextLevel: result.xpForNextLevel,
      });
    });
  });

  app.get("/missions/occurrences", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { from, to } = request.query;
    const where: any = { userId };
    if (from || to) {
      where.dueDate = {};
      if (from) where.dueDate.gte = new Date(from);
      if (to) where.dueDate.lte = new Date(to);
    }
    const occurrences = await db.missionOccurrence.findMany({
      where,
      include: { mission: true },
      orderBy: { dueDate: "asc" },
      take: 200,
    });
    return reply.send({ data: occurrences.map(toOccurrenceResponse) });
  });
}
