"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Bell, Activity, AlertTriangle, CheckCircle, MapPin, Vibrate, Zap } from "lucide-react"
import { useShoppingStore } from "@/lib/shopping-store"

export function AggressiveVibrationAlert() {
  // Location state
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [isTracking, setIsTracking] = useState(false)

  // Alert state
  const [stores, setStores] = useState([])
  const [alerts, setAlerts] = useState<string[]>([])
  const [nearbyStores, setNearbyStores] = useState<any[]>([])
  const [lastAlertTime, setLastAlertTime] = useState<Date | null>(null)
  const [alertedStores, setAlertedStores] = useState<Set<string>>(new Set())
  const [isSystemActive, setIsSystemActive] = useState(false)
  const [lastVibrationTime, setLastVibrationTime] = useState<Date | null>(null)
  const [vibrationCount, setVibrationCount] = useState(0)

  // Refs
  const watchIdRef = useRef<number | null>(null)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const { items } = useShoppingStore()

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    console.log(`🚨 ${timestamp}: ${message}`)
    setAlerts((prev) => [`${timestamp}: ${message}`, ...prev.slice(0, 19)])
  }, [])

  // SUPER AGGRESSIVE VIBRATION - Multiple methods, multiple attempts
  const triggerSuperVibration = useCallback(() => {
    addLog("🚨 TRIGGERING SUPER AGGRESSIVE VIBRATION")
    setLastVibrationTime(new Date())
    setVibrationCount((prev) => prev + 1)

    try {
      if ("vibrate" in navigator) {
        // Method 1: Immediate long vibration
        navigator.vibrate(3000) // 3 seconds
        addLog("📳 Method 1: 3000ms vibration")

        // Method 2: Pattern after 100ms
        setTimeout(() => {
          navigator.vibrate([1000, 500, 1000, 500, 1000, 500, 1000])
          addLog("📳 Method 2: Pattern vibration")
        }, 100)

        // Method 3: Another long vibration after 4 seconds
        setTimeout(() => {
          navigator.vibrate(2000)
          addLog("📳 Method 3: 2000ms vibration")
        }, 4000)

        // Method 4: Final pattern after 7 seconds
        setTimeout(() => {
          navigator.vibrate([500, 200, 500, 200, 500, 200, 500, 200, 500])
          addLog("📳 Method 4: Final pattern")
        }, 7000)

        // Method 5: Continuous short bursts
        let burstCount = 0
        const burstInterval = setInterval(() => {
          navigator.vibrate(300)
          burstCount++
          addLog(`📳 Burst ${burstCount}: 300ms`)
          if (burstCount >= 5) {
            clearInterval(burstInterval)
          }
        }, 1000)
      } else {
        addLog("❌ Vibration API not available")
      }
    } catch (error) {
      addLog(`❌ Vibration error: ${error.message}`)
    }
  }, [addLog])

  // SUPER AGGRESSIVE AUDIO - Multiple frequencies, multiple attempts
  const triggerSuperAudio = useCallback(() => {
    addLog("🔊 TRIGGERING SUPER AGGRESSIVE AUDIO")

    try {
      // Audio Method 1: High frequency beep
      const audioContext1 = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator1 = audioContext1.createOscillator()
      const gainNode1 = audioContext1.createGain()

      oscillator1.connect(gainNode1)
      gainNode1.connect(audioContext1.destination)

      oscillator1.frequency.setValueAtTime(1000, audioContext1.currentTime) // High pitch
      gainNode1.gain.setValueAtTime(0.5, audioContext1.currentTime) // Loud

      oscillator1.start()
      oscillator1.stop(audioContext1.currentTime + 2.0) // 2 seconds
      addLog("🔊 Audio 1: High frequency 2s")

      // Audio Method 2: Low frequency after delay
      setTimeout(() => {
        const audioContext2 = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator2 = audioContext2.createOscillator()
        const gainNode2 = audioContext2.createGain()

        oscillator2.connect(gainNode2)
        gainNode2.connect(audioContext2.destination)

        oscillator2.frequency.setValueAtTime(400, audioContext2.currentTime) // Low pitch
        gainNode2.gain.setValueAtTime(0.5, audioContext2.currentTime)

        oscillator2.start()
        oscillator2.stop(audioContext2.currentTime + 1.5)
        addLog("🔊 Audio 2: Low frequency 1.5s")
      }, 2500)

      // Audio Method 3: Alternating tones
      setTimeout(() => {
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            const audioContext3 = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator3 = audioContext3.createOscillator()
            const gainNode3 = audioContext3.createGain()

            oscillator3.connect(gainNode3)
            gainNode3.connect(audioContext3.destination)

            oscillator3.frequency.setValueAtTime(800 + i * 100, audioContext3.currentTime)
            gainNode3.gain.setValueAtTime(0.4, audioContext3.currentTime)

            oscillator3.start()
            oscillator3.stop(audioContext3.currentTime + 0.3)
            addLog(`🔊 Audio 3.${i + 1}: ${800 + i * 100}Hz`)
          }, i * 400)
        }
      }, 4000)
    } catch (error) {
      addLog(`❌ Audio error: ${error.message}`)
    }
  }, [addLog])

  // SUPER AGGRESSIVE VISUAL ALERT
  const triggerSuperVisual = useCallback(
    (storeName: string, itemNames: string) => {
      addLog("📱 TRIGGERING SUPER AGGRESSIVE VISUAL ALERT")

      // Method 1: Browser alert (blocking)
      alert(`🚨🚨🚨 GRABBIT ALERT! 🚨🚨🚨\n\n${storeName}\n\nDON'T FORGET:\n${itemNames}\n\n🚨🚨🚨`)

      // Method 2: Notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`🚨 GRABBIT ALERT - ${storeName}`, {
          body: `🛒 DON'T FORGET: ${itemNames}`,
          icon: "/images/grabbit-logo.png",
          requireInteraction: true,
          tag: `grabbit-urgent-${Date.now()}`,
          vibrate: [1000, 500, 1000, 500, 1000], // Notification-level vibration
        })
        addLog("📱 Notification sent with vibration")
      }

      // Method 3: Console spam (for debugging)
      for (let i = 0; i < 10; i++) {
        console.log(`🚨🚨🚨 ALERT ${i + 1}: ${storeName} - ${itemNames} 🚨🚨🚨`)
      }
    },
    [addLog],
  )

  // ULTIMATE ALERT FUNCTION - ALL METHODS AT ONCE
  const triggerUltimateAlert = useCallback(
    (storeName: string, items: any[], distance: number) => {
      const itemNames = items.map((item) => item.name).join(", ")
      const alertMsg = `🚨🚨🚨 ULTIMATE ALERT: ${storeName} (${Math.round(distance)}m) - ${itemNames} 🚨🚨🚨`

      addLog(alertMsg)
      setLastAlertTime(new Date())

      // FIRE ALL METHODS SIMULTANEOUSLY
      triggerSuperVibration() // Vibration first
      triggerSuperAudio() // Audio second
      triggerSuperVisual(storeName, itemNames) // Visual third

      addLog("🚨 ALL ALERT METHODS FIRED!")
    },
    [addLog, triggerSuperVibration, triggerSuperAudio, triggerSuperVisual],
  )

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

  // Get relevant items for store
  const getRelevantItems = useCallback(
    (store: any) => {
      const uncompletedItems = items.filter((item) => !item.completed)
      if (uncompletedItems.length === 0) return []

      const storeName = store.name.toLowerCase()
      const storeCategories = store.categories?.map((c: any) => c.alias.toLowerCase()) || []

      // SUPER AGGRESSIVE MATCHING - match almost everything
      return uncompletedItems.filter((item) => {
        const itemCategory = item.primaryCategory?.id || ""

        // If it's ANY common store, match ANY item
        if (
          storeName.includes("safeway") ||
          storeName.includes("cvs") ||
          storeName.includes("target") ||
          storeName.includes("walmart") ||
          storeName.includes("walgreens") ||
          storeName.includes("ace") ||
          storeName.includes("hardware") ||
          storeCategories.includes("grocery") ||
          storeCategories.includes("pharmacy") ||
          storeCategories.includes("hardware") ||
          storeCategories.includes("departmentstores")
        ) {
          addLog(`✅ MATCH: ${item.name} at ${store.name} (aggressive matching)`)
          return true
        }

        return false
      })
    },
    [items, addLog],
  )

  // Check geofences
  const checkGeofences = useCallback(() => {
    if (!latitude || !longitude || stores.length === 0) return

    const uncompletedItems = items.filter((item) => !item.completed)
    if (uncompletedItems.length === 0) return

    const RADIUS = 2000 // 2000 meters - HUGE radius
    const currentNearby: any[] = []

    addLog(`🔍 Checking ${stores.length} stores within ${RADIUS}m`)

    stores.forEach((store: any) => {
      const distance = calculateDistance(latitude, longitude, store.coordinates.latitude, store.coordinates.longitude)

      if (distance <= RADIUS) {
        currentNearby.push({ ...store, distance: Math.round(distance) })
        addLog(`📍 ${store.name}: ${Math.round(distance)}m (within range)`)

        const relevantItems = getRelevantItems(store)

        if (relevantItems.length > 0) {
          const storeKey = `${store.id}-${Math.floor(Date.now() / 30000)}` // Reset every 30 seconds

          if (!alertedStores.has(storeKey)) {
            addLog(`🚨🚨🚨 TRIGGERING ULTIMATE ALERT FOR ${store.name}! 🚨🚨🚨`)
            setAlertedStores((prev) => new Set([...prev, storeKey]))
            triggerUltimateAlert(store.name, relevantItems, distance)
          } else {
            addLog(`⏭️ Already alerted for ${store.name} recently`)
          }
        }
      } else {
        addLog(`📏 ${store.name}: ${Math.round(distance)}m (too far)`)
      }
    })

    setNearbyStores(currentNearby)
  }, [
    latitude,
    longitude,
    stores,
    items,
    calculateDistance,
    getRelevantItems,
    alertedStores,
    triggerUltimateAlert,
    addLog,
  ])

  // Update location
  const updateLocation = useCallback(
    (position: GeolocationPosition) => {
      const newLat = position.coords.latitude
      const newLng = position.coords.longitude

      setLatitude(newLat)
      setLongitude(newLng)

      addLog(`📍 Location: ${newLat.toFixed(8)}, ${newLng.toFixed(8)}`)

      // Check geofences immediately after location update
      setTimeout(checkGeofences, 200)
    },
    [checkGeofences, addLog],
  )

  // Fetch stores
  const fetchStores = useCallback(async () => {
    if (!latitude || !longitude) return

    addLog("🔍 Fetching stores...")

    try {
      const response = await fetch(`/api/stores?latitude=${latitude}&longitude=${longitude}&radius=2000&limit=50`)
      const data = await response.json()

      const foundStores = data.stores || []
      setStores(foundStores)
      addLog(`✅ Loaded ${foundStores.length} stores`)

      // Check geofences after loading stores
      setTimeout(checkGeofences, 500)
    } catch (error) {
      addLog(`❌ Store fetch error: ${error.message}`)
    }
  }, [latitude, longitude, checkGeofences, addLog])

  // Start GPS
  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      addLog("❌ GPS not supported")
      return
    }

    setIsTracking(true)
    addLog("🎯 Starting GPS...")

    // Get initial position
    navigator.geolocation.getCurrentPosition(updateLocation, (error) => addLog(`❌ GPS error: ${error.message}`), {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })

    // Start watching
    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => {
        if (error.code !== error.TIMEOUT) {
          addLog(`❌ GPS watch error: ${error.message}`)
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    )

    addLog("✅ GPS started")
  }, [updateLocation, addLog])

  // Start system
  const startSystem = useCallback(() => {
    addLog("🚀 Starting AGGRESSIVE alert system...")
    setIsSystemActive(true)

    startGPS()

    // Check geofences every 3 seconds
    checkIntervalRef.current = setInterval(checkGeofences, 3000)

    // Fetch stores after GPS starts
    setTimeout(() => {
      if (latitude && longitude) {
        fetchStores()
      }
    }, 2000)

    // Test vibration on start
    setTimeout(() => {
      navigator.vibrate(500)
      addLog("📳 System start vibration test")
    }, 1000)
  }, [startGPS, checkGeofences, fetchStores, latitude, longitude, addLog])

  // Stop system
  const stopSystem = useCallback(() => {
    addLog("🛑 Stopping system")
    setIsSystemActive(false)
    setIsTracking(false)

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
      checkIntervalRef.current = null
    }
  }, [addLog])

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
    <Card className="border-red-500 border-4 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <Zap className="w-6 h-6" />🚨 AGGRESSIVE VIBRATION ALERT 🚨
          {isSystemActive && <Activity className="w-5 h-5 text-green-500 animate-pulse" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <Alert className={isSystemActive ? "border-green-500 bg-green-50" : "border-red-500"}>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="grid grid-cols-2 gap-2 text-sm font-bold">
              <div>🚨 System: {isSystemActive ? "🟢 ACTIVE" : "🔴 INACTIVE"}</div>
              <div>📍 GPS: {isTracking ? "🟢 TRACKING" : "🔴 OFF"}</div>
              <div>🏪 Stores: {stores.length}</div>
              <div>📝 Items: {uncompletedItems.length}</div>
              <div>📳 Vibrations: {vibrationCount}</div>
              <div>🎯 Nearby: {nearbyStores.length}</div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Current Location */}
        {latitude && longitude && (
          <Alert className="border-blue-500 bg-blue-50">
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              <div className="text-sm font-mono">
                <strong>📍 LIVE LOCATION:</strong>
                <br />
                {latitude.toFixed(8)}, {longitude.toFixed(8)}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Items */}
        {uncompletedItems.length > 0 && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>🛒 ITEMS THAT WILL TRIGGER ALERTS:</strong>
              <div className="mt-1 flex flex-wrap gap-1">
                {uncompletedItems.map((item) => (
                  <Badge key={item.id} variant="destructive" className="text-xs font-bold">
                    {item.name}
                  </Badge>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Nearby Stores */}
        {nearbyStores.length > 0 && (
          <Alert className="border-orange-500 bg-orange-50">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <strong>🎯 STORES WITHIN 2000m:</strong>
              {nearbyStores.map((store) => (
                <div key={store.id} className="text-sm mt-1 font-bold">
                  🏪 {store.name} ({store.distance}m away)
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Test Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={triggerSuperVibration} className="bg-purple-600 hover:bg-purple-700 font-bold">
            <Vibrate className="w-4 h-4 mr-2" />🚨 TEST VIBRATION
          </Button>

          <Button onClick={() => checkGeofences()} className="bg-red-600 hover:bg-red-700 font-bold">
            <Bell className="w-4 h-4 mr-2" />🚨 CHECK NOW
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

        {/* Alert Log */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-red-600">🚨 ALERT LOG:</h3>
            <Button onClick={() => setAlerts([])} size="sm" variant="outline">
              Clear
            </Button>
          </div>
          <div className="bg-black text-red-400 p-3 rounded-lg max-h-60 overflow-y-auto font-mono text-xs">
            {alerts.slice(0, 20).map((log, index) => (
              <div key={index} className="mb-1 font-bold">
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <Alert className="bg-red-100 border-red-500 border-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm font-bold">
            <strong>🚨 AGGRESSIVE ALERT SYSTEM:</strong>
            <br />• 2000m radius (MASSIVE range)
            <br />• Checks every 3 seconds
            <br />• Multiple vibration methods
            <br />• Multiple audio alerts
            <br />• Browser popup + notification
            <br />• Matches ANY item to ANY common store
            <br />
            <br />
            <strong className="text-red-600">THIS WILL DEFINITELY BUZZ AND ALERT!</strong>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
