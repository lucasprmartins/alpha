---
paths:
  - "apps/web/src/**/*.css"
  - "apps/web/src/components/**"
  - "apps/web/src/features/**"
---

## Styling (Tailwind e DaisyUI)

O estilo visual da aplicação é construído com Tailwind CSS e DaisyUI, seguindo uma abordagem de design system para consistência, acessibilidade e facilidade de manutenção.

## Instruções

- **SEMPRE** utilize componentes DaisyUI para consistência (`btn`, `card`, `input`, `alert`, `modal`, `skeleton`, `fieldset`, entre outros).
- Classes semânticas (`btn-primary`) em vez de cores diretas (`bg-blue-500`).
- Fundos com `bg-base-100`, `bg-base-200` para respeitar o tema (claro/escuro).
- Texto com `text-base-content` para adaptar ao tema.
- **EVITE** sombras para destacar, use bordas (`card-border`).
- Grid responsivo com `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- Espaçamento consistente com `gap-4` ou `gap-6`.
- **SEMPRE** utilize Phosphor Icons, importando de `@phosphor-icons/react` (os componentes importados devem ter todos o sufixo `Icon`).
- Para ícones, use os pesos `regular` para elementos informativos, `bold` para ações e `fill` para estados ativos.