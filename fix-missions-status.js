const fs = require("fs");
const f = "apps/api/src/routes/missions.ts";
let s = fs.readFileSync(f, "utf8");
s = s.replace(/    if \(status && status !== "all"\) where\.status = status\.toUpperCase\(\);\n/, "");
fs.writeFileSync(f, s);
console.log("done");
