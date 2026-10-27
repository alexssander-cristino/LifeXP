import { z } from "zod";
import { UUID, PaginationQuery } from "./common.js";
import { HabitFrequencySchema } from "./common.js";

export const CreateHabitSchema = z.object({
  title: z.string().min(1).max(200, "Titulo muito longo"),
  description: z.string().max(1000).optional().default(""),
  category: z.string().min(1).max(50).default("geral"),
  frequency: HabitFrequencySchema.default("daily"),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  targetPerDay: z.coerce.number().int().min(1).max(50).default(1),
  targetWeekly: z.coerce.number().int().min(0).max(350).optional().nullable(),
});
export type CreateHabitInput = z.infer<typeof CreateHabitSchema>;

export const UpdateHabitSchema = CreateHabitSchema.partial();
export type UpdateHabitInput = z.infer<typeof UpdateHabitSchema>;

export const LogHabitSchema = z.object({
  logDate: z.string().datetime({ message: "Data invalida (ISO 8601)" }).optional(),
  count: z.coerce.number().int().min(0).max(100).default(1),
  completed: z.boolean().default(true),
  note: z.string().max(500).optional().default(""),
});
export type LogHabitInput = z.infer<typeof LogHabitSchema>;

export const HabitResponse = z.object({
  id: UUID,
  userId: UUID,
  title: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  frequency: z.enum(["daily", "weekly", "custom"]),
  daysOfWeek: z.array(z.number()),
  targetPerDay: z.number(),
  targetWeekly: z.number().nullable(),
  isActive: z.boolean(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type HabitResponse = z.infer<typeof HabitResponse>;

export const HabitLogResponse = z.object({
  id: UUID,
  userId: UUID,
  habitId: UUID,
  logDate: z.string(),
  count: z.number(),
  completed: z.boolean(),
  note: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type HabitLogResponse = z.infer<typeof HabitLogResponse>;

export const HabitsQuery = PaginationQuery.extend({
  isActive: z.coerce.boolean().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type HabitsQuery = z.infer<typeof HabitsQuery>;
