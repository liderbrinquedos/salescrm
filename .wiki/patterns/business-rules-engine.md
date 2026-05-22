# Pattern: Business Rules Engine

> **Categoria:** state-management, business-logic
> **Complexidade:** alta
> **Última revisão:** 2026-05-21

## Quando Usar

Quando o sistema precisa aplicar regras de desconto configuráveis no momento do checkout — descontos por quantidade, valor mínimo, frete grátis, categoria, cliente VIP, combo, sazonal, etc. Ideal para cenários onde as regras de negócio mudam com frequência e precisam ser gerenciadas pelo usuário sem deploy.

## Como Implementar

### Estrutura

```
src/lib/business-rules/
  index.ts    – Exporta API pública
  types.ts    – Tipos: BusinessRule, RuleType, RulesEngineContext, etc.
  engine.ts   – BusinessRulesEngine (core)
  hooks.ts    – useBusinessRules (React + localStorage)
  helpers.ts  – RuleBuilder + RulePresets

src/components/business-rules/
  advanced-settings.tsx – Dialog de configuração
  rule-form.tsx         – Formulário criar/editar regra
  rule-preview.tsx      – Simulador de regras
```

### Tipos de Regra Suportados

| Tipo | Descrição |
|------|-----------|
| `PROMOTIONAL` | Desconto fixo/percentual geral |
| `QUANTITY_THRESHOLD` | Desconto por quantidade mínima |
| `VALUE_THRESHOLD` | Desconto por valor mínimo |
| `COMMISSION_DISCOUNT` | Desconto que abate da comissão |
| `CATEGORY_PROMO` | Desconto por categoria |
| `CUSTOMER_VIP` | Desconto para clientes VIP |
| `FACTORY_PROMO` | Promoção por fábrica |
| `PROGRESSIVE` | Desconto progressivo por faixas |
| `FREE_SHIPPING` | Frete grátis acima de X |
| `CASH_DISCOUNT` | Desconto extra à vista |
| `SEASONAL` | Desconto sazonal (período) |
| `MAX_DISCOUNT` | Teto máximo de desconto |
| `COMBO_PRODUCTS` | Desconto em combo de produtos |

### Uso na Página

```typescript
import { useBusinessRules } from '@/lib/business-rules'
import { AdvancedSettings } from '@/components/business-rules/advanced-settings'

function Page() {
  const { processCart, hasActiveRules, enabledRules } = useBusinessRules()

  // Processar carrinho com regras
  const result = processCart({
    cartItems: [...],
    orderSubtotal: totalValue,
    paymentCondition: 'CASH',
    freightType: 'CIF',
    freightCost: 50,
  })
  // result.discount, result.freeShipping, result.appliedRules, result.finalTotal

  return (
    <>
      {/* Botão flutuante de configuração */}
      <AdvancedSettings />
    </>
  )
}
```

### Regras

1. Regras são persistidas em `localStorage` com key `business-rules`.
2. Regras são ordenadas por prioridade: CRITICAL > HIGH > MEDIUM > LOW.
3. `MAX_DISCOUNT` é regra de limite, não de cálculo — aplicada após todas as outras.
4. `FREE_SHIPPING` marca `freeShipping: true` no resultado, o UI usa para zerar frete.
5. `COMMISSION_DISCOUNT` separa o desconto que abate da comissão do vendedor.

## Anti-Patterns

- Misturar regras fixas no código com regras configuráveis — ou tudo vai pro engine, ou tudo fica hardcoded.
- Regras com efeitos colaterais (ex: chamar API durante avaliação) — o engine deve ser puro.
- Permitir criar regras sem validação de conflitos (ex: duas regras de frete grátis ativas ao mesmo tempo).

## Exemplo no Projeto

- `src/lib/business-rules/engine.ts` — Core engine (BusinessRulesEngine)
- `src/lib/business-rules/hooks.ts` — Hook com 5 regras padrão: à vista 5%, frete grátis R$500, progressivo 5/10/15%, promoção bonecos 10%, teto máximo 15%
- `src/app/page.tsx` — Integração no fluxo de criação de pedido (linhas ~154-255, ~286-344)
- `src/components/business-rules/` — UI de gerenciamento

## Links Relacionados

- [[checkout-flow]] — Fluxo de checkout integrado
- [[../../.wiki/patterns/frontend-standards]]
