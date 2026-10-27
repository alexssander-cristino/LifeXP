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

  // request: FastifyRequest -> request: any (em assinaturas de handler)
  s = s.replace(/request: FastifyRequest/g, "request: any");
  // request: AuthRequest -> request: any
  s = s.replace(/request: AuthRequest/g, "request: any");

  // (request as AuthRequest).user!.id -> (request as any).user!.id
  s = s.replace(/\(request as AuthRequest\)\.user!/g, "(request as any).user");
  s = s.replace(/\(request as AuthRequest\)\.user/g, "(request as any).user");

  // assertOwnership(request as AuthRequest, ...) -> assertOwnership(request as any, ...)
  s = s.replace(/assertOwnership\(request as AuthRequest/g, "assertOwnership(request as any");

  if (s !== orig) {
    fs.writeFileSync(file, s);
    console.log("fixed", file);
  } else {
    console.log("unchanged", file);
  }
}
