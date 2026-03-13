---
paths:
  - "modules/api/**"
---

## Routers API (oRPC)

As rotas API são definidas usando oRPC, que gera tipos automáticos para cliente e servidor.

## Instruções

### Auth Middleware

- `o.route(...)` para rotas públicas.
- `o.use(requireAuth).route()` para rotas que exigem sessão.
- `o.use(requireRole("admin")).route()` para rotas que exigem role específica.

### Router

- **CRUD**: importar e chamar o repositório diretamente no handler.
- Convenção: `{Dominio}Router`, registrar em `src/server.ts`
- Utilizar `logger.debug(...)` para inputs e outputs importantes para o desenvolvimento.

### OpenAPI

- Schemas Zod com `.describe()` em cada campo parar gerar documentação automática (OpenAPI) e validação robusta.
- Rotas com `method`, `path`, `summary`, `description`, `tags` em `.route()` para gerar documentação e organização automática (OpenAPI).
- `z.coerce.number()` para inputs de GET (query params chegam como string)

### Tratamento de Erros

- Use `.errors()` com dados tipados — nunca `ORPCError` direto
- Converta `null` do Core em erros HTTP: `NOT_FOUND`, `CONFLICT`, `BAD_REQUEST`
- Handler verifica `null` e lança `throw errors.X({ data: {...} })`
