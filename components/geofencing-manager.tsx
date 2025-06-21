"use client"

import { useEffect, useState } from "react"
import { useShoppingStore } from "@/lib/shopping-store"
import { useGeolocation } from "@/hooks/use-geolocation"
import { geofencingService } from "@/lib/geofencing"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Bell, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function GeofencingManager() {
  const [isActive, setIsActive] = useState(false)
  const [stores, setStores] = useState([])
  const [lastAlert, setLastAlert] = useState<string | null>(null)
  const { latitude, longitude, error: locationError } = useGeolocation()
  const items = useShoppingStore((state) => state.items)

  // Fetch nearby stores when location is available
  useEffect(() => {
    if (latitude && longitude) {
      fetchNearbyStores()
    }
  }, [latitude, longitude])

  const fetchNearbyStores = async () => {
    if (!latitude || !longitude) return

    try {
      const response = await fetch(`/api/stores?latitude=${latitude}&longitude=${longitude}&radius=1000&limit=50`)
      const data = await response.json()
      setStores(data.stores || [])
    } catch (error) {
      console.error("Error fetching stores for geofencing:", error)
    }
  }

  // Start/stop geofencing
  useEffect(() => {
    if (stores.length > 0 && items.length > 0 && latitude && longitude) {
      const uncompletedItems = items.filter((item) => !item.completed)

      if (uncompletedItems.length > 0) {
        geofencingService.startWatching(
          stores,
          uncompletedItems,
          (alert) => {
            setLastAlert(`${alert.storeName}: ${alert.items.map((i) => i.name).join(", ")}`)

            // Show browser notification
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`Grabbit - ${alert.storeName}`, {
                body: `Don't forget: ${alert.items.map((i) => i.name).join(", ")}`,
                icon: "/images/grabbit-logo.png",
                tag: `store-${alert.storeId}`,
              })
            }
          },
          500, // 500 meter radius
        )
        setIsActive(true)
      }
    }

    return () => {
      geofencingService.stopWatching()
      setIsActive(false)
    }
  }, [stores, items, latitude, longitude])

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        // Test notification
        new Notification("Grabbit Notifications Enabled", {
          body: "You'll now receive alerts when near stores!",
          icon: "/images/grabbit-logo.png",
        })
      }
    }
  }

  if (locationError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Location access needed for store alerts: {locationError}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      {/* Geofencing Status */}
      <Alert className={isActive ? "border-green-500" : "border-yellow-500"}>
        <MapPin className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{isActive ? `🟢 Watching ${stores.length} nearby stores` : "🟡 Setting up location alerts..."}</span>
          {!isActive && stores.length === 0 && (
            <Button onClick={fetchNearbyStores} size="sm" variant="outline">
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>

      {/* Notification Permission */}
      {"Notification" in window && Notification.permission !== "granted" && (
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Enable notifications for store alerts</span>
            <Button onClick={requestNotificationPermission} size="sm">
              Enable
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Last Alert */}
      {lastAlert && (
        <Alert className="border-blue-500">
          <Bell className="h-4 w-4" />
          <AlertDescription>
            <strong>Last Alert:</strong> {lastAlert}
          </AlertDescription>
        </Alert>
      )}

      {/* Debug Info */}
      {latitude && longitude && (
        <div className="text-xs text-muted-foreground">
          📍 Location: {latitude.toFixed(4)}, {longitude.toFixed(4)} | 🏪 {stores.length} stores | 📝{" "}
          {items.filter((i) => !i.completed).length} items
        </div>
      )}
    </div>
  )
}
