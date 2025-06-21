"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, RefreshCw, Star, Phone, ExternalLink, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CATEGORIES } from "@/lib/categorization"
import { getCategoryFromYelp, metersToMiles, type YelpBusiness } from "@/lib/yelp-api"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useShoppingStore } from "@/lib/shopping-store"

export function NearbyStores() {
  const [stores, setStores] = useState<YelpBusiness[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { latitude, longitude, error: locationError, loading: locationLoading, getCurrentLocation } = useGeolocation()
  const items = useShoppingStore((state) => state.items)

  // Get categories that have items in the shopping list
  const categoriesWithItems = CATEGORIES.filter((category) =>
    items.some((item) => item.category.id === category.id && !item.completed),
  )

  const fetchStores = async (categoryFilter?: string) => {
    if (!latitude || !longitude) return

    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: "5000",
        limit: "20",
      })

      if (categoryFilter) {
        params.append("category", categoryFilter)
      }

      const response = await fetch(`/api/stores?${params}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch stores: ${response.status}`)
      }

      const data = await response.json()
      setStores(data.stores || [])
    } catch (error) {
      console.error("Error fetching stores:", error)
      setError("Failed to load nearby stores. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (latitude && longitude) {
      fetchStores(selectedCategory || undefined)
    }
  }, [latitude, longitude, selectedCategory])

  const getCategoryEmoji = (categoryId: string) => {
    return CATEGORIES.find((cat) => cat.id === categoryId)?.emoji || "🏪"
  }

  const openInMaps = (business: YelpBusiness) => {
    const { latitude, longitude } = business.coordinates
    const url = `https://maps.google.com/?q=${latitude},${longitude}`
    window.open(url, "_blank")
  }

  const callBusiness = (phone: string) => {
    window.open(`tel:${phone}`, "_self")
  }

  if (locationError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Nearby Stores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mb-3">{locationError}</AlertDescription>
          </Alert>
          <Button onClick={getCurrentLocation} className="w-full">
            <MapPin className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Nearby Stores
          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Filter */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Filter by category:</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All Stores
            </Button>
            {categoriesWithItems.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-1"
              >
                <span>{category.emoji}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {(locationLoading || loading) && (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">
              {locationLoading ? "Getting your location..." : "Finding nearby stores..."}
            </p>
          </div>
        )}

        {/* Stores List */}
        {!loading && !locationLoading && stores.length > 0 && (
          <div className="space-y-3">
            {stores.slice(0, 10).map((store) => {
              const categoryId = getCategoryFromYelp(store.categories)
              return (
                <div
                  key={store.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-xl mt-1">{getCategoryEmoji(categoryId)}</span>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium truncate">{store.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {store.rating}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{store.location.display_address.join(", ")}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{metersToMiles(store.distance)}</span>
                      {store.price && <Badge variant="outline">{store.price}</Badge>}
                      {store.is_closed && <Badge variant="destructive">Closed</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {store.categories.slice(0, 2).map((category, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {category.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openInMaps(store)} className="h-8 w-8 p-0">
                      <Navigation className="w-4 h-4" />
                    </Button>
                    {store.phone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => callBusiness(store.phone)}
                        className="h-8 w-8 p-0"
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(store.url, "_blank")}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* No Results */}
        {!loading && !locationLoading && stores.length === 0 && latitude && longitude && !error && (
          <div className="text-center py-8">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No stores found in your area</p>
            <Button onClick={() => fetchStores()} variant="outline" className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        )}

        {/* Refresh Button */}
        {!loading && !locationLoading && stores.length > 0 && (
          <Button onClick={() => fetchStores(selectedCategory || undefined)} variant="outline" className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Stores
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
