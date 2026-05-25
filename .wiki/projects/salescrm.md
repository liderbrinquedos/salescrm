# SalesCRM — Sistema de Gestão de Vendas para Representantes

## Visão Geral

Sistema web para gestão de vendas de brinquedos direcionado a representantes comerciais. Permite catálogo de produtos, gestão de clientes, criação de pedidos e aplicação de regras de negócio avançadas (descontos, frete grátis, promoções).

**Público-alvo:** Representantes comerciais de brinquedos (usuários únicos ou pequenas equipes)

**Problema resolvido:** Substituir processo manual de vendas (planilhas, whatsapp) por sistema integrado com catálogo online, carrinho de compras, regras de desconto automáticas e gestão de pedidos.

## Stack

| Componente | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| UI Components | shadcn/ui (Radix primitives) + Tailwind CSS 4 |
| Estado Cliente | Zustand 5 (cart-store) + TanStack React Query 5 |
| Formulários | React Hook Form 7 + Zod 4 |
| Backend | Next.js API Routes + Prisma 6 |
| Banco | SQLite (db/custom.db) |
| Auth | NextAuth.js 4 (planejado) |
| Motor de Regras | Custom Business Rules Engine (src/lib/business-rules) |
| i18n | next-intl 4 (pt-BR) |
| Build | Standalone Docker (node:alpine) |
| Runtime | Bun (desenvolvimento e produção) |

## Arquitetura

### Estrutura de Pastas

```
src/
├── app/
│   ├── api/                    # Rotas API (Next.js)
│   │   ├── orders/
│   │   ├── products/
│   │   ├── customers/
│   │   ├── factories/
│   │   ├── carriers/
│   │   ├── seed/              # Seed dados mock
│   │   └── ... (outros endpoints)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # SPA principal (catalog + customers + orders + dashboard)
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── business-rules/        # Advanced settings + rule form + preview
│   └── ... (outros)
├── lib/
│   ├── business-rules/        # Engine + hooks + types + helpers
│   └── utils.ts
├── store/
│   └── cart-store.ts          # Zustand cart state (localStorage)
└── prisma/
    └── schema.prisma          # Schema completo

public/                         # Assets estáticos
db/                             # SQLite file (custom.db)
```

### Padrão de Roteamento

Single-page application dentro de `/`:
- Tabs internas: Catálogo, Clientes, Pedidos, Dashboard
- Sheet checkout (carrinho → pedido)
- Dialog para configurações avançadas (regras de negócio)

### Decisões Arquiteturais

- [[decisions/001-docker-containerization]] — Docker standalone
- Mais ADRs em `.wiki/decisions/`

## Modelo de Dados (Prisma)

```prisma
model Customer {
  id            String   @id @default(cuid())
  name          String
  email         String?
  phone         String
  cnpj          String   @unique
  address       String?
  city          String?
  state         String?
  tradeName     String?
  contactName   String?
  notes         String?
  isActive      Boolean  @default(true)
  orders        Order[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Factory {
  id            String   @id @default(cuid())
  name          String
  cnpj          String   @unique
  email         String
  phone         String?
  address       String?
  city          String?
  state         String?
  isActive      Boolean  @default(true)
  products      Product[]
  orders        Order[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Product {
  id          String   @id @default(cuid())
  factoryId   String
  name        String
  description String?
  sku         String   @unique
  category    String
  ageRange    String?
  price       Float
  stock       Int
  imageUrl    String?
  isActive    Boolean  @default(true)
  factory     Factory  @relation(fields: [factoryId], references: [id])
  orderItems  OrderItem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Order {
  id               String   @id @default(cuid())
  orderNumber      String   @unique
  customerId       String
  factoryId        String
  status           OrderStatus @default(PENDING)
  paymentCondition PaymentCondition @default(CASH)
  carrierId        String?
  freightType      FreightType @default(CIF)
  freightCost      Float @default(0)
  subtotal         Float
  discount         Float @default(0)
  total            Float
  deliveryDate     DateTime?
  deliveryAddress  String?
  trackingCode     String?
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  customer  Customer  @relation(fields: [customerId], references: [id])
  factory   Factory   @relation(fields: [factoryId], references: [id])
  carrier   Carrier?  @relation(fields: [carrierId], references: [id])
  items     OrderItem[]
}

model OrderItem {
  id         String   @id @default(cuid())
  orderId    String
  productId  String
  quantity   Int
  unitPrice  Float
  totalPrice Float
  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product    Product  @relation(fields: [productId], references: [id])
}

model Carrier {
  id        String   @id @default(cuid())
  name      String
  cnpj      String   @unique
  phone     String?
  email     String?
  trackingUrl String?
  isActive  Boolean  @default(true)
  orders    Order[]
}
```

