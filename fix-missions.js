const fs = require("fs");
const p = "apps/api/src/routes/missions.ts";
let s = fs.readFileSync(p, "utf8");

// Add getUserId helper before export default
const helper = `
function getUserId(request: FastifyRequest): string {
  return (request as AuthRequest).user!.id;
}

`;
s = s.replace("export default async function missionRoutes", helper + "export default async function missionRoutes");

// Replace user.id usages inside handlers
s = s.replace(/const userId = \(request as AuthRequest\)\.user\.id;/g, "const userId = getUserId(request);");

fs.writeFileSync(p, s);
console.log("DONE");
