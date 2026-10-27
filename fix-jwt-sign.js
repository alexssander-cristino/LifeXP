const fs = require("fs");
const f = "apps/api/src/routes/auth.ts";
let s = fs.readFileSync(f, "utf8");
s = s.replace(/jwtSign\(/g, "jwt.sign(");
s = s.replace(/import \{ sign as jwtSign \} from "jsonwebtoken";/g, "import jwt from \"jsonwebtoken\";");
fs.writeFileSync(f, s);
console.log("done");