**Enums:**
```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentCondition {
  CASH
  THIRTY_DAYS
  FORTY_FIVE_DAYS
  SIXTY_DAYS
  NINETY_DAYS
  THIRTY_SIXTY
  THIRTY_SIXTY_NINETY
  THIRTY_SIXTY_NINETY_HUNDRED_TWENTY
}

enum FreightType {
  CIF
  FOB
  FREE
}
```

## API Endpoints

### Produtos
- `GET /api/products` — Lista com filtros (factoryId, category, search)
- `GET /api/products/[id]` — Produto individual

### Clientes
- `GET /api/customers` — Lista todos
- `GET /api/customers/[id]` — Cliente individual
- `POST /api/customers` — Criar
- `PATCH /api/customers/[id]` — Atualizar
- `DELETE /api/customers/[id]` — Deletar

### Fábricas
- `GET /api/factories` — Lista todas

### Transportadoras
- `GET /api/carriers` — Lista todas

### Pedidos
- `GET /api/orders` — Lista com filtros (customerId, factoryId, status)
- `GET /api/orders/[id]` — Pedido completo (com items, customer, factory, carrier)
- `POST /api/orders` — Criar pedido (gera orderNumber automaticamente)
- `PATCH /api/orders/[id]` — Atualizar status, pagamento, frete, tracking, notas
- `DELETE /api/orders/[id]` — Deletar (cascade nos items)

### Seed
- `POST /api/seed` — Cria dados mock (factories, products, customers, carriers)

## Motor de Regras de Negócio

Local: `src/lib/business-rules/`

- **Types:** `BusinessRule`, `RuleType`, `RulePriority`, `DiscountType`
- **Engine:** `BusinessRulesEngine` class — avalia regras contra contexto do carrinho
- **Hook:** `useBusinessRules()` — persiste regras no localStorage, CRUD operations
- **Rule Types (13):** PROMOTIONAL, QUANTITY_THRESHOLD, VALUE_THRESHOLD, COMMISSION_DISCOUNT, CATEGORY_PROMO, CUSTOMER_VIP, FACTORY_PROMO, PROGRESSIVE, FREE_SHIPPING, CASH_DISCOUNT, SEASONAL, COMBO_PRODUCTS, MAX_DISCOUNT

**Aplicação:**
- Avaliado no checkout antes de criar order
- Aplica `discount` e `freightCost = 0` se free shipping
- Resultados exibidos no order summary (rótulo "Regras de Negócio Aplicadas")
- Não persiste quais regras foram aplicadas (só o resultado final)

## Tema Visual

### Clean Tech / Precision Minimalism
- **Font Display:** Space Grotesk (para títulos e destaque)
- **Font Body:** Geist (padrão Next.js)
- **Paleta Light:**
  - bg: `from-orange-50 via-white to-purple-50` (gradient principal)
  - accent: `from-orange-500 to-purple-600`
  - text: `foreground`
- **Paleta Dark:** (em planejamento)
- **Components:** shadcn/ui com customizações (buttons com gradiente, cards com hover effects)

### Responsividade
- Mobile-first Tailwind breakpoints
- Header sticky + Sheet checkout full-width mobile
- Tabelas horizontal scroll em mobile (overflow-x-auto)
- Grid responsivo no catálogo (1/2/3/4 cols)

## Internacionalização

- Idioma: Português (pt-BR)
- next-intl configurado em `src/i18n/` (planejado)
- Atualmente labels hardcoded em pt-BR

## Testes

### Atual
- Nenhum teste automatizado

### Planejado
- Unitários: regra de negócio, cart store, utils
- Integração: API routes (GET/POST/PATCH orders)
- E2E: checkout flow com Playwright

## Deploy

### Build
```bash
npm run build
# Gera: .next/standalone/
# Copia static assets + public
```

### Docker (producao)
```dockerfile
FROM node:alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN bun install --frozen-lockfile
COPY . .
RUN npm run build

FROM node:alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/db ./db
EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  salescrm:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./db:/app/db
    environment:
      - NODE_ENV=production
```

## Próximos Passos (Roadmap)

1. **Auth** — NextAuth.js para login de representantes
2. ~~**Order Details** — Dialog com todos os dados do pedido (rastreamento, timeline)~~ **Implementado** — Ver [[decisions/003-order-details-dialog]]
3. **Imagens Produto** — Upload/gestão de imagens
4. **PDF/Email** — Geração de proposta PDF e envio por email
5. **Dashboard Avançado** — Gráficos de vendas por fábrica/período
6. **Mobile App** — React Native companion
7. **Multi-tenancy** — Suporte a múltiplas empresas
8. **Integração Sankhya** — Sincronização de catálogo e pedidos

##Links Relacionados

- [[patterns/component-structure]]
- [[patterns/business-rules-engine]]
- [[patterns/checkout-flow]]
- [[decisions/001-docker-containerization]]
- [[decisions/002-checkout-discount-breakdown]]
- [[decisions/003-order-details-dialog]]
- [[integrations/sankhya]]
