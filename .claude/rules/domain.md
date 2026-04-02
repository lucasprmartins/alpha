---
paths:
  - "domain/**"
---

## Lógica de Negócio

A lógica de negócio é o coração do sistema, onde as regras e invariantes do domínio são implementadas. Ela deve ser completamente isolada de detalhes técnicos (banco de dados, APIs, etc) para garantir que as regras de negócio sejam claras, testáveis e independentes de frameworks.

### Instruções

- Use Cases ficam em `domain/application/`, recebem repositórios por injeção (higher-order function) e implementam a orquestração da lógica de negócio, chamando as entidades e repositórios conforme necessário.
- Contratos de interfaces de repositório + DTOs ficam em `domain/contracts/`, que a infraestrutura implementa.
- **CRUD** não tem camada application — o router chama o repositório.
- Entidades são classes que representam os objetos do domínio com suas regras e invariantes. Elas encapsulam o estado e comportamento relacionados a um conceito do negócio, garantindo que as regras sejam sempre respeitadas.
- As entidades são apenas para **DOMÍNIO DE NEGÓCIOS**.
