import { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import {
  RegisterSchema,
  LoginSchema,
  VerifyEmailSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@lifexp/contracts";
import { HttpError } from "../middleware/types.js";
import { authenticate } from "../middleware/auth.js";
import { hashPassword, verifyPassword, generateRefreshToken } from "../lib/auth.js";
import jwt from "jsonwebtoken";
import { db } from "../lib/db.js";
import { auditLog } from "../lib/audit.js";
import { config } from "../config.js";

function userToMe(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
    dayStartHour: user.dayStartHour,
    locale: user.locale,
    theme: String(user.theme).toLowerCase(),
    emailVerified: user.emailVerified,
    xp: user.xp,
    level: user.level,
    privacyProfilePublic: user.privacyProfilePublic,
    createdAt: user.createdAt.toISOString?.() ?? null,
  };
}

export default async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request: any, reply: FastifyReply) => {
    const input = RegisterSchema.parse(request.body);
    const { email, password, name, timezone, dayStartHour, locale } = input;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpError(409, "CONFLICT", "Ja existe uma conta com este e-mail");
    }

    const passwordHash = await hashPassword(password);

    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: name || null,
          timezone,
          dayStartHour,
          locale,
        },
      });
      await tx.notificationPreference.create({
        data: { userId: created.id },
      });
      await tx.auditLog.create({
        data: { userId: created.id, action: "user.register", entity: "User", entityId: created.id },
      });
      return created;
    });

    const verifyToken = crypto.randomUUID();
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: verifyToken,
        emailVerifyExpires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    if (config.emailEnabled) {
      const { sendEmail } = await import("../lib/email.js");
      await sendEmail({
        to: email,
        subject: "Confirme seu e-mail - LifeXP",
        text: `Use este token para verificar seu e-mail: ${verifyToken}`,
      });
    } else {
      app.log.info(`[DEV] Token de verificacao para ${email}: ${verifyToken}`);
    }

    await auditLog({ userId: user.id, action: "email.verification_sent", entity: "User", entityId: user.id });

    return reply.code(201).send({
      user: { id: user.id, email: user.email },
      message: "Cadastro realizado. Verifique seu e-mail para ativar a conta.",
    });
  });

  app.post("/auth/login", async (request: any, reply: FastifyReply) => {
    const input = LoginSchema.parse(request.body);
    const { email, password } = input;

    const user = await db.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      throw new HttpError(401, "UNAUTHORIZED", "Credenciais invalidas");
    }

    const passwordOk = await verifyPassword(user.passwordHash, password);
    if (!passwordOk) {
      throw new HttpError(401, "UNAUTHORIZED", "Credenciais invalidas");
    }

    const session = await createAuthSession(app, reply, user, request);

    return reply.send({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: config.jwtAccessTtlSeconds,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        xp: user.xp,
        level: user.level,
        theme: user.theme,
      },
    });
  });

  app.post("/auth/logout", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const token = extractBearer(request);
    if (token) {
      try {
        const payload = await request.jwt.verify(token, { secret: config.jwtAccessSecret });
        await db.session.deleteMany({ where: { tokenHash: payload.jti } });
      } catch {
        // ignore token invalido no logout
      }
    }
    const refresh = request.cookies.refresh_token;
    if (refresh) {
      try {
        const hashed = await hashRefresh(refresh);
        await db.refreshToken.updateMany({ where: { tokenHash: hashed }, data: { revokedAt: new Date() } });
      } catch {
        // ignore
      }
    }
    reply.clearCookie("refresh_token", { path: "/", domain: config.sessionCookieDomain });
    if (request.user) {
      await auditLog({ userId: request.user.id, action: "user.logout", entity: "Session" });
    }
    return reply.send({ ok: true });
  });

  app.post("/auth/refresh", async (request: any, reply: FastifyReply) => {
    const body = z.object({ refreshToken: z.string().optional() }).parse(request.body);
    const refreshToken = body.refreshToken ?? request.cookies.refresh_token;
    if (!refreshToken) {
      throw new HttpError(401, "UNAUTHORIZED", "Refresh token necessario");
    }

    const tokenHash = await hashRefresh(refreshToken);
    const stored = await db.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new HttpError(401, "UNAUTHORIZED", "Refresh token invalido ou expirado");
    }

    const user = await db.user.findUnique({
      where: { id: stored.userId },
      select: { id: true, email: true, deletedAt: true },
    });
    if (!user || user.deletedAt) {
      throw new HttpError(401, "UNAUTHORIZED", "Usuario invalido");
    }

    if (config.refreshTokenRotation) {
      await db.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    }

    const newRefresh = generateRefreshToken();
    const newHash = await hashRefresh(newRefresh);
    await db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * config.jwtRefreshTtlDays),
      },
    });

    const accessToken = jwt.sign({ userId: user.id, email: user.email, jti: crypto.randomUUID() }, config.jwtAccessSecret, { expiresIn: config.jwtAccessTtlSeconds });

    reply.setCookie("refresh_token", newRefresh, {
      path: "/",
      httpOnly: true,
      sameSite: config.sessionCookieSameSite,
      secure: config.sessionCookieSecure,
      domain: config.sessionCookieDomain,
      maxAge: 1000 * 60 * 60 * 24 * config.jwtRefreshTtlDays,
    });

    return reply.send({
      accessToken,
      refreshToken: newRefresh,
      expiresIn: config.jwtAccessTtlSeconds,
    });
  });

  app.post("/auth/verify-email", async (request: any, reply: FastifyReply) => {
    const input = VerifyEmailSchema.parse(request.body);
    const { token } = input;
    const user = await db.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user || !user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
      throw new HttpError(400, "BAD_REQUEST", "Token invalido ou expirado");
    }
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
    });
    await auditLog({ userId: user.id, action: "email.verified", entity: "User", entityId: user.id });
    return reply.send({ ok: true, message: "E-mail verificado com sucesso" });
  });

  app.post("/auth/forgot-password", async (request: any, reply: FastifyReply) => {
    const input = ForgotPasswordSchema.parse(request.body);
    const user = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (user) {
      const resetToken = crypto.randomUUID();
      await db.user.update({
        where: { id: user.id },
        data: { passwordResetToken: resetToken, passwordResetExpires: new Date(Date.now() + 1000 * 60 * 60) },
      });
      if (config.emailEnabled) {
        const { sendEmail } = await import("../lib/email.js");
        await sendEmail({
          to: input.email,
          subject: "Redefinicao de senha - LifeXP",
          text: `Use este token para redefinir sua senha: ${resetToken}`,
        });
      } else {
        app.log.info(`[DEV] Token de redefinicao de senha para ${input.email}: ${resetToken}`);
      }
    }
    return reply.send({ message: "Se o e-mail existir, voce recebera instrucoes de redefinicao" });
  });

  app.post("/auth/reset-password", async (request: any, reply: FastifyReply) => {
    const input = ResetPasswordSchema.parse(request.body);
    const { token, password } = input;
    const user = await db.user.findFirst({ where: { passwordResetToken: token } });
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new HttpError(400, "BAD_REQUEST", "Token invalido ou expirado");
    }

    const passwordHash = await hashPassword(password);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
    });
    await db.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await db.session.deleteMany({ where: { userId: user.id } });
    await auditLog({ userId: user.id, action: "password.reset", entity: "User", entityId: user.id });
    return reply.send({ ok: true, message: "Senha redefinida com sucesso" });
  });

  app.get("/auth/me", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpError(404, "NOT_FOUND", "Usuario nao encontrado");
    return reply.send(userToMe(user));
  });
}

