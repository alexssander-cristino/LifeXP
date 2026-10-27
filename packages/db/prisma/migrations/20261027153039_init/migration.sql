-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EPIC');

-- CreateEnum
CREATE TYPE "MissionType" AS ENUM ('ONE_TIME', 'DAILY', 'WEEKLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "OccurrenceStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('DARK', 'LIGHT');

-- CreateEnum
CREATE TYPE "AttributeCategory" AS ENUM ('SAUDE', 'CONHECIMENTO', 'DISCIPLINA', 'PRODUTIVIDADE', 'FINANCAS', 'RELACIONAMENTOS');

-- CreateEnum
CREATE TYPE "HabitFrequency" AS ENUM ('DAILY', 'WEEKLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'PUSH', 'EMAIL');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "dayStartHour" INTEGER NOT NULL DEFAULT 8,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "theme" "Theme" NOT NULL DEFAULT 'DARK',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyToken" TEXT,
    "emailVerifyExpires" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "privacyProfilePublic" BOOLEAN NOT NULL DEFAULT false,
    "dataExportRequestedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'geral',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "type" "MissionType" NOT NULL DEFAULT 'ONE_TIME',
    "recurrence" JSONB,
    "dueAt" TIMESTAMP(3),
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "goldReward" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_occurrences" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "OccurrenceStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "mission_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "occurrenceId" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xpAwarded" INTEGER NOT NULL,
    "idempotencyKey" TEXT,

    CONSTRAINT "mission_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_ledger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "levelBefore" INTEGER NOT NULL,
    "levelAfter" INTEGER NOT NULL,
    "xpBefore" INTEGER NOT NULL,
    "xpAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_attributes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "AttributeCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "targetValue" INTEGER,
    "unit" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "badgeUrl" TEXT,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "criteria" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ChallengeType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "criteria" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_participants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "progress" JSONB,
    "claimed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "challenge_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "frequency" "HabitFrequency" NOT NULL DEFAULT 'DAILY',
    "daysOfWeek" INTEGER[],
    "targetPerDay" INTEGER NOT NULL DEFAULT 1,
    "targetWeekly" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "logDate" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "externalId" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionReminders" BOOLEAN NOT NULL DEFAULT true,
    "achievementAlerts" BOOLEAN NOT NULL DEFAULT true,
    "levelUpAlerts" BOOLEAN NOT NULL DEFAULT true,
    "habitReminders" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_emailVerifyToken_key" ON "users"("emailVerifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "missions_userId_idx" ON "missions"("userId");

-- CreateIndex
CREATE INDEX "missions_userId_isActive_idx" ON "missions"("userId", "isActive");

-- CreateIndex
CREATE INDEX "missions_userId_type_idx" ON "missions"("userId", "type");

-- CreateIndex
CREATE INDEX "mission_occurrences_missionId_idx" ON "mission_occurrences"("missionId");

-- CreateIndex
CREATE INDEX "mission_occurrences_userId_dueDate_idx" ON "mission_occurrences"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "mission_occurrences_userId_status_idx" ON "mission_occurrences"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "mission_occurrences_missionId_dueDate_key" ON "mission_occurrences"("missionId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "mission_completions_idempotencyKey_key" ON "mission_completions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "mission_completions_userId_idx" ON "mission_completions"("userId");

-- CreateIndex
CREATE INDEX "mission_completions_missionId_idx" ON "mission_completions"("missionId");

-- CreateIndex
CREATE INDEX "mission_completions_completedAt_idx" ON "mission_completions"("completedAt");

-- CreateIndex
CREATE INDEX "xp_ledger_userId_idx" ON "xp_ledger"("userId");

-- CreateIndex
CREATE INDEX "xp_ledger_userId_createdAt_idx" ON "xp_ledger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "xp_ledger_reason_idx" ON "xp_ledger"("reason");

-- CreateIndex
CREATE INDEX "user_attributes_userId_idx" ON "user_attributes"("userId");

-- CreateIndex
CREATE INDEX "user_attributes_userId_category_idx" ON "user_attributes"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "user_attributes_userId_name_key" ON "user_attributes"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

-- CreateIndex
CREATE INDEX "user_achievements_userId_idx" ON "user_achievements"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "challenges_code_key" ON "challenges"("code");

-- CreateIndex
CREATE INDEX "challenge_participants_challengeId_idx" ON "challenge_participants"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_participants_userId_challengeId_key" ON "challenge_participants"("userId", "challengeId");

-- CreateIndex
CREATE INDEX "habits_userId_idx" ON "habits"("userId");

-- CreateIndex
CREATE INDEX "habits_userId_isActive_idx" ON "habits"("userId", "isActive");

-- CreateIndex
CREATE INDEX "habit_logs_userId_idx" ON "habit_logs"("userId");

-- CreateIndex
CREATE INDEX "habit_logs_habitId_idx" ON "habit_logs"("habitId");

-- CreateIndex
CREATE INDEX "habit_logs_logDate_idx" ON "habit_logs"("logDate");

-- CreateIndex
CREATE UNIQUE INDEX "habit_logs_userId_habitId_logDate_key" ON "habit_logs"("userId", "habitId", "logDate");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_occurrences" ADD CONSTRAINT "mission_occurrences_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_completions" ADD CONSTRAINT "mission_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_completions" ADD CONSTRAINT "mission_completions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_completions" ADD CONSTRAINT "mission_completions_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "mission_occurrences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_attributes" ADD CONSTRAINT "user_attributes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
