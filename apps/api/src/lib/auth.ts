/**
 * LifeXP — Autenticacao e criptografia.
 *
 * - Senhas: Argon2id (via argon2)
 * - Access token: JWT curto (15 min por padrao), assinado com JWT_ACCESS_SECRET
 * - Refresh token: aleatorio de 48 bytes, hash armazenado no banco, rotacao
 */

import { randomBytes } from "crypto";
import argon2 from "argon2";
import { config } from "../config.js";

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    // hash invalido ou erro de criptografia: senha nao confere
    return false;
  }
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString("hex");
}

export type TokenPayload = {
  userId: string;
  email: string;
  jti: string;
};
