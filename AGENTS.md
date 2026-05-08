# Instruções do Projeto para Codex

## Visão Geral

Monorepo fullstack com arquitetura limpa orientada a domínio. Separa responsabilidades tanto na arquitetura de software quanto na estrutura de pastas, servindo como base escalável para aplicações web complexas.

## Conhecimento Necessário

### Stack

- Bun para runtime, gerenciamento de pacotes e testes.
- Elysia como framework de servidor HTTP em `apps/server`.
- React 19 com TanStack Router e Query para frontend em `apps/client`.
  - Tailwind CSS e DaisyUI para estilização e design.
  - Phosphor Icons para ícones.
- Drizzle ORM com PostgreSQL para persistência em `modules/db`.
- oRPC para definição de API fortemente tipada em `modules/api`.
- Better Auth para autenticação em `modules/auth`.

### Arquitetura

A arquitetura é baseada em camadas, onde cada camada tem responsabilidades claras e bem definidas:

- **Domínio `domain/`**: Contém entidades, regras de negócio e casos de uso que orquestram as operações. Deve ser independente de frameworks e tecnologias específicas.
- **Infraestrutura `modules/`**: Implementa detalhes técnicos como acesso a banco de dados, serviços externos e frameworks. Deve ser o mais isolada possível do domínio para facilitar manutenção e testes.

## Instruções

- **SEMPRE** consulte a documentação atual antes de implementar código que use qualquer biblioteca do stack. Não confie apenas no conhecimento prévio; APIs mudam entre versões.
- Funções devem ter a nomenclatura clara e seguir o padrão camelCase, enquanto classes e interfaces devem usar PascalCase.
- Funções devem ser focadas, com baixa complexidade e early returns para reduzir aninhamento.
- Utilize o linter (Ultracite) para manter um estilo de código consistente e corrigir problemas comuns.
- Para fazer checagem de lint e tipos, sempre utilize o comando `bun check` que roda ambos em sequência, garantindo que o código esteja limpo e sem erros de tipo antes de ser commitado.

## Abordagem

- Pense antes de agir. Leia os arquivos existentes antes de escrever código.
- Pode usar `bun arquivo.md` para ler arquivos Markdown diretamente no CLI.
- Seja conciso na saída, mas minucioso no raciocínio.
- Prefira editar a reescrever arquivos inteiros.
- Não releia arquivos que já foram lidos, a menos que possam ter sido alterados.
- Teste seu código antes de declarar como concluído.
- Sem aberturas bajuladoras ou enrolação no final.
- Mantenha as soluções simples e diretas.
- Instruções do usuário sempre sobrescrevem este arquivo.

## Lógica de Negócio (`domain/**`)

A lógica de negócio é o coração do sistema, onde as regras e invariantes do domínio são implementadas. Ela deve ser completamente isolada de detalhes técnicos (banco de dados, APIs, etc) para garantir que as regras de negócio sejam claras, testáveis e independentes de frameworks.

- Use Cases ficam em `domain/application/`, recebem repositórios por injeção (higher-order function) e implementam a orquestração da lógica de negócio, chamando as entidades e repositórios conforme necessário.
- Contratos de interfaces de repositório + DTOs ficam em `domain/contracts/`, que a infraestrutura implementa.
- **CRUD** não tem camada application; o router chama o repositório.
- Entidades são classes que representam os objetos do domínio com suas regras e invariantes. Elas encapsulam o estado e comportamento relacionados a um conceito do negócio, garantindo que as regras sejam sempre respeitadas.
- As entidades são apenas para **DOMÍNIO DE NEGÓCIOS**.

## Frontend (`apps/client/**`)

O frontend é construído usando React 19 + TanStack Router/Query + DaisyUI. Ele é responsável pela interface do usuário e interação com a API.

- Imports internos usam alias `@/` (ex: `@/features/Task/queries`).
- Componentes de página ficam em `pages/`.
- Componentes de domínio ficam em `features/`.
- Componentes genéricos ficam em `components/`.
- Arquivos de componentes usam PascalCase (ex: `DashboardPage.tsx`), hooks usam camelCase (ex: `useAuth.ts`).
- Features são organizadas em pasta PascalCase por domínio: `features/<Dominio>/contracts.ts`, `queries.ts`, `components.tsx`.
- Funções utilitárias genéricas ficam em `utils/`.
- **NUNCA** edite ou gere manualmente `routeTree.gen.ts`; ele é gerado automaticamente pelo plugin `@tanstack/router-plugin/vite` ao rodar `bun dev`. Apenas crie o arquivo da rota em `routes/`.

## Componentes React

Aplica-se a `apps/web/src/components/**`, `apps/web/src/features/**` e `apps/web/src/pages/**`.

Os componentes React são a base da interface do usuário e devem ser escritos de forma clara, consistente e fácil de manter.

### Estrutura de Componente

Em ordem sequencial, os componentes React devem seguir esta estrutura lógica para clareza e organização:

