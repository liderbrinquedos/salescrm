import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Buscar produto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await db.product.findUnique({
      where: { id },
      include: {
        factory: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Erro ao buscar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const product = await db.product.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        sku: body.sku,
        category: body.category,
        ageRange: body.ageRange,
        price: parseFloat(body.price),
        stock: parseInt(body.stock),
        imageUrl: body.imageUrl,
        isActive: body.isActive,
      },
      include: {
        factory: true,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar produto (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.product.update({
      where: { id },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({ message: 'Produto desativado com sucesso' })
  } catch (error) {
    console.error('Erro ao desativar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao desativar produto' },
      { status: 500 }
    )
  }
}
