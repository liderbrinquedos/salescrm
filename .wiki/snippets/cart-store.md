# Snippet: Zustand Cart Store Pattern

> Uso: Gerenciamento de carrinho de compras com persistência localStorage
> Local: `src/store/cart-store.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  productId: string
  productName: string
  productSku: string
  factoryId: string
  factoryName: string
  category: string
  quantity: number
  unitPrice: number
  totalPrice: number
  imageUrl?: string
}

interface CartState {
  items: CartItem[]
  selectedFactoryId: string | null
  totalItems: number
  totalValue: number
  // Actions
  setSelectedFactory: (factoryId: string | null) => void
  addItem: (item: Omit<CartItem, 'id' | 'totalPrice'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  clearCartForFactory: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedFactoryId: null,
      totalItems: 0,
      totalValue: 0,

      setSelectedFactory: (factoryId) => set({ selectedFactoryId: factoryId }),

      addItem: (item) => {
        const { items, selectedFactoryId } = get()

        // Single factory per cart validation
        if (selectedFactoryId && item.factoryId !== selectedFactoryId) {
          if (!confirm('Carrinho contém produtos de outra fábrica. Deseja limpar e adicionar este?')) {
            return
          }
        }

        const newItem: CartItem = {
          ...item,
          id: `${item.productId}-${Date.now()}`,
          totalPrice: item.unitPrice * item.quantity,
        }

        set({
          items: [...items, newItem],
          selectedFactoryId: item.factoryId,
        })
      },

      removeItem: (productId) => {
        const { items } = get()
        const filtered = items.filter(i => i.productId !== productId)
        set({
          items: filtered,
          selectedFactoryId: filtered.length > 0 ? filtered[0].factoryId : null,
        })
      },

      updateQuantity: (productId, quantity) => {
        const { items } = get()
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: items.map(i =>
            i.productId === productId
              ? { ...i, quantity, totalPrice: i.unitPrice * quantity }
              : i
          ),
        })
      },

      clearCart: () => set({ items: [], selectedFactoryId: null }),

      clearCartForFactory: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items, selectedFactoryId: state.selectedFactoryId }),
    }
  )
)

// Recalculates totals on every render (memoize if performance becomes issue)
// In components, derive totals with useMemo or use calculated getters
```

## When to Use

- Gerenciar estado do carrinho de compras em qualquer componente
- Acessar itens do carrinho para exibir contador ou total
- Modificar quantidade, adicionar ou remover produtos
- Reset carrinho após pedido criado

## Notes

- A validação de fábrica única é feita no `addItem`
- Persistência automática no localStorage via `zustand/middleware/persist`
- `totalItems` e `totalValue` devem ser calculados nos consumers usando `useMemo`:
  ```tsx
  const totalItems = useCartStore(state => state.items.reduce((sum, i) => sum + i.quantity, 0))
  const totalValue = useCartStore(state => state.items.reduce((sum, i) => sum + i.totalPrice, 0))
  ```
  Isso evita armazenar valores derivados no estado (simples derive-se).