1. Helpers e constantes.
2. Hooks locais (`useState`, `useEffect`, etc.).
3. Sub-componentes: componentes internos (não exportados) usados por composição.
4. Componentes exportados: em ordem de dependência (providers primeiro, depois consumidores).

### Instruções

- Evite misturar lógica de renderização (JSX) com lógica de dados (fetching, state) para melhor legibilidade.
- Mantenha o componente principal focado na renderização, delegando lógica complexa para hooks ou sub-componentes.
- Use `useEffect` apenas para efeitos colaterais que não se encaixam em outras categorias (fetching, estado derivado, eventos). Evite usá-lo para lógica que pode ser resolvida durante o render ou com outros hooks.
- **NÃO USE** `FormEvent`, use `React.SyntheticEvent<HTMLFormElement, SubmitEvent>`.
- Prefira `useTransition` para atualizações não-urgentes.
- Em vez de renderização condicional com `&&` que **desmonta** o componente e perde estado, use `<Activity>` para **preservar** estado e DOM (Use para: tabs, sidebars, modais, navegação que o usuário retorna):

```tsx
// Evite — desmonta e perde estado
{isVisible && <Sidebar />}

// Prefira — preserva estado quando oculto
<Activity mode={isVisible ? "visible" : "hidden"}>
  <Sidebar />
</Activity>
```

- Use `React.SyntheticEvent` no `onSubmit`.
- Estado local com `useState` para campos controlados.
- Validação no submit, não em cada onChange.
- Botão de submit desabilitado quando `enviando` ou campos vazios.
- Modais: `<dialog className="modal">` controlado por ref imperativo (`useImperativeHandle` expondo `open()`). Nunca sincronizar prop com `showModal`/`close` via `useEffect`.

## Queries e Mutations (`apps/client/src/features/**`)

Dados reativos via TanStack DB collections. TanStack Query v5 + oRPC para transporte e cache base.

### Collections (TanStack DB)

- Cada domínio define uma collection com `createCollection(queryCollectionOptions({...}))` no `queries.ts`.
- `queryKey` e `queryFn` usam o `client` oRPC direto (não `api` utils).
- `queryClient` importado do singleton em `@/lib/queryClient`.
- `getKey` retorna o ID da entidade.
- Handlers `onInsert`, `onUpdate`, `onDelete` delegam para o `client` oRPC correspondente.
- `onUpdate` identifica a operação pelos campos modificados (ex: `modified.status === "completed"` -> `client.X.completeX()`).

### Leitura

- `useLiveQuery((q) => q.from({ alias: collection }))` para binding reativo nos componentes.
- `api.X.queryOptions()` apenas para route loaders (`ensureQueryData`).

### Mutations

- Chamar `collection.update()`, `.insert()`, `.delete()` diretamente nos componentes.
- Optimistic updates são automáticos; rollback acontece se o handler lançar erro.
- Metadata extra (ex: `reason` em cancel) é passada via campos do draft no `.update()`.

### Fallback (sem collection)

- `api` para queries (`queryOptions()`, `infiniteOptions()`, `key()`), `client` para chamadas imperativas.
- `isPending` sobre `isLoading`.
- Invalidação como padrão após mutations simples.
- Usar `ORPCError` para tratar erros tipados.

## Routes (`apps/web/src/routes/**`)

As routes são definidas com base em arquivos.

### Convenções de Arquivo

- `__root.tsx` é o layout raiz que envolve toda a aplicação.
- Arquivos com prefixo `_` são layouts pathless que protegem rotas filhas.
- `index.tsx` define a rota exata do diretório (`/`).
- Arquivos com `$` definem segmentos dinâmicos (`$postId.tsx` -> `/posts/123`) ou catch-all (`$.tsx`).
- Diretórios organizam hierarquia: `posts/` -> `/posts/*`.

### Instruções

- O route tree é gerado automaticamente, **NUNCA** edite `routeTree.gen.ts`.
- Use `createFileRoute` para definir rotas, layouts e sub-rotas.
- Rotas protegidas ficam em `src/routes/_auth/` com autenticação via `beforeLoad` no layout `_auth.tsx`. Verifica sessão via `ensureQueryData(sessionOptions)` e redireciona para `/login` se não autenticado.
- Arquivos de rota contêm **APENAS** configuração: `createFileRoute`, `beforeLoad`, `loader`, `validateSearch` e import do componente de `@/pages/`.
- Passe `from` ao usar `useNavigate` para garantir tipagem correta e evitar erros de navegação.
- Ciclo de vida da rota: `beforeLoad` -> `loader` -> componente renderiza:
  - Se `beforeLoad` falhar, o loader não executa e a navegação é redirecionada.
  - `loader` recebe `context.queryClient` via router context.
  - Use `ensureQueryData` para pré-carregar e cachear os dados. **SEMPRE** `await` o resultado (evita inferência de tipo complexa no TS).
  - Loader não retorna dados; apenas garante que estão no cache.
  - Use o **mesmo `queryOptions()`** no loader e no componente (single source of truth).
  - No componente, use `useSuspenseQuery` para ler do cache sem loading state.
