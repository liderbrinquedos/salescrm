import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar fábricas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const onlyActive = searchParams.get('onlyActive')

    const where: any = {}

    if (onlyActive === 'true') {
      where.isActive = true
    }

    const factories = await db.factory.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(factories)
  } catch (error) {
    console.error('Erro ao buscar fábricas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar fábricas' },
      { status: 500 }
    )
  }
}

// POST - Criar fábrica
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const factory = await db.factory.create({
      data: {
        name: body.name,
        cnpj: body.cnpj,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        isActive: body.isActive ?? true,
      },
    })

    return NextResponse.json(factory, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar fábrica:', error)
    return NextResponse.json(
      { error: 'Erro ao criar fábrica' },
      { status: 500 }
    )
  }
}
