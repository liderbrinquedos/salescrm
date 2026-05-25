'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { BusinessRule, RulesEngineContext, RulesEngineResult } from '@/lib/business-rules'
import { Play, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface RulePreviewProps {
  processCart: (context: RulesEngineContext) => RulesEngineResult
  enabledRules: BusinessRule[]
}

export function RulePreview({ processCart, enabledRules }: RulePreviewProps) {

  const [cartValue, setCartValue] = useState(1000)
  const [cartQuantity, setCartQuantity] = useState(10)
  const [freightCost, setFreightCost] = useState(50)
  const [paymentCondition, setPaymentCondition] = useState('CASH')
  const [customerType, setCustomerType] = useState<'regular' | 'vip'>('regular')
  const [result, setResult] = useState<any>(null)
  const [hasRun, setHasRun] = useState(false)

  const runSimulation = () => {
    const context = {
      cartItems: [
        {
          productId: 'prod-1',
          productName: 'Produto Exemplo 1',
          productSku: 'SKU-001',
          factoryId: 'factory-1',
          category: 'Bonecos',
          quantity: cartQuantity,
          unitPrice: cartValue / cartQuantity,
        },
      ],
      customerId: 'customer-1',
      customerData: {
        name: 'Cliente Teste',
        isVip: customerType === 'vip',
      },
      orderSubtotal: cartValue,
      paymentCondition,
      freightType: 'CIF',
      freightCost,
    }

    const simulationResult = processCart(context)
    setResult(simulationResult)
    setHasRun(true)
  }

  // Executa simulação quando os parâmetros mudam (auto-run apenas na primeira vez que há regras)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (enabledRules.length > 0 && !hasRun) {
      runSimulation()
    }
  }, [enabledRules, cartValue, cartQuantity, freightCost, paymentCondition, customerType, runSimulation])

  const resetSimulation = () => {
    setHasRun(false)
    setResult(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simulador de Regras</CardTitle>
          <CardDescription>
            Teste como as regras se comportam em diferentes cenários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Valor do Carrinho (R$)</Label>
              <Input
                type="number"
                value={cartValue}
                onChange={(e) => {
                  setCartValue(parseFloat(e.target.value) || 0)
                  setHasRun(false)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Quantidade de Itens</Label>
              <Input
                type="number"
                value={cartQuantity}
                onChange={(e) => {
                  setCartQuantity(parseInt(e.target.value) || 1)
                  setHasRun(false)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Valor do Frete (R$)</Label>
              <Input
                type="number"
                value={freightCost}
                onChange={(e) => {
                  setFreightCost(parseFloat(e.target.value) || 0)
                  setHasRun(false)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Condição de Pagamento</Label>
              <Select
                value={paymentCondition}
                onValueChange={setPaymentCondition}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">À vista</SelectItem>
                  <SelectItem value="THIRTY_DAYS">30 dias</SelectItem>
                  <SelectItem value="THIRTY_SIXTY">30/60</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Tipo de Cliente:</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={customerType === 'regular' ? 'default' : 'outline'}
                  onClick={() => {
                    setCustomerType('regular')
                    setHasRun(false)
                  }}
                >
                  Regular
                </Button>
                <Button
                  size="sm"
                  variant={customerType === 'vip' ? 'default' : 'outline'}
                  onClick={() => {
                    setCustomerType('vip')
                    setHasRun(false)
                  }}
                >
                  VIP
                </Button>
              </div>
            </div>

            <Button onClick={runSimulation} className="ml-auto">
              <Play className="h-4 w-4 mr-2" />
              Executar Simulação
            </Button>

            <Button variant="outline" onClick={resetSimulation}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Simulação</CardTitle>
            <CardDescription>
              {result.appliedRules.length} regra(s) aplicada(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="text-2xl font-bold">R$ {result.subtotal.toFixed(2)}</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Desconto</p>
                <p className="text-2xl font-bold text-green-600">
                  -R$ {result.discount.toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Frete</p>
                <p className={`text-2xl font-bold ${result.freeShipping ? 'text-green-600' : 'text-blue-600'}`}>
                  {result.freeShipping ? 'Grátis' : `R$ ${freightCost.toFixed(2)}`}
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Final</p>
                <p className="text-2xl font-bold text-purple-600">
                  R$ {result.finalTotal.toFixed(2)}
                </p>
              </div>
            </div>

            {result.commissionDiscount > 0 && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-semibold text-orange-600">Abatimento da Comissão</p>
                    <p className="text-sm text-orange-700">
                      R$ {result.commissionDiscount.toFixed(2)} descontado da comissão do vendedor
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            <div>
              <h4 className="font-semibold mb-3">Regras Aplicadas</h4>
              {result.appliedRules.length > 0 ? (
                <div className="space-y-2">
                  {result.appliedRules.map((rule: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">{rule.ruleName}</p>
                          <p className="text-sm text-muted-foreground">{rule.message}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-green-600">
                        -R$ {rule.discountAmount.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 p-8 bg-gray-50 rounded-lg">
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <p className="text-muted-foreground">Nenhuma regra aplicada neste cenário</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {enabledRules.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma regra ativa para simular
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Ative regras na aba "Regras" para usar o simulador
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
