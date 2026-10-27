/**
 * LifeXP — Seed de desenvolvimento.
 *
 * Executa com: npm run db:seed (workspace packages/db)
 * Os dados aqui inseridos sao explicitamente identificados como SEED e devem
 * ser usados apenas em ambiente de desenvolvimento/homologacao.
 */

import { PrismaClient, Difficulty, MissionType, Theme } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de desenvolvimento...");

  // Senha: "Senha@123" (apenas para desenvolvimento)
  const argon2 = require("argon2");
  const passwordHash = await argon2.hash("Senha@123");

  const user = await prisma.user.upsert({
    where: { email: "dev@lifexp.local" },
    update: {},
    create: {
      email: "dev@lifexp.local",
      name: "Usuário Dev",
      passwordHash,
      timezone: "America/Sao_Paulo",
      dayStartHour: 8,
      locale: "pt-BR",
      theme: Theme.DARK,
      emailVerified: true,
      xp: 0,
      level: 1,
    },
  });

  // Configuracoes de sistema (recompensas por dificuldade)
  await prisma.systemConfig.upsert({
    where: { key: "xp_rewards" },
    update: {},
    create: {
      key: "xp_rewards",
      value: {
        EASY: 15,
        MEDIUM: 30,
        HARD: 60,
        EPIC: 120,
      },
    },
  });
  await prisma.systemConfig.upsert({
    where: { key: "level_formula" },
    update: {},
    create: {
      key: "level_formula",
      value: {
        description:
          "XP necessario para ir do nivel n para n+1 = round(100 * (n+1)^1.4). Total acumulado e a soma dos niveis anteriores.",
        base: 100,
        exponent: 1.4,
      },
    },
  });

  // Conquistas base
  const achievements = [
    {
      code: "first_mission",
      title: "Primeiros Passos",
      description: "Conclua sua primeira missao.",
      xpReward: 20,
      criteria: { type: "mission_completion_count", threshold: 1 },
    },
    {
      code: "week_warrior",
      title: "Guerreiro da Semana",
      description: "Conclua 7 missoes em uma semana.",
      xpReward: 50,
      criteria: { type: "weekly_mission_count", threshold: 7 },
    },
    {
      code: "level_5",
      title: "Nivel 5",
      description: "Alcance o nivel 5.",
      xpReward: 100,
      criteria: { type: "user_level", threshold: 5 },
    },
    {
      code: "habit_streak_3",
      title: "Constancia",
      description: "Mantenha um habito ativo por 3 dias consecutivos.",
      xpReward: 30,
      criteria: { type: "habit_streak", threshold: 3 },
    },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      update: {},
      create: a,
    });
  }

  // Missoes de exemplo para o usuario dev
  const now = new Date();
  const missions = [
    {
      title: "Beber 2 litros de agua",
      description: "Mantenca-se hidratado ao longo do dia.",
      category: "saude",
      difficulty: Difficulty.EASY,
      type: MissionType.DAILY,
      xpReward: 15,
    },
    {
      title: "Ler 20 paginas de um livro",
      description: "Reserve um tempo para leitura diaria.",
      category: "conhecimento",
      difficulty: Difficulty.MEDIUM,
      type: MissionType.DAILY,
      xpReward: 30,
    },
    {
      title: "Revisar financas da semana",
      description: "Lancar gastos e verificar o orcamento.",
      category: "financas",
      difficulty: Difficulty.MEDIUM,
      type: MissionType.WEEKLY,
      xpReward: 40,
    },
  ];

  for (const m of missions) {
    await prisma.mission.create({
      data: {
        ...m,
        userId: user.id,
      },
    });
  }

  // Preferencias de notificacao
  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      missionReminders: true,
      achievementAlerts: true,
      levelUpAlerts: true,
      habitReminders: true,
      emailEnabled: false,
      pushEnabled: false,
    },
  });

  console.log(`Seed concluido. Usuario: ${user.email}`);
  console.log("Credenciais dev: dev@lifexp.local / Senha@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
