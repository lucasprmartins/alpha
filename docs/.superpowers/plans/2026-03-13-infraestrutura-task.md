# Plano de Implementação: Infraestrutura do Domínio Task

> Este documento deve ser usado como entrada para a skill `superpowers:building`.

> Este plano de implementação é referente a especificação `docs/.superpowers/specs/2026-03-13-infraestrutura-task.md`.

> Você pode consultar objetivo, contexto e arquitetura nas especificações.

## Pilha de Tecnologias

- Drizzle ORM (schema PostgreSQL, queries tipadas com `eq`, `select`, `insert`, `update`, `delete`)
- oRPC (rotas tipadas com `.route()`, `.input()`, `.output()`, `.errors()`, `.handler()`)
- Zod 4 (validação de input/output com `.describe()` para OpenAPI)
- Better Auth (middleware `requireAuth` via `@app/api/auth`)

---

## Tarefas

### Tarefa 1: Schema Drizzle da Entidade Task

**Esta tarefa depende de:** Nenhuma

#### Objetivo:

Definir a tabela `task` no PostgreSQL usando Drizzle ORM, mapeando todos os campos da entidade de domínio `Task`.

#### Implementação:

Criar o arquivo de schema seguindo as convenções do `auth.ts`. Usar `pgSchema("public")` não é necessário pois tabelas no schema `public` usam `pgTable` diretamente — o `drizzle.config.ts` já inclui `"public"` no `schemaFilter` (linha 13). A tabela deve ser singular (`task`), com colunas em snake_case e `.enableRLS()`.

Campos da entidade `Task` (referência: `domain/src/entities/Task.ts:7-19`):
- `id`: text, primaryKey (UUID gerado pelo domínio via `crypto.randomUUID()`)
- `title`: text, notNull
- `description`: text, nullable
- `status`: text, notNull, default "pending" (valores: "pending", "in_progress", "completed", "cancelled")
- `priority`: text, notNull, default "medium" (valores: "low", "medium", "high", "urgent")
- `dueDate`: timestamp with timezone, nullable
- `completedAt`: timestamp with timezone, nullable
- `cancelledAt`: timestamp with timezone, nullable
- `cancellationReason`: text, nullable
- `createdAt`: timestamp with timezone, defaultNow, notNull
- `updatedAt`: timestamp with timezone, defaultNow, `$onUpdate(() => new Date())`, notNull

Adicionar `.enableRLS()` na tabela, conforme padrão do `auth.ts:26`.

**Arquivos:**
- Criar: `modules/db/src/schema/task.ts`

---

### Tarefa 2: Repository do Domínio Task

**Esta tarefa depende de:** Tarefa 1

#### Objetivo:

Implementar a interface `TaskRepository` definida em `domain/src/contracts/Task.ts` usando Drizzle ORM para persistência.

#### Implementação:

Criar o repository que implementa os 5 métodos do contrato `TaskRepository` (`domain/src/contracts/Task.ts:3-9`): `create`, `delete`, `findAll`, `findById`, `update`.

O repository deve:
- Importar `db` de `@app/db` e o schema `task` de `@app/db/schema/task`
- Importar `Task` e `TaskProps` de `@app/domain/entities/Task`
- Importar `eq` de `drizzle-orm` para filtros
- Traduzir entre entidades de domínio (`Task`) e registros do banco:
  - Para **persistir**: extrair os campos da entidade via getters e propriedades públicas (`id`, `title`, `description`, `status`, `priority`, `dueDate`, `completedAt`, `cancelledAt`, `cancellationReason`, `createdAt`, `updatedAt`)
  - Para **reconstituir**: criar `new Task(props)` a partir do registro do banco, passando um objeto `TaskProps`
- Usar `db.insert(task).values(...)` para `create`
- Usar `db.select().from(task).where(eq(task.id, id))` para `findById`
- Usar `db.select().from(task)` para `findAll`
- Usar `db.update(task).set(...).where(eq(task.id, entity.id))` para `update`
- Usar `db.delete(task).where(eq(task.id, id))` para `delete`

Exportar como objeto que satisfaz `TaskRepository` (não como classe — usar padrão funcional com objeto literal).

**Arquivos:**
- Criar: `modules/db/src/repositories/Task.ts`

---

### Tarefa 3: Router oRPC do Domínio Task

**Esta tarefa depende de:** Tarefa 2

#### Objetivo:

Definir as rotas oRPC que expõem os 7 casos de uso do Task como endpoints tipados com validação, autenticação e documentação OpenAPI.

#### Implementação:

Criar o router seguindo o padrão definido nas regras do projeto (`api.md`). Cada rota deve usar:
- `o.use(requireAuth)` pois todas as operações de Task exigem autenticação (importar `o` e `requireAuth` de `@app/api/auth`)
- `.route({ method, path, summary, description, tags })` para gerar documentação OpenAPI
- `.input(z.object({...}))` com `.describe()` em cada campo para documentação
- `.errors({...})` com erros tipados (NOT_FOUND, BAD_REQUEST) — nunca `ORPCError` direto
- `.handler()` que instancia o caso de uso com o repository e executa

Endpoints (7 casos de uso de `domain/src/application/Task.ts`):
1. **createTask**: POST `/tasks` — input: `{ title, description?, priority?, dueDate? }` — usa `CreateTask`
2. **listTasks**: GET `/tasks` — sem input — usa `ListTasks`
3. **startTask**: PATCH `/tasks/{id}/start` — input: `{ id }` — usa `StartTask`
4. **completeTask**: PATCH `/tasks/{id}/complete` — input: `{ id }` — usa `CompleteTask`
5. **cancelTask**: PATCH `/tasks/{id}/cancel` — input: `{ id, reason }` — usa `CancelTask`
6. **reopenTask**: PATCH `/tasks/{id}/reopen` — input: `{ id }` — usa `ReopenTask`
7. **deleteTask**: DELETE `/tasks/{id}` — input: `{ id }` — usa `DeleteTask`

Cada handler deve verificar o `Result` retornado pelo caso de uso: se `!result.ok`, lançar o erro tipado correspondente (NOT_FOUND para `TaskNotFoundError`, BAD_REQUEST para `TaskValidationError` e `InvalidTaskTransitionError`).

Exportar como `taskRouter` — um objeto com as 7 rotas nomeadas.

Importar o `taskRepository` de `@app/db/repositories/Task`.

**Arquivos:**
- Criar: `modules/api/src/routers/task.ts`

---

### Tarefa 4: Registrar Router no Servidor

**Esta tarefa depende de:** Tarefa 3

#### Objetivo:

Registrar o `taskRouter` no router principal do servidor para que os endpoints fiquem disponíveis.

#### Implementação:

Modificar `modules/api/src/server.ts` para:
1. Importar `taskRouter` de `./routers/task`
2. Registrar no objeto `router` na linha 8, adicionando `task: taskRouter`

O `drizzle.config.ts` já inclui `"public"` no `schemaFilter` (linha 13), então não precisa de alteração.

**Arquivos:**
- Modificar: `modules/api/src/server.ts:1-8`
