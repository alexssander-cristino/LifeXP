# LifeXP

Plataforma de produtividade pessoal gamificada inspirada em RPGs. Transforme objetivos e hábitos da vida real em missões, conquistas, XP e níveis.

## Arquitetura (monorepo)

| Pacote | Descrição | Tecnologias |
|--------|-----------|-------------|
| `apps/api` | Backend REST versionado (`/api/v1`) | Node.js, TypeScript, Fastify, Prisma, Zod, Vitest |
| `apps/web` | Frontend web responsivo (PWA-ready) | React, TypeScript, Vite, Tailwind CSS |
| `packages/db` | Camada de dados | Prisma ORM, PostgreSQL, migrations versionadas |
| `packages/contracts` | Contratos compartilhados | Zod schemas + tipos TypeScript (OpenAPI) |

Banco principal: PostgreSQL. Cache/filas: Redis (opcional para MVP, obrigatório para rate limiting em escala).

## Primeiros passos (desenvolvimento local)

### 1. Variáveis de ambiente
```bash
cp .env.example .env
# Ajuste os segredos (APP_SECRET, JWT_*, etc.) antes de iniciar
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Subir infraestrutura (PostgreSQL + Redis)
```bash
docker compose up -d db redis
```

### 4. Preparar o banco de dados
```bash
npm run db:generate      # gera o cliente Prisma
npm run db:migrate:dev   # roda as migrations
npm run db:seed          # insere dados de desenvolvimento (identificados como seed)
```

### 5. Rodar a aplicação
```bash
# Backend e frontend em paralelo (terminais separados)
npm run dev --workspace=apps/api   # http://localhost:3333
npm run dev --workspace=apps/web   # http://localhost:5173
```

### Build de produção
```bash
npm run build
```

Ou com Docker Compose:
```bash
docker compose up -d
```

### 6. Documentação da API
Quando o backend estiver rodando: http://localhost:3333/documentation (OpenAPI/Swagger)

## Testes

```bash
# Todos os testes
npm test

# Apenas backend (integracao da API)
npm run test:api

# Apenas frontend
npm run test:web
```

## Estrutura de pastas

```
apps/api/src/        # rotas, servicos, middlewares, repositorios
apps/api/test/       # testes de integracao da API
apps/web/src/        # componentes, paginas, hooks, clientes de API
packages/db/prisma/  # schema.prisma, migrations, seeds
packages/contracts/  # schemas Zod e tipos compartilhados
```

## Segurança

- Senhas hasheadas com Argon2id
- Tokens de acesso curtos + refresh tokens rotativos armazenados em banco
- Cookies HttpOnly/Secure/SameSite
- CORS restritivo, rate limiting, validacao de entrada com Zod
- Autorizacao por recurso no backend (nunca confiar em IDs do cliente)

## Banco primary-replica (producao)

O `db-replica` no `docker-compose.yml` e opcional (`--profile replica`).
Nunca encaminhe gravacoes para a replica. Consulte `docs/deployment.md` para
replicacao fisica, monitoramento de atraso e procedimento de failover.

## Licença

MIT