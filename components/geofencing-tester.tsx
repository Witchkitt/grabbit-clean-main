"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Bell, MapPin, Target, Play, Square, TestTube } from "lucide-react"
import { useShoppingStore } from "@/lib/shopping-store"
import { geofencingService } from "@/lib/geofencing"

export function GeofencingTester() {
  const [isTestMode, setIsTestMode] = useState(false)
  const [testAlerts, setTestAlerts] = useState<string[]>([])
  const [simulatedLocation, setSimulatedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const { items, addItem } = useShoppingStore()

  // Test stores with exact coordinates
  const testStores = [
    {
      id: "test-safeway",
      name: "Safeway (Test)",
      coordinates: { latitude: 37.8351, longitude: -122.1302 },
      categories: [{ alias: "grocery", title: "Grocery" }],
      distance: 0,
    },
    {
      id: "test-cvs",
      name: "CVS Pharmacy (Test)",
      coordinates: { latitude: 37.8353, longitude: -122.1298 },
      categories: [{ alias: "pharmacy", title: "Pharmacy" }],
      distance: 0,
    },
    {
      id: "test-target",
      name: "Target (Test)",
      coordinates: { latitude: 37.8857, longitude: -122.118 },
      categories: [{ alias: "departmentstores", title: "Department Store" }],
      distance: 0,
    },
  ]

  const addTestItems = () => {
    addItem("eggs") // grocery
    addItem("toothpaste") // pharmacy
    addItem("socks") // department
    setTestAlerts((prev) => [...prev, "✅ Added test items: eggs, toothpaste, socks"])
  }

  const startGeofencingTest = () => {
    const uncompletedItems = items.filter((item) => !item.completed)

    if (uncompletedItems.length === 0) {
      setTestAlerts((prev) => [...prev, "❌ No items on list - add test items first"])
      return
    }

    setIsTestMode(true)
    setTestAlerts((prev) => [...prev, "🎯 Starting geofencing test mode..."])

    // Start geofencing with test stores
    geofencingService.startWatching(
      testStores,
      uncompletedItems,
      (alert) => {
        const alertMsg = `🚨 ALERT: ${alert.storeName} - ${alert.items.map((i) => i.name).join(", ")}`
        setTestAlerts((prev) => [...prev, alertMsg])

        // Show browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`Grabbit Test - ${alert.storeName}`, {
            body: `Don't forget: ${alert.items.map((i) => i.name).join(", ")}`,
            icon: "/images/grabbit-logo.png",
          })
        }
      },
      50, // Very small radius for testing (50 meters)
    )
  }

  const stopGeofencingTest = () => {
    setIsTestMode(false)
    geofencingService.stopWatching()
    setTestAlerts((prev) => [...prev, "🛑 Stopped geofencing test"])
  }

  const simulateNearStore = (store: any) => {
    // Simulate being very close to the store (within 30 meters)
    const lat = store.coordinates.latitude + 0.0001 // ~11 meters offset
    const lng = store.coordinates.longitude + 0.0001

    setSimulatedLocation({ lat, lng })
    setTestAlerts((prev) => [...prev, `📍 Simulating location near ${store.name}`])

    // Manually trigger geofence check
    setTimeout(() => {
      setTestAlerts((prev) => [...prev, `🔍 Checking if alert triggers for ${store.name}...`])
    }, 1000)
  }

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        setTestAlerts((prev) => [...prev, "✅ Notifications enabled"])
        // Test notification
        new Notification("Grabbit Test", {
          body: "Notifications are working!",
          icon: "/images/grabbit-logo.png",
        })
      } else {
        setTestAlerts((prev) => [...prev, "❌ Notifications denied"])
      }
    }
  }

  const clearTestLog = () => {
    setTestAlerts([])
  }

  const uncompletedItems = items.filter((item) => !item.completed)

  return (
    <Card className="border-blue-500 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-600">
          <TestTube className="w-5 h-5" />
          Geofencing Test Lab
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Status */}
        <Alert className={isTestMode ? "border-green-500 bg-green-50" : "border-gray-500"}>
          <Target className="h-4 w-4" />
          <AlertDescription>
            <strong>Test Mode:</strong> {isTestMode ? "🟢 ACTIVE" : "🔴 INACTIVE"}
            <br />
            <strong>Items on List:</strong> {uncompletedItems.length}
            <br />
            <strong>Notifications:</strong>{" "}
            {"Notification" in window && Notification.permission === "granted" ? "✅ Enabled" : "❌ Disabled"}
          </AlertDescription>
        </Alert>

        {/* Setup Steps */}
        <div className="space-y-2">
          <h3 className="font-semibold">Test Setup:</h3>

          {/* Step 1: Enable Notifications */}
          {"Notification" in window && Notification.permission !== "granted" && (
            <Button onClick={requestNotificationPermission} className="w-full" variant="outline">
              <Bell className="w-4 h-4 mr-2" />
              1. Enable Notifications
            </Button>
          )}

          {/* Step 2: Add Test Items */}
          {uncompletedItems.length === 0 && (
            <Button onClick={addTestItems} className="w-full" variant="outline">
              <MapPin className="w-4 h-4 mr-2" />
              2. Add Test Items
            </Button>
          )}

          {/* Step 3: Start Test */}
          {!isTestMode && uncompletedItems.length > 0 && (
            <Button onClick={startGeofencingTest} className="w-full bg-green-600 text-white">
              <Play className="w-4 h-4 mr-2" />
              3. Start Geofencing Test
            </Button>
          )}

          {/* Stop Test */}
          {isTestMode && (
            <Button onClick={stopGeofencingTest} className="w-full bg-red-600 text-white">
              <Square className="w-4 h-4 mr-2" />
              Stop Test
            </Button>
          )}
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

        {/* Test Store Buttons */}
        {isTestMode && (
          <div className="space-y-2">
            <h3 className="font-semibold">Simulate Being Near Store:</h3>
            <div className="grid grid-cols-1 gap-2">
              {testStores.map((store) => (
                <Button
                  key={store.id}
                  onClick={() => simulateNearStore(store)}
                  variant="outline"
                  className="text-sm justify-start"
                >
                  📍 {store.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Simulated Location */}
        {simulatedLocation && (
          <Alert className="border-purple-500 bg-purple-50">
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              <strong>Simulated Location:</strong>
              <br />
              Lat: {simulatedLocation.lat.toFixed(6)}
              <br />
              Lng: {simulatedLocation.lng.toFixed(6)}
            </AlertDescription>
          </Alert>
        )}

        {/* Test Log */}
        {testAlerts.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Test Log:</h3>
              <Button onClick={clearTestLog} size="sm" variant="outline">
                Clear
              </Button>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg max-h-40 overflow-y-auto">
              {testAlerts.map((alert, index) => (
                <div key={index} className="text-sm mb-1 font-mono">
                  {alert}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <Alert className="bg-blue-50 border-blue-500">
          <AlertDescription className="text-sm">
            <strong>How to Test:</strong>
            <br />
            1. Enable notifications
            <br />
            2. Add test items (eggs, toothpaste, socks)
            <br />
            3. Start geofencing test
            <br />
            4. Click "Simulate Being Near Store" buttons
            <br />
            5. Watch for alerts in the log and notifications
            <br />
            <br />
            <strong>If alerts work here, they'll work in real life!</strong>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
