"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Trash2, X } from "lucide-react"
import { useShoppingStore } from "@/lib/shopping-store"
import { CATEGORIES } from "@/lib/categorization"

export function ShoppingList() {
  const { items, removeItem, toggleItem, clearCompleted, clearAll } = useShoppingStore()

  // ✅ FIXED: More robust category checking
  const groupedItems = CATEGORIES.map((category) => ({
    ...category,
    items: items.filter((item) => {
      // Handle new multi-category format
      if (item.allCategories && Array.isArray(item.allCategories)) {
        return item.allCategories.some((cat) => cat.id === category.id)
      }
      // Handle old single-category format (fallback)
      if (item.primaryCategory) {
        return item.primaryCategory.id === category.id
      }
      // Handle very old format where category might be a string
      if ((item as any).category) {
        const oldCategory = (item as any).category
        if (typeof oldCategory === "string") {
          return oldCategory === category.id
        }
        if (oldCategory.id) {
          return oldCategory.id === category.id
        }
      }
      return false
    }),
  })).filter((group) => group.items.length > 0)

  const completedCount = items.filter((item) => item.completed).length

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No items in your list yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Use voice input or type to add items!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Shopping List</h2>
        <div className="flex gap-2">
          {completedCount > 0 && (
            <Button onClick={clearCompleted} variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Done ({completedCount})
            </Button>
          )}
          <Button onClick={clearAll} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {groupedItems.map((group) => (
        <Card key={group.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">{group.emoji}</span>
              {group.name}
              <span className="text-sm font-normal text-muted-foreground">({group.items.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.items.map((item) => (
              <div
                key={`${item.id}-${group.id}`}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  item.completed ? "bg-muted/50" : "bg-background"
                }`}
              >
                <Checkbox checked={item.completed} onCheckedChange={() => toggleItem(item.id)} className="mt-1" />
                <div className="flex-1 space-y-2">
                  <span className={`block ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                    {item.name}
                  </span>

                  {/* ✅ Show if item is available at multiple store types */}
                  {item.allCategories && Array.isArray(item.allCategories) && item.allCategories.length > 1 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground">Also available at:</span>
                      {item.allCategories
                        .filter((category) => category.id !== group.id)
                        .map((category, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {category.emoji} {category.name}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => removeItem(item.id)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
