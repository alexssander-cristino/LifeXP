import { FastifyInstance, FastifyReply } from "fastify";
import { HttpError } from "../middleware/types.js";
import { authenticate } from "../middleware/auth.js";
import { db } from "../lib/db.js";
import { levelForXp } from "../lib/xp.js";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function dashboardRoutes(app: FastifyInstance) {
  app.get("/dashboard", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const now = new Date();
    const today = startOfDay(now);

    const [user, pendingMissions, completedMissions, todayOccurrences, recentAchievements] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { id: true, xp: true, level: true } }),
      db.mission.count({ where: { userId, isActive: true } }),
      db.missionCompletion.count({ where: { userId, completedAt: { gte: today } } }),
      db.missionOccurrence.findMany({
        where: { userId, dueDate: { gte: today }, status: "PENDING" },
        include: { mission: { select: { id: true, title: true, category: true, difficulty: true } } },
        orderBy: { dueDate: "asc" },
      }),
      db.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { earnedAt: "desc" },
        take: 5,
      }),
    ]);

    if (!user) throw new HttpError(404, "NOT_FOUND", "Usuario nao encontrado");

    const weekStart = startOfWeek(now, { locale: ptBR, weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    const [weeklyXp, monthlyXp, categoryDistribution, habitStats] = await Promise.all([
      db.xpLedger.aggregate({
        where: { userId, reason: "MISSION_COMPLETION", createdAt: { gte: weekStart, lte: endOfWeek(now) } },
        _sum: { amount: true },
      }),
      db.xpLedger.aggregate({
        where: { userId, reason: "MISSION_COMPLETION", createdAt: { gte: monthStart, lte: endOfMonth(now) } },
        _sum: { amount: true },
      }),
      db.$queryRawUnsafe(
        `SELECT m.category as category, COUNT(*)::int as total
         FROM "mission_completions" mc
         JOIN "missions" m ON m.id = mc."missionId"
         WHERE mc."userId" = $1 AND mc."completedAt" >= $2
         GROUP BY m.category
         ORDER BY total DESC`,
        userId,
        subDays(now, 30),
      ),
      db.habitLog.aggregate({
        where: { userId, completed: true, logDate: { gte: subDays(now, 7) } },
        _count: true,
      }),
    ]);

    const { xpForCurrentLevel, xpForNextLevel } = levelForXp(user.xp);
    const xpToNextLevel = Math.max(0, xpForNextLevel - user.xp);

    const upcoming = await db.missionOccurrence.findMany({
      where: { userId, status: "PENDING", dueDate: { gte: now } },
      include: { mission: { select: { id: true, title: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    return reply.send({
      level: user.level,
      xp: user.xp,
      xpForCurrentLevel,
      xpForNextLevel,
      xpToNextLevel,
      progressPercent: Number(
        (((user.xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100).toFixed(2),
      ),
      pendingMissions,
      completedMissionsToday: completedMissions,
      todayMissions: todayOccurrences.map((o: any) => ({
        id: o.id,
        title: o.mission.title,
        category: o.mission.category,
        difficulty: String(o.mission.difficulty).toLowerCase(),
        dueDate: o.dueDate.toISOString(),
      })),
      recentAchievements: recentAchievements.map((ua: any) => ({
        id: ua.id,
        code: ua.achievement.code,
        title: ua.achievement.title,
        badgeUrl: ua.achievement.badgeUrl,
        earnedAt: ua.earnedAt.toISOString(),
      })),
      weeklyXp: Number(weeklyXp._sum.amount ?? 0),
      monthlyXp: Number(monthlyXp._sum.amount ?? 0),
      categoryDistribution,
      habitCompletionsLast7Days: habitStats._count,
      upcomingGoals: upcoming.map((o: any) => ({
        id: o.id,
        title: o.mission.title,
        dueDate: o.dueDate.toISOString(),
      })),
    });
  });
}
