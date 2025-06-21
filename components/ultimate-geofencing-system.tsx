"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Bell, Activity, Store, AlertTriangle, CheckCircle, Zap } from "lucide-react"
import { useGeolocation } from "@/hooks/use-geolocation-real"
import { useShoppingStore } from "@/lib/shopping-store"

export function UltimateGeofencingSystem() {
  const [isActive, setIsActive] = useState(false)
  const [stores, setStores] = useState([])
  const [alerts, setAlerts] = useState<string[]>([])
  const [nearbyStores, setNearbyStores] = useState<any[]>([])
  const [lastAlertTime, setLastAlertTime] = useState<Date | null>(null)
  const [alertedStores, setAlertedStores] = useState<Set<string>>(new Set())
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { latitude, longitude, isTracking } = useGeolocation()
  const { items } = useShoppingStore()

  const addDebug = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const debugMsg = `${timestamp}: ${message}`
    console.log(`🔍 ${debugMsg}`)
    setDebugInfo((prev) => [...prev.slice(-20), debugMsg]) // Keep last 20 debug messages
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

  // SUPER AGGRESSIVE item matching - matches almost everything
  const getRelevantItems = useCallback(
    (store: any) => {
      const uncompletedItems = items.filter((item) => !item.completed)
      if (uncompletedItems.length === 0) return []

      const storeName = store.name.toLowerCase()
      const storeCategories = store.categories?.map((c: any) => c.alias.toLowerCase()) || []

      addDebug(`🏪 Checking ${store.name} (categories: ${storeCategories.join(", ")})`)

      const relevantItems = uncompletedItems.filter((item) => {
        const itemName = item.name.toLowerCase()
        const itemCategory = item.primaryCategory?.id || ""

        addDebug(`   🛒 Item: "${item.name}" (category: ${itemCategory})`)

        // SUPER AGGRESSIVE MATCHING - if ANY of these match, trigger alert
        let isMatch = false
        let matchReason = ""

        // 1. Direct category matches
        if (
          itemCategory === "grocery" &&
          (storeCategories.includes("grocery") ||
            storeCategories.includes("supermarkets") ||
            storeCategories.includes("convenience"))
        ) {
          isMatch = true
          matchReason = "grocery category match"
        }

        if (
          itemCategory === "pharmacy" &&
          (storeCategories.includes("pharmacy") || storeCategories.includes("drugstores"))
        ) {
          isMatch = true
          matchReason = "pharmacy category match"
        }

        if (
          itemCategory === "hardware" &&
          (storeCategories.includes("hardware") || storeCategories.includes("homeandgarden"))
        ) {
          isMatch = true
          matchReason = "hardware category match"
        }

        if (itemCategory === "department" && storeCategories.includes("departmentstores")) {
          isMatch = true
          matchReason = "department category match"
        }

        // 2. Store name matches (VERY AGGRESSIVE)
        if (storeName.includes("safeway") || storeName.includes("trader") || storeName.includes("grocery")) {
          if (itemCategory === "grocery") {
            isMatch = true
            matchReason = "grocery store name match"
          }
        }

        if (storeName.includes("cvs") || storeName.includes("walgreens") || storeName.includes("pharmacy")) {
          if (itemCategory === "pharmacy") {
            isMatch = true
            matchReason = "pharmacy store name match"
          }
        }

        if (
          storeName.includes("ace") ||
          storeName.includes("hardware") ||
          storeName.includes("home depot") ||
          storeName.includes("lowes")
        ) {
          if (itemCategory === "hardware") {
            isMatch = true
            matchReason = "hardware store name match"
          }
        }

        // 3. FALLBACK: If it's a common store and we have items, just match it!
        if (
          !isMatch &&
          (storeName.includes("cvs") ||
            storeName.includes("safeway") ||
            storeName.includes("target") ||
            storeName.includes("walmart"))
        ) {
          isMatch = true
          matchReason = "common store fallback match"
        }

        addDebug(`      ${isMatch ? "✅" : "❌"} ${item.name}: ${matchReason || "no match"}`)
        return isMatch
      })

      addDebug(`   🎯 ${store.name}: ${relevantItems.length} relevant items`)
      return relevantItems
    },
    [items, addDebug],
  )

  // SUPER AGGRESSIVE notification system
  const triggerAlert = useCallback(
    async (storeName: string, items: any[], distance: number) => {
      const itemNames = items.map((item) => item.name).join(", ")
      const alertMsg = `🚨 ${storeName} (${Math.round(distance)}m) - Don't forget: ${itemNames}`

      addDebug(`🚨 TRIGGERING ALERT: ${alertMsg}`)
      setAlerts((prev) => [...prev, alertMsg])
      setLastAlertTime(new Date())

      // 1. Browser notification
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          // Try service worker first
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
                  vibrate: [500, 200, 500, 200, 500, 200, 500],
                })
                addDebug("✅ Service Worker notification sent")
              }
            } catch (swError) {
              addDebug("⚠️ SW notification failed, trying direct...")
            }
          }

          // Direct notification fallback
          const notification = new Notification(`🐰 Grabbit - ${storeName}`, {
            body: `🛒 Don't forget: ${itemNames}`,
            icon: "/images/grabbit-logo.png",
            tag: `grabbit-alert-${Date.now()}`,
            requireInteraction: true,
            silent: false,
            renotify: true,
          })
          addDebug("✅ Direct notification sent")
        } catch (error) {
          addDebug(`❌ Notification error: ${error.message}`)
        }
      } else {
        addDebug("❌ Notifications not available or not granted")
      }

      // 2. Vibration (AGGRESSIVE)
      if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500, 200, 500, 200, 500])
        addDebug("📳 Vibration triggered")
      }

      // 3. Audio alert
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)

        oscillator.start()
        oscillator.stop(audioContext.currentTime + 1.0)
        addDebug("🔊 Audio alert played")
      } catch (error) {
        addDebug("🔇 Audio not available")
      }

      // 4. Visual alert in browser
      if (typeof window !== "undefined") {
        alert(`🐰 GRABBIT ALERT!\n\n${storeName}\n\nDon't forget: ${itemNames}`)
        addDebug("📱 Browser alert shown")
      }
    },
    [addDebug],
  )

  // Fetch nearby stores
  const fetchStores = useCallback(async () => {
    if (!latitude || !longitude) return

    addDebug("🔍 Fetching nearby stores...")

    try {
      const response = await fetch(`/api/stores?latitude=${latitude}&longitude=${longitude}&radius=1000&limit=50`)
      const data = await response.json()

      const foundStores = data.stores || []
      setStores(foundStores)
      addDebug(`✅ Loaded ${foundStores.length} stores`)

      // Log all stores with distances
      foundStores.forEach((store: any) => {
        const distance = calculateDistance(latitude, longitude, store.coordinates.latitude, store.coordinates.longitude)
        addDebug(
          `   📍 ${store.name}: ${Math.round(distance)}m (${store.categories?.map((c: any) => c.alias).join(", ")})`,
        )
      })
    } catch (error) {
      addDebug(`❌ Error loading stores: ${error.message}`)
    }
  }, [latitude, longitude, addDebug, calculateDistance])

  // SUPER AGGRESSIVE geofence checking
  const checkGeofences = useCallback(() => {
    if (!latitude || !longitude || stores.length === 0) {
      addDebug("⏭️ Skipping geofence check - missing data")
      return
    }

    const RADIUS = 1000 // 1000 meters - VERY LARGE radius
    const uncompletedItems = items.filter((item) => !item.completed)

    if (uncompletedItems.length === 0) {
      addDebug("⏭️ No items on list - skipping")
      return
    }

    addDebug(`🔍 Checking ${stores.length} stores for ${uncompletedItems.length} items`)
    addDebug(`📍 Current location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)

    const currentNearby: any[] = []

    stores.forEach((store: any) => {
      const distance = calculateDistance(latitude, longitude, store.coordinates.latitude, store.coordinates.longitude)

      if (distance <= RADIUS) {
        currentNearby.push({ ...store, distance: Math.round(distance) })
        addDebug(`✅ ${store.name} is within ${RADIUS}m (${Math.round(distance)}m away)`)

        const relevantItems = getRelevantItems(store)

        if (relevantItems.length > 0) {
          const storeKey = `${store.id}-${Math.floor(Date.now() / 60000)}` // Reset every minute

          if (!alertedStores.has(storeKey)) {
            addDebug(`🚨 TRIGGERING ALERT FOR ${store.name}!`)
            setAlertedStores((prev) => new Set([...prev, storeKey]))
            triggerAlert(store.name, relevantItems, distance)
          } else {
            addDebug(`⏭️ Already alerted for ${store.name} recently`)
          }
        } else {
          addDebug(`❌ No relevant items for ${store.name}`)
        }
      } else {
        addDebug(`📏 ${store.name}: ${Math.round(distance)}m (outside ${RADIUS}m radius)`)
      }
    })

    setNearbyStores(currentNearby)
    addDebug(`🏪 ${currentNearby.length} stores within ${RADIUS}m`)
  }, [latitude, longitude, stores, items, calculateDistance, getRelevantItems, alertedStores, triggerAlert, addDebug])

  // Start the system
  const startSystem = useCallback(async () => {
    addDebug("🎯 Starting ULTIMATE geofencing system...")
    setIsActive(true)

    // Fetch stores
    await fetchStores()

    // Start checking every 5 seconds
    checkIntervalRef.current = setInterval(() => {
      checkGeofences()
    }, 5000)

    // Check immediately
    setTimeout(checkGeofences, 2000)
  }, [fetchStores, checkGeofences, addDebug])

  // Stop the system
  const stopSystem = useCallback(() => {
    addDebug("🛑 Stopping geofencing system")
    setIsActive(false)
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
      checkIntervalRef.current = null
    }
  }, [addDebug])

  // Auto-start when location is available
  useEffect(() => {
    if (isTracking && latitude && longitude && !isActive) {
      startSystem()
    } else if (!isTracking && isActive) {
      stopSystem()
    }
  }, [isTracking, latitude, longitude, isActive, startSystem, stopSystem])

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
    <Card className="border-red-500 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <Zap className="w-5 h-5" />
          ULTIMATE Geofencing System
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
              <strong>Currently within 1000m:</strong>
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
            <Button onClick={startSystem} className="flex-1 bg-red-600 text-white">
              <Zap className="w-4 h-4 mr-2" />
              Start ULTIMATE System
            </Button>
          ) : (
            <Button onClick={stopSystem} className="flex-1 bg-gray-600 text-white">
              <Activity className="w-4 h-4 mr-2" />
              Stop System
            </Button>
          )}

          <Button onClick={fetchStores} variant="outline">
            <Store className="w-4 h-4 mr-2" />
            Refresh
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
                  {alert}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Log */}
        {debugInfo.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Debug Log:</h3>
              <Button onClick={() => setDebugInfo([])} size="sm" variant="outline">
                Clear
              </Button>
            </div>
            <div className="bg-black text-green-400 p-3 rounded-lg max-h-60 overflow-y-auto font-mono text-xs">
              {debugInfo.slice(-20).map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <Alert className="bg-red-50 border-red-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>ULTIMATE GEOFENCING:</strong>
            <br />• 1000m radius (HUGE range)
            <br />• Checks every 5 seconds
            <br />• SUPER aggressive item matching
            <br />• Multiple alert methods (notification + vibration + audio + popup)
            <br />• Detailed debug logging
            <br />
            <br />
            <strong>This WILL trigger alerts if you're anywhere near a store!</strong>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
