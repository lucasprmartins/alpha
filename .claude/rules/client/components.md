---
paths:
  - "apps/web/src/components/**"
  - "apps/web/src/features/*.component.tsx"
---

## Componentes React

Os componentes React são a base da interface do usuário e devem ser escritos de forma clara, consistente e fácil de manter.

## Estrutura de Componente

Em ordem sequencial, os componentes React devem seguir esta estrutura lógica para clareza e organização:
1. Helpers e constantes.
2. Hooks locais (`useState`, `useEffect`, etc.).
3. Sub-componentes: componentes internos (não exportados) usados por composição.
4. Componentes exportados: em ordem de dependência (providers primeiro, depois consumidores).

## Instruções

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
<Activity mode={isVisible ? 'visible' : 'hidden'}>
  <Sidebar />
</Activity>
```

- Use `React.SyntheticEvent` no `onSubmit`.
- Estado local com `useState` para campos controlados.
- Validação no submit, não em cada onChange.
- Botão de submit desabilitado quando `enviando` ou campos vazios.
