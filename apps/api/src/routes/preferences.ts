import { FastifyInstance, FastifyReply } from "fastify";
import { UpdateNotificationPreferenceSchema } from "@lifexp/contracts";
import { HttpError } from "../middleware/types.js";
import { authenticate } from "../middleware/auth.js";
import { db } from "../lib/db.js";
import { auditLog } from "../lib/audit.js";

function toPreferenceResponse(p: any) {
  return {
    id: p.id,
    userId: p.userId,
    missionReminders: p.missionReminders,
    achievementAlerts: p.achievementAlerts,
    levelUpAlerts: p.levelUpAlerts,
    habitReminders: p.habitReminders,
    emailEnabled: p.emailEnabled,
    pushEnabled: p.pushEnabled,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export default async function preferenceRoutes(app: FastifyInstance) {
  app.get("/preferences", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    let pref = await db.notificationPreference.findUnique({ where: { userId } });
    if (!pref) {
      pref = await db.notificationPreference.create({ data: { userId } });
    }
    return reply.send(toPreferenceResponse(pref));
  });

  app.patch("/preferences", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const input = UpdateNotificationPreferenceSchema.parse(request.body);
    let pref = await db.notificationPreference.findUnique({ where: { userId } });
    if (!pref) {
      pref = await db.notificationPreference.create({ data: { userId } });
    }
    const updated = await db.notificationPreference.update({
      where: { id: pref.id },
      data: {
        ...(input.missionReminders !== undefined && { missionReminders: input.missionReminders }),
        ...(input.achievementAlerts !== undefined && { achievementAlerts: input.achievementAlerts }),
        ...(input.levelUpAlerts !== undefined && { levelUpAlerts: input.levelUpAlerts }),
        ...(input.habitReminders !== undefined && { habitReminders: input.habitReminders }),
        ...(input.emailEnabled !== undefined && { emailEnabled: input.emailEnabled }),
        ...(input.pushEnabled !== undefined && { pushEnabled: input.pushEnabled }),
      },
    });
    await auditLog({ userId, action: "preferences.update", entity: "NotificationPreference", entityId: pref.id });
    return reply.send(toPreferenceResponse(updated));
  });
}
