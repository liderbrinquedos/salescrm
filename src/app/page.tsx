'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { useCartStore, CartItem } from '@/store/cart-store'
import { ShoppingCart, Package, Users, FileText, Search, Plus, Minus, Trash2, Store, Calendar, Filter, ShoppingBag, TrendingUp } from 'lucide-react'

// Types
interface Product {
  id: string
  factoryId: string
  name: string
  description: string | null
  sku: string
  category: string
  ageRange: string | null
  price: number
  stock: number
  imageUrl: string | null
  isActive: boolean
  factory: {
    id: string
    name: string
  }
}

interface Customer {
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
  notes: string | null
  isActive: boolean
}

interface Order {
  id: string
  orderNumber: string
  customerId: string
  factoryId: string
  status: string
  subtotal: number
  discount: number
  total: number
  deliveryDate: string | null
  deliveryAddress: string | null
  notes: string | null
  createdAt: string
  customer: {
    id: string
    name: string
    cnpj: string
    city: string | null
  }
  factory: {
    id: string
    name: string
  }
  items: OrderItem[]
}

interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product: {
    id: string
    name: string
    sku: string
  }
}

interface Factory {
  id: string
  name: string
  cnpj: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  isActive: boolean
}

export default function Home() {
  // State
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [factories, setFactories] = useState<Factory[]>([])
  const [selectedFactory, setSelectedFactory] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [newOrderOpen, setNewOrderOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [orderNotes, setOrderNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSeeded, setIsSeeded] = useState(false)

  // Cart store
  const { items, totalItems, totalValue, addItem, updateQuantity, removeItem, clearCart } = useCartStore()

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Check if data exists
      const factoriesRes = await fetch('/api/factories')
      const factoriesData = await factoriesRes.json()

      if (factoriesData.length === 0) {
        setIsSeeded(false)
        setLoading(false)
        return
      }

      setIsSeeded(true)

      const [productsRes, customersRes, ordersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/customers'),
        fetch('/api/orders'),
      ])

      const productsData = await productsRes.json()
      const customersData = await customersRes.json()
      const ordersData = await ordersRes.json()

      setProducts(productsData)
      setCustomers(customersData)
      setOrders(ordersData)
      setFactories(factoriesData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const seedData = async () => {
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
      })
      const data = await res.json()
      toast.success('Dados mock criados com sucesso!')
      loadData()
    } catch (error) {
      console.error('Erro ao criar dados:', error)
      toast.error('Erro ao criar dados')
    }
  }

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchFactory = selectedFactory === 'all' || product.factoryId === selectedFactory
    const matchCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchSearch =
      searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchFactory && matchCategory && matchSearch
  })

  // Get unique categories
  const categories = Array.from(new Set(products.map((p) => p.category)))

  // Add to cart
  const handleAddToCart = (product: Product) => {
    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      factoryId: product.factoryId,
      factoryName: product.factory.name,
      category: product.category,
      quantity: 1,
      unitPrice: product.price,
      imageUrl: product.imageUrl,
    })
    toast.success(`${product.name} adicionado ao carrinho`)
  }

  // Create order
  const handleCreateOrder = async () => {
    if (items.length === 0) {
      toast.error('Carrinho vazio')
      return
    }

    if (!selectedCustomer) {
      toast.error('Selecione um cliente')
      return
    }

    try {
      const orderData = {
        customerId: selectedCustomer,
        factoryId: items[0].factoryId,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        notes: orderNotes,
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      if (res.ok) {
        const newOrder = await res.json()
        toast.success('Pedido criado com sucesso!')
        clearCart()
        setNewOrderOpen(false)
        setSelectedCustomer('')
        setOrderNotes('')
        loadData()
      } else {
        toast.error('Erro ao criar pedido')
      }
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      toast.error('Erro ao criar pedido')
    }
  }

  // Update order status
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        toast.success('Status atualizado com sucesso!')
        loadData()
      } else {
        toast.error('Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500',
      CONFIRMED: 'bg-blue-500',
      PROCESSING: 'bg-purple-500',
      SHIPPED: 'bg-orange-500',
      DELIVERED: 'bg-green-500',
      CANCELLED: 'bg-red-500',
    }
    return colors[status] || 'bg-gray-500'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      CONFIRMED: 'Confirmado',
      PROCESSING: 'Em Processamento',
      SHIPPED: 'Enviado',
      DELIVERED: 'Entregue',
      CANCELLED: 'Cancelado',
    }
    return labels[status] || status
  }

  if (!isSeeded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-purple-50 p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Sistema de Vendas de Brinquedos</CardTitle>
            <CardDescription>
              Aplicativo para Representantes Comerciais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Bem-vindo! Este é o sistema de gestão de vendas para representantes de brinquedos.
              Para começar, vamos criar alguns dados de exemplo.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={seedData} className="w-full" size="lg">
              <Package className="w-5 h-5 mr-2" />
              Criar Dados de Exemplo
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Brinquedos CRM
                </h1>
                <p className="text-xs text-muted-foreground">Sistema para Representantes</p>
              </div>
            </div>

            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="lg" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>Carrinho de Vendas</SheetTitle>
                  <SheetDescription>
                    {items.length === 0 ? 'Seu carrinho está vazio' : `${totalItems} itens no carrinho`}
                  </SheetDescription>
                </SheetHeader>

                {items.length > 0 && (
                  <div className="flex flex-col h-full py-6">
                    <ScrollArea className="flex-1 -mx-6 px-6">
                      <div className="space-y-4">
                        {items.map((item) => (
                          <Card key={item.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm">{item.productName}</h4>
                                  <p className="text-xs text-muted-foreground">SKU: {item.productSku}</p>
                                  <p className="text-xs text-muted-foreground">{item.factoryName}</p>
                                  <p className="text-sm font-semibold text-orange-600 mt-2">
                                    R$ {item.unitPrice.toFixed(2)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>

                    <div className="border-t pt-4 mt-4 space-y-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-orange-600">R$ {totalValue.toFixed(2)}</span>
                      </div>

                      <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full" size="lg" onClick={() => setCartOpen(false)}>
                            Finalizar Pedido
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Finalizar Pedido</DialogTitle>
                            <DialogDescription>
                              Selecione o cliente e adicione observações se necessário
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="customer">Cliente *</Label>
                              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                                <SelectTrigger id="customer">
                                  <SelectValue placeholder="Selecione um cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                  {customers.map((customer) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                      {customer.name} - {customer.city}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="notes">Observações</Label>
                              <Textarea
                                id="notes"
                                placeholder="Adicione observações ao pedido..."
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                            <Card>
                              <CardContent className="pt-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Itens:</span>
                                    <span>{totalItems}</span>
                                  </div>
                                  <Separator />
                                  <div className="flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span className="text-orange-600">R$ {totalValue.toFixed(2)}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setNewOrderOpen(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleCreateOrder}>Criar Pedido</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline" className="w-full" onClick={() => clearCart()}>
                        Limpar Carrinho
                      </Button>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs defaultValue="catalog" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="catalog" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Catálogo</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
          </TabsList>

          {/* Catalog Tab */}
          <TabsContent value="catalog" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Fabricante</Label>
                    <Select value={selectedFactory} onValueChange={setSelectedFactory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os fabricantes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os fabricantes</SelectItem>
                        {factories.map((factory) => (
                          <SelectItem key={factory.id} value={factory.id}>
                            {factory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Nome, SKU ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                      <Badge className="text-xs bg-gradient-to-r from-orange-500 to-purple-600">
                        {product.factory.name}
                      </Badge>
                    </div>
                    <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
                    <CardDescription className="text-xs">SKU: {product.sku}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-2">
                    {product.ageRange && (
                      <Badge variant="outline" className="text-xs">
                        {product.ageRange}
                      </Badge>
                    )}
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-2xl font-bold text-orange-600">
                        R$ {product.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Estoque: {product.stock}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {product.stock === 0 ? 'Sem Estoque' : 'Adicionar'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros ou buscar por outro termo
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Clientes</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </div>

            <div className="grid gap-4">
              {customers.map((customer) => (
                <Card key={customer.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                        {customer.tradeName && (
                          <p className="text-sm text-muted-foreground">Fantasia: {customer.tradeName}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span>CNPJ: {customer.cnpj}</span>
                          {customer.city && <span>• {customer.city} - {customer.state}</span>}
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          {customer.phone && <span>📞 {customer.phone}</span>}
                          {customer.email && <span>✉️ {customer.email}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Editar</Button>
                        <Button variant="outline" size="sm">Ver Detalhes</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {customers.length === 0 && (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum cliente cadastrado</h3>
                <p className="text-muted-foreground">
                  Comece adicionando clientes ao sistema
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Pedidos</h2>
              <Button onClick={() => { if (items.length > 0) setNewOrderOpen(true) }}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Pedido
              </Button>
            </div>

            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fábrica</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer.name}</div>
                          <div className="text-xs text-muted-foreground">{order.customer.city}</div>
                        </div>
                      </TableCell>
                      <TableCell>{order.factory.name}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="h-8 w-32">
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
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {order.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Detalhes</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {orders.length === 0 && (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
                <p className="text-muted-foreground">
                  Adicione produtos ao carrinho e crie seu primeiro pedido
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-orange-100">
                    Fábricas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{factories.length}</div>
                  <p className="text-xs text-orange-100 mt-1">Fabricantes ativos</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-purple-100">
                    Produtos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{products.length}</div>
                  <p className="text-xs text-purple-100 mt-1">Produtos no catálogo</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-100">
                    Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{customers.length}</div>
                  <p className="text-xs text-blue-100 mt-1">Clientes cadastrados</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-green-100">
                    Pedidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{orders.length}</div>
                  <p className="text-xs text-green-100 mt-1">Pedidos realizados</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Pedidos Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length > 0 ? (
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">{order.customer.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-orange-600">
                              R$ {order.total.toFixed(2)}
                            </p>
                            <Badge className={getStatusBadgeColor(order.status)} variant="secondary">
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum pedido ainda</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Products by Factory */}
              <Card>
                <CardHeader>
                  <CardTitle>Fábricas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {factories.map((factory) => {
                      const factoryProducts = products.filter(p => p.factoryId === factory.id)
                      return (
                        <div key={factory.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Store className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{factory.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {factory.city} - {factory.state}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{factoryProducts.length}</p>
                            <p className="text-xs text-muted-foreground">Produtos</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2025 Brinquedos CRM - Sistema para Representantes</p>
            <p>Desenvolvido com Next.js 16, Prisma e shadcn/ui</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
