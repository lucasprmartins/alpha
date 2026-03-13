---
paths:
  - "apps/web/src/features/*.queries.ts"
---

## Queries (TanStack Query v5 + oRPC)

As queries e mutations utilizam TanStack Query v5 com oRPC para comunicação tipada com a API.

## Instruções

- `api` para queries (`queryOptions()`, `infiniteOptions()`, `key()`), `client` para mutations (`mutationFn`, chamadas imperativas).
- `isPending` sobre `isLoading`..
- Invalidação como padrão após mutations.
- Invalidar com `.key()` do domínio reseta todas as páginas do infinite query.
- Ações com feedback instantâneo **DEVEM** usar optimistic updates (toggle, favoritar, drag & drop, deletar de lista). O padrão:
  - `onMutate` cancela queries e salva snapshot.
  - `onError` faz rollback.
  - `onSettled` invalida.
- Usar `ORPCError` para tratar erros tipados no `onError`.
