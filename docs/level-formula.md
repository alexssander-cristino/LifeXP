# Documentação — Fórmula de Nível e Progressão (XP)

O motor de progressão roda exclusivamente no backend (`apps/api/src/lib/xp.ts`).
O cliente nunca envia valores de XP para serem aceitos.

## Fórmula

O custo para subir do nível `n` para `n + 1` é:

```
custo(n) = round(100 * (n + 1) ^ 1.4)
```

O XP acumulado necessário para atingir o nível `L` é a soma dos custos de todos os níveis anteriores:

```
xp_para_nivel(L) = sum_{i=1}^{L-1} custo(i)
```

O nível de um usuário com `XP_total` é o maior `L` tal que:

```
xp_para_nivel(L) <= XP_total
```

## Exemplo de valores

| Nível | Custo para subir (nível → próximo) | XP acumulado necessário |
|-------|-----------------------------------|-------------------------|
| 1 → 2 | round(100 * 2^1.4) = 264 | 0 |
| 2 → 3 | round(100 * 3^1.4) = 478 | 264 |
| 3 → 4 | round(100 * 4^1.4) = 724 | 742 |
| 4 → 5 | round(100 * 5^1.4) = 990 | 1.466 |
| 5 → 6 | round(100 * 6^1.4) = 1.274 | 2.456 |

## Regras de negócio implementadas

- **Cálculo no servidor**: a função `awardXp()` recebe apenas `amount` (ganho ou débito), `reason` e referência opcional. O cliente não pode alterar XP diretamente.
- **Ledger imutável**: cada ganho/débito é registrado na tabela `xp_ledger` com `xp_before`, `xp_after`, `level_before`, `level_after` e `createdAt`. Nunca é apagado ou editado.
- **Atualização atômica**: saldo, nível e ledger são atualizados numa única transação Prisma.
- **Idempotência**: conclusões de missão usam `idempotencyKey` com unique constraint no banco. Requisições repetidas não concedem XP duas vezes.
- **Recálculo**: `POST /api/v1/xp/recalc` recalcula saldo e nível a partir do ledger imutável (útil para corrigir inconsistências).
- **Conquistas**: concedem XP adicional via `awardXp()` com reason `ACHIEVEMENT`, protegidas por unique constraint `(userId, achievementId)`.

## Recompensas por dificuldade (configurável)

As recompensas de XP por dificuldade de missão são armazenadas em `system_config` (chave `xp_rewards`) e podem ser ajustadas sem código:

```json
{ "EASY": 15, "MEDIUM": 30, "HARD": 60, "EPIC": 120, "MAX_CAP": 500 }
```

O limite `MAX_CAP` evita que um usuário crie missões com recompensa abusiva.
