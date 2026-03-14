---
paths:
  - "apps/client/src/features/**"
---

## Queries e Mutations (TanStack DB + TanStack Query v5 + oRPC)

Dados reativos via TanStack DB collections. TanStack Query v5 + oRPC para transporte e cache base.

## Instruções

### Collections (TanStack DB)

- Cada domínio define uma collection com `createCollection(queryCollectionOptions({...}))` no `queries.ts`.
- `queryKey` e `queryFn` usam o `client` oRPC direto (não `api` utils).
- `queryClient` importado do singleton em `@/lib/queryClient`.
- `getKey` retorna o ID da entidade.
- Handlers `onInsert`, `onUpdate`, `onDelete` delegam para o `client` oRPC correspondente.
- `onUpdate` identifica a operação pelos campos modificados (ex: `modified.status === "completed"` → `client.X.completeX()`).

### Leitura

- `useLiveQuery((q) => q.from({ alias: collection }))` para binding reativo nos componentes.
- `api.X.queryOptions()` apenas para route loaders (`ensureQueryData`).

### Mutations

- Chamar `collection.update()`, `.insert()`, `.delete()` diretamente nos componentes.
- Optimistic updates são automáticos — rollback acontece se o handler lançar erro.
- Metadata extra (ex: `reason` em cancel) é passada via campos do draft no `.update()`.

### Fallback (sem collection)

- `api` para queries (`queryOptions()`, `infiniteOptions()`, `key()`), `client` para chamadas imperativas.
- `isPending` sobre `isLoading`.
- Invalidação como padrão após mutations simples.
- Usar `ORPCError` para tratar erros tipados.
