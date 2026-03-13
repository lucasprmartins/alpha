---
paths:
  - "apps/web/**"
---

## Frontend

O frontend é construído usando React 19 + TanStack Router/Query + DaisyUI. Ele é responsável pela interface do usuário e interação com a API.

## Instruções

- Imports internos usam alias `@/` (ex: `@/features/x.queries`).
- Componentes de domínio ficam em `features/`, componentes genéricos em `components/`.
- Queries e mutations ficam em `features/*.queries.ts`, tipos em `features/*.types.ts`.
- Funções utilitárias genéricas ficam em `utils/`.
