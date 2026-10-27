import { FastifyInstance, FastifyReply } from "fastify";
import { PaginationQuery } from "@lifexp/contracts";
import { authenticate } from "../middleware/auth.js";
import { db } from "../lib/db.js";

function toAchievementResponse(a: any) {
  return {
    id: a.id,
    code: a.code,
    title: a.title,
    description: a.description,
    badgeUrl: a.badgeUrl,
    xpReward: a.xpReward,
    criteria: a.criteria,
    isActive: a.isActive,
    createdAt: a.createdAt.toISOString(),
  };
}

export default async function achievementRoutes(app: FastifyInstance) {
  app.get("/achievements", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const achievements = await db.achievement.findMany({ where: { isActive: true }, orderBy: { title: "asc" } });
    return reply.send({ data: achievements.map(toAchievementResponse) });
  });

  app.get("/users/achievements", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { page, limit } = PaginationQuery.parse(request.query);

    const [data, total] = await db.$transaction([
      db.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { earnedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.userAchievement.count({ where: { userId } }),
    ]);

    return reply.send({
      data: data.map((ua: any) => ({
        id: ua.id,
        userId: ua.userId,
        achievementId: ua.achievementId,
        achievement: toAchievementResponse(ua.achievement),
        earnedAt: ua.earnedAt.toISOString(),
        notified: ua.notified,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page < Math.ceil(total / limit), hasPrev: page > 1 },
    });
  });
}
