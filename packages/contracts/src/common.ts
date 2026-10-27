import { z } from "zod";

export const UUID = z.string().uuid("ID invalido");
export type UUID = z.infer<typeof UUID>;

export const NonEmptyString = z.string().min(1, "Campo obrigatorio");
export type NonEmptyString = z.infer<typeof NonEmptyString>;

export const Slug = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalido (use apenas letras minusculas, numeros e hifens)");
export type Slug = z.infer<typeof Slug>;

export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuery>;

export const PaginatedResponse = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
  });

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export const ErrorResponse = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;

export const DateRangeQuery = z.object({
  start: z.string().datetime({ message: "Data inicial invalida (ISO 8601)" }).optional(),
  end: z.string().datetime({ message: "Data final invalida (ISO 8601)" }).optional(),
});
export type DateRangeQuery = z.infer<typeof DateRangeQuery>;

export const ThemeSchema = z.enum(["dark", "light"]);
export type Theme = z.infer<typeof ThemeSchema>;

export const DifficultySchema = z.enum(["easy", "medium", "hard", "epic"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const MissionTypeSchema = z.enum(["one_time", "daily", "weekly", "custom"]);
export type MissionType = z.infer<typeof MissionTypeSchema>;

export const OccurrenceStatusSchema = z.enum(["pending", "completed", "cancelled", "expired"]);
export type OccurrenceStatus = z.infer<typeof OccurrenceStatusSchema>;

export const AttributeCategorySchema = z.enum([
  "saude",
  "conhecimento",
  "disciplina",
  "produtividade",
  "financas",
  "relacionamentos",
]);
export type AttributeCategory = z.infer<typeof AttributeCategorySchema>;

export const HabitFrequencySchema = z.enum(["daily", "weekly", "custom"]);
export type HabitFrequency = z.infer<typeof HabitFrequencySchema>;
