import { FastifyInstance, FastifyReply } from "fastify";
import {
  CreateUserAttributeSchema,
  UpdateUserAttributeSchema,
} from "@lifexp/contracts";
import { HttpError } from "../middleware/types.js";
import { authenticate } from "../middleware/auth.js";
import { db } from "../lib/db.js";
import { auditLog } from "../lib/audit.js";

function toAttributeResponse(a: any) {
  return {
    id: a.id,
    userId: a.userId,
    category: a.category,
    name: a.name,
    currentValue: a.currentValue,
    targetValue: a.targetValue,
    unit: a.unit,
    isActive: a.isActive,
    createdAt: a.createdAt.toISOString?.() ?? null,
    updatedAt: a.updatedAt.toISOString?.() ?? null,
  };
}

export default async function attributeRoutes(app: FastifyInstance) {
  app.get("/attributes", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const attributes = await db.userAttribute.findMany({
      where: { userId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return reply.send({ data: attributes.map(toAttributeResponse) });
  });

  app.post("/attributes", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const input = CreateUserAttributeSchema.parse(request.body);
    const attribute = await db.userAttribute.create({
      data: {
        userId,
        category: input.category.toUpperCase() as any,
        name: input.name.trim(),
        currentValue: input.currentValue,
        targetValue: input.targetValue ?? null,
        unit: input.unit ?? null,
        isActive: input.isActive,
      },
    });
    await auditLog({ userId, action: "attribute.create", entity: "UserAttribute", entityId: attribute.id });
    return reply.code(201).send(toAttributeResponse(attribute));
  });

  app.patch("/attributes/:id", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params;
    const attribute = await db.userAttribute.findFirst({ where: { id, userId } });
    if (!attribute) throw new HttpError(404, "NOT_FOUND", "Atributo nao encontrado");
    const input = UpdateUserAttributeSchema.parse(request.body);
    const updated = await db.userAttribute.update({
      where: { id: attribute.id },
      data: {
        ...(input.category !== undefined && { category: input.category.toUpperCase() as any }),
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.currentValue !== undefined && { currentValue: input.currentValue }),
        ...(input.targetValue !== undefined && { targetValue: input.targetValue ?? null }),
        ...(input.unit !== undefined && { unit: input.unit ?? null }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
    await auditLog({ userId, action: "attribute.update", entity: "UserAttribute", entityId: attribute.id });
    return reply.send(toAttributeResponse(updated));
  });

  app.delete("/attributes/:id", { preHandler: [authenticate] }, async (request: any, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params;
    const attribute = await db.userAttribute.findFirst({ where: { id, userId } });
    if (!attribute) throw new HttpError(404, "NOT_FOUND", "Atributo nao encontrado");
    await db.userAttribute.delete({ where: { id: attribute.id } });
    await auditLog({ userId, action: "attribute.delete", entity: "UserAttribute", entityId: attribute.id });
    return reply.send({ ok: true });
  });
}
