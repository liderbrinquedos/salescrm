'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Package,
  Truck,
  CheckCircle2,
  Circle,
  XCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react'

interface CarrierData {
  id: string
  name: string
  cnpj: string
  phone: string | null
  email: string | null
  trackingUrl: string | null
  isActive: boolean
}

interface OrderDetailItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product: {
    id: string
    name: string
    sku: string
    category: string
    price: number
    imageUrl: string | null
  }
}

interface OrderDetail {
  id: string
  orderNumber: string
  customerId: string
  factoryId: string
  status: string
  paymentCondition: string
  carrierId: string | null
  freightType: string
  freightCost: number
  subtotal: number
  discount: number
  discountBreakdown: string | null
  total: number
  trackingCode: string | null
  deliveryDate: string | null
  deliveryAddress: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  customer: {
    id: string
    name: string
    email: string | null
    phone: string
    cnpj: string
    address: string | null
    city: string | null
    state: string | null
    tradeName: string | null
    contactName: string | null
  }
  factory: {
    id: string
    name: string
    cnpj: string
    email: string
  }
  carrier: {
    id: string
    name: string
    trackingUrl: string | null
  } | null
  items: OrderDetailItem[]
}

interface OrderDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string | null
  onOrderUpdated: () => void
  carriers: CarrierData[]
}

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PROCESSING: 'Em Processamento',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  CONFIRMED: 'bg-blue-500',
  PROCESSING: 'bg-purple-500',
  SHIPPED: 'bg-orange-500',
  DELIVERED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'À vista',
  THIRTY_DAYS: '30 dias',
  FORTY_FIVE_DAYS: '45 dias',
  SIXTY_DAYS: '60 dias',
  NINETY_DAYS: '90 dias',
  THIRTY_SIXTY: '30/60',
  THIRTY_SIXTY_NINETY: '30/60/90',
  THIRTY_SIXTY_NINETY_HUNDRED_TWENTY: '30/60/90/120',
}

const FREIGHT_LABELS: Record<string, string> = {
  CIF: 'CIF',
  FOB: 'FOB',
  FREE: 'Grátis',
}

interface DiscountBreakdownItem {
  productId: string
  productName: string
  discountAmount: number
}

