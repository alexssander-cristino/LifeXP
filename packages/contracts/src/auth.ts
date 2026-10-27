import { z } from "zod";
import { UUID } from "./common.js";

export const RegisterSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100).optional().default(""),
  email: z.string().email("E-mail invalido").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Senha deve ter ao menos 8 caracteres")
    .max(128, "Senha muito longa")
    .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiuscula")
    .regex(/[a-z]/, "Senha deve conter ao menos uma letra minuscula")
    .regex(/[0-9]/, "Senha deve conter ao menos um numero")
    .regex(/[^A-Za-z0-9]/, "Senha deve conter ao menos um caractere especial"),
  timezone: z.string().default("UTC"),
  dayStartHour: z.coerce.number().int().min(0).max(23).default(8),
  locale: z.string().default("pt-BR"),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email("E-mail invalido").toLowerCase().trim(),
  password: z.string().min(1, "Senha obrigatoria"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const VerifyEmailSchema = z.object({
  token: UUID,
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email("E-mail invalido").toLowerCase().trim(),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: UUID,
  password: z
    .string()
    .min(8, "Senha deve ter ao menos 8 caracteres")
    .max(128, "Senha muito longa"),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const AuthTokensResponse = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: z.object({
    id: UUID,
    email: z.string(),
    name: z.string().nullable(),
    xp: z.number(),
    level: z.number(),
    theme: z.enum(["dark", "light"]),
  }),
});
export type AuthTokensResponse = z.infer<typeof AuthTokensResponse>;

export const MeResponse = z.object({
  id: UUID,
  email: z.string(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  timezone: z.string(),
  dayStartHour: z.number(),
  locale: z.string(),
  theme: z.enum(["dark", "light"]),
  emailVerified: z.boolean(),
  xp: z.number(),
  level: z.number(),
  privacyProfilePublic: z.boolean(),
  createdAt: z.string(),
});
export type MeResponse = z.infer<typeof MeResponse>;

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  timezone: z.string().optional(),
  dayStartHour: z.coerce.number().int().min(0).max(23).optional(),
  locale: z.string().min(2).max(10).optional(),
  theme: z.enum(["dark", "light"]).optional(),
  privacyProfilePublic: z.boolean().optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
