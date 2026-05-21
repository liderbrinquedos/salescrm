import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar pedidos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const factoryId = searchParams.get('factoryId')
    const status = searchParams.get('status')

    const where: any = {}

    if (customerId) {
      where.customerId = customerId
    }

    if (factoryId) {
      where.factoryId = factoryId
    }

    if (status) {
      where.status = status
    }

    const orders = await db.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            cnpj: true,
            city: true,
          },
        },
        factory: {
          select: {
            id: true,
            name: true,
          },
        },
        carrier: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    )
  }
}

// POST - Criar pedido
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      factoryId,
      items,
      notes,
      deliveryDate,
      deliveryAddress,
      paymentCondition,
      carrierId,
      freightType,
      freightCost
    } = body

    // Gera número do pedido
    const orderNumber = `PED-${Date.now().toString().slice(-8)}`

    // Calcula totais
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (item.unitPrice * item.quantity)
    }, 0)

    const discount = body.discount || 0
    const freightCostValue = freightCost || 0
    const total = subtotal - discount + freightCostValue

    // Cria o pedido com os itens
    const order = await db.order.create({
      data: {
        orderNumber,
        customerId,
        factoryId,
        status: 'PENDING',
        paymentCondition: paymentCondition || 'CASH',
        carrierId: carrierId || null,
        freightType: freightType || 'CIF',
        freightCost: freightCostValue,
        subtotal,
        discount,
        total,
        notes,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deliveryAddress,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
          })),
        },
      },
      include: {
        customer: true,
        factory: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    )
  }
}
