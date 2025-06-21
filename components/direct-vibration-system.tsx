"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, Zap, AlertTriangle, Vibrate } from "lucide-react"
import { useShoppingStore } from "@/lib/shopping-store"

export function DirectVibrationSystem() {
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [isActive, setIsActive] = useState(false)
  const [lastVibration, setLastVibration] = useState<Date | null>(null)
  const { items } = useShoppingStore()

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `${timestamp}: ${message}`
    console.log(`📳 ${logMessage}`)
    setDebugLog((prev) => [logMessage, ...prev.slice(0, 19)])
  }, [])

  // DIRECT vibration function - no dependencies, no complex logic
  const triggerVibration = useCallback(() => {
    addLog("🔔 Attempting to vibrate...")

    try {
      // Method 1: Standard Vibration API
      if ("vibrate" in navigator) {
        // Try multiple patterns with increasing intensity
        const pattern = [1000, 300, 1000, 300, 1000, 300, 1000]
        navigator.vibrate(pattern)
        addLog(`✅ Vibration API called with pattern: ${pattern.join(",")}ms`)
      } else {
        addLog("❌ Vibration API not available")
      }

      // Show confirmation
      setLastVibration(new Date())

      // Also show an alert for testing
      setTimeout(() => {
        alert("VIBRATION TEST - Did your phone vibrate?")
      }, 1500) // Give vibration time to happen first
    } catch (error) {
      addLog(`❌ Vibration error: ${error.message}`)
    }
  }, [addLog])

  // Alternative vibration method using repeated calls
  const triggerAggressiveVibration = useCallback(() => {
    addLog("🔔 Attempting AGGRESSIVE vibration...")

    try {
      if ("vibrate" in navigator) {
        // First vibration
        navigator.vibrate(2000)
        addLog("✅ First vibration: 2000ms")

        // Second vibration after a delay
        setTimeout(() => {
          navigator.vibrate([500, 200, 500, 200, 500])
          addLog("✅ Second vibration: pattern")
        }, 2500)

        // Third vibration after another delay
        setTimeout(() => {
          navigator.vibrate(3000)
          addLog("✅ Third vibration: 3000ms")
        }, 5000)
      } else {
        addLog("❌ Vibration API not available")
      }

      setLastVibration(new Date())
    } catch (error) {
      addLog(`❌ Vibration error: ${error.message}`)
    }
  }, [addLog])

  // Continuous vibration test
  const startContinuousVibration = useCallback(() => {
    addLog("🔄 Starting continuous vibration test...")
    setIsActive(true)

    // Vibrate immediately
    if ("vibrate" in navigator) {
      navigator.vibrate(1000)
      addLog("✅ Initial vibration: 1000ms")
    }

    // Set up interval for continuous vibration
    const interval = setInterval(() => {
      if ("vibrate" in navigator) {
        navigator.vibrate(500)
        addLog("✅ Interval vibration: 500ms")
      }
    }, 2000) // Every 2 seconds

    // Clean up after 10 seconds
    setTimeout(() => {
      clearInterval(interval)
      setIsActive(false)
      addLog("🛑 Continuous vibration stopped")
    }, 10000) // Stop after 10 seconds
  }, [addLog])

  // Check vibration support on mount
  useEffect(() => {
    if ("vibrate" in navigator) {
      addLog("✅ Vibration API is supported on this device")
    } else {
      addLog("❌ Vibration API is NOT supported on this device")
    }
  }, [addLog])

  return (
    <Card className="border-purple-500 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-600">
          <Vibrate className="w-5 h-5" />
          Direct Vibration System
          {isActive && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-purple-500 bg-purple-50">
          <Bell className="h-4 w-4" />
          <AlertDescription>
            <strong>Direct Vibration Test</strong>
            <p className="text-sm mt-1">
              This component tests vibration directly with no dependencies or complex logic. Click the buttons below to
              test different vibration patterns.
            </p>
          </AlertDescription>
        </Alert>

        {/* Vibration Support */}
        <Alert className={"vibrate" in navigator ? "border-green-500" : "border-red-500"}>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>Vibration Support:</strong> {"vibrate" in navigator ? "✅ SUPPORTED" : "❌ NOT SUPPORTED"}
          </AlertDescription>
        </Alert>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 gap-3">
          <Button onClick={triggerVibration} className="bg-purple-600 hover:bg-purple-700">
            <Vibrate className="w-4 h-4 mr-2" />
            Test Simple Vibration
          </Button>

          <Button onClick={triggerAggressiveVibration} className="bg-red-600 hover:bg-red-700">
            <Zap className="w-4 h-4 mr-2" />
            Test AGGRESSIVE Vibration
          </Button>

          <Button onClick={startContinuousVibration} disabled={isActive} className="bg-blue-600 hover:bg-blue-700">
            <Bell className="w-4 h-4 mr-2" />
            Test Continuous Vibration (10s)
          </Button>
        </div>

        {/* Last Vibration */}
        {lastVibration && (
          <Alert className="border-green-500 bg-green-50">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <strong>Last vibration attempt:</strong> {lastVibration.toLocaleTimeString()}
            </AlertDescription>
          </Alert>
        )}

        {/* Debug Log */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Vibration Log:</h3>
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

        {/* Instructions */}
        <Alert className="bg-yellow-50 border-yellow-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Troubleshooting Tips:</strong>
            <br />• Make sure your phone is not in silent/vibrate mode
            <br />• Try with the app in the foreground
            <br />• Some browsers require user interaction before vibration
            <br />• Try installing as a PWA for better permissions
            <br />• If nothing works, try the "AGGRESSIVE" option
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
