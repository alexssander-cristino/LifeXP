const fs = require("fs");
const p = "apps/api/src/routes/auth.ts";
let s = fs.readFileSync(p, "utf8");

const old = `    assertOwnership(request, (request as AuthRequest).user.id);
    const user = await db.user.findUnique({
      where: { id: (request as AuthRequest).user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        timezone: true,
        dayStartHour: true,
        locale: true,
        theme: true,
        emailVerified: true,
        xp: true,
        level: true,
        privacyProfilePublic: true,
        createdAt: true,
      },
    });
    if (!user) throw new HttpError(404, "NOT_FOUND", "Usuario nao encontrado");
    return reply.send(userToMe(user));`;

const nw = `    assertOwnership(request as AuthRequest, (request as AuthRequest).user!.id);
    const user = await db.user.findUnique({ where: { id: (request as AuthRequest).user!.id } });
    if (!user) throw new HttpError(404, "NOT_FOUND", "Usuario nao encontrado");
    return reply.send(userToMe(user));`;

if (!s.includes(old)) {
  console.log("PATTERN NOT FOUND");
  process.exit(1);
}
s = s.replace(old, nw);
s = s.replace(
  `  app.get<{ Reply: MeResponse }>("/auth/me", { preHandler: [authenticate] }, async (request: AuthRequest, reply) => {`,
  `  app.get<{ Reply: MeResponse }>("/auth/me", { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {`
);
fs.writeFileSync(p, s);
console.log("DONE");
