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

- **SEMPRE** consulte a documentação via Context7 antes de implementar código que use qualquer biblioteca do stack. Não confie apenas no conhecimento prévio — APIs mudam entre versões.
- Funções devem ter a nomenclatura clara e seguir o padrão camelCase, enquanto classes e interfaces devem usar PascalCase.
- Funções devem ser focadas, com baixa complexidade e early returns para reduzir aninhamento.
- Utilize o linter (Ultracite) para manter um estilo de código consistente e corrigir problemas comuns.
- Para fazer checagem de lint e tipos, sempre utilize o comando `bun check` que roda ambos em sequência, garantindo que o código esteja limpo e sem erros de tipo antes de ser commitado.

## Abordagem

- Pense antes de agir. Leia os arquivos existentes antes de escrever código.
- Seja conciso na saída, mas minucioso no raciocínio.
- Prefira editar a reescrever arquivos inteiros.
- Não releia arquivos que já foram lidos, a menos que possam ter sido alterados.
- Teste seu código antes de declarar como concluído.
- Sem aberturas bajuladoras ou enrolação no final.
- Mantenha as soluções simples e diretas.
- Instruções do usuário sempre sobrescrevem este arquivo.