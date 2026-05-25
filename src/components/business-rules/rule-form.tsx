'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { BusinessRule, RuleType, DiscountType, RulePriority } from '@/lib/business-rules'
import { Plus, Trash2, X } from 'lucide-react'

interface RuleFormProps {
  rule?: BusinessRule
  onSave: (rule: Partial<BusinessRule>) => void
  onCancel: () => void
}

export function RuleForm({ rule, onSave, onCancel }: RuleFormProps) {
  const [formData, setFormData] = useState<Partial<BusinessRule>>({
    name: '',
    description: '',
    type: 'PROMOTIONAL',
    enabled: true,
    priority: 'MEDIUM',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    deductsFromCommission: false,
    minOrderValue: 0,
    minOrderQuantity: 0,
    freeShippingThreshold: 0,
    productFilter: {},
    customerFilter: {},
    progressiveTiers: [],
    requiredProductIds: [],
    dateRange: undefined,
  })

  const [tiers, setTiers] = useState<Array<{ min: number; discount: number }>>([])

  // Popula o formulário quando uma regra é passada (executa apenas quando a prop muda)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (rule) {
      setFormData(rule)
      if (rule.progressiveTiers) {
        setTiers(
          rule.progressiveTiers.map((t) => ({
            min: t.minValue || t.minQuantity || 0,
            discount: t.discount,
          }))
        )
      }
    }
  }, [rule])

  const handleSave = () => {
    if (!formData.name || !formData.type) {
      alert('Nome e tipo são obrigatórios')
      return
    }

    const dataToSave: Partial<BusinessRule> = {
      ...formData,
      progressiveTiers:
        formData.type === 'PROGRESSIVE'
          ? tiers.map((t) => ({
              minValue: t.min,
              discount: t.discount,
              discountType: 'PERCENTAGE',
            }))
          : undefined,
    }

    onSave(dataToSave)
  }

  const addTier = () => {
    setTiers([...tiers, { min: 0, discount: 0 }])
  }

  const updateTier = (index: number, field: 'min' | 'discount', value: number) => {
    const newTiers = [...tiers]
    newTiers[index][field] = value
    setTiers(newTiers)
  }

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index))
  }

  const ruleTypes: { type: RuleType; label: string }[] = [
    { type: 'PROMOTIONAL', label: 'Desconto Promocional' },
    { type: 'QUANTITY_THRESHOLD', label: 'Desconto por Quantidade' },
    { type: 'VALUE_THRESHOLD', label: 'Desconto por Valor' },
    { type: 'COMMISSION_DISCOUNT', label: 'Abate da Comissão' },
    { type: 'CATEGORY_PROMO', label: 'Promoção por Categoria' },
    { type: 'CUSTOMER_VIP', label: 'Desconto Cliente VIP' },
    { type: 'FACTORY_PROMO', label: 'Promoção por Fábrica' },
    { type: 'PROGRESSIVE', label: 'Desconto Progressivo' },
    { type: 'FREE_SHIPPING', label: 'Frete Grátis' },
    { type: 'CASH_DISCOUNT', label: 'Desconto à Vista' },
    { type: 'SEASONAL', label: 'Desconto Sazonal' },
    { type: 'COMBO_PRODUCTS', label: 'Combo de Produtos' },
    { type: 'MAX_DISCOUNT', label: 'Teto Máximo de Desconto' },
  ]

  const needsDiscountValue = !['FREE_SHIPPING', 'MAX_DISCOUNT'].includes(formData.type || '')
  const needsProgressiveTiers = formData.type === 'PROGRESSIVE'
  const needsCategory = formData.type === 'CATEGORY_PROMO'
  const needsFactory = formData.type === 'FACTORY_PROMO'
  const needsMinOrderValue = ['VALUE_THRESHOLD', 'FREE_SHIPPING'].includes(formData.type || '')
  const needsMinOrderQuantity = formData.type === 'QUANTITY_THRESHOLD'
  const needsDateRange = formData.type === 'SEASONAL'
  const needsVipOnly = formData.type === 'CUSTOMER_VIP'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Regra *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Desconto à Vista"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Tipo de Regra *</Label>
          <Select
            value={formData.type}
            onValueChange={(value: RuleType) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ruleTypes.map((rt) => (
                <SelectItem key={rt.type} value={rt.type}>
                  {rt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva o objetivo desta regra..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: RulePriority) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Baixa</SelectItem>
              <SelectItem value="MEDIUM">Média</SelectItem>
              <SelectItem value="HIGH">Alta</SelectItem>
              <SelectItem value="CRITICAL">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discountType">Tipo de Desconto</Label>
          <Select
            value={formData.discountType}
            onValueChange={(value: DiscountType) => setFormData({ ...formData, discountType: value })}
            disabled={!needsDiscountValue}
          >
            <SelectTrigger id="discountType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
              <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discountValue">Valor do Desconto</Label>
          <Input
            id="discountValue"
            type="number"
            value={formData.discountValue}
            onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
            disabled={!needsDiscountValue}
            placeholder={formData.discountType === 'PERCENTAGE' ? 'Ex: 10' : 'Ex: 50.00'}
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Switch
            id="enabled"
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
          />
          <Label htmlFor="enabled" className="cursor-pointer">
            Regra Ativa
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="deductsFromCommission"
            checked={formData.deductsFromCommission}
            onCheckedChange={(checked) => setFormData({ ...formData, deductsFromCommission: checked })}
          />
          <Label htmlFor="deductsFromCommission" className="cursor-pointer text-sm text-orange-600">
            Abate da Comissão
          </Label>
        </div>
      </div>

      {needsCategory && (
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            value={formData.productFilter?.category || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                productFilter: { ...formData.productFilter, category: e.target.value },
              })
            }
            placeholder="Ex: Bonecos, Jogos, Veículos"
          />
        </div>
      )}

      {needsFactory && (
        <div className="space-y-2">
          <Label htmlFor="factoryId">ID da Fábrica</Label>
          <Input
            id="factoryId"
            value={formData.productFilter?.factoryId || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                productFilter: { ...formData.productFilter, factoryId: e.target.value },
              })
            }
            placeholder="ID da fábrica"
          />
        </div>
      )}

      {needsMinOrderValue && (
        <div className="space-y-2">
          <Label htmlFor="minOrderValue">Valor Mínimo do Pedido</Label>
          <Input
            id="minOrderValue"
            type="number"
            value={formData.minOrderValue || 0}
            onChange={(e) => setFormData({ ...formData, minOrderValue: parseFloat(e.target.value) || 0 })}
            placeholder="Ex: 500"
          />
        </div>
      )}

      {needsMinOrderQuantity && (
        <div className="space-y-2">
          <Label htmlFor="minOrderQuantity">Quantidade Mínima</Label>
          <Input
            id="minOrderQuantity"
            type="number"
            value={formData.minOrderQuantity || 0}
            onChange={(e) => setFormData({ ...formData, minOrderQuantity: parseInt(e.target.value) || 0 })}
            placeholder="Ex: 10"
          />
        </div>
      )}

      {formData.type === 'FREE_SHIPPING' && (
        <div className="space-y-2">
          <Label htmlFor="freeShippingThreshold">Valor Mínimo para Frete Grátis</Label>
          <Input
            id="freeShippingThreshold"
            type="number"
            value={formData.freeShippingThreshold || 0}
            onChange={(e) =>
              setFormData({ ...formData, freeShippingThreshold: parseFloat(e.target.value) || 0 })
            }
            placeholder="Ex: 500"
          />
        </div>
      )}

      {needsDateRange && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Data Início</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.dateRange?.startDate?.split('T')[0] || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dateRange: {
                    ...formData.dateRange,
                    startDate: e.target.value,
                    endDate: formData.dateRange?.endDate || new Date().toISOString(),
                  } as any,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Data Fim</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.dateRange?.endDate?.split('T')[0] || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dateRange: {
                    ...formData.dateRange,
                    startDate: formData.dateRange?.startDate || new Date().toISOString(),
                    endDate: e.target.value,
                  } as any,
                })
              }
            />
          </div>
        </div>
      )}

      {needsVipOnly && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
          <Switch
            id="isVip"
            checked={formData.customerFilter?.isVip || false}
            onCheckedChange={(checked) =>
              setFormData({
                ...formData,
                customerFilter: { ...formData.customerFilter, isVip: checked },
              })
            }
          />
          <Label htmlFor="isVip" className="cursor-pointer">
            Aplicar apenas para clientes VIP
          </Label>
        </div>
      )}

      {needsProgressiveTiers && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Faixas de Desconto</Label>
            <Button size="sm" variant="outline" onClick={addTier}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Faixa
            </Button>
          </div>
          {tiers.map((tier, index) => (
            <div key={index} className="flex gap-2 items-center">
              <div className="flex-1">
                <Label className="text-xs">Valor Mínimo</Label>
                <Input
                  type="number"
                  value={tier.min}
                  onChange={(e) => updateTier(index, 'min', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 1000"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Desconto (%)</Label>
                <Input
                  type="number"
                  value={tier.discount}
                  onChange={(e) => updateTier(index, 'discount', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 10"
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeTier(index)}
                className="mt-4"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))}
          {tiers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma faixa configurada
            </p>
          )}
        </div>
      )}

      <Separator />

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>
          {rule ? 'Atualizar' : 'Criar'} Regra
        </Button>
      </div>
    </div>
  )
}
