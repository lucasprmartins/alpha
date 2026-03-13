---
paths:
  - "apps/server/**"
  - "modules/db/**"
  - "modules/api/**"
  - "modules/auth/**"
---

## Backend

O backend é construído usando Elysia + Bun. Ele é responsável por expor a API e interagir com a infraestrutura.

## Instruções

### Logger (Pino)

- Use **SEMPRE** `logger` de `@app/config/logger`, **NUNCA** `console.log`.
- `logger.info()` são para operações normais, como requisições recebidas, ações do usuário, etc.
- `logger.error({ err }, "mensagem")` são para erros, onde `err` é o objeto de erro capturado.
- `logger.debug()` são para desenvolvimento, como inputs/outputs de funções, dados de debug, etc.

### Variáveis de Ambiente

- **NUNCA** use `process.env`, **SEMPRE** importe `env` de `@app/config/env`. Com exceção de `drizzle.config.ts` que roda fora do servidor.
- Quando possuir uma nova variável de ambiente, adicione ao schema Zod em `config/src/env.ts` e `apps/server/.env.example`.
- Variáveis obrigatórias devem possuir `z.string().min(1)`.
- Variáveis opcionais devem possuir `z.string().optional().default("valor")`.
- **NUNCA** use `as string` para forçar tipo.
