"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Bell, Activity, AlertTriangle, CheckCircle, MapPin, Vibrate } from "lucide-react"
import { useShoppingStore } from "@/lib/shopping-store"

export function VibrationAlertSystem() {
  // Location state
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)

  // Geofencing state
  const [stores, setStores] = useState([])
  const [alerts, setAlerts] = useState<string[]>([])
  const [nearbyStores, setNearbyStores] = useState<any[]>([])
  const [lastAlertTime, setLastAlertTime] = useState<Date | null>(null)
  const [alertedStores, setAlertedStores] = useState<Set<string>>(new Set())
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [isSystemActive, setIsSystemActive] = useState(false)
  const [vibrationSupported, setVibrationSupported] = useState(false)
  const [lastVibrationTime, setLastVibrationTime] = useState<Date | null>(null)

  // Refs
  const watchIdRef = useRef<number | null>(null)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const forceUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const { items } = useShoppingStore()

  const addDebug = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const debugMsg = `${timestamp}: ${message}`
    console.log(`🔍 ${debugMsg}`)
    setDebugInfo((prev) => [...prev.slice(-30), debugMsg])
  }, [])

  // Check vibration support on mount
  useEffect(() => {
    const isSupported = "vibrate" in navigator
    setVibrationSupported(isSupported)
    addDebug(`Vibration API ${isSupported ? "IS" : "IS NOT"} supported`)
  }, [addDebug])

  // Calculate distance between two points
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

  // Update location and immediately check geofences
  const updateLocation = useCallback(
    (position: GeolocationPosition) => {
      const newLat = position.coords.latitude
      const newLng = position.coords.longitude
      const newAccuracy = position.coords.accuracy

      setLatitude(newLat)
      setLongitude(newLng)
      setAccuracy(newAccuracy)
      setLocationError(null)

      addDebug(`📍 Location updated: ${newLat.toFixed(8)}, ${newLng.toFixed(8)} (±${Math.round(newAccuracy)}m)`)

      // IMMEDIATELY check geofences after location update
      if (stores.length > 0) {
        setTimeout(() => checkGeofencesNow(newLat, newLng), 100)
      }
    },
    [stores, addDebug],
  )

  // SUPER AGGRESSIVE item matching
  const getRelevantItems = useCallback(
    (store: any) => {
      const uncompletedItems = items.filter((item) => !item.completed)
      if (uncompletedItems.length === 0) return []

      const storeName = store.name.toLowerCase()
      const storeCategories = store.categories?.map((c: any) => c.alias.toLowerCase()) || []

      addDebug(`🏪 Checking ${store.name} (${storeCategories.join(", ")})`)

      const relevantItems = uncompletedItems.filter((item) => {
        const itemCategory = item.primaryCategory?.id || ""
        let isMatch = false
        let reason = ""

        // SUPER AGGRESSIVE MATCHING
        if (itemCategory === "grocery") {
          if (
            storeCategories.includes("grocery") ||
            storeCategories.includes("supermarkets") ||
            storeCategories.includes("convenience") ||
            storeName.includes("safeway") ||
            storeName.includes("trader") ||
            storeName.includes("grocery") ||
            storeName.includes("market")
          ) {
            isMatch = true
            reason = "grocery match"
          }
        }

        if (itemCategory === "hardware") {
          if (
            storeCategories.includes("hardware") ||
            storeCategories.includes("homeandgarden") ||
            storeName.includes("ace") ||
            storeName.includes("hardware") ||
            storeName.includes("home depot") ||
            storeName.includes("lowes")
          ) {
            isMatch = true
            reason = "hardware match"
          }
        }

        if (itemCategory === "pharmacy") {
          if (
            storeCategories.includes("pharmacy") ||
            storeCategories.includes("drugstores") ||
            storeName.includes("cvs") ||
            storeName.includes("walgreens") ||
            storeName.includes("pharmacy")
          ) {
            isMatch = true
            reason = "pharmacy match"
          }
        }

        // FALLBACK: Any common store gets ANY item
        if (!isMatch && (storeName.includes("cvs") || storeName.includes("safeway") || storeName.includes("target"))) {
          isMatch = true
          reason = "common store fallback"
        }

        addDebug(`   ${isMatch ? "✅" : "❌"} ${item.name}: ${reason}`)
        return isMatch
      })

      return relevantItems
    },
    [items, addDebug],
  )

  // DIRECT VIBRATION FUNCTION - no dependencies, no complex logic
  const triggerDirectVibration = useCallback(() => {
    addDebug("📳 ATTEMPTING DIRECT VIBRATION")

    try {
      if ("vibrate" in navigator) {
        // Try multiple patterns with increasing intensity
        const longPattern = [1000, 300, 1000, 300, 1000, 300, 1000]
        navigator.vibrate(longPattern)
        addDebug(`📳 Vibration API called with pattern: ${longPattern.join(",")}ms`)

        // Try again after a delay with a different pattern
        setTimeout(() => {
          navigator.vibrate(2000)
          addDebug("📳 Second vibration: 2000ms")
        }, 2500)

        // And one more time for good measure
        setTimeout(() => {
          navigator.vibrate([500, 100, 500, 100, 500, 100, 500])
          addDebug("📳 Third vibration: pattern")
        }, 5000)

        setLastVibrationTime(new Date())
      } else {
        addDebug("❌ Vibration API not available")
      }
    } catch (error) {
      addDebug(`❌ Vibration error: ${error.message}`)
    }
  }, [addDebug])

  // SUPER AGGRESSIVE alert system
  const triggerAlert = useCallback(
    async (storeName: string, items: any[], distance: number) => {
      const itemNames = items.map((item) => item.name).join(", ")
      const alertMsg = `🚨 ${storeName} (${Math.round(distance)}m) - Don't forget: ${itemNames}`

      addDebug(`🚨 TRIGGERING ALERT: ${alertMsg}`)
      setAlerts((prev) => [...prev, alertMsg])
      setLastAlertTime(new Date())

      // 1. DIRECT VIBRATION - Call this FIRST before any async operations
      triggerDirectVibration()

      // 2. Browser Alert (GUARANTEED to work)
      alert(`🐰 GRABBIT ALERT!\n\n${storeName}\n\nDon't forget: ${itemNames}`)
      addDebug("📱 Browser alert shown")

      // 3. Notification
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(`🐰 Grabbit - ${storeName}`, {
            body: `🛒 Don't forget: ${itemNames}`,
            icon: "/images/grabbit-logo.png",
            requireInteraction: true,
            tag: `grabbit-${Date.now()}`,
          })
          addDebug("✅ Notification sent")
        } catch (error) {
          addDebug(`❌ Notification failed: ${error.message}`)
        }
      }

      // 4. Audio
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
        addDebug("🔇 Audio failed")
      }
    },
    [addDebug, triggerDirectVibration],
  )

  // Check geofences with current location
  const checkGeofencesNow = useCallback(
    (lat?: number, lng?: number) => {
      const currentLat = lat || latitude
      const currentLng = lng || longitude

      addDebug(`🔍 CHECKING GEOFENCES NOW`)
      addDebug(`📍 Location: ${currentLat?.toFixed(8)}, ${currentLng?.toFixed(8)}`)
      addDebug(`🏪 Stores: ${stores.length}`)
      addDebug(`📝 Items: ${items.filter((i) => !i.completed).length}`)

      if (!currentLat || !currentLng) {
        addDebug("❌ No location data")
        return
      }

      if (stores.length === 0) {
        addDebug("❌ No stores loaded")
        return
      }

      const uncompletedItems = items.filter((item) => !item.completed)
      if (uncompletedItems.length === 0) {
        addDebug("❌ No items on list")
        return
      }

      const RADIUS = 1000 // 1000 meters
      const currentNearby: any[] = []

      stores.forEach((store: any) => {
        const distance = calculateDistance(
          currentLat,
          currentLng,
          store.coordinates.latitude,
          store.coordinates.longitude,
        )

        addDebug(`📏 ${store.name}: ${Math.round(distance)}m`)

        if (distance <= RADIUS) {
          currentNearby.push({ ...store, distance: Math.round(distance) })
          addDebug(`✅ ${store.name} is within ${RADIUS}m`)

          const relevantItems = getRelevantItems(store)

          if (relevantItems.length > 0) {
            const storeKey = `${store.id}-${Math.floor(Date.now() / 60000)}`

            if (!alertedStores.has(storeKey)) {
              addDebug(`🚨 TRIGGERING ALERT FOR ${store.name}!`)
              setAlertedStores((prev) => new Set([...prev, storeKey]))
              triggerAlert(store.name, relevantItems, distance)
            } else {
              addDebug(`⏭️ Already alerted for ${store.name}`)
            }
          } else {
            addDebug(`❌ No relevant items for ${store.name}`)
          }
        }
      })

      setNearbyStores(currentNearby)
      addDebug(`🏪 ${currentNearby.length} stores within ${RADIUS}m`)
    },
    [latitude, longitude, stores, items, calculateDistance, getRelevantItems, alertedStores, triggerAlert, addDebug],
  )

  // Fetch stores
  const fetchStores = useCallback(async () => {
    if (!latitude || !longitude) {
      addDebug("❌ Cannot fetch stores - no location")
      return
    }

    addDebug("🔍 Fetching stores...")

    try {
      const response = await fetch(`/api/stores?latitude=${latitude}&longitude=${longitude}&radius=1000&limit=50`)
      const data = await response.json()

      const foundStores = data.stores || []
      setStores(foundStores)
      addDebug(`✅ Loaded ${foundStores.length} stores`)

      // Immediately check geofences after loading stores
      setTimeout(() => checkGeofencesNow(), 500)
    } catch (error) {
      addDebug(`❌ Store fetch error: ${error.message}`)
    }
  }, [latitude, longitude, addDebug, checkGeofencesNow])

  // Start GPS tracking
  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("GPS not supported")
      addDebug("❌ GPS not supported")
      return
    }

    setIsTracking(true)
    addDebug("🎯 Starting GPS tracking...")

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position)
        addDebug("✅ Initial GPS position obtained")
      },
      (error) => {
        setLocationError(error.message)
        addDebug(`❌ Initial GPS error: ${error.message}`)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )

    // Start watching
    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => {
        if (error.code !== error.TIMEOUT) {
          setLocationError(error.message)
          addDebug(`❌ GPS watch error: ${error.message}`)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      },
    )

    // Force updates every 3 seconds
    forceUpdateIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        updateLocation,
        (error) => addDebug(`⚡ Force update error: ${error.message}`),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      )
    }, 3000)

    addDebug("✅ GPS tracking started")
  }, [updateLocation, addDebug])

  // Stop GPS tracking
  const stopGPS = useCallback(() => {
    setIsTracking(false)

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (forceUpdateIntervalRef.current !== null) {
      clearInterval(forceUpdateIntervalRef.current)
      forceUpdateIntervalRef.current = null
    }

    addDebug("🛑 GPS tracking stopped")
  }, [addDebug])

  // Start the unified system
  const startSystem = useCallback(async () => {
    addDebug("🚀 Starting VIBRATION alert system...")
    setIsSystemActive(true)

    // Start GPS first
    startGPS()

    // Start geofence checking every 5 seconds
    checkIntervalRef.current = setInterval(() => {
      if (latitude && longitude) {
        checkGeofencesNow()
      }
    }, 5000)

    // Fetch stores after a short delay
    setTimeout(() => {
      if (latitude && longitude) {
        fetchStores()
      }
    }, 3000)

    // Test vibration on start
    if (vibrationSupported) {
      navigator.vibrate(500)
      addDebug("📳 Initial vibration test: 500ms")
    }
  }, [startGPS, checkGeofencesNow, fetchStores, latitude, longitude, addDebug, vibrationSupported])

  // Stop the system
  const stopSystem = useCallback(() => {
    addDebug("🛑 Stopping vibration alert system")
    setIsSystemActive(false)

    stopGPS()

    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
      checkIntervalRef.current = null
    }
  }, [stopGPS, addDebug])

  // Auto-start on mount
  useEffect(() => {
    startSystem()
    return () => stopSystem()
  }, [])

  // Fetch stores when location becomes available
  useEffect(() => {
    if (latitude && longitude && stores.length === 0) {
      fetchStores()
    }
  }, [latitude, longitude, stores.length, fetchStores])

  const uncompletedItems = items.filter((item) => !item.completed)

  return (
    <Card className="border-red-500 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <Vibrate className="w-5 h-5" />
          VIBRATION Alert System
          {isSystemActive && <Activity className="w-4 h-4 text-green-500 animate-pulse" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <Alert className={isSystemActive ? "border-green-500 bg-green-50" : "border-red-500"}>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <strong>System:</strong> {isSystemActive ? "🟢 ACTIVE" : "🔴 INACTIVE"}
              </div>
              <div>
                <strong>GPS:</strong> {isTracking ? "🟢 TRACKING" : "🔴 OFF"}
              </div>
              <div>
                <strong>Vibration:</strong> {vibrationSupported ? "✅ SUPPORTED" : "❌ NOT SUPPORTED"}
              </div>
              <div>
                <strong>Items:</strong> {uncompletedItems.length}
              </div>
              <div>
                <strong>Nearby:</strong> {nearbyStores.length}
              </div>
              <div>
                <strong>Location:</strong> {latitude && longitude ? "✅ AVAILABLE" : "❌ MISSING"}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Current Location */}
        {latitude && longitude && (
          <Alert className="border-blue-500 bg-blue-50">
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              <div className="text-sm">
                <strong>📍 Current Location:</strong>
                <br />
                Lat: {latitude.toFixed(8)}
                <br />
                Lng: {longitude.toFixed(8)}
                <br />
                Accuracy: ±{accuracy ? Math.round(accuracy) : "Unknown"}m
              </div>
            </AlertDescription>
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

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button onClick={triggerDirectVibration} className="flex-1 bg-purple-600 text-white">
            <Vibrate className="w-4 h-4 mr-2" />
            Test Vibration
          </Button>

          <Button onClick={() => checkGeofencesNow()} variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Check Now
          </Button>
        </div>

        {/* Last Alert & Vibration */}
        <div className="grid grid-cols-2 gap-2">
          {lastAlertTime && (
            <Alert className="border-purple-500 bg-purple-50">
              <Bell className="h-4 w-4" />
              <AlertDescription>
                <strong>Last alert:</strong> {lastAlertTime.toLocaleTimeString()}
              </AlertDescription>
            </Alert>
          )}

          {lastVibrationTime && (
            <Alert className="border-purple-500 bg-purple-50">
              <Vibrate className="h-4 w-4" />
              <AlertDescription>
                <strong>Last vibration:</strong> {lastVibrationTime.toLocaleTimeString()}
              </AlertDescription>
            </Alert>
          )}
        </div>

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
              {debugInfo.slice(-30).map((log, index) => (
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
            <strong>DIRECT VIBRATION SYSTEM:</strong>
            <br />• Uses direct vibration calls with no dependencies
            <br />• Tries multiple vibration patterns
            <br />• Calls vibration BEFORE any async operations
            <br />• Includes test button to verify vibration works
            <br />
            <br />
            <strong>Click "Test Vibration" to verify your device vibrates!</strong>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
