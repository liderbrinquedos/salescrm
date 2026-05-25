'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Settings, Sparkles, Check, X, Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react'
import { RuleType, RulePriority, DiscountType, BusinessRule, RulesEngineContext, RulesEngineResult } from '@/lib/business-rules'
import { RuleForm } from './rule-form'
import { RulePreview } from './rule-preview'

interface AdvancedSettingsProps {
  rules: BusinessRule[]
  enabledRules: BusinessRule[]
  hasActiveRules: boolean
  addRule: (rule: Omit<BusinessRule, 'id' | 'createdAt' | 'updatedAt' | 'appliedCount'>) => BusinessRule
  updateRule: (ruleId: string, updates: Partial<BusinessRule>) => void
  removeRule: (ruleId: string) => void
  toggleRule: (ruleId: string, enabled: boolean) => void
  duplicateRule: (ruleId: string) => BusinessRule | null
  resetToDefaults: () => void
  processCart: (context: RulesEngineContext) => RulesEngineResult
}

/**
 * Componente de Settings Avançados - Motor de Regras de Negócios
 * Acesso discreto para configuração de regras complexas
 */
export function AdvancedSettings({
  rules,
  enabledRules,
  hasActiveRules,
  addRule,
  updateRule,
  removeRule,
  toggleRule,
  duplicateRule,
  resetToDefaults,
  processCart,
}: AdvancedSettingsProps) {
  const [open, setOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'rules' | 'preview'>('rules')
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [showRuleForm, setShowRuleForm] = useState(false)

  const handleSaveRule = (ruleData: any) => {
    if (editingRule) {
      updateRule(editingRule, ruleData)
    } else {
      addRule(ruleData)
    }
    setShowRuleForm(false)
    setEditingRule(null)
  }

  const handleEditRule = (ruleId: string) => {
    setEditingRule(ruleId)
    setShowRuleForm(true)
  }

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Tem certeza que deseja excluir esta regra?')) {
      removeRule(ruleId)
    }
  }

  const handleDuplicateRule = (ruleId: string) => {
    duplicateRule(ruleId)
  }

  const ruleTypes: { type: RuleType; label: string; color: string }[] = [
    { type: 'PROMOTIONAL', label: 'Promocional', color: 'bg-purple-500' },
    { type: 'QUANTITY_THRESHOLD', label: 'Por Quantidade', color: 'bg-blue-500' },
    { type: 'VALUE_THRESHOLD', label: 'Por Valor', color: 'bg-green-500' },
    { type: 'COMMISSION_DISCOUNT', label: 'Abate Comissão', color: 'bg-orange-500' },
    { type: 'CATEGORY_PROMO', label: 'Por Categoria', color: 'bg-pink-500' },
    { type: 'CUSTOMER_VIP', label: 'Cliente VIP', color: 'bg-yellow-500' },
    { type: 'FACTORY_PROMO', label: 'Por Fábrica', color: 'bg-cyan-500' },
    { type: 'PROGRESSIVE', label: 'Progressivo', color: 'bg-indigo-500' },
    { type: 'FREE_SHIPPING', label: 'Frete Grátis', color: 'bg-teal-500' },
    { type: 'CASH_DISCOUNT', label: 'À Vista', color: 'bg-emerald-500' },
    { type: 'SEASONAL', label: 'Sazonal', color: 'bg-rose-500' },
    { type: 'COMBO_PRODUCTS', label: 'Combo', color: 'bg-violet-500' },
    { type: 'MAX_DISCOUNT', label: 'Teto Máximo', color: 'bg-red-500' },
  ]

  const priorityColors: Record<RulePriority, string> = {
    LOW: 'bg-gray-500',
    MEDIUM: 'bg-blue-500',
    HIGH: 'bg-orange-500',
    CRITICAL: 'bg-red-600',
  }

  const getPriorityLabel = (priority: RulePriority): string => {
    const labels: Record<RulePriority, string> = {
      LOW: 'Baixa',
      MEDIUM: 'Média',
      HIGH: 'Alta',
      CRITICAL: 'Crítica',
    }
    return labels[priority]
  }

  return (
    <>
      {/* Botão discreto de acesso */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
        title="Configurações Avançadas"
      >
        <Sparkles className="h-5 w-5 text-white" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Motor de Regras de Negócios</DialogTitle>
                <DialogDescription>
                  Configure regras avançadas para descontos e promoções
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Regras
                {hasActiveRules && (
                  <Badge variant="secondary" className="ml-1">
                    {enabledRules.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Pré-visualização
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingRule(null)
                      setShowRuleForm(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Regra
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm('Deseja restaurar as regras padrão?')) {
                        resetToDefaults()
                      }
                    }}
                  >
                    Restaurar Padrão
                  </Button>
                </div>
                <Badge variant={hasActiveRules ? 'default' : 'secondary'}>
                  {hasActiveRules ? `${enabledRules.length} regras ativas` : 'Nenhuma regra ativa'}
                </Badge>
              </div>

              {showRuleForm ? (
                <div className="border rounded-lg p-4">
                  <RuleForm
                    rule={editingRule ? rules.find((r) => r.id === editingRule) : undefined}
                    onSave={handleSaveRule}
                    onCancel={() => {
                      setShowRuleForm(false)
                      setEditingRule(null)
                    }}
                  />
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {rules.map((rule) => {
                      const typeInfo = ruleTypes.find((t) => t.type === rule.type)
                      return (
                        <div
                          key={rule.id}
                          className={`border rounded-lg p-4 transition-colors ${
                            rule.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={`${typeInfo?.color} text-white`}>
                                  {typeInfo?.label}
                                </Badge>
                                <Badge
                                  className={`${priorityColors[rule.priority]} text-white`}
                                  variant="secondary"
                                >
                                  {getPriorityLabel(rule.priority)}
                                </Badge>
                                {rule.deductsFromCommission && (
                                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                                    Abate Comissão
                                  </Badge>
                                )}
                                {rule.enabled ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <X className="h-4 w-4 text-gray-400" />
                                )}
                              </div>

                              <h4 className="font-semibold text-lg">{rule.name}</h4>
                              {rule.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {rule.description}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-2 mt-3">
                                <Badge variant="outline" className="text-xs">
                                  {rule.discountType === 'PERCENTAGE'
                                    ? `${rule.discountValue}%`
                                    : `R$ ${rule.discountValue.toFixed(2)}`}
                                </Badge>
                                {rule.productFilter?.category && (
                                  <Badge variant="outline" className="text-xs">
                                    Categoria: {rule.productFilter.category}
                                  </Badge>
                                )}
                                {rule.minOrderValue && (
                                  <Badge variant="outline" className="text-xs">
                                    Min: R$ {rule.minOrderValue}
                                  </Badge>
                                )}
                                {rule.freeShippingThreshold && (
                                  <Badge variant="outline" className="text-xs">
                                    Frete grátis: R$ {rule.freeShippingThreshold}
                                  </Badge>
                                )}
                                {rule.dateRange && (
                                  <Badge variant="outline" className="text-xs">
                                    {new Date(rule.dateRange.startDate).toLocaleDateString('pt-BR')} - {new Date(rule.dateRange.endDate).toLocaleDateString('pt-BR')}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span>Aplicada {rule.appliedCount}x</span>
                                <span>Criada: {new Date(rule.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>

                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => toggleRule(rule.id, !rule.enabled)}
                                title={rule.enabled ? 'Desativar' : 'Ativar'}
                              >
                                {rule.enabled ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditRule(rule.id)}
                                title="Editar"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDuplicateRule(rule.id)}
                                title="Duplicar"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteRule(rule.id)}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {rules.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhuma regra configurada</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            setEditingRule(null)
                            setShowRuleForm(true)
                          }}
                        >
                          Criar Primeira Regra
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <RulePreview processCart={processCart} enabledRules={enabledRules} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