export function OrderDetailsDialog({
  open,
  onOpenChange,
  orderId,
  onOrderUpdated,
  carriers,
}: OrderDetailsDialogProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('order')

  const [status, setStatus] = useState('')
  const [paymentCondition, setPaymentCondition] = useState('')
  const [freightType, setFreightType] = useState('')
  const [freightCost, setFreightCost] = useState(0)
  const [carrierId, setCarrierId] = useState('')
  const [trackingCode, setTrackingCode] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open && orderId) {
      loadOrder()
    }
    if (!open) {
      setOrder(null)
      setActiveTab('order')
    }
  }, [open, orderId])

  const loadOrder = async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (res.ok) {
        const data: OrderDetail = await res.json()
        setOrder(data)
        setStatus(data.status)
        setPaymentCondition(data.paymentCondition)
        setFreightType(data.freightType)
        setFreightCost(data.freightCost)
        setCarrierId(data.carrierId || '')
        setTrackingCode(data.trackingCode || '')
        setDeliveryAddress(data.deliveryAddress || '')
        setDeliveryDate(data.deliveryDate ? data.deliveryDate.split('T')[0] : '')
        setNotes(data.notes || '')
      } else {
        toast.error('Erro ao carregar pedido')
      }
    } catch {
      toast.error('Erro ao carregar pedido')
    } finally {
      setLoading(false)
    }
  }

  const isDirty = useMemo(() => {
    if (!order) return false
    return (
      status !== order.status ||
      paymentCondition !== order.paymentCondition ||
      freightType !== order.freightType ||
      freightCost !== order.freightCost ||
      (carrierId || null) !== order.carrierId ||
      trackingCode !== (order.trackingCode || '') ||
      deliveryAddress !== (order.deliveryAddress || '') ||
      deliveryDate !== (order.deliveryDate ? order.deliveryDate.split('T')[0] : '') ||
      notes !== (order.notes || '')
    )
  }, [order, status, paymentCondition, freightType, freightCost, carrierId, trackingCode, deliveryAddress, deliveryDate, notes])

  const handleSave = async () => {
    if (!orderId || !order) return
    setSaving(true)

    const body: Record<string, unknown> = {}
    if (status !== order.status) body.status = status
    if (paymentCondition !== order.paymentCondition) body.paymentCondition = paymentCondition
    if (freightType !== order.freightType) body.freightType = freightType
    if (freightCost !== order.freightCost) body.freightCost = freightCost
    if ((carrierId || null) !== order.carrierId) body.carrierId = carrierId || null
    if (trackingCode !== (order.trackingCode || '')) body.trackingCode = trackingCode || null
    if (deliveryAddress !== (order.deliveryAddress || '')) body.deliveryAddress = deliveryAddress || null
    if (deliveryDate !== (order.deliveryDate ? order.deliveryDate.split('T')[0] : '')) body.deliveryDate = deliveryDate || null
    if (notes !== (order.notes || '')) body.notes = notes || null

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success('Pedido atualizado com sucesso!')
        onOpenChange(false)
        onOrderUpdated()
      } else {
        toast.error('Erro ao atualizar pedido')
      }
    } catch {
      toast.error('Erro ao atualizar pedido')
    } finally {
      setSaving(false)
    }
  }

  const parsedBreakdown = useMemo(() => {
    if (!order?.discountBreakdown) return null
    try {
      const parsed = JSON.parse(order.discountBreakdown)
      if (Array.isArray(parsed)) {
        return parsed as DiscountBreakdownItem[]
      }
      if (parsed?.itemAllocations) {
        return parsed.itemAllocations as DiscountBreakdownItem[]
      }
      return null
    } catch {
      return null
    }
  }, [order?.discountBreakdown])

  const getItemDiscount = (productId: string): number => {
    if (!parsedBreakdown) return 0
    const item = parsedBreakdown.find((b) => b.productId === productId)
    return item?.discountAmount || 0
  }

  const getStatusStepIndex = (s: string) => STATUS_STEPS.indexOf(s)

  const renderStepper = () => {
    if (status === 'CANCELLED') {
      return (
        <div className="flex items-center justify-center gap-2 py-3">
          <XCircle className="h-5 w-5 text-red-500" />
          <Badge className="bg-red-500 text-white">Pedido Cancelado</Badge>
        </div>
      )
    }

    const currentIndex = getStatusStepIndex(status)

    return (
      <div className="flex items-center justify-between py-3">
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isFuture = index > currentIndex
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrent
                        ? `${STATUS_COLORS[status]} border-current text-white`
                        : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Circle className="h-3 w-3 fill-current" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                <span
                  className={`text-[10px] text-center whitespace-nowrap ${
                    isCurrent
                      ? 'font-semibold text-foreground'
                      : isFuture
                        ? 'text-muted-foreground'
                        : 'text-green-600 font-medium'
                  }`}
                >
                  {STATUS_LABELS[step]}
                </span>
              </div>
              {index < STATUS_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 mb-5 ${
                    isCompleted ? 'bg-green-500' : 'bg-muted-foreground/20'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : order ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-purple-600 rounded-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    Pedido {order.orderNumber}
                  </DialogTitle>
                  <DialogDescription>
                    Criado em{' '}
                    {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="px-6"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="order">Pedido</TabsTrigger>
                <TabsTrigger value="tracking">Rastreamento</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[60vh] pr-4">
                <TabsContent value="order" className="space-y-4 mt-4">
                  {renderStepper()}

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pendente</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                        <SelectItem value="PROCESSING">Em Processamento</SelectItem>
                        <SelectItem value="SHIPPED">Enviado</SelectItem>
                        <SelectItem value="DELIVERED">Entregue</SelectItem>
                        <SelectItem value="CANCELLED">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Cliente</Label>
                      <p className="font-medium">{order.customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer.cnpj}
                      </p>
                      {order.customer.city && (
                        <p className="text-sm text-muted-foreground">
                          {order.customer.city}
                          {order.customer.state ? ` - ${order.customer.state}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Fabrica</Label>
                      <p className="font-medium">{order.factory.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.factory.cnpj}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Condicao Pagamento</Label>
                      <Select value={paymentCondition} onValueChange={setPaymentCondition}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Tipo Frete</Label>
                      <Select value={freightType} onValueChange={setFreightType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(FREIGHT_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Valor Frete</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={freightCost}
                        onChange={(e) => setFreightCost(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Transportadora</Label>
                      <Select value={carrierId} onValueChange={setCarrierId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {carriers.map((carrier) => (
                            <SelectItem key={carrier.id} value={carrier.id}>
                              {carrier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Itens do Pedido ({order.items.length})
                    </Label>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="hidden sm:table-cell">SKU</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                            <TableHead className="text-right">Preco Unit</TableHead>
                            <TableHead className="text-right">Desconto</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item) => {
                            const itemDiscount = getItemDiscount(item.productId)
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  {item.product.name}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground">
                                  {item.product.sku}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="text-right">
                                  R$ {item.unitPrice.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {itemDiscount > 0 ? (
                                    <span className="text-green-600">
                                      -R$ {itemDiscount.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  R$ {(item.totalPrice - itemDiscount).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex flex-col items-end gap-1 pt-2 text-sm">
                      <div className="flex justify-between w-64">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>R$ {order.subtotal.toFixed(2)}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between w-64 text-green-600">
                          <span>Desconto</span>
                          <span>-R$ {order.discount.toFixed(2)}</span>
                        </div>
                      )}
                      {order.freightCost > 0 && (
                        <div className="flex justify-between w-64 text-blue-600">
                          <span>Frete</span>
                          <span>R$ {order.freightCost.toFixed(2)}</span>
                        </div>
                      )}
                      {order.freightType === 'FREE' && (
                        <div className="flex justify-between w-64 text-green-600">
                          <span>Frete</span>
                          <span>Gratis</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between w-64 font-bold text-base">
                        <span>Total</span>
                        <span className="text-orange-600">
                          R$ {order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Notas</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Adicione observacoes ao pedido..."
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="tracking" className="space-y-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold">Tracking</h3>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Codigo de Rastreio</Label>
                    <div className="flex gap-2">
                      <Input
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                        placeholder="Ex: BR123456789XX"
                      />
                      {trackingCode && order.carrier?.trackingUrl && (
                        <Button
                          variant="outline"
                          size="icon"
                          asChild
                        >
                          <a
                            href={order.carrier.trackingUrl.replace('{trackingCode}', trackingCode)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {order.carrier && (
                    <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                      <Label className="text-xs text-muted-foreground">Transportadora</Label>
                      <p className="font-medium">{order.carrier.name}</p>
                      {order.carrier.trackingUrl && (
                        <p className="text-xs text-muted-foreground">
                          URL: {order.carrier.trackingUrl}
                        </p>
                      )}
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold">Entrega</h3>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Endereco de Entrega</Label>
                    <Input
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Rua, numero, bairro, cidade - UF"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Data Prevista</Label>
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                  </div>

                  {deliveryDate && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">
                        Previsao:{' '}
                        <span className="font-semibold">
                          {new Date(deliveryDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </p>
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <DialogFooter className="px-6 pb-6 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:opacity-90"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Alteracoes
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
