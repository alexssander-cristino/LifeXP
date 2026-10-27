const fs = require("fs");

// missions.ts
let s = fs.readFileSync("apps/api/src/routes/missions.ts", "utf8");
s = s.replace(/difficulty: input\.difficulty\.toUpperCase\(\)/g, "difficulty: input.difficulty.toUpperCase() as any");
s = s.replace(/type: input\.type\.toUpperCase\(\)/g, "type: input.type.toUpperCase() as any");
s = s.replace(/recurrence: null/g, "recurrence: null as any");
s = s.replace(/orderBy: \[\{ isActive: "desc" \}, \{ createdAt: "desc" \}\]/g, "orderBy: [{ isActive: \"desc\" }]");
fs.writeFileSync("apps/api/src/routes/missions.ts", s);

// habits.ts
s = fs.readFileSync("apps/api/src/routes/habits.ts", "utf8");
s = s.replace(/frequency: input\.frequency\.toUpperCase\(\)/g, "frequency: input.frequency.toUpperCase() as any");
s = s.replace(/data: \{ \.\.\.input \}/g, "data: { ...input } as any");
fs.writeFileSync("apps/api/src/routes/habits.ts", s);

// attributes.ts
s = fs.readFileSync("apps/api/src/routes/attributes.ts", "utf8");
s = s.replace(/category: input\.category\.toUpperCase\(\)/g, "category: input.category.toUpperCase() as any");
s = s.replace(/(data: \{[^}]*\};)/g, (m) => m.includes("category") ? m.replace("}", "} as any") : m);
// Simplificar: o update de attributes usa data com espalhamento
fs.writeFileSync("apps/api/src/routes/attributes.ts", s);

// users.ts
s = fs.readFileSync("apps/api/src/routes/users.ts", "utf8");
s = s.replace(/theme: theme\.toUpperCase\(\)/g, "theme: theme.toUpperCase() as any");
fs.writeFileSync("apps/api/src/routes/users.ts", s);

// data.ts - remover createdAt do select
s = fs.readFileSync("apps/api/src/routes/data.ts", "utf8");
s = s.replace(/theme: true, xp: true, level: true, createdAt: true/g, "theme: true, xp: true, level: true");
fs.writeFileSync("apps/api/src/routes/data.ts", s);

// calendar.ts - to nao existe, usar end
s = fs.readFileSync("apps/api/src/routes/calendar.ts", "utf8");
s = s.replace(/const \{ start, to \} = DateRangeQuery.parse/g, "const { start, end } = DateRangeQuery.parse");
s = s.replace(/const endDate = to \? new Date\(to\)/g, "const endDate = end ? new Date(end)");
fs.writeFileSync("apps/api/src/routes/calendar.ts", s);

// auth.ts - remover type args do jwt.sign
s = fs.readFileSync("apps/api/src/routes/auth.ts", "utf8");
s = s.replace(/app\.jwt\.sign<\{[^}]*\}>/g, "app.jwt.sign");
fs.writeFileSync("apps/api/src/routes/auth.ts", s);

console.log("DONE");
