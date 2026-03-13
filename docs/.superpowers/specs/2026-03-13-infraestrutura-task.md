# Especificação: Infraestrutura do Domínio Task

> Este documento deve ser usado como entrada para a skill `superpowers:planning`.

## Objetivo e Contexto

Implementar os arquivos de infraestrutura (schema, repository, router) do domínio Task como código funcional, servindo de referência para desenvolvedores criarem novos domínios.

O projeto possui um domínio Task completo com entidade rica, contratos e 7 casos de uso, mas os módulos de infraestrutura (`modules/db/src/schema/`, `modules/db/src/repositories/`, `modules/api/src/routers/`) estão vazios. Sem uma implementação de referência, desenvolvedores não têm como saber o padrão esperado para conectar o domínio à camada de infraestrutura.

---

## Requisitos Funcionais

- Criar schema Drizzle para a entidade Task em `modules/db/src/schema/task.ts`, seguindo as convenções do `auth.ts` (pgSchema, RLS, timestamps com timezone, snake_case)
- Criar repository em `modules/db/src/repositories/Task.ts` que implemente a interface `TaskRepository` definida em `domain/src/contracts/Task.ts`, utilizando Drizzle para persistência
- Criar router oRPC em `modules/api/src/routers/task.ts` que exponha os 7 casos de uso do Task (Create, List, Start, Complete, Cancel, Reopen, Delete) como endpoints tipados
- Registrar o router do Task no servidor principal em `modules/api/src/server.ts`

---

## Arquitetura

A implementação segue a arquitetura em camadas já estabelecida no projeto, onde cada componente tem responsabilidade clara e bem definida. A abordagem escolhida é implementar código real e funcional do domínio Task, pois serve como documentação viva testável e elimina a necessidade de manter templates separados.

**Componentes:**
- `modules/db/src/schema/task.ts`: Define a tabela `task` no PostgreSQL com todos os campos da entidade (title, status, priority, dueDate, cancellationReason, timestamps) usando Drizzle ORM
- `modules/db/src/repositories/Task.ts`: Implementa `TaskRepository` do domínio, traduzindo entre entidades de domínio e registros do banco via Drizzle queries
- `modules/api/src/routers/task.ts`: Define as rotas oRPC com validação de input, middleware de autenticação e chamada aos casos de uso, retornando resultados tipados

O fluxo de dados é: Router recebe request HTTP via oRPC → valida input → instancia o caso de uso com o repository concreto → caso de uso executa lógica de domínio → repository persiste alterações → resultado tipado é retornado ao cliente.

---

## Restrições e Decisões

- Seguir exatamente as convenções do schema `auth.ts`: tabela singular, colunas snake_case, `.enableRLS()`, timestamps `createdAt`/`updatedAt` com timezone
- O repository deve implementar fielmente a interface `TaskRepository` do domínio sem alterá-la
- O router deve utilizar os middlewares de autenticação existentes (`requireAuth`) definidos em `modules/api/src/auth.ts`
- Consultar documentação via Context7 para Drizzle ORM e oRPC antes de implementar, conforme regra do CLAUDE.md
- Manter nomenclatura: schema e router em camelCase para arquivo (`task.ts`), repository em PascalCase (`Task.ts`) seguindo convenção de contratos do domínio

---

## Critérios de Sucesso

- [ ] Schema define tabela com todos os campos da entidade Task e gera migration válida
- [ ] Repository implementa todos os métodos do contrato `TaskRepository` (create, delete, findAll, findById, update)
- [ ] Router expõe endpoints para os 7 casos de uso (Create, List, Start, Complete, Cancel, Reopen, Delete)
- [ ] Router está registrado no servidor principal em `server.ts`
- [ ] `bun check` passa sem erros de lint ou tipo
