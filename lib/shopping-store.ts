/**
 * ⚠️ FIXED SHOPPING STORE WITH PROPER MIGRATION ⚠️
 *
 * Now properly migrates old single-category items to multi-category format.
 *
 * Status: Fixed migration issue
 */

"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { categorizeItem, type ShoppingItem } from "./categorization"

interface ShoppingStore {
  items: ShoppingItem[]
  addItem: (name: string) => void
  removeItem: (id: string) => void
  toggleItem: (id: string) => void
  clearCompleted: () => void
  clearAll: () => void
}

// ✅ Migration function for old items
function migrateOldItem(item: any): ShoppingItem {
  // If item already has the new format, return as is
  if (item.allCategories && item.primaryCategory) {
    return item as ShoppingItem
  }

  // If item has old single category format, migrate it
  const { primaryCategory, allCategories } = categorizeItem(item.name)

  return {
    id: item.id,
    name: item.name,
    primaryCategory,
    allCategories,
    completed: item.completed || false,
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
  }
}

export const useShoppingStore = create<ShoppingStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (name: string) => {
        const { primaryCategory, allCategories } = categorizeItem(name)

        const newItem: ShoppingItem = {
          id: Date.now().toString(),
          name: name.trim(),
          primaryCategory,
          allCategories,
          completed: false,
          createdAt: new Date(),
        }

        set((state) => ({
          items: [...state.items, newItem],
        }))
      },

      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },

      toggleItem: (id: string) => {
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
        }))
      },

      clearCompleted: () => {
        set((state) => ({
          items: state.items.filter((item) => !item.completed),
        }))
      },

      clearAll: () => {
        set({ items: [] })
      },
    }),
    {
      name: "grabbit-shopping-list",
      version: 4, // ✅ Incremented for migration fix
      migrate: (persistedState: any, version: number) => {
        // ✅ Migrate old items to new multi-category format
        if (version < 4 && persistedState?.items) {
          return {
            ...persistedState,
            items: persistedState.items.map(migrateOldItem),
          }
        }
        return persistedState
      },
    },
  ),
)
