# Documentação — Implantação, Backup e Banco Primary-Replica

## 1. Execução local (desenvolvimento)

### Pré-requisitos
- Node.js >= 20
- PostgreSQL >= 16
- Redis >= 7
- Docker e Docker Compose (opcional, recomendado)

### Passos
```bash
# 1. Variáveis de ambiente
cp .env.example .env
# Edite .env com segredos reais (APP_SECRET, JWT_*, DATABASE_URL, etc.)

# 2. Dependências
npm install

# 3. Banco (via Docker Compose)
docker compose up -d db redis

# 4. Migrations e seed
npm run db:generate
npm run db:migrate:dev
npm run db:seed

# 5. Rodar a aplicação
npm run dev --workspace=@lifexp/api   # http://localhost:3333
npm run dev --workspace=apps/web      # http://localhost:5173
```

### Usuário de desenvolvimento (seed)
- E-mail: `dev@lifexp.local`
- Senha: `Senha@123`

## 2. Banco Primary-Replica

O `docker-compose.yml` inclui o serviço `db-replica` (opcional, ativado com `--profile replica`).

### Arquitetura
- **Primary (`db`)**: responsável por TODAS as gravações. A aplicação envia writes para `DATABASE_URL`.
- **Réplica (`db-replica`)**: endpoint de leitura separado. Ativada apenas quando `ENABLE_READ_REPLICA=true` e `READ_DATABASE_URL` está definida.
- **Nunca enviar gravações para a réplica.** O código da API usa `db` (primary) para writes e `dbForRead()` (réplica ou primary) para reads.

### Replicação física (produção)
Para replicação streaming real no PostgreSQL:
1. No primary: `wal_level = replica`, `max_wal_senders`, `wal_keep_size`, `hot_standby = on` (na réplica).
2. Criar usuário de replicação com `REPLICATION` privilege.
3. Configurar `pg_hba.conf` para permitir conexão de replicação da réplica.
4. Fazer backup base do primary e restaurar na réplica com `pg_basebackup`.
5. Configurar `standby.signal` ou `recovery.signal` na réplica.

### Monitoramento de atraso (replication lag)
```sql
-- No primary:
SELECT application_name, state, sync_state, sent_lsn, write_lsn, flush_lsn, replay_lsn
FROM pg_stat_replication;

-- Na réplica (atraso em segundos):
SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds;
```

### Fallback
Se a réplica estiver atrasada ou indisponível, a aplicação cai de volta para o primary automaticamente (`dbForRead()` retorna `db` quando `ENABLE_READ_REPLICA` é false ou `READ_DATABASE_URL` está vazia).

## 3. Backup e Restauração

### Backup (dump lógico)
```bash
# Via linha de comando
pg_dump -h <host> -p <porta> -U <usuario> -d lifexp > backup_$(date +%Y%m%d_%H%M%S).sql

# Via Docker Compose
docker compose exec db pg_dump -U lifexp -d lifexp > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restauração
```bash
# Recriar o banco (se necessário)
createdb -h <host> -p <porta> -U <usuario> lifexp

# Restaurar
psql -h <host> -p <porta> -U <usuario> -d lifexp < backup_YYYYMMDD_HHMMSS.sql

# Rodar migrations para garantir esquema atualizado
npx prisma migrate deploy
```

### Procedimento documentado
1. Fazer backup antes de qualquer migration em produção.
2. Aplicar migration com `npx prisma migrate deploy`.
3. Verificar integridade: `SELECT count(*) FROM users;` e outras tabelas críticas.
4. Em caso de falha, restaurar o backup e revisar a migration.

## 4. Variáveis de ambiente críticas (produção)

Defina sempre via variáveis de ambiente, nunca no código:
- `DATABASE_URL` — conexão primary (escritas)
- `READ_DATABASE_URL` — conexão réplica (opcional)
- `APP_SECRET` — segredo da aplicação (mínimo 32 caracteres aleatórios)
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — chaves JWT
- `DATABASE_URL` deve apontar para o primary; `READ_DATABASE_URL` para a réplica.

## 5. Redis

Usado para cache, rate limiting e filas. Nunca substitui o PostgreSQL para o histórico definitivo de XP (`xp_ledger`).

```bash
docker compose up -d redis
```

## 6. Implantação em produção

1. Buildar imagens: `docker compose build`
2. Subir apenas serviços necessários: `docker compose up -d db redis api web`
3. Aplicar migrations: `docker compose exec api npx prisma migrate deploy`
4. Configurar reverse proxy (Nginx/Traefik) com SSL para `API_BASE_URL` e `WEB_URL`.
5. Definir `SESSION_COOKIE_SECURE=true` e `CORS_ORIGIN` com domínios de produção.
6. Ativar `EMAIL_ENABLED=true` com SMTP real para verificação de e-mail e redefinição de senha.
