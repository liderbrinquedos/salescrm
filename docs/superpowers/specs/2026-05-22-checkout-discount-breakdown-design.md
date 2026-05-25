# Checkout com Breakdown de Descontos por Item

> **Data:** 2026-05-22
> **Status:** Aprovado
> **Autor:** OpenCode + Lider

## Resumo

Ratear o desconto total do pedido entre os itens do carrinho, alocando o valor de cada regra de negócio proporcionalmente aos itens elegíveis. Persistir o snapshot do breakdown no pedido para consulta futura e exibir no checkout via accordion de detalhamento (Progressive Disclosure).

## Mudanças nos Tipos (types.ts)

### Novos tipos

```typescript
export interface ItemDiscountAllocation {
  productId: string
  productName: string
  category: string
  unitPrice: number
  quantity: number
  totalPrice: number
  discountAmount: number
}

export interface OrderDiscountBreakdownRule {
  ruleId: string
  ruleName: string
  ruleType: RuleType
  discountAmount: number
  discountType: DiscountType
  itemAllocations: ItemDiscountAllocation[]
}

export interface OrderDiscountBreakdown {
  totalDiscount: number
  appliedRules: OrderDiscountBreakdownRule[]
}
```

### Tipos estendidos

- `RuleApplicationResult` ganha:
  - `itemAllocations: ItemDiscountAllocation[]`
  - `ruleType: RuleType`

## Engine (engine.ts)

### Novo método: `calculateDiscountWithAllocation`

Substitui o uso interno de `calculateDiscount` por um método que retorna `{ total, allocations[] }`.

Regras de rateio:
- Regras com **productFilter** (CATEGORY_PROMO, PROMOTIONAL com filtro, FACTORY_PROMO) rateiam apenas entre os itens elegíveis
- Regras sobre **subtotal geral** (QUANTITY_THRESHOLD, VALUE_THRESHOLD, CASH_DISCOUNT, PROGRESSIVE, COMBO) rateiam entre todos os itens do carrinho
- FREE_SHIPPING não rateia (desconto vai pro frete)
- MAX_DISCOUNT não rateia (é teto, não desconto aplicado)

Alocação proporcional ao valor de cada item:
```
ratio = itemValue / totalEligibleValue
itemDiscount = totalDiscount * ratio
```

### evaluateRule modificado

Retorna `itemAllocations[]` no `RuleApplicationResult`.

## Schema Prisma

### Order model

```
discountBreakdown  String?   // JSON com OrderDiscountBreakdown
```

SQLite não tem JSON nativo → armazenar como string, parsear na aplicação.

### Migration

```bash
npx prisma migrate dev --name add_discount_breakdown
```

## API Routes

### POST /api/orders

Body ganha campo opcional `discountBreakdown` (string JSON). Salvo diretamente no banco.

### GET /api/orders/[id]

Já retorna o order completo. O campo `discountBreakdown` vem como string — o frontend faz parse.

## UI: Checkout OrderSummary

### Estado recolhido (padrão)

Card de resumo com:
- Contagem de itens
- Subtotal
- Lista de regras aplicadas (nome + valor)
- Total
- Link "Ver detalhamento por item ▾"

### Estado expandido

Tabela com coluna única "Descontos" + legenda abaixo:

| Produto | Valor Orig. | Qtde | Descontos | Valor Líquido |
|---|---|---|---|---|

- Cada linha soma todos os descontos daquele item (de todas as regras)
- Abaixo da tabela, legenda detalhada por regra:
  ```
  Descontos aplicados:
  ├ Promoção Bonecos 10%: -R$ 10,00
  ├ Sazonal 5%: -R$ 5,00
  └ À vista 5%: -R$ 10,00
  Total descontos: -R$ 25,00
  ```
- Última linha: totalizadores (soma dos valores líquidos)

### Componente

`src/features/orders/components/OrderSummary.tsx`
- Props: `items`, `rulesResult`, `onToggleExpand`
- Estado local: `expanded: boolean`
- Accordion suave com transição CSS

## Integração no Checkout

Substituir o Card de resumo atual (linhas 702-779 do page.tsx) pelo componente `OrderSummary`.

## Snapshot na Criação

No `handleCreateOrder()`, montar o `OrderDiscountBreakdown` a partir do `rulesResult` e enviar no body da requisição.

## Próximos Passos (Fase B)

Quando formos implementar a tela de detalhes do pedido existente, o `discountBreakdown` já estará salvo — basta exibir.

## Observações

- O accordion NÃO aparece se não houver regras aplicadas (manual discount only)
- O breakdown salvo é imutável — reflete as regras no momento da criação

## Decisão Final

A interface usa **coluna única "Descontos"** na tabela expandida + legenda de breakdown por regra abaixo (estilo `├`/`└`), em vez de colunas dinâmicas por tipo de regra. Isso evita complexidade visual quando há 3+ tipos de regra aplicados simultaneamente.

## Bugs Corrigidos Durante Implementação

1. **Dessincronização do hook `useBusinessRules()`** — era chamado em 2 componentes independentes, cada um com seu próprio estado em localStorage. Corrigido elevando o hook para o `page.tsx` e passando tudo como props.
2. **DATABASE_URL incorreta** — apontava para `/home/z/my-project/db/custom.db` que não existia. Corrigido para `file:/home/lider/project/aplicacoes/salescrm/db/custom.db`.

## ADR

A decisão arquitetural completa está documentada em `.wiki/decisions/002-checkout-discount-breakdown.md`.
