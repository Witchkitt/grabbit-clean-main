"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Bell, MapPin, Target, Activity, Store, AlertTriangle, CheckCircle } from "lucide-react"
import { useGeolocation } from "@/hooks/use-geolocation-real"
import { useShoppingStore } from "@/lib/shopping-store"

export function RealGeofencingSystem() {
  const [isActive, setIsActive] = useState(false)
  const [stores, setStores] = useState([])
  const [alerts, setAlerts] = useState<string[]>([])
  const [nearbyStores, setNearbyStores] = useState<any[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [lastAlertTime, setLastAlertTime] = useState<Date | null>(null)
  const [alertedStores, setAlertedStores] = useState<Set<string>>(new Set())

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { latitude, longitude, isTracking } = useGeolocation()
  const { items } = useShoppingStore()

  // Check notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted")
    }
  }, [])

  // Calculate distance between two points
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }, [])

  const triggerNotification = useCallback(async (storeName: string, itemNames: string) => {
    console.log("📱 Triggering notification...")

    if (typeof window === "undefined" || !("Notification" in window)) {
      console.log("❌ Notifications not supported")
      return
    }

    if (Notification.permission !== "granted") {
      console.log("❌ Notification permission not granted")
      return
    }

    try {
      // Try service worker notification first
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          if (registration && registration.showNotification) {
            await registration.showNotification(`🐰 Grabbit - ${storeName}`, {
              body: `🛒 Don't forget: ${itemNames}`,
              icon: "/images/grabbit-logo.png",
              badge: "/images/grabbit-logo.png",
              tag: `grabbit-alert-${Date.now()}`,
              requireInteraction: true,
              silent: false,
              renotify: true,
              vibrate: [500, 200, 500, 200, 500],
              actions: [
                { action: "view", title: "View List" },
                { action: "dismiss", title: "Dismiss" },
              ],
            })
            console.log("✅ Service Worker notification sent")
            return
          }
        } catch (swError) {
          console.log("⚠️ Service Worker notification failed, trying direct...")
        }
      }

      // Fallback to direct notification
      const notification = new Notification(`🐰 Grabbit - ${storeName}`, {
        body: `🛒 Don't forget: ${itemNames}`,
        icon: "/images/grabbit-logo.png",
        tag: `grabbit-alert-${Date.now()}`,
        requireInteraction: true,
        silent: false,
        renotify: true,
      })

      console.log("✅ Direct notification sent")

      // Handle notification click
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (error) {
      console.error("❌ Notification error:", error)
    }
  }, [])

  const triggerAudio = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.8)
      console.log("🔊 Audio alert played")
    } catch (error) {
      console.log("🔇 Audio not available:", error.message)
    }
  }, [])

  // Get relevant items for a store
  const getRelevantItems = useCallback(
    (store: any) => {
      const uncompletedItems = items.filter((item) => !item.completed)

      if (uncompletedItems.length === 0) return []

      // Get store categories
      const storeCategories = store.categories?.map((c: any) => c.alias.toLowerCase()) || []
      const storeName = store.name.toLowerCase()

      console.log(`🏪 ${store.name} categories:`, storeCategories)

      return uncompletedItems.filter((item) => {
        const itemCategory = item.primaryCategory?.id || ""
        console.log(`🛒 Checking item "${item.name}" (${itemCategory}) against store categories`)

        // Enhanced category mapping - more inclusive
        const categoryMatches: Record<string, string[]> = {
          grocery: ["grocery", "supermarkets", "convenience", "markets", "food"],
          pharmacy: ["pharmacy", "drugstores", "health"],
          hardware: ["hardware", "homeandgarden", "tools", "lumber", "building"],
          department: ["departmentstores", "retail", "shopping"],
          pet: ["petstore", "pet", "animal"],
          electronics: ["electronics", "computers", "tech"],
          music: ["musicalinstruments", "music"],
          service: ["servicestations", "gas", "fuel"],
        }

        const matchingCategories = categoryMatches[itemCategory] || []

        // Check category match
        const categoryMatch = matchingCategories.some((cat) =>
          storeCategories.some((storeCat) => storeCat.includes(cat) || cat.includes(storeCat)),
        )

        // Check store name match (for known stores)
        const nameMatch =
          (itemCategory === "hardware" &&
            (storeName.includes("osh") || storeName.includes("ace") || storeName.includes("hardware"))) ||
          (itemCategory === "grocery" &&
            (storeName.includes("safeway") || storeName.includes("trader") || storeName.includes("grocery"))) ||
          (itemCategory === "pharmacy" &&
            (storeName.includes("cvs") || storeName.includes("walgreens") || storeName.includes("pharmacy")))

        const isMatch = categoryMatch || nameMatch
        console.log(`   ${isMatch ? "✅" : "❌"} ${item.name}: category=${categoryMatch}, name=${nameMatch}`)

        return isMatch
      })
    },
    [items],
  )

  // Fetch nearby stores
  const fetchStores = useCallback(async () => {
    if (!latitude || !longitude) return

    try {
      const response = await fetch(`/api/stores?latitude=${latitude}&longitude=${longitude}&radius=2000&limit=50`)
      const data = await response.json()

      const foundStores = data.stores || []
      setStores(foundStores)

      setAlerts((prev) => [...prev, `📍 Loaded ${foundStores.length} stores in area`])

      console.log(
        "🏪 Loaded stores:",
        foundStores.map((s) => ({ name: s.name, distance: s.distance })),
      )
    } catch (error) {
      setAlerts((prev) => [...prev, `❌ Error loading stores: ${error.message}`])
    }
  }, [latitude, longitude])

  // Check for nearby stores and trigger alerts
  const checkGeofences = useCallback(() => {
    if (!latitude || !longitude || stores.length === 0) {
      console.log("🔍 Geofence check skipped - missing data")
      return
    }

    const RADIUS = 500 // 500 meters
    const currentNearby: any[] = []

    console.log(
      `🔍 Checking geofences for ${stores.length} stores from location ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    )

    stores.forEach((store: any) => {
      const distance = calculateDistance(latitude, longitude, store.coordinates.latitude, store.coordinates.longitude)

      console.log(`📏 ${store.name}: ${Math.round(distance)}m away`)

      if (distance <= RADIUS) {
        currentNearby.push({ ...store, distance: Math.round(distance) })
        console.log(`✅ ${store.name} is within ${RADIUS}m (${Math.round(distance)}m)`)

        const relevantItems = getRelevantItems(store)
        console.log(
          `🛒 Relevant items for ${store.name}:`,
          relevantItems.map((i) => i.name),
        )

        if (relevantItems.length > 0) {
          const storeKey = `${store.id}-${Math.floor(Date.now() / 300000)}` // Reset every 5 minutes

          if (!alertedStores.has(storeKey)) {
            // TRIGGER ALERT!
            const itemNames = relevantItems.map((item) => item.name).join(", ")
            const alertMsg = `🚨 ${store.name} (${Math.round(distance)}m away) - Don't forget: ${itemNames}`

            console.log("🚨 TRIGGERING ALERT:", alertMsg)
            setAlerts((prev) => [...prev, alertMsg])
            setLastAlertTime(new Date())
            setAlertedStores((prev) => new Set([...prev, storeKey]))

            // Force notification
            triggerNotification(store.name, itemNames)

            // Force vibration
            if (navigator.vibrate) {
              navigator.vibrate([500, 200, 500, 200, 500, 200, 300])
              console.log("📳 Vibration triggered")
            }

            // Force audio
            triggerAudio()
          } else {
            console.log(`⏭️ Already alerted for ${store.name} recently`)
          }
        } else {
          console.log(`❌ No relevant items for ${store.name}`)
        }
      }

      // Reset alert if moved far away (but keep recent alerts for 5 minutes)
      if (distance > RADIUS * 3) {
        const oldKeys = Array.from(alertedStores).filter((key) => key.startsWith(store.id))
        oldKeys.forEach((key) => {
          const timestamp = Number.parseInt(key.split("-")[1]) * 300000
          if (Date.now() - timestamp > 300000) {
            // 5 minutes
            setAlertedStores((prev) => {
              const newSet = new Set(prev)
              newSet.delete(key)
              return newSet
            })
          }
        })
      }
    })

    setNearbyStores(currentNearby)
    console.log(`🏪 Currently nearby: ${currentNearby.length} stores`)
  }, [
    latitude,
    longitude,
    stores,
    calculateDistance,
    getRelevantItems,
    alertedStores,
    triggerNotification,
    triggerAudio,
  ])

  // Start geofencing
  const startGeofencing = useCallback(async () => {
    if (!notificationsEnabled) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === "granted")

      if (permission !== "granted") {
        setAlerts((prev) => [...prev, "❌ Notifications denied - alerts may not work"])
        return
      }
    }

    setIsActive(true)
    setAlerts((prev) => [...prev, "🎯 Geofencing started - will check every 10 seconds"])

    // Fetch stores first
    await fetchStores()

    // Start checking every 10 seconds
    checkIntervalRef.current = setInterval(() => {
      checkGeofences()
    }, 10000) // Check every 10 seconds

    // Check immediately
    setTimeout(checkGeofences, 2000)
  }, [notificationsEnabled, fetchStores, checkGeofences])

  // Stop geofencing
  const stopGeofencing = useCallback(() => {
    setIsActive(false)
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
      checkIntervalRef.current = null
    }
    setAlerts((prev) => [...prev, "🛑 Geofencing stopped"])
  }, [])

  // Auto-start when location tracking is active
  useEffect(() => {
    if (isTracking && latitude && longitude && !isActive) {
      startGeofencing()
    } else if (!isTracking && isActive) {
      stopGeofencing()
    }
  }, [isTracking, latitude, longitude, isActive, startGeofencing, stopGeofencing])

  // Cleanup
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [])

  const uncompletedItems = items.filter((item) => !item.completed)

  return (
    <Card className="border-orange-500 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <Target className="w-5 h-5" />
          Real Geofencing System
          {isActive && <Activity className="w-4 h-4 text-green-500 animate-pulse" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <Alert className={isActive ? "border-green-500 bg-green-50" : "border-red-500"}>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <strong>Status:</strong> {isActive ? "🟢 ACTIVE" : "🔴 INACTIVE"}
              </div>
              <div>
                <strong>Stores:</strong> {stores.length}
              </div>
              <div>
                <strong>Items:</strong> {uncompletedItems.length}
              </div>
              <div>
                <strong>Nearby:</strong> {nearbyStores.length}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Notifications */}
        {!notificationsEnabled && (
          <Alert variant="destructive">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              Notifications disabled - you won't get alerts!
              <Button
                onClick={async () => {
                  const permission = await Notification.requestPermission()
                  setNotificationsEnabled(permission === "granted")
                }}
                size="sm"
                className="ml-2"
              >
                Enable
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Items Check */}
        {uncompletedItems.length === 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>No items on shopping list - alerts won't trigger</AlertDescription>
          </Alert>
        )}

        {/* Current Items */}
        {uncompletedItems.length > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Items that will trigger alerts:</strong>
              <div className="mt-1 flex flex-wrap gap-1">
                {uncompletedItems.map((item) => (
                  <Badge key={item.id} variant="secondary" className="text-xs">
                    {item.name} ({item.primaryCategory?.name})
                  </Badge>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Nearby Stores */}
        {nearbyStores.length > 0 && (
          <Alert className="border-blue-500 bg-blue-50">
            <Store className="h-4 w-4" />
            <AlertDescription>
              <strong>Currently within 500m:</strong>
              {nearbyStores.map((store) => (
                <div key={store.id} className="text-sm mt-1">
                  📍 {store.name} ({store.distance}m away)
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isActive ? (
            <Button onClick={startGeofencing} className="flex-1 bg-green-600 text-white">
              <Target className="w-4 h-4 mr-2" />
              Start Geofencing
            </Button>
          ) : (
            <Button onClick={stopGeofencing} className="flex-1 bg-red-600 text-white">
              <Activity className="w-4 h-4 mr-2" />
              Stop Geofencing
            </Button>
          )}

          <Button onClick={fetchStores} variant="outline">
            <Store className="w-4 h-4 mr-2" />
            Refresh Stores
          </Button>
        </div>

        {/* Last Alert */}
        {lastAlertTime && (
          <Alert className="border-purple-500 bg-purple-50">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <strong>Last alert:</strong> {lastAlertTime.toLocaleTimeString()}
            </AlertDescription>
          </Alert>
        )}

        {/* Alert Log */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Alert Log:</h3>
              <Button onClick={() => setAlerts([])} size="sm" variant="outline">
                Clear
              </Button>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg max-h-40 overflow-y-auto">
              {alerts.slice(-10).map((alert, index) => (
                <div key={index} className="text-sm mb-1 font-mono">
                  {new Date().toLocaleTimeString()}: {alert}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <Alert className="bg-yellow-50 border-yellow-500">
          <MapPin className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>How it works:</strong>
            <br />• Checks your location every 10 seconds
            <br />• Alerts when within 500m of relevant stores
            <br />• Only alerts for items on your shopping list
            <br />• Won't repeat alerts for same store
            <br />
            <br />
            <strong>Make sure you have items on your list and notifications enabled!</strong>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
