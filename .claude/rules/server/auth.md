---
paths:
  - "modules/auth/**"
---

## Autenticação (Better Auth)

A autenticação é implementada usando Better Auth para gerenciamento de users, sessions e roles.

## Instruções

### Backend

- Parar criar dados extras do usuário: use `additionalFields` do Better Auth — não crie um domínio User separado.
- O contexto da sessão é extraído via `createContext()` e passado a todos os handlers oRPC.

## Frontend

- Use os hooks `useSignIn()`, `useSignUp()` e `useSignOut()` para autenticação, que cuidam de refetch da sessão e redirecionamentos automáticos.
- Usar `ensureQueryData(sessionOptions)` no `beforeLoad` das rotas protegidas.
- AuthProvider configura redirects: `afterSignIn`, `afterSignUp`, `afterSignOut`.

### Plugins

- `username` para login simples por username.
- `admin` para gerenciamento de usuários e roles.
