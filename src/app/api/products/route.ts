import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar produtos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const factoryId = searchParams.get('factoryId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: any = {
      isActive: true,
    }

    if (factoryId) {
      where.factoryId = factoryId
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const products = await db.product.findMany({
      where,
      include: {
        factory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    )
  }
}

// POST - Criar produto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const product = await db.product.create({
      data: {
        factoryId: body.factoryId,
        name: body.name,
        description: body.description,
        sku: body.sku,
        category: body.category,
        ageRange: body.ageRange,
        price: parseFloat(body.price),
        stock: parseInt(body.stock) || 0,
        imageUrl: body.imageUrl,
        isActive: body.isActive ?? true,
      },
      include: {
        factory: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    )
  }
}
