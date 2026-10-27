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

  // Remove tipo generico: app.get<{...}> -> app.get
  s = s.replace(/app\.(get|post|patch|put|delete)<\{[^}]*\}>/g, (m) => {
    return "app." + m.split(".")[1].split("<")[0];
  });

  if (s !== orig) {
    fs.writeFileSync(file, s);
    console.log("fixed generics", file);
  } else {
    console.log("unchanged generics", file);
  }
}
