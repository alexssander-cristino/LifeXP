import fastify, { FastifyInstance } from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyRateLimit from "@fastify/rate-limit";
import { config } from "./config.js";
import { db, disconnectDb } from "./lib/db.js";
import { HttpError } from "./middleware/types.js";
import { swagger } from "./plugins/swagger.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import missionRoutes from "./routes/missions.js";
import habitRoutes from "./routes/habits.js";
import xpRoutes from "./routes/xp.js";
import attributeRoutes from "./routes/attributes.js";
import achievementRoutes from "./routes/achievements.js";
import challengeRoutes from "./routes/challenges.js";
import calendarRoutes from "./routes/calendar.js";
import dashboardRoutes from "./routes/dashboard.js";
import notificationRoutes from "./routes/notifications.js";
import preferenceRoutes from "./routes/preferences.js";
import dataRoutes from "./routes/data.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: config.logLevel,
      serializers: {
        req: (req: any) => ({ method: req.method, url: req.url, hostname: req.hostname, ip: req.ip }),
        res: (res: any) => ({ statusCode: res.statusCode }),
      },
      redact: ["req.headers.authorization", "req.headers.cookie", "body.password", "body.passwordHash", "req.body.password", "res.body.password"],
    },
  });

  // CORS restrito a origem configurada
  await app.register(fastifyCors, {
    origin: config.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["content-type", "authorization"],
  });

  await app.register(fastifyCookie, {
    secret: config.appSecret,
    parseOptions: {},
  });

  // Rate limiting geral
  await app.register(fastifyRateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindowMs,
    ban: 0,
    keyGenerator: (req) => req.ip ?? "anonymous",
  });

  // OpenAPI
  await swagger(app);

  // Health
  app.get("/health", async () => ({ status: "ok", service: "lifexp-api" }));

  // Rotas versionadas
  app.register(authRoutes, { prefix: "/api/v1" });
  app.register(userRoutes, { prefix: "/api/v1" });
  app.register(missionRoutes, { prefix: "/api/v1" });
  app.register(habitRoutes, { prefix: "/api/v1" });
  app.register(xpRoutes, { prefix: "/api/v1" });
  app.register(attributeRoutes, { prefix: "/api/v1" });
  app.register(achievementRoutes, { prefix: "/api/v1" });
  app.register(challengeRoutes, { prefix: "/api/v1" });
  app.register(calendarRoutes, { prefix: "/api/v1" });
  app.register(dashboardRoutes, { prefix: "/api/v1" });
  app.register(notificationRoutes, { prefix: "/api/v1" });
  app.register(preferenceRoutes, { prefix: "/api/v1" });
  app.register(dataRoutes, { prefix: "/api/v1" });

  // Tratamento consistente de erros (sem vazamento de senhas/tokens)
  app.setErrorHandler((error: unknown, _request: any, reply: any) => {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send(error.body);
    }
    const e = error as Error & { statusCode?: number; code?: string };
    if (e.statusCode) {
      return reply.code(e.statusCode).send({ error: { code: e.code || "ERROR", message: e.message } });
    }
    // Prisma unique constraint
    if ((e as any)?.code === "P2002") {
      return reply.code(409).send({ error: { code: "CONFLICT", message: "Registro duplicado ou ja existente" } });
    }
    if ((e as any)?.code === "P2025") {
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Registro nao encontrado" } });
    }
    console.error(error);
    return reply.code(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: config.nodeEnv === "production" ? "Erro interno do servidor" : (e as Error)?.message || "Erro interno",
      },
    });
  });

  // Graceful shutdown
  const close = async () => {
    await app.close();
    await disconnectDb();
  };
  process.on("SIGTERM", close);
  process.on("SIGINT", close);

  return app;
}

export { db };
