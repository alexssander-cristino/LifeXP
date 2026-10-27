import { z } from "zod";
import { UUID } from "./common.js";

export const AchievementResponse = z.object({
  id: UUID,
  code: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  badgeUrl: z.string().nullable(),
  xpReward: z.number(),
  criteria: z.record(z.string(), z.any()).nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type AchievementResponse = z.infer<typeof AchievementResponse>;

export const UserAchievementResponse = z.object({
  id: UUID,
  userId: UUID,
  achievementId: UUID,
  achievement: AchievementResponse.nullable(),
  earnedAt: z.string(),
  notified: z.boolean(),
});
export type UserAchievementResponse = z.infer<typeof UserAchievementResponse>;

export const ChallengeResponse = z.object({
  id: UUID,
  code: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  type: z.enum(["weekly", "monthly", "custom"]),
  startsAt: z.string(),
  endsAt: z.string(),
  xpReward: z.number(),
  criteria: z.record(z.string(), z.any()).nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type ChallengeResponse = z.infer<typeof ChallengeResponse>;

export const ChallengeParticipantResponse = z.object({
  id: UUID,
  userId: UUID,
  challengeId: UUID,
  joinedAt: z.string(),
  completedAt: z.string().nullable(),
  progress: z.record(z.string(), z.any()).nullable(),
  claimed: z.boolean(),
});
export type ChallengeParticipantResponse = z.infer<typeof ChallengeParticipantResponse>;

export const JoinChallengeSchema = z.object({});
export type JoinChallengeInput = z.infer<typeof JoinChallengeSchema>;

export const ClaimChallengeSchema = z.object({});
export type ClaimChallengeInput = z.infer<typeof ClaimChallengeSchema>;
