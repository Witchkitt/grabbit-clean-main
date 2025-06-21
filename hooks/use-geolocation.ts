"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
  lastUpdate: Date | null
}

interface UseGeolocationReturn extends GeolocationState {
  getCurrentLocation: () => void
  startWatching: () => void
  stopWatching: () => void
  clearError: () => void
  setManualLocation: (lat: number, lng: number) => void
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    lastUpdate: null,
  })

  const watchIdRef = useRef<number | null>(null)
  const isWatchingRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const attemptCountRef = useRef(0)
  const lastPositionRef = useRef<GeolocationPosition | null>(null)
  const initializedRef = useRef(false)

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  // Manual location setter for fallback
  const setManualLocation = useCallback((lat: number, lng: number) => {
    console.log("📍 Setting manual location:", { lat, lng })
    setState({
      latitude: lat,
      longitude: lng,
      accuracy: 1000, // Assume 1km accuracy for manual
      error: null,
      loading: false,
      lastUpdate: new Date(),
    })
  }, [])

  // Try to get location from IP geolocation as fallback
  const tryIPGeolocation = useCallback(async () => {
    try {
      console.log("📍 Trying IP geolocation fallback...")
      const response = await fetch("https://ipapi.co/json/")
      const data = await response.json()

      if (data.latitude && data.longitude) {
        console.log("📍 IP geolocation success:", {
          lat: data.latitude,
          lng: data.longitude,
          city: data.city,
          country: data.country_name,
        })

        setState({
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 10000, // IP location is less accurate
          error: null,
          loading: false,
          lastUpdate: new Date(),
        })
        return true
      }
    } catch (error) {
      console.log("📍 IP geolocation failed:", error)
    }
    return false
  }, [])

  // Use a default location if all else fails
  const useDefaultLocation = useCallback(() => {
    console.log("📍 Using default location (Moraga)")
    setState({
      latitude: 37.8349, // Moraga
      longitude: -122.13,
      accuracy: 50000, // Very low accuracy
      error: "Using default location. Please enable location access for better results.",
      loading: false,
      lastUpdate: new Date(),
    })
  }, [])

  const getCurrentLocation = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    attemptCountRef.current += 1

    console.log(`📍 Getting location (attempt ${attemptCountRef.current})...`)

    // Create a promise that will timeout after 3 seconds
    const locationPromise = new Promise<GeolocationPosition>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Custom timeout"))
      }, 3000) // 3 second timeout

      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId)
            resolve(position)
          },
          (error) => {
            clearTimeout(timeoutId)
            reject(error)
          },
          {
            enableHighAccuracy: false, // Use network positioning
            timeout: 2500, // Browser timeout
            maximumAge: 60000, // Accept 1 minute old location
          },
        )
      } else {
        reject(new Error("Geolocation not supported"))
      }
    })

    locationPromise
      .then((position) => {
        console.log("📍 Location success:", {
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
          accuracy: Math.round(position.coords.accuracy),
        })

        lastPositionRef.current = position

        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          lastUpdate: new Date(),
        })

        // Reset attempt counter on success
        attemptCountRef.current = 0
      })
      .catch((error) => {
        console.log("📍 Location failed:", error.message)

        // If we have a last position, use it
        if (lastPositionRef.current) {
          console.log("📍 Using last known position")
          const position = lastPositionRef.current
          setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy * 2, // Double the accuracy (less accurate)
            error: "Using last known location",
            loading: false,
            lastUpdate: new Date(),
          })
          return
        }

        // If this is the first few attempts, try IP geolocation
        if (attemptCountRef.current <= 2) {
          console.log("📍 Trying IP geolocation fallback...")
          tryIPGeolocation().then((ipSuccess) => {
            if (ipSuccess) {
              attemptCountRef.current = 0
            }
          })
          return
        }

        // If all attempts failed, use default location
        if (attemptCountRef.current >= 3) {
          attemptCountRef.current = 0
          useDefaultLocation()
          return
        }

        // Set error but don't give up yet
        let errorMessage = "Unable to get precise location"

        if (error.code === 1) {
          errorMessage = "Location access denied. Using approximate location."
        } else if (error.code === 2) {
          errorMessage = "Location unavailable. Using approximate location."
        } else if (error.code === 3 || error.message === "Custom timeout") {
          errorMessage = "Location timeout. Using approximate location."
        }

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }))

        // Try IP geolocation after a short delay
        setTimeout(() => {
          tryIPGeolocation().then((ipSuccess) => {
            if (!ipSuccess) {
              useDefaultLocation()
            }
          })
        }, 1000)
      })
  }, [tryIPGeolocation, useDefaultLocation])

  const startWatching = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return
    }

    if (isWatchingRef.current) {
      return // Already watching
    }

    console.log("📍 Starting location watching...")

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          lastPositionRef.current = position

          setState((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            error: null,
            loading: false,
            lastUpdate: new Date(),
          }))
          console.log("📍 Location updated:", {
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
            accuracy: Math.round(position.coords.accuracy),
          })
        },
        (error) => {
          // Don't stop watching on timeout - just log it
          if (error.code === error.TIMEOUT) {
            console.log("📍 Location timeout during watching (continuing...)")
            return
          }

          console.log("📍 Location watching error:", error.message)

          // Only stop watching on permission errors
          if (error.code === error.PERMISSION_DENIED) {
            setState((prev) => ({
              ...prev,
              error: "Location access denied",
            }))
          }
        },
        {
          enableHighAccuracy: false, // Use network positioning for better battery life
          timeout: 10000, // Longer timeout for watching
          maximumAge: 30000, // Accept 30 second old location
        },
      )

      isWatchingRef.current = true
      console.log(`📍 Location watching started (ID: ${watchIdRef.current})`)

      // Also periodically get current location to ensure updates
      intervalRef.current = setInterval(() => {
        if (isWatchingRef.current && typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              lastPositionRef.current = position
              setState((prev) => ({
                ...prev,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                error: null,
                loading: false,
                lastUpdate: new Date(),
              }))
              console.log("📍 Interval location update:", {
                lat: position.coords.latitude.toFixed(6),
                lng: position.coords.longitude.toFixed(6),
              })
            },
            (error) => {
              console.log("📍 Interval location error:", error.message)
            },
            {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 30000,
            },
          )
        }
      }, 30000) // Check every 30 seconds (increased from 15 to reduce load)
    } catch (error) {
      console.error("❌ Error starting location watching:", error)
    }
  }, [])

  const stopWatching = useCallback(() => {
    if (typeof navigator !== "undefined" && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      isWatchingRef.current = false
      console.log("📍 Stopped location tracking")
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Initialize location only once on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      getCurrentLocation()

      // Start watching after initial location is obtained
      const watchTimeout = setTimeout(() => {
        startWatching()
      }, 3000) // Wait 3 seconds before starting watch

      return () => {
        clearTimeout(watchTimeout)
      }
    }
  }, []) // Empty dependency array - only run once

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching()
    }
  }, [stopWatching])

  return {
    ...state,
    getCurrentLocation,
    startWatching,
    stopWatching,
    clearError,
    setManualLocation,
  }
}
