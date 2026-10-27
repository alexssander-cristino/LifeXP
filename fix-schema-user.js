const fs = require("fs");
const f = "packages/db/prisma/schema.prisma";
let s = fs.readFileSync(f, "utf8");

// Adicionar createdAt/updatedAt ao model User (após level)
s = s.replace(
  /(level                 Int              @default\(1\)\s*\/\/ cache, recalculavel a partir do xp_ledger\n)/,
  "$1  createdAt             DateTime         @default(now())\n  updatedAt             DateTime         @updatedAt\n"
);

fs.writeFileSync(f, s);
console.log("done");
