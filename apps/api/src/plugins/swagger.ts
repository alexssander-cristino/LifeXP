import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { config } from "../config.js";

export async function swagger(app: any): Promise<void> {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "LifeXP API",
        description: "API REST versionada da plataforma de produtividade gamificada LifeXP.",
        version: "1.0.0",
      },
      servers: [{ url: config.apiBaseUrl, description: "Servidor da API" }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Access token JWT obtido em /api/v1/auth/login",
          },
        },
      },
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/documentation",
    uiConfig: { docExpansion: "list", deepLinking: false },
    initOAuth: {},
    uiHooks: {
      onRequest: () => undefined,
    },
    staticCSP: true,
    transformStaticCSP: (header: string) => header,
  });

  app.addHook("onReady", () => {
    app.swagger();
  });
}
