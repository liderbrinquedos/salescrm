# Snippet: Next.js API Route Handler Pattern

> Uso: Criar endpoints RESTful para Prisma no Next.js App Router
> Local: `src/app/api/<resource>/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma' // ou '@/lib/db'

// --- GET list with optional filters ---
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const factoryId = searchParams.get('factoryId')
    const status = searchParams.get('status')

    const where: any = {}
    if (customerId) where.customerId = customerId
    if (factoryId) where.factoryId = factoryId
    if (status) where.status = status

    const data = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, city: true } },
        factory: { select: { id: true, name: true } },
        carrier: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/orders error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// --- POST create ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generate order number
    const timestamp = Date.now().toString().slice(-8)
    const orderNumber = `PED-${timestamp}`

    // Calculate totals from items
    const items = body.items
    const subtotal = items.reduce((sum: number, i: any) => sum + (i.quantity * i.unitPrice), 0)
    const discount = body.discount || 0
    const freightCost = body.freightCost || 0
    const total = subtotal - discount + freightCost

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: body.customerId,
        factoryId: body.factoryId,
        status: body.status || 'PENDING',
        paymentCondition: body.paymentCondition || 'CASH',
        carrierId: body.carrierId || null,
        freightType: body.freightType || 'CIF',
        freightCost,
        subtotal,
        discount,
        total,
        notes: body.notes || null,
        items: {
          create: items.map((i: any) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.quantity * i.unitPrice,
          })),
        },
      },
      include: {
        customer: true,
        factory: true,
        items: { include: { product: true } },
        carrier: true,
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('POST /api/orders error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

// --- PATCH single resource ---
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Only allow updatable fields
    const { subtotal, total, items, ...updatable } = body
    const data = updatable

    const order = await prisma.order.update({
      where: { id: params.id },
      data,
      include: {
        customer: true,
        factory: true,
        carrier: true,
        items: { include: { product: true } },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error(`PATCH /api/orders/${params.id} error:`, error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

// --- DELETE single resource ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.order.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`DELETE /api/orders/${params.id} error:`, error)
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    )
  }
}
```

## When to Use

- All CRUD endpoints for Prisma models
- Standardized error handling and response format
- Include/exclude fields strategically (avoid N+1)
- Transaction when needed (e.g., create order + items)

## Variantes

### Get Single with Full Includes
```ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      customer: true, // full customer
      factory: true,  // full factory
      carrier: true,  // full carrier
      items: {
        include: {
          product: true // full product
        }
      }
    }
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(order)
}
```

### Authorization Middleware
```ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... rest
}
```
