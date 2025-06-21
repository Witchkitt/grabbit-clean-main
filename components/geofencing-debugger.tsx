"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Bug, MapPin, List, Bell, Target, AlertTriangle } from "lucide-react"
import { useGeolocation } from "@/hooks/use-geolocation-real"
import { useShoppingStore } from "@/lib/shopping-store"

export function GeofencingDebugger() {
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [stores, setStores] = useState([])
  const [storeDistances, setStoreDistances] = useState<any[]>([])
  const [isChecking, setIsChecking] = useState(false)

  const { latitude, longitude, isTracking } = useGeolocation()
  const { items } = useShoppingStore()

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLog((prev) => [...prev, `${timestamp}: ${message}`])
    console.log(`🐛 ${timestamp}: ${message}`)
  }, [])

  // Calculate distance
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }, [])

  // Debug check everything
  const runFullDiagnostic = useCallback(async () => {
    setIsChecking(true)
    addLog("🔍 Starting full diagnostic...")

    // 1. Check location
    if (!latitude || !longitude) {
      addLog("❌ PROBLEM: No location available")
      setIsChecking(false)
      return
    }
    addLog(`✅ Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)

    // 2. Check location tracking
    if (!isTracking) {
      addLog("❌ PROBLEM: Location tracking is OFF")
    } else {
      addLog("✅ Location tracking is ON")
    }

    // 3. Check items
    const uncompletedItems = items.filter((item) => !item.completed)
    if (uncompletedItems.length === 0) {
      addLog("❌ PROBLEM: No items on shopping list")
      setIsChecking(false)
      return
    }
    addLog(`✅ Items on list: ${uncompletedItems.map((i) => i.name).join(", ")}`)

    // 4. Check notifications
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = Notification.permission
      if (permission !== "granted") {
        addLog(`❌ PROBLEM: Notifications ${permission}`)
      } else {
        addLog("✅ Notifications enabled")
      }
    }

    // 5. Fetch stores
    addLog("🔍 Fetching nearby stores...")
    try {
      const response = await fetch(`/api/stores?latitude=${latitude}&longitude=${longitude}&radius=2000&limit=50`)
      const data = await response.json()

      const foundStores = data.stores || []
      setStores(foundStores)
      addLog(`✅ Found ${foundStores.length} stores`)

      if (foundStores.length === 0) {
        addLog("❌ PROBLEM: No stores found in area")
        addLog(`📍 API Response: ${JSON.stringify(data.meta)}`)
        setIsChecking(false)
        return
      }

      // 6. Calculate distances to all stores
      const distances = foundStores.map((store: any) => {
        const distance = calculateDistance(latitude, longitude, store.coordinates.latitude, store.coordinates.longitude)
        return {
          name: store.name,
          distance: Math.round(distance),
          categories: store.categories?.map((c: any) => c.alias) || [],
          id: store.id,
        }
      })

      distances.sort((a, b) => a.distance - b.distance)
      setStoreDistances(distances)

      addLog("📏 Distances to all stores:")
      distances.slice(0, 10).forEach((store) => {
        addLog(`   ${store.name}: ${store.distance}m (${store.categories.join(", ")})`)
      })

      // 7. Check for stores within 500m
      const nearbyStores = distances.filter((store) => store.distance <= 500)
      if (nearbyStores.length === 0) {
        addLog("❌ PROBLEM: No stores within 500m")
        addLog(`   Closest store: ${distances[0]?.name} at ${distances[0]?.distance}m`)
      } else {
        addLog(`✅ ${nearbyStores.length} stores within 500m:`)
        nearbyStores.forEach((store) => {
          addLog(`   ${store.name}: ${store.distance}m`)
        })
      }

      // 8. Check category matching
      nearbyStores.forEach((store) => {
        const relevantItems = uncompletedItems.filter((item) => {
          const itemCategory = item.primaryCategory?.id || ""
          const storeCategories = store.categories

          const categoryMap: Record<string, string[]> = {
            grocery: ["grocery", "supermarkets", "convenience"],
            pharmacy: ["pharmacy", "drugstores"],
            hardware: ["hardware", "homeandgarden"],
            department: ["departmentstores"],
            pet: ["petstore"],
            electronics: ["electronics"],
            music: ["musicalinstruments"],
            service: ["servicestations", "gas_stations"],
          }

          const matchingCategories = categoryMap[itemCategory] || []
          const hasMatch = matchingCategories.some((cat) =>
            storeCategories.some((storeCat) => storeCat.includes(cat) || cat.includes(storeCat)),
          )

          return hasMatch
        })

        if (relevantItems.length > 0) {
          addLog(`🎯 ${store.name} SHOULD TRIGGER ALERT for: ${relevantItems.map((i) => i.name).join(", ")}`)
        } else {
          addLog(`❌ ${store.name} - no matching items (categories: ${store.categories.join(", ")})`)
        }
      })
    } catch (error) {
      addLog(`❌ PROBLEM: Store fetch failed - ${error.message}`)
    }

    setIsChecking(false)
  }, [latitude, longitude, isTracking, items, addLog, calculateDistance])

  // Test notification
  const testNotification = useCallback(async () => {
    addLog("📱 Testing notifications...")

    if (typeof window === "undefined" || !("Notification" in window)) {
      addLog("❌ Notifications not supported in this browser")
      return
    }

    addLog(`📱 Current permission: ${Notification.permission}`)

    if (Notification.permission !== "granted") {
      addLog("📱 Requesting notification permission...")
      const permission = await Notification.requestPermission()
      addLog(`📱 Permission result: ${permission}`)

      if (permission !== "granted") {
        addLog("❌ Notification permission denied")
        return
      }
    }

    try {
      // Test with service worker first
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready
        if (registration && registration.showNotification) {
          await registration.showNotification("🐰 Grabbit Test (Service Worker)", {
            body: "Service Worker notification test - if you see this, SW notifications work!",
            icon: "/images/grabbit-logo.png",
            badge: "/images/grabbit-logo.png",
            tag: "grabbit-test-sw",
            requireInteraction: true,
            vibrate: [200, 100, 200],
          })
          addLog("✅ Service Worker notification sent")
        }
      }

      // Also test direct notification
      const notification = new Notification("🐰 Grabbit Test (Direct)", {
        body: "Direct notification test - if you see this, direct notifications work!",
        icon: "/images/grabbit-logo.png",
        tag: "grabbit-test-direct",
        requireInteraction: true,
      })

      addLog("✅ Direct notification sent")

      // Test vibration
      if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500])
        addLog("📳 Vibration triggered")
      } else {
        addLog("❌ Vibration not supported")
      }
    } catch (error) {
      addLog(`❌ Notification error: ${error.message}`)
    }
  }, [addLog])

  const triggerManualAlert = useCallback(() => {
    addLog("🚨 MANUAL ALERT TRIGGERED")

    const testItems = items.filter((item) => !item.completed)
    if (testItems.length === 0) {
      addLog("❌ No items to alert about")
      return
    }

    const itemNames = testItems
      .slice(0, 3)
      .map((item) => item.name)
      .join(", ")

    // Show notification
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("🐰 Grabbit - MANUAL TEST", {
          body: `Don't forget: ${itemNames}`,
          icon: "/images/grabbit-logo.png",
          tag: "grabbit-manual-test",
          requireInteraction: true,
          vibrate: [500, 200, 500, 200, 500],
        })
        addLog("📱 Manual notification sent")
      } catch (error) {
        addLog(`❌ Manual notification failed: ${error.message}`)
      }
    }

    // Vibration
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500])
      addLog("📳 Manual vibration triggered")
    }

    // Audio
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.5)
      addLog("🔊 Manual audio alert played")
    } catch (error) {
      addLog("🔇 Audio not available")
    }
  }, [addLog, items])

  const uncompletedItems = items.filter((item) => !item.completed)

  return (
    <Card className="border-red-500 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <Bug className="w-5 h-5" />
          Geofencing Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Status */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Alert className={latitude && longitude ? "border-green-500" : "border-red-500"}>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              <strong>Location:</strong> {latitude && longitude ? "✅ Available" : "❌ Missing"}
            </AlertDescription>
          </Alert>

          <Alert className={isTracking ? "border-green-500" : "border-red-500"}>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>Tracking:</strong> {isTracking ? "✅ Active" : "❌ Inactive"}
            </AlertDescription>
          </Alert>

          <Alert className={uncompletedItems.length > 0 ? "border-green-500" : "border-red-500"}>
            <List className="h-4 w-4" />
            <AlertDescription>
              <strong>Items:</strong> {uncompletedItems.length > 0 ? `✅ ${uncompletedItems.length}` : "❌ None"}
            </AlertDescription>
          </Alert>

          <Alert
            className={
              typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted"
                ? "border-green-500"
                : "border-red-500"
            }
          >
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <strong>Notifications:</strong>{" "}
              {typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted"
                ? "✅ Enabled"
                : "❌ Disabled"}
            </AlertDescription>
          </Alert>
        </div>

        {/* Current Items */}
        {uncompletedItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Items on List:</h3>
            <div className="flex flex-wrap gap-1">
              {uncompletedItems.map((item) => (
                <Badge key={item.id} variant="secondary" className="text-xs">
                  {item.name} ({item.primaryCategory?.name})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Store Distances */}
        {storeDistances.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Nearby Stores (closest first):</h3>
            <div className="bg-gray-100 p-3 rounded-lg max-h-32 overflow-y-auto">
              {storeDistances.slice(0, 10).map((store, index) => (
                <div key={index} className="text-sm mb-1">
                  <span className={store.distance <= 500 ? "text-green-600 font-bold" : ""}>
                    {store.name}: {store.distance}m
                  </span>
                  <span className="text-gray-500 ml-2">({store.categories.join(", ")})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={runFullDiagnostic} disabled={isChecking} className="flex-1">
            <Bug className="w-4 h-4 mr-2" />
            {isChecking ? "Checking..." : "Run Full Diagnostic"}
          </Button>
          <Button onClick={testNotification} variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Test Notification
          </Button>
          <Button onClick={triggerManualAlert} variant="outline" className="bg-red-100">
            🚨 Manual Alert
          </Button>
        </div>

        {/* Debug Log */}
        {debugLog.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Debug Log:</h3>
              <Button onClick={() => setDebugLog([])} size="sm" variant="outline">
                Clear
              </Button>
            </div>
            <div className="bg-black text-green-400 p-3 rounded-lg max-h-60 overflow-y-auto font-mono text-xs">
              {debugLog.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <Alert className="bg-yellow-50 border-yellow-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>How to use:</strong>
            <br />
            1. Go to the store parking lot
            <br />
            2. Click "Run Full Diagnostic"
            <br />
            3. Check the debug log for problems
            <br />
            4. Look for "SHOULD TRIGGER ALERT" messages
            <br />
            <br />
            This will tell us exactly why alerts aren't working!
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
