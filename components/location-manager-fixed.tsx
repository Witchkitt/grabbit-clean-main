"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Target, RefreshCw } from "lucide-react"
import { useGeolocation } from "@/hooks/use-geolocation-fixed"

const LOCATIONS = [
  { name: "Moraga", lat: 37.8349, lng: -122.13 },
  { name: "Lafayette", lat: 37.8857, lng: -122.118 },
  { name: "Orinda", lat: 37.8771, lng: -122.1802 },
  { name: "Walnut Creek", lat: 37.9101, lng: -122.0652 },
]

export function LocationManagerFixed() {
  const [stores, setStores] = useState([])
  const [status, setStatus] = useState("Ready")

  const {
    latitude,
    longitude,
    accuracy,
    error,
    loading,
    lastUpdate,
    getCurrentLocation,
    setManualLocation,
    clearError,
  } = useGeolocation()

  // SIMPLE LOCATION SETTER WITH IMMEDIATE FEEDBACK
  const handleLocationClick = useCallback(
    (name: string, lat: number, lng: number) => {
      console.log(`🎯 Setting location to ${name}:`, { lat, lng })
      setStatus(`Setting location to ${name}...`)

      // Set location immediately
      setManualLocation(lat, lng)

      // Show immediate feedback
      setStatus(`✅ Location set to ${name} (${lat}, ${lng})`)

      // Clear stores to force refresh
      setStores([])

      // Show alert for confirmation
      setTimeout(() => {
        alert(`Location set to ${name}!\nLat: ${lat}\nLng: ${lng}`)
      }, 100)
    },
    [setManualLocation],
  )

  // Fetch stores when location changes
  useEffect(() => {
    if (latitude && longitude) {
      console.log("📍 Location changed, fetching stores...")
      fetchStores()
    }
  }, [latitude, longitude])

  const fetchStores = async () => {
    if (!latitude || !longitude) return

    setStatus("🔍 Fetching stores...")

    try {
      const response = await fetch(`/api/stores?latitude=${latitude}&longitude=${longitude}&radius=5000&limit=20`)
      const data = await response.json()

      setStores(data.stores || [])
      setStatus(`✅ Found ${data.stores?.length || 0} stores`)
    } catch (error) {
      setStatus("❌ Error fetching stores")
      console.error("Store fetch error:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <Alert>
          <Target className="h-4 w-4" />
          <AlertDescription>{status}</AlertDescription>
        </Alert>

        {/* Current Location */}
        {latitude && longitude && (
          <Alert className="border-green-500 bg-green-50">
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              <strong>Current Location:</strong>
              <br />
              Lat: {latitude.toFixed(6)}
              <br />
              Lng: {longitude.toFixed(6)}
              <br />
              Accuracy: {accuracy ? Math.round(accuracy) : "Unknown"}m<br />
              Stores: {stores.length}
              <br />
              Last Update: {lastUpdate?.toLocaleTimeString() || "Never"}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              <Button onClick={clearError} size="sm" className="ml-2">
                Clear
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Location Buttons */}
        <div className="space-y-2">
          <h3 className="font-semibold">Set Location:</h3>
          <div className="grid grid-cols-2 gap-2">
            {LOCATIONS.map((loc) => (
              <Button
                key={loc.name}
                onClick={() => handleLocationClick(loc.name, loc.lat, loc.lng)}
                variant="outline"
                className="text-sm"
              >
                📍 {loc.name}
              </Button>
            ))}
          </div>
        </div>

        {/* GPS Button */}
        <Button onClick={getCurrentLocation} disabled={loading} className="w-full" variant="secondary">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Getting GPS..." : "Get GPS Location"}
        </Button>
      </CardContent>
    </Card>
  )
}
