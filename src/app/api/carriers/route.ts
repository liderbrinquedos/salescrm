import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar transportadoras
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const onlyActive = searchParams.get('onlyActive')

    const where: any = {}

    if (onlyActive === 'true') {
      where.isActive = true
    }

    const carriers = await db.carrier.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(carriers)
  } catch (error) {
    console.error('Erro ao buscar transportadoras:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar transportadoras' },
      { status: 500 }
    )
  }
}

// POST - Criar transportadora
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const carrier = await db.carrier.create({
      data: {
        name: body.name,
        cnpj: body.cnpj,
        phone: body.phone,
        email: body.email,
        trackingUrl: body.trackingUrl,
        notes: body.notes,
        isActive: body.isActive ?? true,
      },
    })

    return NextResponse.json(carrier, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar transportadora:', error)
    return NextResponse.json(
      { error: 'Erro ao criar transportadora' },
      { status: 500 }
    )
  }
}
