'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { BusinessRulesEngine, createRulesEngine } from './engine'
import {
  BusinessRule,
  RuleType,
  DiscountType,
  RulePriority,
  RulesEngineContext,
  RulesEngineResult,
} from './types'

const STORAGE_KEY = 'business-rules'

// Regras de exemplo para começar
const DEFAULT_RULES: BusinessRule[] = [
  {
    id: 'rule-1',
    name: 'Desconto à Vista',
    description: '5% de desconto para pagamentos à vista',
    type: 'CASH_DISCOUNT',
    enabled: true,
    priority: 'HIGH',
    discountType: 'PERCENTAGE',
    discountValue: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    appliedCount: 0,
  },
  {
    id: 'rule-2',
    name: 'Frete Grátis acima de R$ 500',
    description: 'Frete grátis para pedidos acima de R$ 500',
    type: 'FREE_SHIPPING',
    enabled: true,
    priority: 'MEDIUM',
    discountType: 'FIXED',
    discountValue: 0,
    freeShippingThreshold: 500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    appliedCount: 0,
  },
  {
    id: 'rule-3',
    name: 'Desconto Progressivo',
    description: 'Desconto progressivo por valor do pedido',
    type: 'PROGRESSIVE',
    enabled: false,
    priority: 'MEDIUM',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    progressiveTiers: [
      { minValue: 1000, discount: 5, discountType: 'PERCENTAGE' },
      { minValue: 3000, discount: 10, discountType: 'PERCENTAGE' },
      { minValue: 5000, discount: 15, discountType: 'PERCENTAGE' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    appliedCount: 0,
  },
  {
    id: 'rule-4',
    name: 'Promoção Bonecos',
    description: '10% de desconto em bonecos',
    type: 'CATEGORY_PROMO',
    enabled: false,
    priority: 'LOW',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    productFilter: {
      category: 'Bonecos',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    appliedCount: 0,
  },
  {
    id: 'rule-5',
    name: 'Teto Máximo de Desconto',
    description: 'Máximo de 15% de desconto por pedido',
    type: 'MAX_DISCOUNT',
    enabled: false,
    priority: 'CRITICAL',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    appliedCount: 0,
  },
]

/**
 * Hook para gerenciar o motor de regras de negócios
 */
export function useBusinessRules() {
  const [rules, setRules] = useState<BusinessRule[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Carrega regras do localStorage (executa apenas no mount)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setRules(JSON.parse(stored))
      } catch (e) {
        console.error('Erro ao carregar regras:', e)
        setRules(DEFAULT_RULES)
      }
    } else {
      setRules(DEFAULT_RULES)
    }
    setIsLoaded(true)
  }, [])

  // Salva regras no localStorage quando mudar
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
    }
  }, [rules, isLoaded])

  // Cria instância do motor de regras
  const engine = useMemo(() => createRulesEngine(rules), [rules])

  /**
   * Adiciona uma nova regra
   */
  const addRule = useCallback((rule: Omit<BusinessRule, 'id' | 'createdAt' | 'updatedAt' | 'appliedCount'>) => {
    const newRule: BusinessRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      appliedCount: 0,
    }
    setRules((prev) => [...prev, newRule])
    return newRule
  }, [])

  /**
   * Atualiza uma regra existente
   */
  const updateRule = useCallback((ruleId: string, updates: Partial<BusinessRule>) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId
          ? { ...rule, ...updates, updatedAt: new Date().toISOString() }
          : rule
      )
    )
  }, [])

  /**
   * Remove uma regra
   */
  const removeRule = useCallback((ruleId: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== ruleId))
  }, [])

  /**
   * Ativa/Desativa uma regra
   */
  const toggleRule = useCallback((ruleId: string, enabled: boolean) => {
    updateRule(ruleId, { enabled })
  }, [updateRule])

  /**
   * Duplica uma regra
   */
  const duplicateRule = useCallback((ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId)
    if (rule) {
      const newRule = addRule({
        ...rule,
        name: `${rule.name} (cópia)`,
      })
      return newRule
    }
    return null
  }, [rules, addRule])

  /**
   * Reseta para as regras padrão
   */
  const resetToDefaults = useCallback(() => {
    setRules(DEFAULT_RULES)
  }, [])

  /**
   * Processa o carrinho com as regras
   */
  const processCart = useCallback((context: RulesEngineContext): RulesEngineResult => {
    return engine.process(context)
  }, [engine])

  /**
   * Retorna regras habilitadas
   */
  const enabledRules = useMemo(() => rules.filter((r) => r.enabled), [rules])

  /**
   * Retorna regras por tipo
   */
  const getRulesByType = useCallback((type: RuleType) => {
    return rules.filter((r) => r.type === type)
  }, [rules])

  /**
   * Verifica se há regras ativas
   */
  const hasActiveRules = useMemo(() => enabledRules.length > 0, [enabledRules])

  return {
    // Estado
    rules,
    enabledRules,
    isLoaded,
    hasActiveRules,

    // Ações
    addRule,
    updateRule,
    removeRule,
    toggleRule,
    duplicateRule,
    resetToDefaults,

    // Motor de regras
    processCart,
    getRulesByType,

    // Engine (para uso avançado)
    engine,
  }
}
