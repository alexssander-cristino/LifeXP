import { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { NotificationsQuery } from "@lifexp/contracts";
import { HttpError } from "../middleware/types.js";
import { authenticate } from "../middleware/auth.js";
import { db } from "../lib/db.js";
import { auditLog } from "../lib/audit.js";

function toNotificationResponse(n: any) {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data,
    channel: n.channel,
    status: n.status,
    externalId: n.externalId,
    deliveredAt: n.deliveredAt?.toISOString() ?? null,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString?.() ?? null,
  };
}

export default async function notificationRoutes(app: FastifyInstance) {
  app.get("/notifications", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { page, limit, unreadOnly } = NotificationsQuery.parse(request.query);

    const where: any = { userId };
    if (unreadOnly) where.readAt = null;

    const [data, total] = await db.$transaction([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
    ]);

    return reply.send({
      data: data.map(toNotificationResponse),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page < Math.ceil(total / limit), hasPrev: page > 1 },
      unreadCount: await db.notification.count({ where: { userId, readAt: null } }),
    });
  });

  app.patch("/notifications/:notificationId/read", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { notificationId } = request.params;
    const notification = await db.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new HttpError(404, "NOT_FOUND", "Notificacao nao encontrada");
    const updated = await db.notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
    });
    await auditLog({ userId, action: "notification.read", entity: "Notification", entityId: notification.id });
    return reply.send(toNotificationResponse(updated));
  });

  app.post("/notifications/read-all", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    await db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    await auditLog({ userId, action: "notification.read_all", entity: "Notification" });
    return reply.send({ ok: true });
  });
}
