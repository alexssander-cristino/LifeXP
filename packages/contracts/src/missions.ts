import { z } from "zod";
import { UUID, NonEmptyString, PaginationQuery } from "./common.js";
import { DifficultySchema, MissionTypeSchema, OccurrenceStatusSchema } from "./common.js";

export const CreateMissionSchema = z.object({
  title: NonEmptyString.max(200, "Titulo muito longo"),
  description: z.string().max(2000, "Descricao muito longa").optional().default(""),
  category: z.string().min(1).max(50, "Categoria muito longa").default("geral"),
  difficulty: DifficultySchema.default("medium"),
  type: MissionTypeSchema.default("one_time"),
  recurrence: z.record(z.string(), z.any()).optional().default({}),
  dueAt: z.string().datetime({ message: "Prazo invalido (ISO 8601)" }).optional().nullable(),
  xpReward: z.coerce.number().int().min(0).max(500, "Recompensa de XP acima do limite permitido").default(0),
  goldReward: z.coerce.number().int().min(0).max(10000).optional().nullable(),
});
export type CreateMissionInput = z.infer<typeof CreateMissionSchema>;

export const UpdateMissionSchema = CreateMissionSchema.partial().omit({ type: true }).strict();
export type UpdateMissionInput = z.infer<typeof UpdateMissionSchema>;

export const CompleteMissionSchema = z.object({
  idempotencyKey: UUID.optional(),
});
export type CompleteMissionInput = z.infer<typeof CompleteMissionSchema>;

export const MissionResponse = z.object({
  id: UUID,
  userId: UUID,
  title: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  difficulty: z.enum(["easy", "medium", "hard", "epic"]),
  type: z.enum(["one_time", "daily", "weekly", "custom"]),
  recurrence: z.record(z.string(), z.any()).nullable(),
  dueAt: z.string().nullable(),
  xpReward: z.number(),
  goldReward: z.number().nullable(),
  isActive: z.boolean(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MissionResponse = z.infer<typeof MissionResponse>;

export const MissionOccurrenceResponse = z.object({
  id: UUID,
  missionId: UUID,
  userId: UUID,
  dueDate: z.string(),
  status: OccurrenceStatusSchema,
  completedAt: z.string().nullable(),
  mission: MissionResponse.nullable(),
});
export type MissionOccurrenceResponse = z.infer<typeof MissionOccurrenceResponse>;

export const MissionCompletionResponse = z.object({
  id: UUID,
  userId: UUID,
  missionId: UUID,
  occurrenceId: UUID.nullable(),
  completedAt: z.string(),
  xpAwarded: z.number(),
  idempotencyKey: z.string().nullable(),
});
export type MissionCompletionResponse = z.infer<typeof MissionCompletionResponse>;

export const MissionsQuery = PaginationQuery.extend({
  status: z.enum(["pending", "completed", "cancelled", "expired", "all"]).default("pending"),
  type: MissionTypeSchema.optional(),
  category: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type MissionsQuery = z.infer<typeof MissionsQuery>;
