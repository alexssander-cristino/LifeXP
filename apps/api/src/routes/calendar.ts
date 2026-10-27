import { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { DateRangeQuery } from "@lifexp/contracts";
import { HttpError } from "../middleware/types.js";
import { authenticate } from "../middleware/auth.js";
import { db } from "../lib/db.js";
import { startOfDay, endOfDay, eachDayOfInterval, formatISO } from "date-fns";

export default async function calendarRoutes(app: FastifyInstance) {
  app.get("/calendar", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { start, end } = DateRangeQuery.parse(request.query);

    const fromDate = start ? new Date(start) : startOfDay(new Date());
    const endDate = end ? new Date(end) : endOfDay(new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + 30));

    if (endDate < fromDate) {
      throw new HttpError(400, "BAD_REQUEST", "Data final deve ser posterior a inicial");
    }

    const [occurrences, habitLogs] = await Promise.all([
      db.missionOccurrence.findMany({
        where: {
          userId,
          dueDate: { gte: fromDate, lte: endDate },
        },
        include: { mission: { select: { id: true, title: true, category: true, difficulty: true, xpReward: true } } },
        orderBy: { dueDate: "asc" },
      }),
      db.habitLog.findMany({
        where: { userId, logDate: { gte: fromDate, lte: endDate } },
        include: { habit: { select: { id: true, title: true, category: true } } },
        orderBy: { logDate: "asc" },
      }),
    ]);

    const days = eachDayOfInterval({ start: fromDate, end: endDate });
    const byDay = new Map<string, { missions: any[]; habits: any[] }>();
    for (const d of days) byDay.set(formatISO(d).split("T")[0], { missions: [], habits: [] });

    for (const o of occurrences) {
      const key = o.dueDate.toISOString().split("T")[0];
      const cell = byDay.get(key) || { missions: [], habits: [] };
      cell.missions.push({
        id: o.id,
        missionId: o.missionId,
        title: o.mission.title,
        category: o.mission.category,
        difficulty: String(o.mission.difficulty).toLowerCase(),
        xpReward: o.mission.xpReward,
        status: String(o.status).toLowerCase(),
        dueDate: o.dueDate.toISOString(),
      });
      byDay.set(key, cell);
    }
    for (const l of habitLogs) {
      const key = l.logDate.toISOString().split("T")[0];
      const cell = byDay.get(key) || { missions: [], habits: [] };
      cell.habits.push({
        id: l.id,
        habitId: l.habitId,
        title: l.habit.title,
        category: l.habit.category,
        count: l.count,
        completed: l.completed,
        logDate: l.logDate.toISOString(),
      });
      byDay.set(key, cell);
    }

    return reply.send({
      from: fromDate.toISOString(),
      to: endDate.toISOString(),
      days: days.map((d) => {
        const key = formatISO(d).split("T")[0];
        return { date: key, ...byDay.get(key)! };
      }),
    });
  });
}
