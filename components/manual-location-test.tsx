"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Navigation } from "lucide-react"

export function ManualLocationTest() {
  const [currentLat, setCurrentLat] = useState<number | null>(null)
  const [currentLng, setCurrentLng] = useState<number | null>(null)
  const [status, setStatus] = useState("")

  // HARDCODED TEST LOCATIONS
  const testLocations = [
    { name: "Test Location 1", lat: 37.8351, lng: -122.1302 },
    { name: "Test Location 2", lat: 37.8357, lng: -122.131 },
    { name: "Test Location 3", lat: 37.8345, lng: -122.1295 },
    { name: "Test Location 4", lat: 37.836, lng: -122.132 },
  ]

  const simulateMovement = (name: string, lat: number, lng: number) => {
    setCurrentLat(lat)
    setCurrentLng(lng)
    setStatus(`Moving to ${name}`)

    // Dispatch a custom event that our location hooks will listen for
    window.dispatchEvent(
      new CustomEvent("locationChanged", {
        detail: { latitude: lat, longitude: lng, accuracy: 10 },
      }),
    )

    // Also try to set it directly in the geolocation mock
    if (navigator.geolocation) {
      // @ts-ignore - adding a test method
      if (navigator.geolocation._setMockLocation) {
        // @ts-ignore
        navigator.geolocation._setMockLocation(lat, lng)
      }
    }

    // Force the position to update by directly calling getCurrentPosition
    if (navigator.geolocation) {
      const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition

      // Temporarily override getCurrentPosition
      navigator.geolocation.getCurrentPosition = (success) => {
        success({
          coords: {
            latitude: lat,
            longitude: lng,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        })
      }

      // Call it to trigger updates
      navigator.geolocation.getCurrentPosition(() => {})

      // Restore the original after a short delay
      setTimeout(() => {
        navigator.geolocation.getCurrentPosition = originalGetCurrentPosition
      }, 100)
    }
  }

  return (
    <Card className="border-purple-500 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-600">
          <Navigation className="w-5 h-5" />
          Test Location Movement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-purple-50">
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            <strong>Test Tool:</strong> Click the buttons below to simulate movement between locations. This will help
            test if the location tracking is working properly.
          </AlertDescription>
        </Alert>

        {status && (
          <Alert className="border-green-500">
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-2">
          {testLocations.map((loc) => (
            <Button
              key={loc.name}
              onClick={() => simulateMovement(loc.name, loc.lat, loc.lng)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loc.name}
            </Button>
          ))}
        </div>

        {currentLat && currentLng && (
          <div className="text-sm font-mono bg-gray-100 p-2 rounded">
            Current Test Position:
            <br />
            Lat: {currentLat.toFixed(6)}
            <br />
            Lng: {currentLng.toFixed(6)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
