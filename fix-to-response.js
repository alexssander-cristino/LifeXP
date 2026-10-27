const fs = require("fs");

// missions.ts - toMissionResponse
let f = "apps/api/src/routes/missions.ts";
let s = fs.readFileSync(f, "utf8");
s = s.replace(
  /dueAt: m\.dueAt\?\.toISOString\(\) \?\? null,\n    xpReward: m\.xpReward,/,
  "dueAt: m.dueAt?.toISOString?.() ?? null,\n    xpReward: m.xpReward,"
);
s = s.replace(
  /archivedAt: m\.archivedAt\?\.toISOString\(\) \?\? null,\n    createdAt: m\.createdAt\.toISOString\(\),/,
  "archivedAt: m.archivedAt?.toISOString?.() ?? null,\n    createdAt: m.createdAt?.toISOString?.() ?? null,"
);
s = s.replace(
  /updatedAt: m\.updatedAt\.toISOString\(\),/,
  "updatedAt: m.updatedAt?.toISOString?.() ?? null,"
);
fs.writeFileSync(f, s);

// habits.ts
f = "apps/api/src/routes/habits.ts";
s = fs.readFileSync(f, "utf8");
s = s.replace(
  /archivedAt: h\.archivedAt\?\.toISOString\(\) \?\? null,\n    createdAt: h\.createdAt\.toISOString\(\),/,
  "archivedAt: h.archivedAt?.toISOString?.() ?? null,\n    createdAt: h.createdAt?.toISOString?.() ?? null,"
);
s = s.replace(
  /updatedAt: h\.updatedAt\.toISOString\(\),/,
  "updatedAt: h.updatedAt?.toISOString?.() ?? null,"
);
fs.writeFileSync(f, s);

// toHabitLogResponse
s = fs.readFileSync(f, "utf8");
s = s.replace(
  /createdAt: l\.createdAt\.toISOString\(\),\n    updatedAt: l\.updatedAt\.toISOString\(\),/,
  "createdAt: l.createdAt?.toISOString?.() ?? null,\n    updatedAt: l.updatedAt?.toISOString?.() ?? null,"
);
fs.writeFileSync(f, s);

console.log("done");
