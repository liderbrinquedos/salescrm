import {
  BusinessRule,
  RuleType,
  DiscountType,
  RulePriority,
  ProgressiveTier,
} from './types'

/**
 * Helpers para criar regras de negócios de forma mais fácil
 */
export class RuleBuilder {
  private rule: Partial<BusinessRule> = {
    enabled: true,
    priority: 'MEDIUM',
    discountType: 'PERCENTAGE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    appliedCount: 0,
  }

  /**
   * Define o nome da regra
   */
  name(name: string): RuleBuilder {
    this.rule.name = name
    return this
  }

  /**
   * Define a descrição
   */
  description(description: string): RuleBuilder {
    this.rule.description = description
    return this
  }

  /**
   * Define o tipo da regra
   */
  type(type: RuleType): RuleBuilder {
    this.rule.type = type
    return this
  }

  /**
   * Define a prioridade
   */
  priority(priority: RulePriority): RuleBuilder {
    this.rule.priority = priority
    return this
  }

  /**
   * Define o tipo de desconto
   */
  discountType(type: DiscountType): RuleBuilder {
    this.rule.discountType = type
    return this
  }

  /**
   * Define o valor do desconto
   */
  discountValue(value: number): RuleBuilder {
    this.rule.discountValue = value
    return this
  }

  /**
   * Ativa/Desativa a regra
   */
  enabled(enabled: boolean): RuleBuilder {
    this.rule.enabled = enabled
    return this
  }

  /**
   * Define se abate da comissão
   */
  deductsFromCommission(deducts: boolean): RuleBuilder {
    this.rule.deductsFromCommission = deducts
    return this
  }

  /**
   * Define filtro por categoria
   */
  category(category: string): RuleBuilder {
    this.rule.productFilter = { ...this.rule.productFilter, category }
    return this
  }

  /**
   * Define filtro por fábrica
   */
  factory(factoryId: string): RuleBuilder {
    this.rule.productFilter = { ...this.rule.productFilter, factoryId }
    return this
  }

  /**
   * Define filtro por produtos específicos
   */
  products(productIds: string[]): RuleBuilder {
    this.rule.productFilter = { ...this.rule.productFilter, productIds }
    return this
  }

  /**
   * Define filtro por clientes VIP
   */
  vipOnly(isVip: boolean = true): RuleBuilder {
    this.rule.customerFilter = { ...this.rule.customerFilter, isVip }
    return this
  }

  /**
   * Define filtro por cidade
   */
  city(city: string): RuleBuilder {
    this.rule.customerFilter = { ...this.rule.customerFilter, city }
    return this
  }

  /**
   * Define valor mínimo do pedido
   */
  minOrderValue(value: number): RuleBuilder {
    this.rule.minOrderValue = value
    return this
  }

  /**
   * Define quantidade mínima do pedido
   */
  minOrderQuantity(quantity: number): RuleBuilder {
    this.rule.minOrderQuantity = quantity
    return this
  }

  /**
   * Define data de vigência
   */
  dateRange(startDate: string, endDate: string): RuleBuilder {
    this.rule.dateRange = { startDate, endDate }
    return this
  }

  /**
   * Define tiers para desconto progressivo
   */
  progressiveTiers(tiers: ProgressiveTier[]): RuleBuilder {
    this.rule.progressiveTiers = tiers
    return this
  }

  /**
   * Define threshold para frete grátis
   */
  freeShippingThreshold(value: number): RuleBuilder {
    this.rule.freeShippingThreshold = value
    return this
  }

  /**
   * Define produtos obrigatórios para combo
   */
  requiredProducts(productIds: string[]): RuleBuilder {
    this.rule.requiredProductIds = productIds
    return this
  }

  /**
   * Constrói a regra
   */
  build(): BusinessRule {
    if (!this.rule.name || !this.rule.type) {
      throw new Error('Nome e tipo são obrigatórios')
    }
    return {
      ...this.rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    } as BusinessRule
  }
}

/**
 * Cria um builder de regra
 */
export function createRule(): RuleBuilder {
  return new RuleBuilder()
}

/**
 * Presets de regras comuns
 */
