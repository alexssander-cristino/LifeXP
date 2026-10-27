const fs = require("fs");
const files = [
  "apps/api/src/routes/habits.ts",
  "apps/api/src/routes/missions.ts",
  "apps/api/src/routes/notifications.ts",
  "apps/api/src/routes/dashboard.ts",
  "apps/api/src/routes/calendar.ts",
  "apps/api/src/routes/challenges.ts",
  "apps/api/src/routes/attributes.ts",
  "apps/api/src/routes/data.ts",
  "apps/api/src/routes/auth.ts",
  "apps/api/src/routes/users.ts",
  "apps/api/src/routes/xp.ts",
  "apps/api/src/routes/preferences.ts",
];

for (const file of files) {
  let s = fs.readFileSync(file, "utf8");
  const orig = s;

  // AuthRequest handler -> FastifyRequest handler (para evitar erro de atribuibilidade)
  // Apenas onde ja tem FastifyRequest no escopo
  s = s.replace(/async \(request: AuthRequest, reply: FastifyReply\)/g, "async (request: FastifyRequest, reply: FastifyReply)");

  // request.params.X -> (request as any).params.X
  s = s.replace(/request\.params\.(\w+)/g, "(request as any).params.$1");
  // request.query.X -> (request as any).query.X
  s = s.replace(/request\.query\.(\w+)/g, "(request as any).query.$1");

  // (request as AuthRequest).user!.id -> (request as AuthRequest).user!.id (mantem)
  // (request as AuthRequest).user.id -> (request as AuthRequest).user!.id
  s = s.replace(/\(request as AuthRequest\)\.user\.id/g, "(request as AuthRequest).user!.id");

  if (s !== orig) {
    fs.writeFileSync(file, s);
    console.log("fixed", file);
  } else {
    console.log("unchanged", file);
  }
}
