const BASE = "http://localhost:3333";
let token = null;

async function req(path, method = "GET", body = null, headers = {}) {
  const opts = { method, headers: { "Content-Type": "application/json", ...headers } };
  if (body) opts.body = JSON.stringify(body);
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, opts);
  const txt = await res.text();
  let data;
  try { data = JSON.parse(txt); } catch { data = txt; }
  return { status: res.status, body: data };
}

async function main() {
  // 1. Health
  console.log("=== Health ===");
  console.log(await req("/health"));

  // 2. Cadastro (usar email único)
  const email = `teste_${Date.now()}@lifexp.local`;
  console.log("\n=== Cadastro ===");
  const reg = await req("/api/v1/auth/register", "POST", {
    email, password: "Senha@123", name: "Usuário Teste",
  });
  console.log(reg);

  // 3. Login
  console.log("\n=== Login ===");
  const login = await req("/api/v1/auth/login", "POST", { email, password: "Senha@123" });
  console.log(login);
  if (login.status === 200) token = login.body.accessToken;

  // 4. Me
  console.log("\n=== Me ===");
  console.log(await req("/api/v1/auth/me"));

  // 5. Criar missão
  console.log("\n=== Criar missão ===");
  const mission = await req("/api/v1/missions", "POST", {
    title: "Beber água",
    description: "Beber 2 litros de água",
    category: "saude",
    difficulty: "easy",
    type: "daily",
    xpReward: 15,
  });
  console.log(mission);
  const missionId = mission.body?.id;

  // 6. Listar missões
  console.log("\n=== Listar missões ===");
  console.log(await req("/api/v1/missions"));

  // 7. Concluir missão (primeira vez)
  if (missionId) {
    console.log("\n=== Concluir missão ===");
    const complete = await req(`/api/v1/missions/${missionId}/complete`, "POST", {}, { "Idempotency-Key": `idem-${Date.now()}` });
    console.log(complete);

    // 8. Tentar concluir novamente (deve dar conflito)
    console.log("\n=== Concluir novamente (duplicado) ===");
    console.log(await req(`/api/v1/missions/${missionId}/complete`, "POST", {}, { "Idempotency-Key": `idem-${Date.now()}` }));

    // 9. XP
    console.log("\n=== XP /me ===");
    console.log(await req("/api/v1/xp/me"));

    // 10. Ledger
    console.log("\n=== XP Ledger ===");
    console.log(await req("/api/v1/xp/ledger"));
  }

  // 11. Hábitos
  console.log("\n=== Criar hábito ===");
  const habit = await req("/api/v1/habits", "POST", {
    title: "Leitura",
    description: "Ler 20 páginas",
    category: "conhecimento",
    frequency: "daily",
    targetPerDay: 1,
  });
  console.log(habit);
  const habitId = habit.body?.id;

  if (habitId) {
    console.log("\n=== Log hábito ===");
    const log = await req(`/api/v1/habits/${habitId}/logs`, "POST", { count: 1, completed: true });
    console.log(log);
  }

  // 12. Dashboard
  console.log("\n=== Dashboard ===");
  console.log(await req("/api/v1/dashboard"));

  // 13. Logout
  console.log("\n=== Logout ===");
  console.log(await req("/api/v1/auth/logout", "POST"));
}

main().catch(console.error);