export const RulePresets = {
  /**
   * Desconto à vista
   */
  cashDiscount(percentage: number): RuleBuilder {
    return createRule()
      .name(`Desconto à Vista ${percentage}%`)
      .description(`${percentage}% de desconto para pagamentos à vista`)
      .type('CASH_DISCOUNT')
      .discountType('PERCENTAGE')
      .discountValue(percentage)
      .priority('HIGH')
  },

  /**
   * Frete grátis
   */
  freeShipping(minValue: number): RuleBuilder {
    return createRule()
      .name(`Frete Grátis acima de R$ ${minValue}`)
      .description(`Frete grátis para pedidos acima de R$ ${minValue}`)
      .type('FREE_SHIPPING')
      .discountType('FIXED')
      .discountValue(0)
      .freeShippingThreshold(minValue)
      .priority('MEDIUM')
  },

  /**
   * Desconto por categoria
   */
  categoryPromo(category: string, percentage: number): RuleBuilder {
    return createRule()
      .name(`Promoção ${category}`)
      .description(`${percentage}% de desconto em ${category}`)
      .type('CATEGORY_PROMO')
      .discountType('PERCENTAGE')
      .discountValue(percentage)
      .category(category)
      .priority('LOW')
  },

  /**
   * Desconto progressivo
   */
  progressiveDiscount(tiers: Array<{ min: number; discount: number }>): RuleBuilder {
    return createRule()
      .name('Desconto Progressivo')
      .description('Desconto progressivo por valor do pedido')
      .type('PROGRESSIVE')
      .discountType('PERCENTAGE')
      .discountValue(0)
      .progressiveTiers(
        tiers.map((t) => ({
          minValue: t.min,
          discount: t.discount,
          discountType: 'PERCENTAGE',
        }))
      )
      .priority('MEDIUM')
  },

  /**
   * Teto máximo de desconto
   */
  maxDiscount(percentage: number): RuleBuilder {
    return createRule()
      .name(`Teto Máximo ${percentage}%`)
      .description(`Máximo de ${percentage}% de desconto por pedido`)
      .type('MAX_DISCOUNT')
      .discountType('PERCENTAGE')
      .discountValue(percentage)
      .priority('CRITICAL')
  },

  /**
   * Desconto VIP
   */
  vipDiscount(percentage: number): RuleBuilder {
    return createRule()
      .name(`Desconto VIP ${percentage}%`)
      .description(`${percentage}% de desconto para clientes VIP`)
      .type('CUSTOMER_VIP')
      .discountType('PERCENTAGE')
      .discountValue(percentage)
      .vipOnly(true)
      .priority('HIGH')
  },

  /**
   * Promoção de fábrica
   */
  factoryPromo(factoryId: string, factoryName: string, percentage: number): RuleBuilder {
    return createRule()
      .name(`Promoção ${factoryName}`)
      .description(`${percentage}% de desconto em produtos da ${factoryName}`)
      .type('FACTORY_PROMO')
      .discountType('PERCENTAGE')
      .discountValue(percentage)
      .factory(factoryId)
      .priority('LOW')
  },

  /**
   * Desconto que abate da comissão
   */
  commissionDiscount(percentage: number): RuleBuilder {
    return createRule()
      .name(`Abatimento Comissão ${percentage}%`)
      .description(`${percentage}% de desconto que abate da comissão`)
      .type('COMMISSION_DISCOUNT')
      .discountType('PERCENTAGE')
      .discountValue(percentage)
      .deductsFromCommission(true)
      .priority('HIGH')
  },

  /**
   * Promoção sazonal
   */
  seasonalDiscount(name: string, percentage: number, startDate: string, endDate: string): RuleBuilder {
    return createRule()
      .name(name)
      .description(`${percentage}% de desconto sazonal`)
      .type('SEASONAL')
      .discountType('PERCENTAGE')
      .discountValue(percentage)
      .dateRange(startDate, endDate)
      .priority('MEDIUM')
  },

  /**
   * Desconto por quantidade
   */
  quantityDiscount(minQuantity: number, percentage: number): RuleBuilder {
    return createRule()
      .name(`Desconto Quantidade ${percentage}%`)
      .description(`${percentage}% de desconto para ${minQuantity}+ itens`)
      .type('QUANTITY_THRESHOLD')
      .discountType('PERCENTAGE')
      .discountValue(percentage)
      .minOrderQuantity(minQuantity)
      .priority('MEDIUM')
  },

  /**
   * Desconto por valor
   */
  valueDiscount(minValue: number, percentage: number): RuleBuilder {
    return createRule()
      .name(`Desconto Valor ${percentage}%`)
      .description(`${percentage}% de desconto para pedidos acima de R$ ${minValue}`)
      .type('VALUE_THRESHOLD')
      .discountType('PERCENTAGE')
      .discountValue(percentage)
      .minOrderValue(minValue)
      .priority('MEDIUM')
  },
}
