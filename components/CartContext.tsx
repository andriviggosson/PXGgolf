'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartItem {
  id: string
  name: string
  slug: string
  price_isk: number
  image_url: string | null
  category: string
  product_type: string
  quantity: number
  variant?: string
}

interface CartContextType {
  items: CartItem[]
  count: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  removeItem: (id: string, variant?: string) => void
  updateQty: (id: string, qty: number, variant?: string) => void
  clear: () => void
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

const KEY = 'pxg_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(items))
  }, [items, hydrated])

  const itemKey = (id: string, variant?: string) => `${id}__${variant ?? ''}`

  const addItem = (item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems(prev => {
      const k = itemKey(item.id, item.variant)
      const existing = prev.find(i => itemKey(i.id, i.variant) === k)
      if (existing) {
        return prev.map(i => itemKey(i.id, i.variant) === k ? { ...i, quantity: i.quantity + qty } : i)
      }
      return [...prev, { ...item, quantity: qty }]
    })
    setIsOpen(true)
  }

  const removeItem = (id: string, variant?: string) => {
    const k = itemKey(id, variant)
    setItems(prev => prev.filter(i => itemKey(i.id, i.variant) !== k))
  }

  const updateQty = (id: string, qty: number, variant?: string) => {
    const k = itemKey(id, variant)
    if (qty <= 0) { removeItem(id, variant); return }
    setItems(prev => prev.map(i => itemKey(i.id, i.variant) === k ? { ...i, quantity: qty } : i))
  }

  const clear = () => setItems([])

  const count = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.price_isk * i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items, count, subtotal,
      addItem, removeItem, updateQty, clear,
      isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
