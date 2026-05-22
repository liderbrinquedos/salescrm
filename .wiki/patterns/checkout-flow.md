# Pattern: Checkout Flow (Sheet com etapas)

> **Categoria:** ui-pattern, state-management
> **Complexidade:** media
> **Última revisão:** 2026-05-21

## Quando Usar

Quando o checkout precisa de múltiplos passos (revisar carrinho → preencher dados do pedido) e deve evitar conflitos entre overlays (ex: Sheet + Dialog do Radix UI abertos simultaneamente).

## Problema Resolvido

O Radix UI (base do shadcn/ui) gerencia overlays com `aria-hidden` e focus trapping. Ter **Sheet** e **Dialog** abertos ao mesmo tempo causa:
- Dialog abre e fecha sozinho (conflito de portais)
- Focus trap de um overlay interfere no outro
- Comportamento inconsistente entre navegadores

## Solução

Unificar o fluxo em **um único Sheet** com etapas controladas por estado:

```typescript
const [checkoutStep, setCheckoutStep] = useState<'cart' | 'order'>('cart')
```

### Estrutura

```tsx
<Sheet open={cartOpen} onOpenChange={(open) => {
  setCartOpen(open)
  if (!open) setCheckoutStep('cart') // reseta ao fechar
}}>
  {/* Etapa 1: Carrinho */}
  {checkoutStep === 'cart' && (
    <div>
      {/* Itens do carrinho, botão "Finalizar Pedido" */}
      <Button onClick={() => setCheckoutStep('order')}>
        Finalizar Pedido
      </Button>
    </div>
  )}

  {/* Etapa 2: Formulário do Pedido */}
  {checkoutStep === 'order' && (
    <div>
      {/* Cliente, frete, pagamento, desconto, resumo */}
      <Button onClick={() => setCheckoutStep('cart')}>Voltar</Button>
      <Button onClick={handleCreateOrder}>Criar Pedido</Button>
    </div>
  )}
</Sheet>
```

### Fluxo Completo

```
[Sheet Aberto: cart]
  ↓ Clica "Finalizar Pedido"
[Sheet: order] — formulário de pedido
  ↓ Clica "Criar Pedido"
[API: POST /api/orders] → sucesso
  ↓ clearCart(), setCheckoutStep('cart'), setCartOpen(false), setActiveTab('orders')
[Sheet Fechado, aba Pedidos ativa]
```

### Pontos de Entrada

| Origem | Ação |
|--------|------|
| Carrinho (Sheet) | `setCheckoutStep('order')` |
| Aba Pedidos → "Novo Pedido" | `setCheckoutStep('order'); setCartOpen(true)` |

## Regras

1. `checkoutStep` sempre reseta para `'cart'` quando Sheet fecha (`onOpenChange`).
2. Após criar pedido: `clearCart()`, `setCheckoutStep('cart')`, `setCartOpen(false)`.
3. Botão "Voltar" no formulário apenas muda etapa, não fecha Sheet.

## Anti-Patterns

- Usar `Dialog` e `Sheet` simultaneamente — causa conflito de portais.
- Fechar Sheet e abrir Dialog no mesmo handler — mesmo problema.
- Não resetar `checkoutStep` ao fechar Sheet — próximo open pode mostrar etapa errada.

## Exemplo no Projeto

- `src/app/page.tsx:474-790` — Sheet com etapas `cart`/`order`

## Links Relacionados

- [[business-rules-engine]] — Motor de regras integrado ao checkout
- [[../../.wiki/patterns/frontend-standards]]
