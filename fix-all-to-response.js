const fs = require("fs");
const files = [
  "apps/api/src/routes/missions.ts",
  "apps/api/src/routes/habits.ts",
  "apps/api/src/routes/notifications.ts",
  "apps/api/src/routes/challenges.ts",
  "apps/api/src/routes/attributes.ts",
  "apps/api/src/routes/auth.ts",
  "apps/api/src/routes/users.ts",
];

function fixFile(file) {
  let s = fs.readFileSync(file, "utf8");
  const orig = s;
  
  // Substituir .toISOString() por .toISOString?.() ?? null em padrões comuns
  s = s.replace(/\.toISOString\(\)/g, ".toISOString?.() ?? null");
  
  if (s !== orig) {
    fs.writeFileSync(file, s);
    console.log("fixed", file);
  } else {
    console.log("unchanged", file);
  }
}

for (const f of files) fixFile(f);
console.log("DONE");
