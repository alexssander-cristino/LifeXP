/**
 * LifeXP — Concessao de conquistas.
 *
 * Regras avaliadas no servidor. A unique constraint de user_achievements
 * (userId, achievementId) e a verificacao de existencia evitam duplicacao.
 */

import { PrismaClient } from "@prisma/client";
import { subDays, startOfDay, differenceInCalendarDays } from "date-fns";
import { db } from "./db.js";
import { awardXp } from "./xp.js";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * Avalia todas as regras de conquista para o usuario e concede as que ainda nao foram obtidas.
 * Chamado dentro de transacoes de conclusao de missao, habito e desafio.
 */
export async function grantAchievements(args: { userId: string; tx: Tx }): Promise<void> {
  const { userId, tx } = args;

  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { id: true, level: true, xp: true },
  });
  if (!user) return;

  const [completionsCount, weeklyCompletions, habitLogs] = await Promise.all([
    tx.missionCompletion.count({ where: { userId } }),
    tx.missionCompletion.count({
      where: { userId, completedAt: { gte: subDays(new Date(), 7) } },
    }),
    tx.habitLog.findMany({
      where: { userId, completed: true },
      select: { habitId: true, logDate: true },
    }),
  ]);

  const rules: Array<{
    code: string;
    check: () => Promise<boolean>;
    xpReward: number;
  }> = [
    {
      code: "first_mission",
      check: async () => completionsCount >= 1,
      xpReward: 20,
    },
    {
      code: "week_warrior",
      check: async () => weeklyCompletions >= 7,
      xpReward: 50,
    },
    {
      code: "level_5",
      check: async () => user.level >= 5,
      xpReward: 100,
    },
    {
      code: "habit_streak_3",
      check: async () => (await hasCurrentStreak(userId, tx, 3)),
      xpReward: 30,
    },
  ];

  for (const rule of rules) {
    if (!(await rule.check())) continue;

    const already = await tx.userAchievement.findFirst({
      where: { userId, achievement: { code: rule.code } },
    });
    if (already) continue;

    const achievement = await tx.achievement.findUnique({ where: { code: rule.code } });
    if (!achievement || !achievement.isActive) continue;

    await tx.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    });

    if (achievement.xpReward > 0) {
      await awardXp({
        userId,
        amount: achievement.xpReward,
        reason: "ACHIEVEMENT",
        referenceId: achievement.id,
        referenceType: "Achievement",
        tx,
      });
    }

    await tx.notification.create({
      data: {
        userId,
        type: "achievement_earned",
        title: "Conquista desbloqueada!",
        body: achievement.title,
        channel: "IN_APP",
      },
    });

    await tx.auditLog.create({
      data: { userId, action: "achievement.grant", entity: "UserAchievement", metadata: { code: rule.code } },
    });
  }
}

/** Verdadeiro se o usuario tem algum habito com sequencia atual >= dias (contando a partir de hoje atras). */
async function hasCurrentStreak(userId: string, tx: Tx, days: number): Promise<boolean> {
  const habits = await tx.habit.findMany({
    where: { userId, isActive: true },
    select: { id: true },
  });
  if (habits.length === 0) return false;

  const logs = await tx.habitLog.findMany({
    where: { userId, habitId: { in: habits.map((h) => h.id) }, completed: true },
    select: { habitId: true, logDate: true },
  });

  const byHabit = new Map<string, Set<string>>();
  for (const log of logs) {
    const key = startOfDay(log.logDate).toISOString();
    if (!byHabit.has(log.habitId)) byHabit.set(log.habitId, new Set());
    byHabit.get(log.habitId)!.add(key);
  }

  const today = startOfDay(new Date()).toISOString();
  for (const [habitId, dates] of byHabit) {
    let streak = 0;
    let cursor = today;
    while (dates.has(cursor)) {
      streak += 1;
      cursor = subDays(new Date(cursor), 1).toISOString(); // aproximacao de calendario
      cursor = startOfDay(new Date(cursor)).toISOString();
      if (streak >= days) return true;
    }
  }
  return false;
}
