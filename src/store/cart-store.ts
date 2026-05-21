import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
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
  setSelectedFactory: (factoryId: string) => void
  addItem: (item: Omit<CartItem, 'totalPrice'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  clearCartForFactory: (factoryId: string) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedFactoryId: null,
      totalItems: 0,
      totalValue: 0,

      setSelectedFactory: (factoryId: string) => {
        set({ selectedFactoryId: factoryId })
      },

      addItem: (item) => {
        const { items, selectedFactoryId } = get()

        // Se item for de outra fábrica, limpa o carrinho
        if (selectedFactoryId && item.factoryId !== selectedFactoryId) {
          const confirmed = window.confirm(
            'Este produto é de outra fábrica. Deseja limpar o carrinho atual e adicionar este produto?'
          )
          if (confirmed) {
            set({ items: [], selectedFactoryId: item.factoryId })
          } else {
            return
          }
        }

        const existingItemIndex = items.findIndex(
          (i) => i.productId === item.productId
        )

        let newItems: CartItem[]

        if (existingItemIndex >= 0) {
          // Atualiza quantidade do item existente
          newItems = items.map((i, index) => {
            if (index === existingItemIndex) {
              const newQuantity = i.quantity + item.quantity
              return {
                ...i,
                quantity: newQuantity,
                totalPrice: newQuantity * i.unitPrice,
              }
            }
            return i
          })
        } else {
          // Adiciona novo item
          const newItem: CartItem = {
            ...item,
            totalPrice: item.quantity * item.unitPrice,
          }
          newItems = [...items, newItem]
        }

        // Calcula totais
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalValue = newItems.reduce((sum, item) => sum + item.totalPrice, 0)

        set({
          items: newItems,
          selectedFactoryId: item.factoryId,
          totalItems,
          totalValue,
        })
      },

      removeItem: (productId: string) => {
        const { items, selectedFactoryId } = get()
        const newItems = items.filter((item) => item.productId !== productId)

        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalValue = newItems.reduce((sum, item) => sum + item.totalPrice, 0)

        set({
          items: newItems,
          selectedFactoryId: newItems.length === 0 ? null : selectedFactoryId,
          totalItems,
          totalValue,
        })
      },

      updateQuantity: (productId: string, quantity: number) => {
        const { items } = get()

        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        const newItems = items.map((item) => {
          if (item.productId === productId) {
            return {
              ...item,
              quantity,
              totalPrice: quantity * item.unitPrice,
            }
          }
          return item
        })

        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalValue = newItems.reduce((sum, item) => sum + item.totalPrice, 0)

        set({
          items: newItems,
          totalItems,
          totalValue,
        })
      },

      clearCart: () => {
        set({
          items: [],
          selectedFactoryId: null,
          totalItems: 0,
          totalValue: 0,
        })
      },

      clearCartForFactory: (factoryId: string) => {
        const { items } = get()
        const newItems = items.filter((item) => item.factoryId !== factoryId)

        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalValue = newItems.reduce((sum, item) => sum + item.totalPrice, 0)

        set({
          items: newItems,
          selectedFactoryId: newItems.length === 0 ? null : get().selectedFactoryId,
          totalItems,
          totalValue,
        })
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
