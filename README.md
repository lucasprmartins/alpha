<div align="center">

<img src="apps/client/src/assets/logo-1.svg" alt="Alpha" width="200" />
<br><br>


**Template full-stack TypeScript com arquitetura limpa em monorepo.**

<a href="https://bun.sh/"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bun/bun-original.svg" width="30" title="Bun" alt="Bun" /></a>&nbsp;&nbsp;
<a href="https://elysiajs.com/"><img src="https://raw.githubusercontent.com/elysiajs/documentation/main/docs/public/assets/elysia.svg" width="30" title="Elysia" alt="Elysia" /></a>&nbsp;&nbsp;
<a href="https://www.better-auth.com/"><img src="https://svgl.app/library/better-auth_dark.svg" width="30" title="Better Auth" alt="Better Auth" /></a>&nbsp;&nbsp;
<a href="https://www.postgresql.org/"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="30" title="PostgreSQL" alt="PostgreSQL" /></a>&nbsp;&nbsp;
<a href="https://orm.drizzle.team/"><img src="https://cdn.simpleicons.org/drizzle" width="30" title="Drizzle ORM" alt="Drizzle ORM" /></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<a href="https://tanstack.com/router"><img src="https://tanstack.com/images/logos/logo-color-100.png" width="30" title="TanStack Router" alt="TanStack Router" /></a>&nbsp;&nbsp;
<a href="https://react.dev/"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="30" title="React" alt="React" /></a>&nbsp;&nbsp;
<a href="https://tailwindcss.com/"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="30" title="Tailwind CSS" alt="Tailwind CSS" /></a>&nbsp;&nbsp;
<a href="https://daisyui.com/"><img src="https://img.daisyui.com/images/daisyui/mark-static.svg" width="30" title="DaisyUI" alt="DaisyUI" /></a>


[Começando](#começando) · [Estrutura](#estrutura) · [Scripts](#scripts)

</div>

---

## Estrutura

```
apps/
├── proxy/         # Proxy reverso (Caddy)
├── server/        # Backend (Elysia)
└── client/        # Frontend (React 19)

domain/            # Domínio de negócio
config/            # Configurações

modules/
├── api/           # Rotas da API (oRPC)
├── auth/          # Auth (Better Auth)
└── db/            # Database (Drizzle ORM)
```

## Requisitos

- [Bun](https://bun.sh) >= 1.3.11
- [Docker](https://www.docker.com/) *(PostgreSQL local via Docker Compose)*
- [GitHub CLI](https://cli.github.com) (`gh`)

## Começando

1. Clone o template:

   ```bash
   gh repo clone lucasprmartins/alpha <nome-do-projeto>
   ```

   ou

   ```bash
   git clone https://github.com/lucasprmartins/alpha.git <nome-do-projeto>
   ```

2. Instale as dependências e execute o inicializador:

   ```bash
   cd <nome-do-projeto>
   bun install && bun setup
   ```

O script pergunta o nome do projeto, cria um repositório GitHub privado e faz o commit inicial.

## Após o setup

1. Configure as variáveis de ambiente:

```bash
bun env
```

2. Aplique os schemas no banco de dados:

```bash
bun db:push
```

3. Inicie o desenvolvimento:

```bash
bun dev
```

> O `bun dev` sobe automaticamente o PostgreSQL via Docker Compose antes de iniciar o server e o client.

4. Remova os arquivos de exemplo:

```bash
bun cleanup
```

> O `BETTER_AUTH_SECRET` é gerado automaticamente pelo `bun env`.

O servidor roda em `http://localhost:3000` e o frontend em `http://localhost:3001`.

## Deploy

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/QSrOcY)

O projeto inclui configuração pronta para deploy no [Railway](https://railway.com). Clique no botão acima para criar uma instância com todos os serviços configurados.

## Integrações

Integrações opcionais estão disponíveis via [alpha-plugins](https://github.com/lucasprmartins/alpha-plugins).

```bash
gh repo clone lucasprmartins/alpha-plugins
cd alpha-plugins && bun install && bun plugin
```
