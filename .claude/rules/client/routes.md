---
paths:
  - "apps/web/src/routes/**"
---

## Routes (TanStack Router)

As routes são definidas com base em arquivos.

## Convenções de Arquivo

- `__root.tsx` é o layout raiz que envolve toda a aplicação.
- Arquivos com prefixo `_` são layouts pathless que protegem rotas filhas.
- `index.tsx` define a rota exata do diretório (`/`).
- Arquivos com `$` definem segmentos dinâmicos (`$postId.tsx` → `/posts/123`) ou catch-all (`$.tsx`).
- Diretórios organizam hierarquia: `posts/` → `/posts/*`.

## Instruções

- O route tree é gerado automaticamente, **NUNCA** edite `routeTree.gen.ts`.
- Use `createFileRoute` para definir rotas, layouts e sub-rotas.
- Rotas protegidas ficam em `src/routes/_auth/` com autenticação via `beforeLoad` no layout `_auth.tsx`. Verifica sessão via `ensureQueryData(sessionOptions)` e redireciona para `/login` se não autenticado.
- Arquivos de rota contêm **APENAS** configuração: `createFileRoute`, `beforeLoad`, `loader`, `validateSearch` e import do componente de `@/features/*.component`.
- Passe `from` ao usar `useNavigate` para garantir tipagem correta e evitar erros de navegação.
- Ciclo de vida da rota: `beforeLoad` → `loader` → componente renderiza:
  - Se `beforeLoad` falhar, o loader não executa e a navegação é redirecionada.
  - `loader` recebe `context.queryClient` via router context.
  - Use `ensureQueryData` para pré-carregar e cachear os dados. **SEMPRE** `await` o resultado (evita inferência de tipo complexa no TS).
  - Loader não retorna dados — apenas garante que estão no cache.
  - Use o **mesmo `queryOptions()`** no loader e no componente (single source of truth).
  - No componente, use `useSuspenseQuery` para ler do cache sem loading state.
- Ao adicionar uma nova rota, incluir em `src/lib/navigation.ts` com `to` sem prefixo `_auth`.
