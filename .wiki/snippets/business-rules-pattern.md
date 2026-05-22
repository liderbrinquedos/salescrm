# Snippet: Business Rules Engine Usage

> Uso: Aplicar regras de desconto e frete no checkout
> Local: `src/lib/business-rules/` e uso em `src/app/page.tsx`

```typescript
// 1. Hook useBusinessRules
import { useBusinessRules } from '@/lib/business-rules'

const {
  rules,
  enabledRules,
  hasActiveRules,
  processCart,
  addRule,
  updateRule,
  removeRule,
  toggleRule,
  duplicateRule,
  resetToDefaults,
  getRulesByType,
} = useBusinessRules()

// 2. Contexto do carrinho para processamento
const cartContext = {
  cartItems: items.map(item => ({
    productId: item.productId,
    productName: item.productName,
    productSku: item.productSku,
    factoryId: item.factoryId,
    category: item.category,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  })),
  orderSubtotal: totalValue,
  paymentCondition, // 'CASH', 'THIRTY_DAYS', etc.
  freightType,      // 'CIF', 'FOB', 'FREE'
  freightCost,      // number
}

// 3. Processar regras (usar dentro de useEffect)
useEffect(() => {
  if (hasActiveRules && items.length > 0) {
    const result = processCart(cartContext)
    setRulesResult(result
    // result.shape:
    // {
    //   discount: number,                  // valor do desconto calculado
    //   freeShipping: boolean,            // frete grátis aplicado?
    //   commissionDiscount: number,       // abatimento comissão
    //   appliedRules: RuleApplication[], // { ruleId, ruleName, discountAmount }
    //   allRules: RuleApplication[]      // todas regras avaliadas
    // }
  } else {
    setRulesResult(null)
  }
}, [items, totalValue, paymentCondition, freightType, freightCost, hasActiveRules, processCart])

// 4. Usar resultado no cálculo final do pedido
const finalDiscount = rulesResult ? rulesResult.discount : manualDiscount
const finalFreightCost = rulesResult?.freeShipping ? 0 : freightCost

// 5. Exibir regras aplicadas no UI
{rulesResult && rulesResult.appliedRules.length > 0 && (
  <div className="bg-purple-50 border border-purple-200 rounded p-3">
    <div className="flex items-center gap-2 mb-2">
      <Sparkles className="h-4 w-4 text-purple-600" />
      <span className="font-semibold text-sm text-purple-700">
        Regras de Negócio Aplicadas
      </span>
      <Badge variant="secondary" className="ml-auto">
        {rulesResult.appliedRules.length}
      </Badge>
    </div>
    <div className="space-y-1">
      {rulesResult.appliedRules.map((applied, idx) => (
        <div key={idx} className="flex justify-between text-xs">
          <span className="text-purple-600">{applied.ruleName}</span>
          <span className="font-semibold text-green-600">
            -R$ {applied.discountAmount.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
    {rulesResult.commissionDiscount > 0 && (
      <div className="mt-2 pt-2 border-t border-purple-200 text-xs">
        <span className="text-orange-600">
          Abatimento comissão: R$ {rulesResult.commissionDiscount.toFixed(2)}
        </span>
      </div>
    )}
  </div>
)}

// 6. Criar Order com discount e freight ajustados
const orderData = {
  customerId: selectedCustomer,
  factoryId: items[0].factoryId,
  items: items.map(i => ({
    productId: i.productId,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
  })),
  discount: finalDiscount,
  paymentCondition,
  carrierId: carrierId || null,
  freightType,
  freightCost: finalFreightCost,
  notes: orderNotes,
}
```

## RuleBuilder Pattern

```typescript
import { RuleBuilder, RulePresets } from '@/lib/business-rules/helpers'

const rule = new RuleBuilder()
  .withName('Desconto Monitor 50 polegadas')
  .withType('PROMOTIONAL')
  .withPriority('HIGH')
  .withDiscount({ type: 'PERCENTAGE', value: 10 })
  .whenProductCategory('Monitores')
  .whenProductAgeRange('Adulto')
  .whenOrderMinValue(1000)
  .whenPaymentCondition('CASH')
  .validFrom(new Date('2025-01-01'))
  .validTo(new Date('2025-12-31'))
  .build()

// Ou usar presets:
const rule = RulePresets.createPercentageRule({
  name: 'Desconto 5% à vista',
  percentage: 5,
  category: 'all',
  priority: 'MEDIUM',
})
```

## Tipos Principais

```typescript
type RuleType = 
  | 'PROMOTIONAL'
  | 'QUANTITY_THRESHOLD'
  | 'VALUE_THRESHOLD'
  | 'COMMISSION_DISCOUNT'
  | 'CATEGORY_PROMO'
  | 'CUSTOMER_VIP'
  | 'FACTORY_PROMO'
  | 'PROGRESSIVE'
  | 'FREE_SHIPPING'
  | 'CASH_DISCOUNT'
  | 'SEASONAL'
  | 'COMBO_PRODUCTS'
  | 'MAX_DISCOUNT'

type RulePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

type DiscountType = 'PERCENTAGE' | 'FIXED'

interface BusinessRule {
  id: string
  name: string
  description?: string
  type: RuleType
  priority: RulePriority
  enabled: boolean
  discountType: DiscountType
  discountValue: number
  // Filters
  productFilter?: { category?: string; ageRange?: string; sku?: string }
  customerFilter?: { segment?: string; isVIP?: boolean }
  factoryFilter?: { factoryIds?: string[] }
  // Conditions
  minOrderValue?: number
  paymentConditions?: string[]
  freightTypes?: string[]
  // Behavior
  maxDiscount?: number
  deductsFromCommission: boolean
  freeShippingThreshold?: number
  // Validity
  dateRange?: { startDate: Date; endDate: Date }
  // Metadata
  appliedCount: number
  createdAt: Date
  updatedAt: Date
}

interface RulesEngineResult {
  discount: number
  freeShipping: boolean
  commissionDiscount: number
  appliedRules: RuleApplication[]
  allRules: RuleApplication[]
}

interface RuleApplication {
  ruleId: string
  ruleName: string
  discountAmount: number
  freeShipping: boolean
  commissionDiscount: number
}
```

## Storage

- Regras são salvas no localStorage via Zustand persist
- Key: `business-rules-storage`
- Estrutura: `{ rules: BusinessRule[], version: number }`

## Gotchas

- Rules NÃO são salvas no banco (apenas localStorage)
- Regras são reavaliadas a cada mudança no carrinho
- `processCart` não causa re-render (puro), use em `useEffect`
- Desconto máximo (`MAX_DISCOUNT`) deve ser a última regra a ser avaliada
- Regras de comissão (`COMMISSION_DISCOUNT`) não afetam o total do pedido
- Free shipping tem prioridade sobre custo de frete manual

## Testing

```typescript
import { BusinessRulesEngine } from '@/lib/business-rules/engine'

const engine = new BusinessRulesEngine([rule1, rule2])
const result = engine.evaluate(cartContext)

expect(result.discount).toBe(150)
expect(result.freeShipping).toBe(true)
expect(result.appliedRules).toHaveLength(2)
```
