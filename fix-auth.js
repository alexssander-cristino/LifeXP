const fs = require("fs");
const p = "apps/api/src/routes/auth.ts";
let s = fs.readFileSync(p, "utf8");
const i = s.indexOf('/auth/me",');
const chunk = s.slice(i, i + 900);
console.log(chunk);
