import { buildApp } from "./server.js";
import { config } from "./config.js";

const start = async () => {
  const app = await buildApp();
  try {
    const address = await app.listen({ port: config.port, host: "0.0.0.0" });
    app.log.info(`LifeXP API rodando em ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
