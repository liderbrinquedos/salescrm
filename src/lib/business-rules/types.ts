// Tipos de Regras de Negócio

export type RuleType =
  | 'PROMOTIONAL'        // Desconto promocional fixo/percentual
  | 'QUANTITY_THRESHOLD' // Desconto por quantidade mínima
  | 'VALUE_THRESHOLD'    // Desconto por valor mínimo
  | 'COMMISSION_DISCOUNT' // Desconto que abate da comissão
  | 'CATEGORY_PROMO'     // Desconto por categoria específica
  | 'CUSTOMER_VIP'       // Desconto para clientes VIP
  | 'FACTORY_PROMO'      // Promoção específica por fábrica
  | 'PROGRESSIVE'        // Desconto progressivo por faixas
  | 'FREE_SHIPPING'      // Frete grátis acima de X
  | 'CASH_DISCOUNT'      // Desconto extra à vista
  | 'SEASONAL'           // Desconto sazonal (período)
  | 'MAX_DISCOUNT'       // Teto máximo de desconto
  | 'COMBO_PRODUCTS'     // Desconto em combo de produtos

export type DiscountType = 'PERCENTAGE' | 'FIXED'

export type Operator = 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL' | 'LESS_THAN' | 'LESS_THAN_OR_EQUAL' | 'EQUAL'

export type RulePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface ThresholdRule {
  type: 'quantity' | 'value'
  operator: Operator
  value: number
}

export interface ProductFilter {
  productIds?: string[]
  category?: string
  factoryId?: string
  skuPatterns?: string[]
}

export interface CustomerFilter {
  customerIds?: string[]
  tradeNamePattern?: string
  city?: string
  isVip?: boolean
}

export interface DateRange {
  startDate: string
  endDate: string
}

export interface ProgressiveTier {
  minQuantity?: number
  minValue?: number
  discount: number
  discountType: DiscountType
}

export interface BusinessRule {
  id: string
  name: string
  description: string
  type: RuleType
  enabled: boolean
  priority: RulePriority

  // Condições de aplicação
  productFilter?: ProductFilter
  customerFilter?: CustomerFilter
  dateRange?: DateRange
  threshold?: ThresholdRule
  minOrderValue?: number
  minOrderQuantity?: number

  // Configuração do desconto
  discountType: DiscountType
  discountValue: number

  // Configurações específicas por tipo
  deductsFromCommission?: boolean // Se abate da comissão do vendedor
  progressiveTiers?: ProgressiveTier[] // Para regras progressivas
  requiredProductIds?: string[] // Para combos
  freeShippingThreshold?: number // Para frete grátis

  // Metadados
  createdAt: string
  updatedAt: string
  appliedCount: number // Quantas vezes foi aplicada
}

export interface ItemDiscountAllocation {
  productId: string
  productName: string
  category: string
  unitPrice: number
  quantity: number
  totalPrice: number
  discountAmount: number
}

export interface RuleApplicationResult {
  ruleId: string
  ruleName: string
  ruleType: RuleType
  discountAmount: number
  discountType: DiscountType
  isCommissionDeduction?: boolean
  message?: string
  itemAllocations: ItemDiscountAllocation[]
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

export interface RulesEngineContext {
  cartItems: Array<{
    productId: string
    productName: string
    productSku: string
    factoryId: string
    category: string
    quantity: number
    unitPrice: number
  }>
  customerId?: string
  customerData?: {
    name: string
    city?: string
    isVip?: boolean
  }
  orderSubtotal: number
  paymentCondition?: string
  freightType?: string
  freightCost: number
}

export interface RulesEngineResult {
  subtotal: number
  discount: number
  commissionDiscount: number // Desconto que abate da comissão
  freeShipping: boolean
  appliedRules: RuleApplicationResult[]
  finalTotal: number
}
