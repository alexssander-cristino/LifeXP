import { execSync } from "child_process";
import { config } from "../src/config";

// Garante que o banco de teste esteja disponível
// As migrations devem ser aplicadas antes de rodar os testes:
//   DATABASE_URL=... npx prisma migrate dev --name test
export const TEST_DB_URL = config.databaseUrl;
