"use client"

import { useState, useCallback } from "react"

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
  setManualLocation: (lat: number, lng: number) => void
  clearError: () => void
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

  // SIMPLE, RELIABLE MANUAL LOCATION SETTER
  const setManualLocation = useCallback((lat: number, lng: number) => {
    console.log("🔧 MANUAL LOCATION SET:", { lat, lng })

    setState({
      latitude: lat,
      longitude: lng,
      accuracy: 1000,
      error: null,
      loading: false,
      lastUpdate: new Date(),
    })

    // Force trigger any listeners
    window.dispatchEvent(
      new CustomEvent("locationChanged", {
        detail: { latitude: lat, longitude: lng },
      }),
    )
  }, [])

  const getCurrentLocation = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation not supported",
        loading: false,
      }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          lastUpdate: new Date(),
        })
      },
      (error) => {
        setState((prev) => ({
          ...prev,
          error: error.message,
          loading: false,
        }))
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    getCurrentLocation,
    setManualLocation,
    clearError,
  }
}
