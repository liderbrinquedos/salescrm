import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Criar fábricas (tenants)
    const factories = await Promise.all([
      db.factory.create({
        data: {
          name: 'Brinquedos Alegria Ltda',
          cnpj: '12.345.678/0001-90',
          email: 'contato@brinquedosalegria.com.br',
          phone: '(11) 3456-7890',
          address: 'Rua das Brincadeiras, 123',
          city: 'São Paulo',
          state: 'SP',
          isActive: true,
        },
      }),
      db.factory.create({
        data: {
          name: 'Toys World Indústria',
          cnpj: '98.765.432/0001-10',
          email: 'vendas@toysworld.com.br',
          phone: '(21) 2345-6789',
          address: 'Av. dos Brinquedos, 456',
          city: 'Rio de Janeiro',
          state: 'RJ',
          isActive: true,
        },
      }),
      db.factory.create({
        data: {
          name: 'KidZone Brinquedos',
          cnpj: '45.678.912/0001-34',
          email: 'comercial@kidzone.com.br',
          phone: '(41) 3123-4567',
          address: 'Rua da Criançada, 789',
          city: 'Curitiba',
          state: 'PR',
          isActive: true,
        },
      }),
    ])

    // Criar produtos para cada fábrica
    const products = await Promise.all([
      // Produtos da Brinquedos Alegria
      db.product.create({
        data: {
          factoryId: factories[0].id,
          name: 'Boneca Bebê Feliz',
          description: 'Boneca de pano macia e colorida, ideal para bebês',
          sku: 'BA-BB-001',
          category: 'Bonecos',
          ageRange: '0-3 anos',
          price: 89.90,
          stock: 150,
          imageUrl: '',
          isActive: true,
        },
      }),
      db.product.create({
        data: {
          factoryId: factories[0].id,
          name: 'Conjunto Blocos de Montar',
          description: '50 peças coloridas para estimular a criatividade',
          sku: 'BA-BM-002',
          category: 'Jogos',
          ageRange: '3-6 anos',
          price: 129.90,
          stock: 80,
          imageUrl: '',
          isActive: true,
        },
      }),
      db.product.create({
        data: {
          factoryId: factories[0].id,
          name: 'Pelúcia Urso Pardal',
          description: 'Urso de pelúcia super macio com 30cm',
          sku: 'BA-PU-003',
          category: 'Pelúcias',
          ageRange: 'Todas idades',
          price: 149.90,
          stock: 60,
          imageUrl: '',
          isActive: true,
        },
      }),
      db.product.create({
        data: {
          factoryId: factories[0].id,
          name: 'Triciclo Vermelho',
          description: 'Triciclo em metal com cesto porta-objetos',
          sku: 'BA-TR-004',
          category: 'Veículos',
          ageRange: '3-5 anos',
          price: 299.90,
          stock: 40,
          imageUrl: '',
          isActive: true,
        },
      }),
      // Produtos da Toys World
      db.product.create({
        data: {
          factoryId: factories[1].id,
          name: 'Carrinho de Controle Remoto',
          description: 'Carro esportivo com controle remoto, escala 1:10',
          sku: 'TW-CC-001',
          category: 'Veículos',
          ageRange: '8+ anos',
          price: 349.90,
          stock: 50,
          imageUrl: '',
          isActive: true,
        },
      }),
      db.product.create({
        data: {
          factoryId: factories[1].id,
          name: 'Quebra-Cabeça 500 Peças',
          description: 'Paisagem mágica com 500 peças',
          sku: 'TW-QP-002',
          category: 'Quebra-cabeça',
          ageRange: '6+ anos',
          price: 79.90,
          stock: 100,
          imageUrl: '',
          isActive: true,
        },
      }),
      db.product.create({
        data: {
          factoryId: factories[1].id,
          name: 'Kit de Ciência - Química',
          description: 'Experimentos químicos seguros e educativos',
          sku: 'TW-KC-003',
          category: 'Educacional',
          ageRange: '10+ anos',
          price: 199.90,
          stock: 30,
          imageUrl: '',
          isActive: true,
        },
      }),
      db.product.create({
        data: {
          factoryId: factories[1].id,
          name: 'Action Figure Super Herói',
          description: 'Figura de ação com 30cm e acessórios',
          sku: 'TW-AF-004',
          category: 'Bonecos',
          ageRange: '4+ anos',
          price: 119.90,
          stock: 90,
          imageUrl: '',
          isActive: true,
        },
      }),
      // Produtos da KidZone
      db.product.create({
        data: {
          factoryId: factories[2].id,
          name: 'Casa de Boneca Luxury',
          description: 'Casa de 3 andares com móveis e acessórios',
          sku: 'KZ-CB-001',
          category: 'Bonecos',
          ageRange: '3+ anos',
          price: 599.90,
          stock: 25,
          imageUrl: '',
          isActive: true,
        },
      }),
      db.product.create({
        data: {
          factoryId: factories[2].id,
          name: 'Tabuleiro Xadrez Clássico',
          description: 'Xadrez em madeira com peças esculpidas',
          sku: 'KZ-XD-002',
          category: 'Jogos',
          ageRange: '6+ anos',
          price: 149.90,
          stock: 70,
          imageUrl: '',
          isActive: true,
        },
      }),
      db.product.create({
        data: {
          factoryId: factories[2].id,
          name: 'Kit Lego-City - Construção',
          description: '500 peças para construir cidade completa',
          sku: 'KZ-LC-003',
          category: 'Jogos',
          ageRange: '6+ anos',
          price: 249.90,
          stock: 45,
          imageUrl: '',
          isActive: true,
        },
      }),
      db.product.create({
        data: {
          factoryId: factories[2].id,
          name: 'Bicicleta Infantil 12"',
          description: 'Bicicleta com rodinhas de apoio',
          sku: 'KZ-BI-004',
          category: 'Veículos',
          ageRange: '3-5 anos',
          price: 449.90,
          stock: 35,
          imageUrl: '',
          isActive: true,
        },
      }),
    ])

    // Criar clientes
    const customers = await Promise.all([
      db.customer.create({
        data: {
          name: 'Loja de Brinquedos Infância Feliz',
          email: 'contato@infanciafeliz.com.br',
          phone: '(11) 2345-6789',
          cnpj: '11.222.333/0001-44',
          address: 'Rua do Comércio, 100',
          city: 'São Paulo',
          state: 'SP',
          tradeName: 'Infância Feliz',
          contactName: 'João Silva',
          notes: 'Cliente preferencial, paga em dia',
          isActive: true,
        },
      }),
      db.customer.create({
        data: {
          name: 'Distribuidora Brinquedos Brasil',
          email: 'vendas@brinquedosbrasil.com.br',
          phone: '(21) 3456-7890',
          cnpj: '22.333.444/0001-55',
          address: 'Av. Brasil, 2000',
          city: 'Rio de Janeiro',
          state: 'RJ',
          tradeName: 'Brinquedos Brasil',
          contactName: 'Maria Santos',
          notes: 'Distribuidora com lojas em 3 estados',
          isActive: true,
        },
      }),
      db.customer.create({
        data: {
          name: 'Mundo da Criança',
          email: 'compra@mundodacrianca.com.br',
          phone: '(31) 4567-8901',
          cnpj: '33.444.555/0001-66',
          address: 'Rua Central, 300',
          city: 'Belo Horizonte',
          state: 'MG',
          tradeName: 'Mundo da Criança',
          contactName: 'Pedro Oliveira',
          notes: 'Novo cliente, solicitar referências',
          isActive: true,
        },
      }),
      db.customer.create({
        data: {
          name: 'Brinquedos do Sul',
          email: 'contato@brinquedodosul.com.br',
          phone: '(51) 5678-9012',
          cnpj: '44.555.666/0001-77',
          address: 'Av. Porto Alegre, 400',
          city: 'Porto Alegre',
          state: 'RS',
          tradeName: 'Brinquedos do Sul',
          contactName: 'Ana Costa',
          notes: '',
          isActive: true,
        },
      }),
    ])

    // Criar transportadoras
    const carriers = await Promise.all([
      db.carrier.create({
        data: {
          name: 'Correios',
          cnpj: '34.028.316/0001-03',
          phone: '(11) 3003-0100',
          email: 'contato@correios.com.br',
          trackingUrl: 'https://www.correios.com.br/rastreamento/',
          notes: 'Transportadora oficial',
          isActive: true,
        },
      }),
      db.carrier.create({
        data: {
          name: 'Jadlog',
          cnpj: '04.164.253/0001-10',
          phone: '(11) 3346-2000',
          email: 'jadlog@jadlog.com.br',
          trackingUrl: 'https://www.jadlog.com.br/tracking',
          notes: 'Transporte rápido',
          isActive: true,
        },
      }),
      db.carrier.create({
        data: {
          name: 'Sedex',
          cnpj: '00.000.000/0001-91',
          phone: '(11) 3003-0100',
          email: 'sedex@correios.com.br',
          trackingUrl: 'https://www.correios.com.br/rastreamento/',
          notes: 'Entrega expressa',
          isActive: true,
        },
      }),
      db.carrier.create({
        data: {
          name: 'Transportadora Brinquedos Express',
          cnpj: '55.666.777/0001-88',
          phone: '(41) 3456-7890',
          email: 'vendas@brinquedosexpress.com.br',
          trackingUrl: null,
          notes: 'Especializada em brinquedos',
          isActive: true,
        },
      }),
    ])

    return NextResponse.json({
      message: 'Dados mock criados com sucesso!',
      factories: factories.length,
      products: products.length,
      customers: customers.length,
      carriers: carriers.length,
    })
  } catch (error) {
    console.error('Erro ao criar dados mock:', error)
    return NextResponse.json(
      { error: 'Erro ao criar dados mock' },
      { status: 500 }
    )
  }
}
