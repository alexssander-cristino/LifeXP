import { FastifyInstance, FastifyReply } from "fastify";
import { HttpError } from "../middleware/types.js";
import { authenticate } from "../middleware/auth.js";
import { db } from "../lib/db.js";
import { auditLog } from "../lib/audit.js";

export default async function dataRoutes(app: FastifyInstance) {
  app.get("/data/export", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;

    const [user, missions, completions, habits, logs, ledger, attributes, achievements, notifications] =
      await Promise.all([
        db.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, name: true, timezone: true, locale: true, theme: true, xp: true, level: true },
        }),
        db.mission.findMany({ where: { userId } }),
        db.missionCompletion.findMany({ where: { userId } }),
        db.habit.findMany({ where: { userId } }),
        db.habitLog.findMany({ where: { userId } }),
        db.xpLedger.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
        db.userAttribute.findMany({ where: { userId } }),
        db.userAchievement.findMany({ where: { userId }, include: { achievement: true } }),
        db.notification.findMany({ where: { userId } }),
      ]);

    if (!user) throw new HttpError(404, "NOT_FOUND", "Usuario nao encontrado");

    await db.user.update({ where: { id: userId }, data: { dataExportRequestedAt: new Date() } });
    await auditLog({ userId, action: "user.data_export", entity: "User", entityId: userId });

    const payload = {
      exportedAt: new Date().toISOString(),
      user,
      missions,
      completions,
      habits,
      habitLogs: logs,
      xpLedger: ledger,
      attributes,
      achievements,
      notifications,
      note: "Todos os dados pertencentes ao usuario, exportados por solicitacao propria.",
    };

    return reply
      .header("Content-Type", "application/json")
      .header("Content-Disposition", `attachment; filename="lifexp-export-${userId}.json"`)
      .send(payload);
  });

  app.delete("/data/me", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpError(404, "NOT_FOUND", "Usuario nao encontrado");

    await db.$transaction([
      db.user.update({ where: { id: userId }, data: { deletedAt: new Date(), email: `deleted_${userId}@lifexp.local`, emailVerified: false } }),
      db.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
      db.session.deleteMany({ where: { userId } }),
    ]);
    await auditLog({ userId, action: "user.account_deleted", entity: "User", entityId: userId });

    return reply.send({ ok: true, message: "Conta desativada. Dados pessoais nao sao mais acessiveis." });
  });
}
