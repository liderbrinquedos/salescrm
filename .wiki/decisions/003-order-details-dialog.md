# ADR-003: Order Details Dialog — Visualizacao e Edicao de Pedidos

> **Data:** 2026-05-25
> **Status:** accepted
> **Autor:** OpenCode + Lider

## Contexto

O botao "Detalhes" na tabela de pedidos era nao funcional — nao existia nenhuma view de detalhes do pedido. O unico ponto de interacao com pedidos existentes era o inline Select de status na tabela. Campos como rastreamento, endereco de entrega, notas, condicao de pagamento e frete nao eram editaveis na UI, apesar do `PATCH /api/orders/[id]` ja suportar todos esses campos. O roadmap listava "Order Details — Dialog com todos os dados do pedido (rastreamento, timeline)" como item #2.

## Decisao

Criar **Dialog modal** com 2 tabs internos para visualizar e editar detalhes completos de um pedido:

### Estrutura do Dialog

- **Overlay:** Dialog modal (`max-w-4xl`) — nao conflita com a Sheet do carrinho (Radix portal), segue padrao do AdvancedSettings
- **Tab "Pedido":** Stepper de status visual + Select de status editavel + dados cliente/fabrica (somente leitura) + pagamento/frete editaveis + tabela de itens com breakdown de desconto + notas editaveis
- **Tab "Rastreamento":** Codigo de rastreio editavel + link externo para transportadora + endereco e data de entrega editaveis
- **Footer:** Botoes Cancelar + Salvar (disabled via dirty check, loading state durante PATCH)

### Stepper de Status

Visual horizontal mostrando o fluxo `Pendente -> Confirmado -> Processamento -> Enviado -> Entregue`. Status atual destacado, passos concluidos em verde, futuros em muted. Status CANCELLED renderiza indicador especial vermelho. Sem historico real de mudancas (nao exige modelo novo no Prisma).

### Dirty Check

Comparacao via `useMemo` dos campos editaveis com os valores originais do pedido carregado. PATCH envia apenas campos modificados.

### Componente extraido

`src/features/orders/components/OrderDetailsDialog.tsx` — componente isolado, seguindo o padrao de feature modules definido em `[[patterns/component-structure]]`.

### Sem mudancas no backend

O `PATCH /api/orders/[id]` ja suporta todos os campos editaveis. Nenhuma alteracao no Prisma schema ou API routes.

## Alternativas Consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| Dialog modal com 2 tabs (escolhida) | Nao conflita com Sheet, segue padrao do AdvancedSettings, organiza informacao densa | Click extra para ver rastreamento |
| Dialog com scroll unico (secoes empilhadas) | Tudo visivel sem trocar tab | Dialog muito longo, cansativo em telas pequenas |
| Accordion colapsavel | Balance entre densidade e organizacao | Padrao accordion nao existe no projeto, mais complexo |
| Sheet lateral | Consistente com checkout | Conflita com Sheet do carrinho (Radix portal), quebra padrao do projeto |

## Consequencias

- **Positivas:**
  - Botao "Detalhes" funcional — representantes podem visualizar e editar pedidos completos
  - Edicao inline de status, pagamento, frete, tracking, notas e entrega sem nova tela
  - Stepper de status da visibilidade instantanea do andamento do pedido
  - Componente extraido de `page.tsx`, reduzindo monolito
  - Sem debt tecnico no backend — PATCH existente suficiente

- **Negativas:**
  - Stepper e visual apenas, sem historico real de mudancas de status (exigiria modelo `OrderStatusLog` no Prisma)
  - Itens do pedido sao somente leitura (edicao de itens nao suportada pelo PATCH atual)
  - Dialog carrega dados do pedido via GET individual a cada abertura (sem cache)

- **Codigo:**
  - Novo arquivo: `src/features/orders/components/OrderDetailsDialog.tsx` (~300 linhas)
  - `page.tsx`: adicionado estado `orderDetailId`/`orderDetailOpen`, import, onClick no botao, render do dialog

## Arquivos Modificados

| Arquivo | Mudanca |
|---|---|
| `src/features/orders/components/OrderDetailsDialog.tsx` | **Novo** — Dialog completo |
| `src/app/page.tsx` | Import, estado, onClick, render do dialog |

## Links Relacionados

- `~/.local/share/opencode/plans/2026-05-25-order-details-dialog.md` — Spec de design
- [[patterns/component-structure]] — Padrao de estrutura de componentes
- [[decisions/002-checkout-discount-breakdown]] — Breakdown de descontos (dados usados na tabela de itens)
- [[projects/salescrm]] — Roadmap do projeto
