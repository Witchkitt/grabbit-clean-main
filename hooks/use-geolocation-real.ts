"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
  lastUpdate: Date | null
  isTracking: boolean
  movementHistory: Array<{ lat: number; lng: number; timestamp: Date; accuracy: number; source: string }>
  gpsStatus: string
  updateCount: number
  staticCount: number
  lastMovedTime: Date | null
}

interface UseGeolocationReturn extends GeolocationState {
  startTracking: () => void
  stopTracking: () => void
  getCurrentLocation: () => void
  clearError: () => void
  getDistanceMoved: () => number
  forceUpdate: () => void
  resetTracking: () => void
  isStatic: boolean
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    lastUpdate: null,
    isTracking: false,
    movementHistory: [],
    gpsStatus: "Initializing...",
    updateCount: 0,
    staticCount: 0,
    lastMovedTime: null,
  })

  const watchIdRef = useRef<number | null>(null)
  const forceUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastPositionRef = useRef<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })
  const staticThreshold = 0.0000001 // Extremely small threshold to detect any movement

  // Calculate if position is static (not moving)
  const isStatic = state.staticCount > 5 && state.updateCount > 5

  // Calculate distance between two points in meters
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

  const getDistanceMoved = useCallback((): number => {
    if (state.movementHistory.length < 2) return 0

    let totalDistance = 0
    for (let i = 1; i < state.movementHistory.length; i++) {
      const prev = state.movementHistory[i - 1]
      const curr = state.movementHistory[i]
      totalDistance += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng)
    }
    return totalDistance
  }, [state.movementHistory, calculateDistance])

  const updateLocation = useCallback((position: GeolocationPosition, source = "GPS") => {
    const newLat = position.coords.latitude
    const newLng = position.coords.longitude
    const newAccuracy = position.coords.accuracy
    const now = new Date()

    // Check if position has changed
    const hasChanged =
      lastPositionRef.current.lat === null ||
      lastPositionRef.current.lng === null ||
      Math.abs(newLat - lastPositionRef.current.lat) > staticThreshold ||
      Math.abs(newLng - lastPositionRef.current.lng) > staticThreshold

    // Update last position reference
    lastPositionRef.current = { lat: newLat, lng: newLng }

    // Debug output with static detection
    console.log(`📍 ${source} UPDATE:`, {
      lat: newLat.toFixed(10),
      lng: newLng.toFixed(10),
      accuracy: Math.round(newAccuracy),
      timestamp: now.toLocaleTimeString(),
      source,
      changed: hasChanged ? "YES" : "NO CHANGE ⚠️",
    })

    setState((prev) => {
      // Update static counter
      const newStaticCount = hasChanged ? 0 : prev.staticCount + 1

      // Update last moved time if position changed
      const newLastMovedTime = hasChanged ? now : prev.lastMovedTime

      // Add to history
      const newHistory = [
        ...prev.movementHistory,
        { lat: newLat, lng: newLng, timestamp: now, accuracy: newAccuracy, source },
      ].slice(-100) // Keep last 100 positions

      // Calculate static status message
      let statusMessage = `${source} - Updated ${now.toLocaleTimeString()}`
      if (newStaticCount > 5) {
        statusMessage = `⚠️ STATIC POSITION - ${newStaticCount} updates without movement`
      }

      return {
        ...prev,
        latitude: newLat,
        longitude: newLng,
        accuracy: newAccuracy,
        error: null,
        loading: false,
        lastUpdate: now,
        movementHistory: newHistory,
        gpsStatus: statusMessage,
        updateCount: prev.updateCount + 1,
        staticCount: newStaticCount,
        lastMovedTime: newLastMovedTime || prev.lastMovedTime,
      }
    })

    // Dispatch event for other components
    window.dispatchEvent(
      new CustomEvent("locationChanged", {
        detail: {
          latitude: newLat,
          longitude: newLng,
          accuracy: newAccuracy,
          source,
          isStatic: !hasChanged,
        },
      }),
    )
  }, [])

  const handleLocationError = useCallback((error: GeolocationPositionError, source = "GPS") => {
    console.error(`📍 ${source} ERROR:`, error)

    let errorMessage = `${source} Error: `

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage += "Permission denied. Enable location access in browser settings."
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage += "Position unavailable. Check if location services are enabled."
        break
      case error.TIMEOUT:
        errorMessage += "Timeout. GPS signal may be weak."
        // Don't stop on timeout, just log it
        setState((prev) => ({
          ...prev,
          gpsStatus: `${source} timeout - continuing...`,
        }))
        return
      default:
        errorMessage += error.message
    }

    setState((prev) => ({
      ...prev,
      error: errorMessage,
      loading: false,
      gpsStatus: `${source} failed: ${error.message}`,
    }))
  }, [])

  const forceUpdate = useCallback(() => {
    if (!navigator.geolocation) return

    console.log("⚡ FORCING GPS UPDATE...")
    setState((prev) => ({ ...prev, gpsStatus: "Forcing GPS update..." }))

    // Try to clear any cached positions by calling getCurrentPosition multiple times
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => updateLocation(position, `FORCED-${i + 1}`),
          (error) => handleLocationError(error, `FORCED-${i + 1}`),
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0, // NO CACHE
          },
        )
      }, i * 500) // Stagger requests
    }
  }, [updateLocation, handleLocationError])

  const resetTracking = useCallback(() => {
    // Stop current tracking
    stopTracking()

    // Reset state
    setState((prev) => ({
      ...prev,
      movementHistory: [],
      updateCount: 0,
      staticCount: 0,
      lastMovedTime: null,
      gpsStatus: "Reset tracking...",
    }))

    // Reset last position reference
    lastPositionRef.current = { lat: null, lng: null }

    // Restart tracking after a short delay
    setTimeout(() => {
      startTracking()
    }, 1000)
  }, [])

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation not supported",
        gpsStatus: "Not supported",
      }))
      return
    }

    console.log("🎯 Starting SUPER AGGRESSIVE GPS tracking...")

    setState((prev) => ({
      ...prev,
      isTracking: true,
      loading: true,
      error: null,
      gpsStatus: "Starting GPS...",
    }))

    // Method 1: Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position, "INITIAL")
        startWatchingPosition()
      },
      (error) => handleLocationError(error, "INITIAL"),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }, [updateLocation, handleLocationError])

  const startWatchingPosition = useCallback(() => {
    try {
      // Method 2: Start continuous watching
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => updateLocation(position, "WATCH"),
        (error) => {
          if (error.code === error.TIMEOUT) {
            console.log("📍 Watch timeout (continuing...)")
            setState((prev) => ({ ...prev, gpsStatus: "Watch timeout - continuing..." }))
            return
          }
          handleLocationError(error, "WATCH")
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        },
      )

      console.log(`📍 Started GPS watching (ID: ${watchIdRef.current})`)

      // Method 3: Force updates every 2 seconds
      forceUpdateIntervalRef.current = setInterval(() => {
        if (navigator.geolocation) {
          console.log("⚡ Interval GPS check...")
          navigator.geolocation.getCurrentPosition(
            (position) => updateLocation(position, "INTERVAL"),
            (error) => {
              console.log("⚡ Interval error (ignored):", error.message)
              setState((prev) => ({ ...prev, gpsStatus: `Interval error: ${error.message}` }))
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            },
          )
        }
      }, 2000) // Every 2 seconds

      // Method 4: Status updates
      statusIntervalRef.current = setInterval(() => {
        setState((prev) => {
          // Calculate time since last movement
          let staticMessage = ""
          if (prev.lastMovedTime && prev.staticCount > 5) {
            const staticTime = Math.floor((Date.now() - prev.lastMovedTime.getTime()) / 1000)
            staticMessage = ` - Static for ${staticTime}s`
          }

          return {
            ...prev,
            gpsStatus: `Active - ${prev.updateCount} updates${staticMessage} - ${new Date().toLocaleTimeString()}`,
          }
        })
      }, 1000) // Every second

      console.log("⚡ Started super aggressive GPS tracking with 2-second intervals")
    } catch (error) {
      console.error("❌ Error starting GPS:", error)
      setState((prev) => ({
        ...prev,
        error: "Failed to start GPS tracking",
        loading: false,
        isTracking: false,
        gpsStatus: "Failed to start",
      }))
    }
  }, [updateLocation, handleLocationError])

  const stopTracking = useCallback(() => {
    console.log("🛑 Stopping GPS tracking...")

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (forceUpdateIntervalRef.current !== null) {
      clearInterval(forceUpdateIntervalRef.current)
      forceUpdateIntervalRef.current = null
    }

    if (statusIntervalRef.current !== null) {
      clearInterval(statusIntervalRef.current)
      statusIntervalRef.current = null
    }

    setState((prev) => ({
      ...prev,
      isTracking: false,
      loading: false,
      gpsStatus: "Stopped",
    }))
  }, [])

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "GPS not supported",
        gpsStatus: "Not supported",
      }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null, gpsStatus: "Getting fresh GPS..." }))

    navigator.geolocation.getCurrentPosition(
      (position) => updateLocation(position, "MANUAL"),
      (error) => handleLocationError(error, "MANUAL"),
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      },
    )
  }, [updateLocation, handleLocationError])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  // Auto-start GPS tracking on mount
  useEffect(() => {
    startTracking()

    return () => {
      stopTracking()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (forceUpdateIntervalRef.current !== null) {
        clearInterval(forceUpdateIntervalRef.current)
      }
      if (statusIntervalRef.current !== null) {
        clearInterval(statusIntervalRef.current)
      }
    }
  }, [])

  return {
    ...state,
    startTracking,
    stopTracking,
    getCurrentLocation,
    clearError,
    getDistanceMoved,
    forceUpdate,
    resetTracking,
    isStatic,
  }
}
