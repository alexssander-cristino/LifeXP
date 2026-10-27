const fs = require("fs");
const f = "apps/api/src/routes/auth.ts";
let s = fs.readFileSync(f, "utf8");
s = s.replace(/import\(["'](\.\.?\/[^"')]+)["']\)/g, (m, p) => {
  if (p.endsWith(".js") || p.endsWith(".ts")) return m;
  return `import("${p}.js")`;
});
fs.writeFileSync(f, s);
console.log("done");
