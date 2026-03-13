---
paths:
  - "apps/web/**"
---

## Frontend

O frontend é construído usando React 19 + TanStack Router/Query + DaisyUI. Ele é responsável pela interface do usuário e interação com a API.

## Instruções

- Imports internos usam alias `@/` (ex: `@/features/x.queries`).
- Componentes de página ficam em `pages/`.
- Componentes de domínio ficam em `features/`, componentes genéricos em `components/`.
- Arquivos de componentes usam PascalCase (ex: `DashboardPage.tsx`), hooks usam camelCase (ex: `useAuth.ts`).
- Queries e mutations ficam em `features/*.queries.ts`, interfaces e tipos em `features/*.contracts.ts`.
- Funções utilitárias genéricas ficam em `utils/`.
