const fs = require("fs");
const s = fs.readFileSync("apps/api/src/routes/habits.ts", "utf8");
const lines = s.split("\n");
lines.forEach((l, i) => {
  if (l.includes("params.") || l.includes("query.") || l.includes("request.params") || l.includes("request.query")) {
    console.log(i+1, l.trim().slice(0, 120));
  }
});
