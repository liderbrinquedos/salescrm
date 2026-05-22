# Pattern: Component Structure (Next.js App Router)

> **Categoria:** frontend-architecture  
> **Complexidade:** media  
> **Última revisão:** 2026-05-21

## Quando Usar

Aplicações Next.js 14+ com App Router que começam a ter páginas ou componentes muito grandes, misturando lógica de UI, estado e chamadas de API. Use este padrão para manter a manutenibilidade e escalabilidade.

## Como Implementar

1. **Separar responsabilidades por pasta:**
   - `src/app/` — rotas, layout, página principal (page.tsx fine)
   - `src/components/` — componentes reutilizáveis (UI pura, sem lógica de negócio)
   - `src/features/` — módulos por domínio (ex: `catalog/`, `orders/`, `customers/`) contendo seus componentes, hooks e lógica.
   - `src/lib/` — utilitários, clients (Prisma, fetch), helpers.
   - `src/store/` — estado global (Zustand, Context, etc)
   - `src/hooks/` — custom hooks genéricos.

2. **Componentes “dumb” em `components/` e “smart” em `features/`.**
3. **Rotas com Server Components por padrão; Client Components apenas onde interatividade for necessária (`'use client'`).**
4. **Tipos compartilhados em `src/types/` ou `src/lib/types.ts`.**

Exemplo de estrutura futura do SalesCRM:

```
src/
  app/
    layout.tsx
    page.tsx        -> apenas orquestração de features
    (auth)/...
  features/
    catalog/
      components/
        ProductCard.tsx
        ProductFilters.tsx
      hooks/
        useProducts.ts
    orders/
      components/
        OrderSheet.tsx
        OrderList.tsx
      hooks/
        useOrders.ts
    customers/
      ...
  components/
    ui/
      button.tsx
      card.tsx
      ...
  lib/
    db.ts
    api.ts
  store/
    cart-store.ts
```

## Regras

1. Cada feature é autocontida: componentes, hooks,常量 relacionados ficam juntos.
2. Página (`page.tsx`) apenas combina features e repassa props; não tem lógica de negócio.
3. Componentes UI puros (sem estado) em `components/`.
4. Evitar `'use client'` em componentes que não precisam; priorizar server components.
5. Rotas dinâmicas (`[id]`) dentro de `app/` seguem a mesma lógica.

## Anti-Patterns (O que EVITAR)

- Misturar lógica de API e UI na mesma função/componente.
- Colocar hooks customizados dentro de `components/` (devem ir em `hooks/` ou `features/`).
- Monolito de página com centenas de linhas (como o `page.tsx` atual).
- Client Components no topo da árvore sem necessidade.

## Exemplo no Projeto

- Atualmente o `src/app/page.tsx` é monolítico (~1150 linhas). Será refatorado para extrair:
  - `features/catalog/components/ProductGrid.tsx`
  - `features/catalog/components/ProductCard.tsx`
  - `features/orders/components/OrderSheet.tsx`
  - etc.

## Links Relacionados

- [[../../.wiki/patterns/frontend-standards]] — Padrão visual
- ADR-001 — Docker Containerization
