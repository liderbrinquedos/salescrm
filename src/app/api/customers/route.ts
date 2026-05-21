import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar clientes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const city = searchParams.get('city')

    const where: any = {
      isActive: true,
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { cnpj: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { tradeName: { contains: search } },
      ]
    }

    if (city) {
      where.city = city
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
      { status: 500 }
    )
  }
}

// POST - Criar cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const customer = await db.customer.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        cnpj: body.cnpj,
        address: body.address,
        city: body.city,
        state: body.state,
        tradeName: body.tradeName,
        contactName: body.contactName,
        notes: body.notes,
        isActive: body.isActive ?? true,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    )
  }
}
