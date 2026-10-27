import { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import {
  CreateHabitSchema,
  UpdateHabitSchema,
  LogHabitSchema,
  HabitsQuery,
} from "@lifexp/contracts";
import { HttpError } from "../middleware/types.js";
import { authenticate } from "../middleware/auth.js";
import { db } from "../lib/db.js";
import { startOfDay, subDays } from "date-fns";
import { awardXp } from "../lib/xp.js";
import { grantAchievements } from "../lib/achievements.js";
import { auditLog } from "../lib/audit.js";

function toHabitResponse(h: any) {
  return {
    id: h.id,
    userId: h.userId,
    title: h.title,
    description: h.description,
    category: h.category,
    frequency: String(h.frequency).toLowerCase(),
    daysOfWeek: h.daysOfWeek,
    targetPerDay: h.targetPerDay,
    targetWeekly: h.targetWeekly,
    isActive: h.isActive,
    archivedAt: h.archivedAt?.toISOString?.() ?? null,
    createdAt: h.createdAt?.toISOString?.() ?? null,
    updatedAt: h.updatedAt?.toISOString?.() ?? null,
  };
}

function toHabitLogResponse(l: any) {
  return {
    id: l.id,
    userId: l.userId,
    habitId: l.habitId,
    logDate: l.logDate.toISOString?.() ?? null,
    count: l.count,
    completed: l.completed,
    note: l.note,
    createdAt: l.createdAt?.toISOString?.() ?? null,
    updatedAt: l.updatedAt?.toISOString?.() ?? null,
  };
}

export default async function habitRoutes(app: FastifyInstance) {
  app.get("/habits", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { page, limit, isActive, from, to } = HabitsQuery.parse(request.query);

    const where: any = { userId };
    if (isActive !== undefined) where.isActive = isActive;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [data, total] = await db.$transaction([
      db.habit.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { title: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { logs: true } } },
      }),
      db.habit.count({ where }),
    ]);

    return reply.send({
      data: data.map((h: any) => ({
        ...toHabitResponse(h),
        logCount: h._count?.logs,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page < Math.ceil(total / limit), hasPrev: page > 1 },
    });
  });

  app.post("/habits", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const input = CreateHabitSchema.parse(request.body);
    const habit = await db.habit.create({
      data: {
        userId,
        title: input.title.trim(),
        description: input.description || null,
        category: input.category,
        frequency: input.frequency.toUpperCase() as any,
        daysOfWeek: input.daysOfWeek,
        targetPerDay: input.targetPerDay,
        targetWeekly: input.targetWeekly ?? null,
      },
    });
    await auditLog({
      userId,
      action: "habit.create",
      entity: "Habit",
      entityId: habit.id,
      metadata: { title: habit.title, frequency: habit.frequency },
    });
    return reply.code(201).send(toHabitResponse(habit));
  });

  app.get("/habits/:id", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params;
    const habit = await db.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new HttpError(404, "NOT_FOUND", "Habito nao encontrado");
    return reply.send(toHabitResponse(habit));
  });

  app.patch("/habits/:id", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params;
    const habit = await db.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new HttpError(404, "NOT_FOUND", "Habito nao encontrado");
    const input = UpdateHabitSchema.parse(request.body);
    const updated = await db.habit.update({ where: { id: habit.id }, data: { ...input } as any });
    await auditLog({ userId, action: "habit.update", entity: "Habit", entityId: habit.id });
    return reply.send(toHabitResponse(updated));
  });

  app.delete("/habits/:id", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params;
    const habit = await db.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new HttpError(404, "NOT_FOUND", "Habito nao encontrado");
    const updated = await db.habit.update({ where: { id: habit.id }, data: { isActive: false, archivedAt: new Date() } });
    await auditLog({ userId, action: "habit.archive", entity: "Habit", entityId: habit.id });
    return reply.send(toHabitResponse(updated));
  });

  app.post("/habits/:id/logs", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id: habitId } = request.params;
    const input = LogHabitSchema.parse(request.body);
    const { logDate, count, completed, note } = input;

    const habit = await db.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) throw new HttpError(404, "NOT_FOUND", "Habito nao encontrado");

    const date = logDate ? new Date(logDate) : startOfDay(new Date());
    const dayKey = startOfDay(date);

    return await db.$transaction(async (tx) => {
      const log = await tx.habitLog.upsert({
        where: { userId_habitId_logDate: { userId, habitId, logDate: dayKey } },
        update: {
          count,
          completed,
          note: note || null,
          updatedAt: new Date(),
        },
        create: {
          userId,
          habitId,
          logDate: dayKey,
          count,
          completed,
          note: note || null,
        },
      });

      if (completed) {
        await awardXp({
          userId,
          amount: 5,
          reason: "HABIT_LOG",
          referenceId: log.id,
          referenceType: "HabitLog",
          tx,
        });
        await grantAchievements({ userId, tx });
      }

      await tx.auditLog.create({
        data: { userId, action: "habit.log", entity: "HabitLog", entityId: log.id, metadata: { habitId, count, completed } },
      });

      return reply.code(201).send(toHabitLogResponse(log));
    });
  });

  app.get("/habits/:id/logs", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id: habitId } = request.params;
    const { from, to } = request.query;

    const habit = await db.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) throw new HttpError(404, "NOT_FOUND", "Habito nao encontrado");

    const where: any = { userId, habitId };
    if (from || to) {
      where.logDate = {};
      if (from) where.logDate.gte = new Date(from);
      if (to) where.logDate.lte = new Date(to);
    }

    const logs = await db.habitLog.findMany({
      where,
      orderBy: { logDate: "desc" },
      take: 100,
    });
    return reply.send({ data: logs.map(toHabitLogResponse) });
  });

  app.get("/habits/:id/stats", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id: habitId } = request.params;

    const habit = await db.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) throw new HttpError(404, "NOT_FOUND", "Habito nao encontrado");

    const from = subDays(startOfDay(new Date()), 29);
    const logs = await db.habitLog.findMany({
      where: { userId, habitId, logDate: { gte: from } },
      orderBy: { logDate: "asc" },
    });

    const days = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i);
      return startOfDay(d).toISOString?.() ?? null;
    });
    const logByDate = new Map(logs.map((l: any) => [startOfDay(l.logDate).toISOString?.() ?? null, l]));

    const series = days.map((d) => {
      const l = logByDate.get(d);
      return { date: d, count: l ? l.count : 0, completed: l ? l.completed : false };
    });
    const completedDays = series.filter((s: any) => s.completed).length;
    return reply.send({ habitId, periodDays: 30, completedDays, completionRate: Number(((completedDays / 30) * 100).toFixed(2)), series });
  });
}
