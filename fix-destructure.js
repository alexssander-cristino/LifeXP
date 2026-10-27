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

  // const { id } = request.params; -> const { id } = (request as any).params;
  s = s.replace(/const \{ ([^}]+) \} = request\.params;/g, "const { $1 } = (request as any).params;");
  s = s.replace(/const \{ ([^}]+) \} = request\.query;/g, "const { $1 } = (request as any).query;");

  // request.params.X -> (request as any).params.X (caso nao pegado antes)
  s = s.replace(/request\.params\.(\w+)/g, "(request as any).params.$1");
  s = s.replace(/request\.query\.(\w+)/g, "(request as any).query.$1");

  if (s !== orig) {
    fs.writeFileSync(file, s);
    console.log("fixed", file);
  } else {
    console.log("unchanged", file);
  }
}
