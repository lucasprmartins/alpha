---
paths:
  - "apps/client/**"
---

## Frontend

O frontend é construído usando React 19 + TanStack Router/Query + DaisyUI. Ele é responsável pela interface do usuário e interação com a API.

## Instruções

- Imports internos usam alias `@/` (ex: `@/features/Task/queries`).
- Componentes de página ficam em `pages/`.
- Componentes de domínio ficam em `features/`
- Componentes genéricos ficam em `components/`.
- Arquivos de componentes usam PascalCase (ex: `DashboardPage.tsx`), hooks usam camelCase (ex: `useAuth.ts`).
- Features são organizadas em pasta PascalCase por domínio: `features/<Dominio>/contracts.ts`, `queries.ts`, `components.tsx`.
- Funções utilitárias genéricas ficam em `utils/`.
- **NUNCA** edite ou gere manualmente `routeTree.gen.ts` — ele é gerado automaticamente pelo plugin `@tanstack/router-plugin/vite` ao rodar `bun dev`. Apenas crie o arquivo da rota em `routes/`.
