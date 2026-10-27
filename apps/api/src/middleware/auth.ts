import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { AuthRequest, HttpError, requireAuth } from "./types.js";
import { config } from "../config.js";
import { db } from "../lib/db.js";

/**
 * Hook de autenticacao para rotas protegidas.
 * Valida JWT de acesso, confirma que o usuario existe e nao esta desativado,
 * e anexa o usuario ao request. Nao confia em nenhum dado enviado pelo cliente.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    throw new HttpError(401, "UNAUTHORIZED", "Token de acesso necessario");
  }

  const token = auth.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, config.jwtAccessSecret) as { userId: string; email: string; jti: string };

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, xp: true, level: true, theme: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new HttpError(401, "UNAUTHORIZED", "Usuario invalido ou desativado");
    }

    (request as AuthRequest).user = {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      xp: user.xp,
      level: user.level,
      theme: user.theme,
    };
  } catch (err: unknown) {
    if (err instanceof HttpError) throw err;
    const e = err as Error & { statusCode?: number; code?: string };
    if (e.message?.includes("expired")) {
      throw new HttpError(401, "UNAUTHORIZED", "Token expirado");
    }
    throw new HttpError(401, "UNAUTHORIZED", "Token invalido");
  }
}

/**
 * Garante que o request esta autenticado (para uso em plugins de rota com preHandler).
 */
export function requireAuthenticated(request: AuthRequest): void {
  requireAuth(request);
}
