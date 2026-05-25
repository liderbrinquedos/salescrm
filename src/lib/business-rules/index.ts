// Motor de Regras de Negócios
export { BusinessRulesEngine, createRulesEngine } from './engine'

// Hook React
export { useBusinessRules } from './hooks'

// Tipos
export type {
  BusinessRule,
  RuleType,
  DiscountType,
  Operator,
  RulePriority,
  ThresholdRule,
  ProductFilter,
  CustomerFilter,
  DateRange,
  ProgressiveTier,
  RuleApplicationResult,
  RulesEngineContext,
  RulesEngineResult,
} from './types'

// Helpers
export { RuleBuilder, createRule, RulePresets } from './helpers'
