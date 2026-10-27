import { FastifyInstance, FastifyReply } from "fastify";
import { PaginationQuery } from "@lifexp/contracts";
import { HttpError } from "../middleware/types.js";
import { authenticate } from "../middleware/auth.js";
import { db } from "../lib/db.js";
import { awardXp } from "../lib/xp.js";
import { auditLog } from "../lib/audit.js";

function toChallengeResponse(c: any) {
  return {
    id: c.id,
    code: c.code,
    title: c.title,
    description: c.description,
    type: String(c.type).toLowerCase(),
    startsAt: c.startsAt.toISOString?.() ?? null,
    endsAt: c.endsAt.toISOString?.() ?? null,
    xpReward: c.xpReward,
    criteria: c.criteria,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString?.() ?? null,
  };
}

export default async function challengeRoutes(app: FastifyInstance) {
  app.get("/challenges", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const { page, limit } = PaginationQuery.parse(request.query);
    const now = new Date();
    const [data, total] = await db.$transaction([
      db.challenge.findMany({
        where: { isActive: true, endsAt: { gte: now } },
        orderBy: { endsAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.challenge.count({ where: { isActive: true, endsAt: { gte: now } } }),
    ]);
    return reply.send({
      data: data.map(toChallengeResponse),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page < Math.ceil(total / limit), hasPrev: page > 1 },
    });
  });

  app.post("/challenges/:id/join", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params;
    const challenge = await db.challenge.findFirst({ where: { id, isActive: true } });
    if (!challenge) throw new HttpError(404, "NOT_FOUND", "Desafio nao encontrado");

    const participant = await db.challengeParticipant.upsert({
      where: { userId_challengeId: { userId, challengeId: challenge.id } },
      update: {},
      create: { userId, challengeId: challenge.id },
    });
    await auditLog({ userId, action: "challenge.join", entity: "ChallengeParticipant", entityId: participant.id });
    return reply.code(201).send({ id: participant.id, challengeId: participant.challengeId, joinedAt: participant.joinedAt.toISOString?.() ?? null });
  });

  app.post("/challenges/:id/claim", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params;
    const participant = await db.challengeParticipant.findFirst({
      where: { userId, challengeId: id },
      include: { challenge: true },
    });
    if (!participant) throw new HttpError(404, "NOT_FOUND", "Participacao nao encontrada");
    if (participant.claimed) throw new HttpError(409, "CONFLICT", "Recompensa ja resgatada");
    if (participant.challenge.endsAt > new Date()) throw new HttpError(400, "BAD_REQUEST", "Desafio ainda nao encerrou");

    const result = await awardXp({
      userId,
      amount: participant.challenge.xpReward,
      reason: "CHALLENGE",
      referenceId: participant.id,
      referenceType: "ChallengeParticipant",
    });

    await db.challengeParticipant.update({ where: { id: participant.id }, data: { claimed: true, completedAt: new Date() } });
    await db.notification.create({
      data: { userId, type: "challenge_completed", title: "Desafio completado!", body: participant.challenge.title, channel: "IN_APP" },
    });
    await db.auditLog.create({ data: { userId, action: "challenge.claim", entity: "ChallengeParticipant", entityId: participant.id } });

    return reply.send({ xpAwarded: participant.challenge.xpReward, leveledUp: result.leveledUp, level: result.user.level, xp: result.user.xp });
  });
}
