import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Buscar transportadora por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const carrier = await db.carrier.findUnique({
      where: { id },
    })

    if (!carrier) {
      return NextResponse.json(
        { error: 'Transportadora não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(carrier)
  } catch (error) {
    console.error('Erro ao buscar transportadora:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar transportadora' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar transportadora
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const carrier = await db.carrier.update({
      where: { id },
      data: {
        name: body.name,
        cnpj: body.cnpj,
        phone: body.phone,
        email: body.email,
        trackingUrl: body.trackingUrl,
        notes: body.notes,
        isActive: body.isActive,
      },
    })

    return NextResponse.json(carrier)
  } catch (error) {
    console.error('Erro ao atualizar transportadora:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar transportadora' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar transportadora (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.carrier.update({
      where: { id },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({ message: 'Transportadora desativada com sucesso' })
  } catch (error) {
    console.error('Erro ao desativar transportadora:', error)
    return NextResponse.json(
      { error: 'Erro ao desativar transportadora' },
      { status: 500 }
    )
  }
}