- Ao adicionar uma nova rota, incluir em `src/lib/navigation.ts` com `to` sem prefixo `_auth`.

## Styling

Aplica-se a `apps/web/src/**/*.css`, `apps/web/src/components/**` e `apps/web/src/features/**`.

O estilo visual da aplicação é construído com Tailwind CSS e DaisyUI, seguindo uma abordagem de design system para consistência, acessibilidade e facilidade de manutenção.

- **SEMPRE** utilize componentes DaisyUI para consistência (`btn`, `card`, `input`, `alert`, `modal`, `skeleton`, `fieldset`, entre outros).
- Classes semânticas (`btn-primary`) em vez de cores diretas (`bg-blue-500`).
- Fundos com `bg-base-100`, `bg-base-200` para respeitar o tema (claro/escuro).
- Texto com `text-base-content` para adaptar ao tema.
- **EVITE** sombras para destacar, use bordas (`card-border`).
- Grid responsivo com `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- Espaçamento consistente com `gap-4` ou `gap-6`.
- **SEMPRE** utilize Phosphor Icons, importando de `@phosphor-icons/react` (os componentes importados devem ter todos o sufixo `Icon`).
- Para ícones, use os pesos `regular` para elementos informativos, `bold` para ações e `fill` para estados ativos.

## Backend

Aplica-se a `apps/server/**`, `modules/db/**`, `modules/api/**` e `modules/auth/**`.

O backend é construído usando Elysia + Bun. Ele é responsável por expor a API e interagir com a infraestrutura.

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

## Routers API (`modules/api/**`)

As rotas API são definidas usando oRPC, que gera tipos automáticos para cliente e servidor.

### Auth Middleware

- `o.route(...)` para rotas públicas.
- `o.use(requireAuth).route()` para rotas que exigem sessão.
- `o.use(requireRole("admin")).route()` para rotas que exigem role específica.

### Router

- **CRUD**: importar e chamar o repositório diretamente no handler.
- Convenção: `{Dominio}Router`, registrar em `src/server.ts`.
- Utilizar `logger.debug(...)` para inputs e outputs importantes para o desenvolvimento.

### OpenAPI

- Schemas Zod com `.describe()` em cada campo parar gerar documentação automática (OpenAPI) e validação robusta.
- Rotas com `method`, `path`, `summary`, `description`, `tags` em `.route()` para gerar documentação e organização automática (OpenAPI).
- `z.coerce.number()` para inputs de GET (query params chegam como string).

### Tratamento de Erros

- Use `.errors()` com dados tipados; nunca `ORPCError` direto.
- Converta `null` do Core em erros HTTP: `NOT_FOUND`, `CONFLICT`, `BAD_REQUEST`.
- Handler verifica `null` e lança `throw errors.X({ data: {...} })`.

## Autenticação (`modules/auth/**`)

A autenticação é implementada usando Better Auth para gerenciamento de users, sessions e roles.

### Backend

- Parar criar dados extras do usuário: use `additionalFields` do Better Auth; não crie um domínio User separado.
- O contexto da sessão é extraído via `createContext()` e passado a todos os handlers oRPC.

### Frontend

- Use os hooks `useSignIn()`, `useSignUp()` e `useSignOut()` para autenticação, que cuidam de refetch da sessão e redirecionamentos automáticos.
- Usar `ensureQueryData(sessionOptions)` no `beforeLoad` das rotas protegidas.
- AuthProvider configura redirects: `afterSignIn`, `afterSignUp`, `afterSignOut`.

### Plugins

- `username` para login simples por username.
- `admin` para gerenciamento de usuários e roles.

## Infraestrutura (`modules/db/**`)

O banco de dados é implementado usando Drizzle ORM, com PostgreSQL como SGBD.

- Os nomes das tabelas são singular em lower_snake_case.
- **SEMPRE** incluir `.enableRLS()` nas tabelas.
- **SEMPRE** incluir `createdAt` e `updatedAt` (timestamps com timezone) como colunas nas tabelas.
- `.returning()` em querys com INSERT/UPDATE/DELETE para obter os dados afetados.
- `.limit(1)` em consultas de item único, destructure com `const [row]`.
- `.set()`/`.values()` **NUNCA** incluem `id`, `createdAt`, `updatedAt`.
- Paginação: busca `limite + 1` com offset, `slice(0, limite)`, retorna `nextCursor: more ? cursor + limite : null`.
- **NUNCA** edite `src/db/migrations/`.
- Após criar ou alterar schema utilize o comando `bun db:generate`.
- Use `db.transaction(async (tx) => {...})` para atomicidade.
- Use `tx` (não `db`) para todas as queries dentro da transação.
- Rollback automático se exceção for lançada.
