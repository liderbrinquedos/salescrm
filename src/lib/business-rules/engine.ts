import {
  BusinessRule,
  RulesEngineContext,
  RulesEngineResult,
  RuleApplicationResult,
  ItemDiscountAllocation,
  RuleType,
} from './types'

/**
 * Motor de Regras de Negócios
 * Processa regras configuráveis e aplica descontos baseado em condições
 */
export class BusinessRulesEngine {
  private rules: BusinessRule[] = []

  constructor(rules: BusinessRule[] = []) {
    this.rules = rules
  }

  /**
   * Define as regras do motor
   */
  setRules(rules: BusinessRule[]): void {
    this.rules = rules
  }

  /**
   * Adiciona uma regra
   */
  addRule(rule: BusinessRule): void {
    this.rules.push(rule)
  }

  /**
   * Remove uma regra por ID
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((r) => r.id !== ruleId)
  }

  /**
   * Ativa/Desativa uma regra
   */
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find((r) => r.id === ruleId)
    if (rule) {
      rule.enabled = enabled
    }
  }

  /**
   * Processa todas as regras aplicáveis ao contexto
   */
  process(context: RulesEngineContext): RulesEngineResult {
    const appliedRules: RuleApplicationResult[] = []
    let totalDiscount = 0
    let commissionDiscount = 0
    let freeShipping = false

    // Ordena regras por prioridade
    const sortedRules = [...this.rules]
      .filter((r) => r.enabled)
      .sort((a, b) => {
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

    // Processa cada regra
    for (const rule of sortedRules) {
      const result = this.evaluateRule(rule, context)
      if (result) {
        appliedRules.push(result)
        if (result.isCommissionDeduction) {
          commissionDiscount += result.discountAmount
        } else {
          totalDiscount += result.discountAmount
        }

        if (rule.type === 'FREE_SHIPPING' && result.discountAmount > 0) {
          freeShipping = true
        }
      }
    }

    // Aplica regra de teto máximo de desconto se existir
    const maxDiscountRule = sortedRules.find((r) => r.type === 'MAX_DISCOUNT')
    if (maxDiscountRule) {
      if (totalDiscount > maxDiscountRule.discountValue) {
        totalDiscount = maxDiscountRule.discountValue
        appliedRules.push({
          ruleId: maxDiscountRule.id,
          ruleName: maxDiscountRule.name,
          ruleType: maxDiscountRule.type,
          discountAmount: 0,
          discountType: maxDiscountRule.discountType,
          message: 'Teto máximo de desconto aplicado',
          itemAllocations: [],
        })
      }
    }

    const finalTotal = context.orderSubtotal - totalDiscount + context.freightCost

    return {
      subtotal: context.orderSubtotal,
      discount: totalDiscount,
      commissionDiscount,
      freeShipping,
      appliedRules,
      finalTotal,
    }
  }

  /**
   * Avalia se uma regra deve ser aplicada e calcula o desconto
   */
  private evaluateRule(
    rule: BusinessRule,
    context: RulesEngineContext
  ): RuleApplicationResult | null {
    // Verifica filtros de cliente
    if (!this.checkCustomerFilter(rule, context)) {
      return null
    }

    // Verifica filtros de produto
    const applicableItems = this.filterApplicableItems(rule, context)
    if (applicableItems.length === 0) {
      return null
    }

    // Verifica data de vigência
    if (!this.checkDateRange(rule)) {
      return null
    }

    // Verifica threshold (quantidade ou valor mínimo)
    if (!this.checkThreshold(rule, context, applicableItems)) {
      return null
    }

    // Calcula o desconto baseado no tipo da regra
    const result = this.calculateDiscountWithAllocation(rule, context, applicableItems)
    if (result.total <= 0) {
      return null
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      ruleType: rule.type,
      discountAmount: result.total,
      discountType: rule.discountType,
      isCommissionDeduction: rule.deductsFromCommission,
      message: this.getRuleMessage(rule, result.total),
      itemAllocations: result.allocations,
    }
  }

  /**
   * Verifica se o filtro de cliente corresponde
   */
  private checkCustomerFilter(rule: BusinessRule, context: RulesEngineContext): boolean {
    if (!rule.customerFilter) return true

    const filter = rule.customerFilter

    if (filter.customerIds && filter.customerIds.length > 0) {
      if (!context.customerId || !filter.customerIds.includes(context.customerId)) {
        return false
      }
    }

    if (filter.isVip !== undefined) {
      if (context.customerData?.isVip !== filter.isVip) {
        return false
      }
    }

    if (filter.city) {
      if (context.customerData?.city !== filter.city) {
        return false
      }
    }

    return true
  }

  /**
   * Filtra itens aplicáveis à regra
   */
  private filterApplicableItems(
    rule: BusinessRule,
    context: RulesEngineContext
  ): typeof context.cartItems {
    let items = [...context.cartItems]

    if (rule.productFilter) {
      const filter = rule.productFilter

      if (filter.productIds && filter.productIds.length > 0) {
        items = items.filter((item) => filter.productIds!.includes(item.productId))
      }

      if (filter.category) {
        items = items.filter((item) => item.category === filter.category)
      }

      if (filter.factoryId) {
        items = items.filter((item) => item.factoryId === filter.factoryId)
      }

      if (filter.skuPatterns && filter.skuPatterns.length > 0) {
        items = items.filter((item) =>
          filter.skuPatterns!.some((pattern) => item.productSku.includes(pattern))
        )
      }
    }

    return items
  }

  /**
   * Verifica se está dentro da data de vigência
   */
  private checkDateRange(rule: BusinessRule): boolean {
    if (!rule.dateRange) return true

    const now = new Date()
    const startDate = new Date(rule.dateRange.startDate)
    const endDate = new Date(rule.dateRange.endDate)

    return now >= startDate && now <= endDate
  }

  /**
   * Verifica thresholds (quantidade/valor mínimo)
   */
  private checkThreshold(
    rule: BusinessRule,
    context: RulesEngineContext,
    applicableItems: typeof context.cartItems
  ): boolean {
    if (rule.threshold) {
      const threshold = rule.threshold

      if (threshold.type === 'quantity') {
        const totalQuantity = applicableItems.reduce((sum, item) => sum + item.quantity, 0)
        return this.compareValues(totalQuantity, threshold.operator, threshold.value)
      } else if (threshold.type === 'value') {
        const totalValue = applicableItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
        return this.compareValues(totalValue, threshold.operator, threshold.value)
      }
    }

    if (rule.minOrderValue) {
      if (context.orderSubtotal < rule.minOrderValue) {
        return false
      }
    }

    if (rule.minOrderQuantity) {
      const totalQuantity = context.cartItems.reduce((sum, item) => sum + item.quantity, 0)
      if (totalQuantity < rule.minOrderQuantity) {
        return false
      }
    }

    return true
  }

  /**
   * Compara valores baseado no operador
   */
  private compareValues(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case 'GREATER_THAN':
        return actual > expected
      case 'GREATER_THAN_OR_EQUAL':
        return actual >= expected
      case 'LESS_THAN':
        return actual < expected
      case 'LESS_THAN_OR_EQUAL':
        return actual <= expected
      case 'EQUAL':
        return actual === expected
      default:
        return false
    }
  }

  /**
   * Calcula o desconto baseado no tipo da regra com rateio por item
   */
  private calculateDiscountWithAllocation(
    rule: BusinessRule,
    context: RulesEngineContext,
    applicableItems: typeof context.cartItems
  ): { total: number; allocations: ItemDiscountAllocation[] } {
    const itemsValue = applicableItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const itemsQuantity = applicableItems.reduce((sum, item) => sum + item.quantity, 0)
    const allItems = context.cartItems

    // FREE_SHIPPING e MAX_DISCOUNT não rateiam por item
    if (rule.type === 'FREE_SHIPPING') {
      if (rule.freeShippingThreshold && context.freightCost > 0) {
        if (context.orderSubtotal >= rule.freeShippingThreshold) {
          return { total: context.freightCost, allocations: [] }
        }
      }
      return { total: 0, allocations: [] }
    }

    if (rule.type === 'MAX_DISCOUNT') {
      return { total: 0, allocations: [] }
    }

    // Define quais itens entram no rateio
    const itemsForRateio =
      rule.productFilter?.category || rule.productFilter?.productIds || rule.productFilter?.factoryId
        ? applicableItems
        : allItems

    // Calcula o total de desconto
    let total = 0

    switch (rule.type) {
      case 'PROMOTIONAL':
      case 'CATEGORY_PROMO':
      case 'CUSTOMER_VIP':
      case 'FACTORY_PROMO':
      case 'SEASONAL':
      case 'COMMISSION_DISCOUNT':
        total = rule.discountType === 'PERCENTAGE'
          ? (itemsValue * rule.discountValue) / 100
          : rule.discountValue
        break

      case 'QUANTITY_THRESHOLD':
      case 'VALUE_THRESHOLD':
        total = rule.discountType === 'PERCENTAGE'
          ? (context.orderSubtotal * rule.discountValue) / 100
          : rule.discountValue
        break

      case 'PROGRESSIVE':
        if (rule.progressiveTiers && rule.progressiveTiers.length > 0) {
          let maxDiscount = 0
          for (const tier of rule.progressiveTiers) {
            let passes = false
            if (tier.minValue !== undefined) {
              passes = context.orderSubtotal >= tier.minValue
            } else if (tier.minQuantity !== undefined) {
              passes = itemsQuantity >= tier.minQuantity
            }

            if (passes) {
              const tierDiscount = tier.discountType === 'PERCENTAGE'
                ? (context.orderSubtotal * tier.discount) / 100
                : tier.discount
              maxDiscount = Math.max(maxDiscount, tierDiscount)
            }
          }
          total = maxDiscount
        }
        break

      case 'CASH_DISCOUNT':
        if (context.paymentCondition === 'CASH') {
          total = rule.discountType === 'PERCENTAGE'
            ? (context.orderSubtotal * rule.discountValue) / 100
            : rule.discountValue
        }
        break

      case 'COMBO_PRODUCTS':
        if (rule.requiredProductIds && rule.requiredProductIds.length > 0) {
          const hasAllProducts = rule.requiredProductIds.every((id) =>
            context.cartItems.some((item) => item.productId === id)
          )
          if (hasAllProducts) {
            total = rule.discountType === 'PERCENTAGE'
              ? (context.orderSubtotal * rule.discountValue) / 100
              : rule.discountValue
          }
        }
        break

      default:
        total = 0
    }

    if (total <= 0) {
      return { total: 0, allocations: [] }
    }

    // Rateio proporcional ao valor de cada item
    const rateioBaseValue = itemsForRateio.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const allocations: ItemDiscountAllocation[] = itemsForRateio.map((item) => {
      const itemValue = item.quantity * item.unitPrice
      const ratio = rateioBaseValue > 0 ? itemValue / rateioBaseValue : 0
      return {
        productId: item.productId,
        productName: item.productName,
        category: item.category,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: itemValue,
        discountAmount: total * ratio,
      }
    })

    return { total, allocations }
  }

  /**
   * Gera mensagem descritiva da regra
   */
  private getRuleMessage(rule: BusinessRule, discount: number): string {
    const formattedDiscount =
      rule.discountType === 'PERCENTAGE'
        ? `${rule.discountValue}%`
        : `R$ ${discount.toFixed(2)}`

    switch (rule.type) {
      case 'PROMOTIONAL':
        return `Desconto promocional de ${formattedDiscount}`
      case 'QUANTITY_THRESHOLD':
        return `Desconto por quantidade: ${formattedDiscount}`
      case 'VALUE_THRESHOLD':
        return `Desconto por valor: ${formattedDiscount}`
      case 'COMMISSION_DISCOUNT':
        return `Abatimento comissão: ${formattedDiscount}`
      case 'CATEGORY_PROMO':
        return `Promoção categoria: ${formattedDiscount}`
      case 'CUSTOMER_VIP':
        return `Desconto VIP: ${formattedDiscount}`
      case 'FACTORY_PROMO':
        return `Promoção fábrica: ${formattedDiscount}`
      case 'PROGRESSIVE':
        return `Desconto progressivo aplicado`
      case 'FREE_SHIPPING':
        return `Frete grátis`
      case 'CASH_DISCOUNT':
        return `Desconto à vista: ${formattedDiscount}`
      case 'SEASONAL':
        return `Desconto sazonal: ${formattedDiscount}`
      case 'COMBO_PRODUCTS':
        return `Desconto combo: ${formattedDiscount}`
      case 'MAX_DISCOUNT':
        return `Teto máximo de desconto`
      default:
        return `Desconto: ${formattedDiscount}`
    }
  }
}

/**
 * Cria uma instância do motor com regras padrão
 */
export function createRulesEngine(rules: BusinessRule[] = []): BusinessRulesEngine {
  return new BusinessRulesEngine(rules)
}
