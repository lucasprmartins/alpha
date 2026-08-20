# Bun 1.4 neste projeto

Diagnóstico de impacto e plano de adaptação do monorepo `alpha` para o Bun 1.4.

- **Versão atual do projeto:** Bun 1.3.14
- **Lockfile:** `lockfileVersion: 1`, `configVersion: 1`, 572 entradas
- **Linker:** `hoisted` (fixado explicitamente em `bunfig.toml`)
- **Referência:** https://bun.com/blog/bun-v1.4

---

## 1. Ganho automático (zero código)

A maior parte do valor do release é passiva — basta atualizar o runtime.

| Ganho | Onde bate no projeto |
| --- | --- |
| Elysia: 91 MB → 55 MB sob carga (−40% de memória) | `apps/server` no Railway; maior impacto de custo do release |
| CPU ocioso 5× menor (p50/p99 caem pela metade) | server persistente no Railway |
| Startup Linux 10,9 ms → 5,1 ms, memória de boot −55% | cold start do serviço |
| Promises 1,5–2,4× mais rápidas, `new URL()` 4,6×, RegExp 138–200× | caminho oRPC + Better Auth, async-pesado |
| `node:zlib` migrado para zlib-ng | respostas comprimidas do Elysia |
| Streams nativos com backpressure automático no `Bun.serve` | `.mount(auth.handler)` e as rotas `/rpc` e `/api` com `parse: "none"` |

---

## 2. Bump de versão — arquivos a tocar

| Arquivo | Valor atual |
| --- | --- |
| `package.json` (raiz) | `packageManager: "bun@1.3.14"` |
| `config/package.json` | `packageManager: "bun@1.3.14"` |
| `modules/api/package.json` | `packageManager: "bun@1.3.14"` |
| `modules/auth/package.json` | `packageManager: "bun@1.3.14"` |
| `modules/db/package.json` | `packageManager: "bun@1.3.14"` |
| `apps/client/package.json` | `packageManager: "bun@1.3.14"` |
| `.github/workflows/ci.yml` | `BUN_VERSION: "1.3.14"` |
| `scripts/lib/preflight.ts` | `MIN_BUN = { major: 1, minor: 3, patch: 13 }` |

`apps/server/package.json` não declara `packageManager` — inconsistência prévia, vale padronizar no mesmo passo.

**`@types/bun`:** o catálogo da raiz declara `^1.3.11` e os workspaces pinam `^1.3.14` direto. Sem bump para `^1.4`, os tipos de `Bun.Image`, `Bun.markdown` e `Bun.cron` não existem.

### Lockfile e catálogo

- `bun.lock` migra para `lockfileVersion: 2` no primeiro install. O projeto **não** usa overrides aninhados nem version-scoped, então não cai no `lockfileVersion: 3` — que o Turborepo ainda não aceita upstream. Este era o risco mais sério para um monorepo com turbo e ele não se aplica aqui.
- Esperar uma reescrita única do lockfile no primeiro install (churn de peers com `catalog:`).
- O `catalog` da raiz lista `typescript`, `@types/bun` e `zod`, mas só `config/package.json` referencia com `"zod": "catalog:"`; os demais pinam `^4.4.3` direto. No 1.4, `bun update` sem argumentos passa a reescrever o catálogo da raiz, e `bun add zod` num workspace cujo catálogo lista `zod` passa a escrever `catalog:` sozinho. Decidir: consolidar tudo em catálogo ou remover o catálogo.

---

## 3. Riscos a validar em staging

Nenhum é erro no código do projeto — todos são comportamento de runtime ou de biblioteca.

1. **`Request#clone()` agora lança** `TypeError: Body is disturbed or locked` depois do body lido, inclusive no `request` passado a handlers. `apps/server/src/index.ts` repassa o mesmo `request` para `createContext(request)` e **depois** para `rpcHandler.handle(request, ...)` / `apiHandler.handle(...)`. Se oRPC ou Better Auth clonarem internamente após leitura, isso aparece agora. **Teste obrigatório:** login + uma chamada RPC com body.
2. **Headers duplicados são combinados com `, `** em respostas de `fetch()` e requests do `Bun.serve` (antes só o último valor sobrevivia). `Set-Cookie` continua separado via `getSetCookie()`, então a sessão do Better Auth deve estar segura. O `rateLimitGenerator` em `apps/server/src/index.ts` já faz `.split(",")[0]` no `x-forwarded-for`, e portanto está coberto.
3. **TLS:** o `.env` local usa `postgresql://user:password@localhost:5432/db` sem SSL — não afetado. `Bun.SQL` já verificava hostname; o endurecimento novo atinge `Bun.connect` e `RedisClient`, não usados aqui. Confirmar como o Railway monta o `DATABASE_URL` em produção.
4. **Node.js 26 / `NODE_MODULE_VERSION` 147:** o projeto não tem addon N-API — `postgres` e `drizzle` são JS puro; biome, turbo e vite são binários standalone via `optionalDependencies` de plataforma. Risco baixo; o install reavalia esses optionals.
5. **`"jsx": "react-jsx"`** em `apps/client/tsconfig.json`: o Bun passa a emitir `jsx` em vez de `jsxDEV`. Não afeta o client (quem transpila é o Vite) e não há teste de componente. Só vira problema se um dia rodar `.tsx` sob `bun test`.
6. **`bunfig.toml`** é TOML trivialmente válido — passa no parser estrito novo.
7. **`Bun.$`** em `scripts/lib/{preflight,steps,utils}.ts` e `scripts/setup.ts` usa só interpolação, nunca glob literal. A mudança de globbing torna esses scripts mais seguros, não quebra.
8. **`bun --bun`** não é usado em lugar nenhum, então a mudança de carregamento de `.env` sob `node` não afeta. `bunx pino-pretty` no `dev` do server segue válido.

