const fs = require("fs");
const path = require("path");

const srcDir = "packages/contracts/src";
const files = [];

function collect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full);
    else if (entry.name.endsWith(".ts")) files.push(full);
  }
}
collect(srcDir);

for (const file of files) {
  let s = fs.readFileSync(file, "utf8");
  const orig = s;
  s = s.replace(/from ['"](\.\.?\/[^'"']+)['"]/g, (m, p) => {
    if (p.endsWith(".js") || p.endsWith(".ts") || p.endsWith(".json")) return m;
    return `from "${p}.js"`;
  });
  if (s !== orig) {
    fs.writeFileSync(file, s);
    console.log("fixed", file);
  }
}
console.log("DONE");
