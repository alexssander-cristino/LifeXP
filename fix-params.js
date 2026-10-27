const fs = require("fs");

function fix(file) {
  let s = fs.readFileSync(file, "utf8");
  const orig = s;
  // request.params.id -> cast
  s = s.replace(/request\.params\.id/g, "(request.params as { id: string }).id");
  s = s.replace(/request\.params\.notificationId/g, "(request.params as { notificationId: string }).notificationId");
  s = s.replace(/request\.params\.habitId/g, "(request.params as { habitId: string }).habitId");
  s = s.replace(/request\.params\.missionId/g, "(request.params as { missionId: string }).missionId");
  // request.query.from/to
  s = s.replace(/request\.query\.from/g, "(request.query as { from?: string }).from");
  s = s.replace(/request\.query\.to/g, "(request.query as { to?: string }).to");
  // destructured { from, to } from request.query -> keep, but query type already has from/to
  if (s !== orig) {
    fs.writeFileSync(file, s);
    console.log("fixed", file);
  }
}

fix("apps/api/src/routes/habits.ts");
fix("apps/api/src/routes/missions.ts");
fix("apps/api/src/routes/notifications.ts");
