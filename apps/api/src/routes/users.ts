import { FastifyInstance, FastifyReply } from "fastify";
import { UpdateProfileSchema } from "@lifexp/contracts";
import { HttpError } from "../middleware/types.js";
import { authenticate } from "../middleware/auth.js";
import { db } from "../lib/db.js";
import { auditLog } from "../lib/audit.js";

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

export default async function userRoutes(app: FastifyInstance) {
  app.patch("/users/me", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const input = UpdateProfileSchema.parse(request.body);
    const { name, avatarUrl, timezone, dayStartHour, locale, theme, privacyProfilePublic } = input;

    const current = await db.user.findUnique({ where: { id: userId } });
    if (!current || current.deletedAt) {
      throw new HttpError(404, "NOT_FOUND", "Usuario nao encontrado");
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(timezone !== undefined && { timezone }),
        ...(dayStartHour !== undefined && { dayStartHour }),
        ...(locale !== undefined && { locale }),
        ...(theme !== undefined && { theme: theme.toUpperCase() as any }),
        ...(privacyProfilePublic !== undefined && { privacyProfilePublic }),
      },
    });

    await auditLog({
      userId,
      action: "user.profile_updated",
      entity: "User",
      entityId: userId,
    });
    return reply.send(userToMe(updated));
  });
}
