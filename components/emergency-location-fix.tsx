"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Target, AlertTriangle } from "lucide-react"
import { useShoppingStore } from "@/lib/shopping-store"

// EMERGENCY LOCATION OVERRIDE - BYPASSES ALL BROKEN SYSTEMS
export function EmergencyLocationFix() {
  const [currentLat, setCurrentLat] = useState<number | null>(null)
  const [currentLng, setCurrentLng] = useState<number | null>(null)
  const [manualLat, setManualLat] = useState("")
  const [manualLng, setManualLng] = useState("")
  const [status, setStatus] = useState("Ready for emergency location override")
  const { addItem } = useShoppingStore()

  // HARDCODED LOCATIONS - NO DEPENDENCIES
  const locations = [
    { name: "Moraga Safeway", lat: 37.8351, lng: -122.1302 },
    { name: "Lafayette Target", lat: 37.8857, lng: -122.118 },
    { name: "Orinda CVS", lat: 37.8771, lng: -122.1802 },
    { name: "Walnut Creek", lat: 37.9101, lng: -122.0652 },
  ]

  const setLocation = (name: string, lat: number, lng: number) => {
    setCurrentLat(lat)
    setCurrentLng(lng)
    setStatus(`✅ LOCATION SET: ${name} (${lat.toFixed(4)}, ${lng.toFixed(4)})`)

    // Force update localStorage directly
    localStorage.setItem("emergency-location", JSON.stringify({ lat, lng, name, timestamp: Date.now() }))

    // Show success alert
    alert(`Location set to ${name}!\nLat: ${lat}\nLng: ${lng}`)
  }

  const setManualLocation = () => {
    const lat = Number.parseFloat(manualLat)
    const lng = Number.parseFloat(manualLng)

    if (isNaN(lat) || isNaN(lng)) {
      alert("Invalid coordinates!")
      return
    }

    setLocation("Manual Location", lat, lng)
    setManualLat("")
    setManualLng("")
  }

  const addTestItems = () => {
    addItem("eggs")
    addItem("milk")
    addItem("bread")
    setStatus("✅ Added test items: eggs, milk, bread")
  }

  const getCurrentLocation = () => {
    setStatus("🔍 Getting GPS location...")

    if (!navigator.geolocation) {
      setStatus("❌ GPS not supported")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setLocation("GPS Location", lat, lng)
      },
      (error) => {
        setStatus(`❌ GPS Error: ${error.message}`)
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  return (
    <Card className="border-red-500 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          EMERGENCY LOCATION OVERRIDE
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>{status}</AlertDescription>
        </Alert>

        {/* Current Location Display */}
        {currentLat && currentLng && (
          <Alert className="border-green-500 bg-green-50">
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>ACTIVE LOCATION:</strong>
              <br />
              Lat: {currentLat.toFixed(6)}
              <br />
              Lng: {currentLng.toFixed(6)}
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Location Buttons */}
        <div className="space-y-2">
          <h3 className="font-semibold">Quick Locations:</h3>
          <div className="grid grid-cols-2 gap-2">
            {locations.map((loc) => (
              <Button
                key={loc.name}
                onClick={() => setLocation(loc.name, loc.lat, loc.lng)}
                variant="outline"
                className="text-sm"
              >
                {loc.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Manual Input */}
        <div className="space-y-2">
          <h3 className="font-semibold">Manual Coordinates:</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Latitude"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              type="number"
              step="any"
            />
            <Input
              placeholder="Longitude"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              type="number"
              step="any"
            />
            <Button onClick={setManualLocation}>SET</Button>
          </div>
        </div>

        {/* GPS Button */}
        <Button onClick={getCurrentLocation} className="w-full" variant="secondary">
          <MapPin className="w-4 h-4 mr-2" />
          Try GPS Location
        </Button>

        {/* Test Items */}
        <Button onClick={addTestItems} className="w-full bg-blue-600 text-white">
          Add Test Items (eggs, milk, bread)
        </Button>

        {/* Instructions */}
        <Alert className="bg-yellow-50 border-yellow-500">
          <AlertDescription className="text-sm">
            <strong>EMERGENCY INSTRUCTIONS:</strong>
            <br />
            1. Click a location button above
            <br />
            2. Verify coordinates appear
            <br />
            3. Add test items
            <br />
            4. Test geofencing tomorrow
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
