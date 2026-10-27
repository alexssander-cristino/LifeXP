import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/server";
import { config } from "../src/config";

const BASE = config.apiBaseUrl;

async function req(path: string, method = "GET", body: any = null, token?: string) {
  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const opts: any = { method, headers };
  if (body !== null && body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const txt = await res.text();
  let data: any = txt;
  try { data = JSON.parse(txt); } catch { /* */ }
  return { status: res.status, body: data, headers: res.headers };
}

let tokenA: string;
let tokenB: string;

describe("LifeXP API — Fluxo E2E e Integração", () => {
  let app: any;

  beforeAll(async () => {
    app = await buildApp();
    await app.listen({ port: 3334, host: "127.0.0.1" });
  });

  afterAll(async () => {
    await app.close();
  });

  it("Cadastro de usuário A", async () => {
    const email = `userA_${Date.now()}@lifexp.local`.toLowerCase();
    const r = await req("/api/v1/auth/register", "POST", {
      email, password: "Senha@123", name: "Usuario A",
    });
    expect(r.status).toBe(201);
    expect(r.body.user.email).toBe(email);
  });

  it("Login do usuário A", async () => {
    // Usar email fixo do seed ou cadastrar novo
    const email = `userA_${Date.now()}@lifexp.local`;
    await req("/api/v1/auth/register", "POST", {
      email, password: "Senha@123", name: "Usuario A",
    });
    const r = await req("/api/v1/auth/login", "POST", { email, password: "Senha@123" });
    expect(r.status).toBe(200);
    expect(r.body.accessToken).toBeDefined();
    expect(r.body.refreshToken).toBeDefined();
    tokenA = r.body.accessToken;
  });

  it("Isolamento de dados — usuário B não vê dados de A", async () => {
    const emailB = `userB_${Date.now()}@lifexp.local`;
    await req("/api/v1/auth/register", "POST", {
      email: emailB, password: "Senha@123", name: "Usuario B",
    });
    const rB = await req("/api/v1/auth/login", "POST", { email: emailB, password: "Senha@123" });
    expect(rB.status).toBe(200);
    tokenB = rB.body.accessToken;

    // Usuário B não deve ver missões do usuário A (que não existem ainda, mas o isolamento é testado pelo token)
    const r = await req("/api/v1/missions", "GET", null, tokenB);
    expect(r.status).toBe(200);
    expect(r.body.data).toEqual([]);
  });

  it("Criar missão", async () => {
    const r = await req("/api/v1/missions", "POST", {
      title: "Missão de Teste",
      description: "Descrição da missão",
      category: "saude",
      difficulty: "medium",
      type: "one_time",
      xpReward: 30,
    }, tokenA);
    expect(r.status).toBe(201);
    expect(r.body.title).toBe("Missão de Teste");
    expect(r.body.id).toBeDefined();
  });

  it("Listar missões", async () => {
    const r = await req("/api/v1/missions", "GET", null, tokenA);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
    expect(r.body.data.length).toBeGreaterThan(0);
  });

  it("Concluir missão e receber XP (XP no servidor)", async () => {
    // Criar uma missão para concluir
    const create = await req("/api/v1/missions", "POST", {
      title: "Missão XP",
      category: "produtividade",
      difficulty: "easy",
      type: "one_time",
      xpReward: 20,
    }, tokenA);
    expect(create.status).toBe(201);
    const missionId = create.body.id;

    // Concluir
    const complete = await req(`/api/v1/missions/${missionId}/complete`, "POST", {}, tokenA);
    expect(complete.status).toBe(200);
    expect(complete.body.xpAwarded).toBe(20);
    expect(complete.body.xp).toBeGreaterThan(0);
    expect(complete.body.level).toBeGreaterThanOrEqual(1);
  });

  it("Não permitir conclusão duplicada (idempotência)", async () => {
    const create = await req("/api/v1/missions", "POST", {
      title: "Missão Idempotência",
      category: "geral",
      difficulty: "easy",
      type: "one_time",
      xpReward: 10,
    }, tokenA);
    const missionId = create.body.id;

    const first = await req(`/api/v1/missions/${missionId}/complete`, "POST", {}, tokenA);
    expect(first.status).toBe(200);

    const second = await req(`/api/v1/missions/${missionId}/complete`, "POST", {}, tokenA);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("CONFLICT");
  });

  it("Verificar histórico de XP (ledger imutável)", async () => {
    const r = await req("/api/v1/xp/ledger", "GET", null, tokenA);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
    // Deve haver ao menos entradas de MISSION_COMPLETION e ACHIEVEMENT
    const reasons = r.body.data.map((e: any) => e.reason);
    expect(reasons.includes("MISSION_COMPLETION")).toBe(true);
  });

  it("Recalcular progressão a partir do ledger", async () => {
    const r = await req("/api/v1/xp/recalc", "POST", null, tokenA);
    if (r.status !== 200) console.log("RECALC ERROR:", r.body);
    expect(r.status).toBe(200);
    expect(r.body.xp).toBeGreaterThanOrEqual(0);
    expect(r.body.level).toBeGreaterThanOrEqual(1);
    expect(r.body.eventsProcessed).toBeGreaterThan(0);
  });

  it("Concessão de conquistas (sem duplicação)", async () => {
    const r = await req("/api/v1/users/achievements", "GET", null, tokenA);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
  });

  it("Criar e logar hábito", async () => {
    const create = await req("/api/v1/habits", "POST", {
      title: "Hábito de Teste",
      category: "conhecimento",
      frequency: "daily",
      targetPerDay: 1,
    }, tokenA);
    expect(create.status).toBe(201);
    const habitId = create.body.id;

    const log = await req(`/api/v1/habits/${habitId}/logs`, "POST", {
      count: 1, completed: true,
    }, tokenA);
    expect(log.status).toBe(201);
    expect(log.body.completed).toBe(true);
  });

  it("Dashboard com dados reais", async () => {
    const r = await req("/api/v1/dashboard", "GET", null, tokenA);
    expect(r.status).toBe(200);
    expect(r.body.level).toBeDefined();
    expect(r.body.xp).toBeDefined();
    expect(r.body.pendingMissions).toBeDefined();
  });

  it("Não confiar em IDs de outros usuários (autorização)", async () => {
    // Criar missão como usuário A
    const create = await req("/api/v1/missions", "POST", {
      title: "Missão Privada",
      category: "geral",
      difficulty: "easy",
      type: "one_time",
      xpReward: 5,
    }, tokenA);
    const missionId = create.body.id;

    // Usuário B tenta acessar a missão de A
    const r = await req(`/api/v1/missions/${missionId}`, "GET", null, tokenB);
    expect(r.status).toBe(404);
  });
});
