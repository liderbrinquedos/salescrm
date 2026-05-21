import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Buscar cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const customer = await db.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cliente' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const customer = await db.customer.update({
      where: { id },
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
        isActive: body.isActive,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar cliente' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar cliente (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.customer.update({
      where: { id },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({ message: 'Cliente desativado com sucesso' })
  } catch (error) {
    console.error('Erro ao desativar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao desativar cliente' },
      { status: 500 }
    )
  }
}
