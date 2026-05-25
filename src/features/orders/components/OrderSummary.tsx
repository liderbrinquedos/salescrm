'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

interface ItemData {
  productId: string
  productName: string
  category: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface RuleData {
  ruleId: string
  ruleName: string
  ruleType: string
  discountAmount: number
  discountType: string
  itemAllocations: Array<{
    productId: string
    productName: string
    discountAmount: number
  }>
}

interface RulesResult {
  subtotal: number
  discount: number
  commissionDiscount: number
  freeShipping: boolean
  finalTotal: number
  appliedRules: RuleData[]
}

interface OrderSummaryProps {
  items: ItemData[]
  totalItems: number
  totalValue: number
  rulesResult: RulesResult | null
  manualDiscount?: {
    type: 'fixed' | 'percentage'
    value: number
  }
  freightCost: number
  freeShipping: boolean
}

export function OrderSummary({
  items,
  totalItems,
  totalValue,
  rulesResult,
  manualDiscount,
  freightCost,
  freeShipping,
}: OrderSummaryProps) {
  const [expanded, setExpanded] = useState(false)

  const hasRules = rulesResult && rulesResult.appliedRules.length > 0
  const finalFreightCost = freeShipping ? 0 : freightCost

  let finalDiscount = 0
  if (hasRules) {
    finalDiscount = rulesResult.discount
  } else if (manualDiscount && manualDiscount.value > 0) {
    finalDiscount = manualDiscount.type === 'percentage'
      ? totalValue * (manualDiscount.value / 100)
      : manualDiscount.value
  }

  const finalTotal = totalValue - finalDiscount + finalFreightCost

  // Aggregate discount per item across all rules
  const itemDiscountMap = new Map<string, number>()
  if (hasRules) {
    for (const rule of rulesResult.appliedRules) {
      for (const alloc of rule.itemAllocations) {
        const current = itemDiscountMap.get(alloc.productId) || 0
        itemDiscountMap.set(alloc.productId, current + alloc.discountAmount)
      }
    }
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-2">
          {hasRules && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg mb-3">
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
                {rulesResult.appliedRules.map((rule, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-purple-600">{rule.ruleName}</span>
                    <span className="font-semibold text-green-600">
                      -R$ {rule.discountAmount.toFixed(2)}
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

          <div className="flex justify-between text-sm">
            <span>Itens:</span>
            <span>{totalItems}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>R$ {totalValue.toFixed(2)}</span>
          </div>
          {finalDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Desconto:</span>
              <span>-R$ {finalDiscount.toFixed(2)}</span>
            </div>
          )}
          {finalFreightCost > 0 && (
            <div className="flex justify-between text-sm text-blue-600">
              <span>Frete:</span>
              <span>R$ {finalFreightCost.toFixed(2)}</span>
            </div>
          )}
          {freeShipping && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Frete:</span>
              <span>Grátis</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span className="text-orange-600">R$ {finalTotal.toFixed(2)}</span>
          </div>

          {hasRules && items.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground mt-2"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>Ver menos detalhes <ChevronUp className="h-3 w-3 ml-1" /></>
                ) : (
                  <>Ver detalhamento por item <ChevronDown className="h-3 w-3 ml-1" /></>
                )}
              </Button>

              {expanded && (
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Produto</TableHead>
                        <TableHead className="text-xs text-right">Valor</TableHead>
                        <TableHead className="text-xs text-right">Qtde</TableHead>
                        <TableHead className="text-xs text-right">Descontos</TableHead>
                        <TableHead className="text-xs text-right">Líquido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const itemDiscount = itemDiscountMap.get(item.productId) || 0
                        const itemNet = item.totalPrice - itemDiscount
                        return (
                          <TableRow key={item.productId}>
                            <TableCell className="text-xs font-medium">{item.productName}</TableCell>
                            <TableCell className="text-xs text-right">R$ {item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-xs text-right">{item.quantity}</TableCell>
                            <TableCell className="text-xs text-right text-green-600">
                              {itemDiscount > 0 ? `-R$ ${itemDiscount.toFixed(2)}` : '--'}
                            </TableCell>
                            <TableCell className="text-xs text-right font-semibold">
                              R$ {itemNet.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  <div className="p-3 bg-muted/50 border-t">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      Descontos aplicados:
                    </p>
                    {rulesResult.appliedRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs ml-2">
                        <span className="text-muted-foreground">
                          {idx === rulesResult.appliedRules.length - 1 ? '└ ' : '├ '}
                          {rule.ruleName}:
                        </span>
                        <span className="text-green-600 font-medium">
                          -R$ {rule.discountAmount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <Separator className="my-1" />
                    <div className="flex items-center justify-between text-xs font-semibold ml-2">
                      <span>Total descontos:</span>
                      <span className="text-green-600">-R$ {rulesResult.discount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