async function createAuthSession(app: FastifyInstance, reply: FastifyReply, user: any, request: any) {
  const jti = crypto.randomUUID();
  const accessToken = jwt.sign({ userId: user.id, email: user.email, jti }, config.jwtAccessSecret, { expiresIn: config.jwtAccessTtlSeconds });
  const refreshToken = generateRefreshToken();
  const refreshHash = await hashRefresh(refreshToken);

  await db.$transaction([
    db.session.create({
      data: {
        userId: user.id,
        tokenHash: jti,
        expiresAt: new Date(Date.now() + config.jwtAccessTtlSeconds * 1000),
      },
    }),
    db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * config.jwtRefreshTtlDays),
      },
    }),
  ]);

  reply.setCookie("refresh_token", refreshToken, {
    path: "/",
    httpOnly: true,
    sameSite: config.sessionCookieSameSite,
    secure: config.sessionCookieSecure,
    domain: config.sessionCookieDomain,
    maxAge: 1000 * 60 * 60 * 24 * config.jwtRefreshTtlDays,
  });

  await auditLog({ userId: user.id, action: "user.login", entity: "Session", ip: request.ip });

  return { accessToken, refreshToken };
}

function extractBearer(request: any): string | undefined {
  const auth = request.headers.authorization;
  return auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : undefined;
}

async function hashRefresh(token: string): Promise<string> {
  const { hashPassword } = await import("../lib/auth.js");
  return hashPassword(token);
}
