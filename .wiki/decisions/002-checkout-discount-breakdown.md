# ADR-002: Checkout com Breakdown de Descontos por Item

> **Data:** 2026-05-22
> **Status:** accepted
> **Autor:** OpenCode + Lider

## Contexto

O checkout do SalesCRM aplicava descontos via motor de regras de negócio, mas o valor era sempre global — o usuário via o total de desconto sem saber quanto cada item havia recebido. Para pedidos com mix de regras (ex: categoria + à vista + progressivo), não havia transparência.

Também não havia snapshot do breakdown no banco — o campo `Order.discount` era um Float simples. Uma futura tela de "Detalhes do Pedido" não teria como mostrar o cálculo original.

## Decisão

### 1. Alocação de desconto por regra + item (rateio proporcional)

O motor de regras foi modificado para retornar, para cada regra aplicada, um array de `ItemDiscountAllocation` com o rateio proporcional ao valor de cada item elegível.

- Regras com **productFilter** (CATEGORY_PROMO, PROMOTIONAL com filtro, FACTORY_PROMO) rateiam apenas entre os itens elegíveis.
- Regras sobre **subtotal geral** (CASH_DISCOUNT, PROGRESSIVE, QUANTITY_THRESHOLD, VALUE_THRESHOLD, COMBO) rateiam entre todos os itens do carrinho.
- FREE_SHIPPING e MAX_DISCOUNT não rateiam.

### 2. Snapshot persistido no banco

Adicionado campo `discountBreakdown` (String/JSON) no modelo `Order` do Prisma. No momento da criação do pedido, o breakdown completo é serializado e salvo. Imutável — reflete as regras no momento da criação.

### 3. Progressive Disclosure na UI

O resumo do pedido no checkout usa accordion:
- **Estado recolhido**: totalizadores + lista de regras aplicadas + link "Ver detalhamento por item"
- **Estado expandido**: tabela com coluna única "Descontos" por item + legenda abaixo com breakdown por regra (estilo `├`/`└`)

### 4. Estado único do motor de regras

Corrigido bug onde `useBusinessRules()` era chamado em 2 componentes independentes (page.tsx + AdvancedSettings), causando dessincronização. Agora apenas `page.tsx` invoca o hook; `AdvancedSettings` recebe tudo como props.

## Novos Tipos

- `ItemDiscountAllocation` — alocação de desconto por item
- `OrderDiscountBreakdownRule` — regra aplicada com suas alocações
- `OrderDiscountBreakdown` — snapshot completo
- `RuleApplicationResult` estendido com `itemAllocations` e `ruleType`

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/lib/business-rules/types.ts` | Novos tipos + extensão de `RuleApplicationResult` |
| `src/lib/business-rules/engine.ts` | `calculateDiscountWithAllocation` substitui `calculateDiscount` |
| `prisma/schema.prisma` | Campo `discountBreakdown` em Order |
| `src/app/api/orders/route.ts` | POST salva `discountBreakdown` |
| `src/app/page.tsx` | Usa `OrderSummary`, passa props ao `AdvancedSettings` |
| `src/features/orders/components/OrderSummary.tsx` | **Novo** — accordion de breakdown |
| `src/components/business-rules/advanced-settings.tsx` | Recebe props em vez de hook próprio |
| `src/components/business-rules/rule-preview.tsx` | Recebe props em vez de hook próprio |
| `.env` | DATABASE_URL corrigida para caminho local |

## Alternativas Consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| Rateio proporcional simples (global / n itens) | Menos mudanças no engine | Impreciso: regras de categoria rateariam pra itens de outras categorias |
| Recalcular breakdown na leitura (sem snapshot) | Sem migration no banco | Breakdown muda se regras forem alteradas depois |
| Colunas dinâmicas por tipo de regra na tabela | Mais informativo visualmente | Interface complexa, quebra com 3+ tipos de regra |

## Consequências

- Usuário agora vê exatamente quanto cada item recebeu de desconto e de qual regra veio.
- Breakdown fiel mesmo que regras mudem no futuro (snapshot imutável).
- Fase B (tela de detalhes do pedido existente) já tem os dados prontos.
- AdvancedSettings e checkout compartilham o mesmo estado de regras.

## Links Relacionados

- `docs/superpowers/specs/2026-05-22-checkout-discount-breakdown-design.md` — Design doc
- `src/features/orders/components/OrderSummary.tsx` — Componente de accordion
- `src/lib/business-rules/engine.ts` — Motor com rateio por item
- `src/lib/business-rules/types.ts` — Tipos do breakdown
- `prisma/schema.prisma` — Modelo Order com discountBreakdown
- [[../patterns/checkout-flow]] — Fluxo de checkout
- [[../patterns/business-rules-engine]] — Motor de regras
