import { z } from "zod";
import { UUID } from "./common.js";

export const UserAttributeResponse = z.object({
  id: UUID,
  userId: UUID,
  category: z.enum([
    "saude",
    "conhecimento",
    "disciplina",
    "produtividade",
    "financas",
    "relacionamentos",
  ]),
  name: z.string(),
  currentValue: z.number(),
  targetValue: z.number().nullable(),
  unit: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserAttributeResponse = z.infer<typeof UserAttributeResponse>;

export const CreateUserAttributeSchema = z.object({
  category: z.enum([
    "saude",
    "conhecimento",
    "disciplina",
    "produtividade",
    "financas",
    "relacionamentos",
  ]),
  name: z.string().min(1).max(50, "Nome muito longo"),
  currentValue: z.coerce.number().int().min(0).default(0),
  targetValue: z.coerce.number().int().min(0).optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  isActive: z.boolean().default(true),
});
export type CreateUserAttributeInput = z.infer<typeof CreateUserAttributeSchema>;

export const UpdateUserAttributeSchema = CreateUserAttributeSchema.partial();
export type UpdateUserAttributeInput = z.infer<typeof UpdateUserAttributeSchema>;

export const DataExportResponse = z.object({
  userId: UUID,
  exportedAt: z.string(),
  downloadUrl: z.string().nullable(),
  note: z.string(),
});
export type DataExportResponse = z.infer<typeof DataExportResponse>;
