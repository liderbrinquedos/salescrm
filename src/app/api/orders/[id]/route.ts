import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Buscar pedido por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await db.order.findUnique({
      where: { id },
      include: {
        customer: true,
        factory: true,
        carrier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pedido' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar status do pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const order = await db.order.update({
      where: { id },
      data: {
        status: body.status,
        paymentCondition: body.paymentCondition,
        carrierId: body.carrierId,
        freightType: body.freightType,
        freightCost: body.freightCost,
        trackingCode: body.trackingCode,
        notes: body.notes,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
        deliveryAddress: body.deliveryAddress,
      },
      include: {
        customer: true,
        factory: true,
        carrier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar pedido
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.order.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Pedido excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir pedido' },
      { status: 500 }
    )
  }
}