---

## 4. Adaptações priorizadas

### Alto retorno, risco baixo

**4.1 `--bytecode --format=esm` no build do server**

`apps/server/package.json` já faz `bun build --compile --minify`. O 1.4 destravou bytecode para ES modules (antes forçava CommonJS), derrubando o startup do binário compilado sem mudar uma linha de código. É a adaptação mais direta do release para este repo.

**4.2 `bun audit fix` e `bun pm licenses` no CI**

O `ci.yml` tem três jobs (check, test, build) e nenhuma checagem de segurança de dependência. Ambos os comandos são novos no 1.4:

```sh
bun audit fix --dry-run          # falha o job se houver vulnerabilidade sem fix aplicado
bun pm licenses --prod --json    # inventário de licenças
```

**4.3 `bun dedupe --check` no CI**

Hoje `zod`, `typescript` e `@types/bun` resolvem para uma versão só — não há duplicata. O `--check` trava a regressão, e as versões declaradas divergentes (`zod` `^4.3.6` no catálogo vs `^4.4.3` nos workspaces) convidam a divergir de novo.

### Retorno alto, exige decisão

**4.4 Migrar `linker = "hoisted"` para `"isolated"`**

É o único bloqueio ativo ao global virtual store, que rende **até 7× no caminho exato do CI**: lockfile presente, cache quente, `node_modules` zerado — que é o que os três jobs do `ci.yml` fazem, cada um com `bun install --frozen-lockfile`.

O linker está fixado explicitamente, então foi escolha deliberada e desfazê-la precisa de validação: isolated corta phantom dependencies. A superfície de risco é pequena e favorável — `modules/auth` declara `react`, `@tanstack/*` e `@phosphor-icons/react` corretamente como `peerDependencies`, e `apps/client` os fornece. Testar num branch isolado antes de decidir.

**4.5 Substituir `serve@14.2.6` por `Bun.serve` no start do client**

`apps/client/package.json` roda `serve -s dist -p 3001`. O 1.4 trouxe rotas de diretório com `sendfile`, `ETag`, `Range`, `304` e `index.html` automáticos:

```ts
Bun.serve({ port: 3001, routes: { "/*": { dir: "./dist" } } });
```

Remove uma dependência de produção inteira. **Ressalva:** o `-s` do `serve` faz fallback SPA para `index.html`, e o TanStack Router depende disso — `dir:` sozinho não replica esse comportamento e exigiria uma rota catch-all explícita. Adaptável, mas não é troca de uma linha.

---

## 5. Avaliado e descartado

**React Compiler embutido — não se aplica.** O `--react-compiler` roda dentro do parser do `bun build`, e `apps/client` é bundlado por Vite 8 + `@vitejs/plugin-react`. Aproveitá-lo exigiria trocar o bundler do client, desproporcional ao ganho. Se quiser React Compiler agora, o caminho continua sendo o plugin Babel no Vite.

**`bun test --parallel` / `--shard` / `--timings` — sem ganho mensurável hoje.** São dois arquivos de teste no `domain`. Vira relevante quando a suíte crescer; `--changed=main` seria o primeiro a entrar, no job de PR.

**`bun run --parallel` não substitui o turbo.** Não tem cache nem grafo de dependência entre pacotes — o `turbo.json` usa `dependsOn: ["^build"]`. Manter turbo.

**`bun prune --production` — pouco aproveitável.** Não há Dockerfile; o deploy é Railpack/Railway. Registrar para o caso de containerizar.

---

## 6. Backlog para quando o produto crescer

- **`Bun.Image`** — `config/src/s3.ts` está pronto mas sem nenhum consumidor, e `Avatar.tsx` só renderiza uma URL (`user.image` é `text` no schema). Quando entrar upload de avatar, o pipeline resize/webp sai de graça, sem `sharp` nem addon nativo.
- **`Bun.cron()`** — não há job agendado hoje; é a opção natural para o primeiro.
- **`--cpu-prof-md` / `--heap-prof-md`** — profile em Markdown, legível por SSH e colável em LLM. Útil para diagnosticar o server no Railway sem anexar DevTools.

---

## 7. Ordem de execução sugerida

1. Bump das versões da seção 2 e `bun install` (aceitar a migração do lockfile para v2).
2. `bun check` e `bun test`.
3. Validar em staging os itens 1 e 2 da seção 3 — login e chamada RPC com body.
4. Aplicar 4.1, 4.2 e 4.3.
5. Avaliar 4.4 num branch isolado, medindo o tempo de install no CI antes e depois.
6. Tratar 4.5 como tarefa separada, por causa do fallback SPA.
