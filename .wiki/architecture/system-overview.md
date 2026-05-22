# System Overview — SalesCRM

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose (opcional)                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  Next.js 16 Standalone                 │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  App Router (src/app/)                          │  │ │
│  │  │  ├── page.tsx (SPA principal)                  │  │ │
│  │  │  ├── layout.tsx                                │  │ │
│  │  │  ├── globals.css                               │  │ │
│  │  │  └── api/ (API Routes)                         │  │ │
│  │  │      ├── orders/                               │  │ │
│  │  │      ├── products/                             │  │ │
│  │  │      ├── customers/                            │  │ │
│  │  │      └── ...                                   │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Componentes UI (src/components/)               │  │ │
│  │  │  ├── ui/ (shadcn/ui)                           │  │ │
│  │  │  ├── business-rules/                           │  │ │
│  │  │  └── ...                                       │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                            │
│                  Porta: 3000 (dev) / standalone prod      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Persistência                             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  SQLite (db/custom.db)               │ │
│  │                    Prisma ORM                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                    Arquivo local: db/custom.db             │
└─────────────────────────────────────────────────────────────┘
```

## Componentes

### Frontend (Next.js 16)
- **Framework:** Next.js 16 com App Router
- **Runtime:** Bun (desenvolvimento e produção)
- **Linguagem:** TypeScript 5
- **UI:** React 19 + Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Estado:** Zustand 5 + TanStack React Query 5
- **Formulários:** React Hook Form 7 + Zod 4
- **Animações:** Framer Motion 12
- **Tabelas:** TanStack React Table 8
- **Drag & Drop:** dnd-kit
- **i18n:** next-intl 4
- **Gráficos:** Recharts
- **Build:** `npm run build` → standalone output (.next/standalone/)
- **Deploy:** Docker (base image: node:alpine)

### Backend (API Routes Serverless)
- **Framework:** Next.js API Routes + Prisma
- **Banco:** SQLite via Prisma (arquivo local `db/custom.db`)
- **Auth:** NextAuth.js 4 (em desenvolvimento, não ativo yet)
- **Schema:** Prisma com relacionamentos completos

### Banco de Dados (SQLite/Prisma)

```
Customer ──┬── Order ──┬── OrderItem ──┬── Product
           │           │               │
           │           └── Factory     │
           │                           │
           └── (contato, endereço)     └── Factory
                                        │
Carrier ──────────────────────────────────┘
```

**Modelos Principais:**
- `Customer`: clientes (CNPJ, endereço, contato)
- `Factory`: fabricantes
- `Product`: catálogo (SKU, stock, preço, categoria)
- `Order`: pedidos (status, pagamento, frete, desconto)
- `OrderItem`: itens do pedido
- `Carrier`: transportadoras

**Enums:**
- `OrderStatus`: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
- `PaymentCondition`: CASH, THIRTY_DAYS, FORTY_FIVE_DAYS, SIXTY_DAYS, NINETY_DAYS, THIRTY_SIXTY, THIRTY_SIXTY_NINETY, THIRTY_SIXTY_NINETY_HUNDRED_TWENTY
- `FreightType`: CIF, FOB, FREE

## Fluxo de Dados

### 1. Catálogo de Produtos
```
GET /api/products
├── Filtros: factoryId, category, search term
└── Retorna: [{ id, name, sku, price, stock, category, factory.name, ... }]
```

### 2. Carrinho de Compras
```
Zustand Store (localStorage)
├── items: CartItem[]
├── addItem(product) → valida fábrica única
├── updateQuantity(productId, qty)
├── removeItem(productId)
├── clearCart()
└── totalValue, totalItems
```

### 3. Criação de Pedido
```
Sheet Checkout (2 steps)
│
├── Step 1: Carrinho
│   └── ScrollArea com itens + totais
│
└── Step 2: Finalizar
    ├── Select Cliente
    ├── Observações
    ├── Condição Pagamento
    ├── Tipo Frete + Transportadora + Valor Frete
    ├── Desconto manual (%) ou fixo (R$)
    ├── Resumo order summary (regras de negócio aplicadas)
    └── POST /api/orders
        ├── Calcula discount (business rules ou manual)
        ├── Calcula freight (free shipping se regra aplicar)
        └── Cria Order + OrderItems
```

### 4. Listagem e Gestão de Pedidos
```
GET /api/orders
├── Filtros opcionais: customerId, factoryId, status
└── Inclui: customer, factory, carrier, items.product

PATCH /api/orders/[id]
├── Body: { status?, paymentCondition?, carrierId?, freightType?, freightCost?, trackingCode?, notes?, deliveryDate?, deliveryAddress? }
└── Retorna order atualizado com relações completas

DELETE /api/orders/[id]
└── Cascade delete dos itens
```

### 5. Motor de Regras de Negócio
```
useBusinessRules() hook
├── Rules armazenadas em localStorage
├── processCart(context) → RulesEngineResult
│   ├── Calcula desconto baseado em regras
│   ├── Aplica free shipping se threshold atingido
│   ├── Calcula abatimento de comissão
│   └── Retorna discount, freeShipping, appliedRules[], commissionDiscount
└── addRule/updateRule/removeRule/toggleRule/duplicateRule/resetToDefaults
```

**Regras padrão:**
1. Desconto a Vista (5% CASH)
2. Frete Grátis acima de R$ 500
3. Desconto Progressivo (5%/10%/15% por franjas)
4. Promoção por Categoria
5. Teto Máximo de Desconto

## Persistência

- **Desenvolvimento:** SQLite em `db/custom.db`
- **Prisma Migrate:** `prisma db push` (dev), `prisma migrate dev` (migrations)
- **Seed:** `POST /api/seed` para dados mock

## Segurança

- **Auth:** NextAuth 4 em desenvolvimento (em configuração)
- **API Routes:** Sem autenticação ativa (protótipo interno)
- **Validação:** Zod schemas nos inputs dos forms
- **Sanitização:** Prisma parameterized queries (SQL injection safe)

## Deploy

### Desenvolvimento
```bash
npm run dev           # Next.js dev server :3000
npm run db:push       # Aplica schema ao SQLite
npm run db:seed       # POST /api/seed
```

### Produção (Docker)
```bash
docker build -t salescrm .
docker run -p 3000:3000 salescrm
# ou docker-compose
```

Build gera standalone em `.next/standalone/` com server.js + arquivos estáticos.

## Performance Considerations

- **React 19 + Server Components** por padrão
- **TanStack Query** para cache e deduplication de requests
- **Zustand persist** salva carrinho no localStorage
- **Imagens:** não há upload, `imageUrl` é string (integração futura com CDN)
- **Tables:** virtualizar se lista de pedidos grow (react-virtual)

## Monitoramento & Observabilidade

- **Logs:** console.error + toasts (sonner)
- **Erros:** try/catch nos handlers + toast.error
- **Telemetria:** nenhuma (futuro: analytics?)

## CI/CD (futuro)

- GitHub Actions:
  - `prisma generate` + `prisma db push` staging
  - `npm run build` + Docker build
  - Deploy Railway/Render/Vercel (serverless)
