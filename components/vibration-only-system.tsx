"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Vibrate, Volume2, Bell, Zap } from "lucide-react"

export function VibrationOnlySystem() {
  const [vibrationLog, setVibrationLog] = useState<string[]>([])
  const [isVibrationSupported, setIsVibrationSupported] = useState(false)
  const [lastVibrationTest, setLastVibrationTest] = useState<Date | null>(null)

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMsg = `${timestamp}: ${message}`
    console.log(`📳 ${logMsg}`)
    setVibrationLog((prev) => [...prev.slice(-10), logMsg])
  }, [])

  // Check vibration support on mount
  useEffect(() => {
    const supported = "vibrate" in navigator
    setIsVibrationSupported(supported)
    addLog(`Vibration API supported: ${supported ? "YES" : "NO"}`)
  }, [addLog])

  // SUPER AGGRESSIVE vibration function
  const triggerVibration = useCallback(async () => {
    addLog("🚨 TRIGGERING VIBRATION...")
    setLastVibrationTest(new Date())

    if (!navigator.vibrate) {
      addLog("❌ navigator.vibrate not available")
      return false
    }

    try {
      // Method 1: Long continuous vibration
      addLog("Method 1: Long continuous (2000ms)")
      const result1 = navigator.vibrate(2000)
      addLog(`Result 1: ${result1}`)

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Method 2: Pattern vibration
      addLog("Method 2: Pattern [500,200,500,200,500]")
      const result2 = navigator.vibrate([500, 200, 500, 200, 500])
      addLog(`Result 2: ${result2}`)

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Method 3: Short bursts
      addLog("Method 3: Short bursts [100,50,100,50,100]")
      const result3 = navigator.vibrate([100, 50, 100, 50, 100])
      addLog(`Result 3: ${result3}`)

      // Method 4: Emergency pattern
      await new Promise((resolve) => setTimeout(resolve, 500))
      addLog("Method 4: Emergency pattern [300,100,300,100,300,100,300]")
      const result4 = navigator.vibrate([300, 100, 300, 100, 300, 100, 300])
      addLog(`Result 4: ${result4}`)

      addLog("✅ All vibration methods attempted")
      return true
    } catch (error) {
      addLog(`❌ Vibration error: ${error.message}`)
      return false
    }
  }, [addLog])

  // Audio alert as backup
  const triggerAudio = useCallback(() => {
    addLog("🔊 Triggering audio alert...")

    try {
      // Method 1: Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 1.0)

      addLog("✅ Audio alert played")
    } catch (error) {
      addLog(`❌ Audio error: ${error.message}`)
    }
  }, [addLog])

  // Combined alert (vibration + audio)
  const triggerCombinedAlert = useCallback(async () => {
    addLog("🚨🚨🚨 COMBINED ALERT TRIGGERED! 🚨🚨🚨")

    // Trigger vibration first (most important)
    await triggerVibration()

    // Then audio
    triggerAudio()

    // Browser alert as final fallback
    setTimeout(() => {
      alert("🐰 GRABBIT ALERT!\n\nThis is a test alert with vibration!")
      addLog("📱 Browser alert shown")
    }, 100)
  }, [triggerVibration, triggerAudio, addLog])

  // Listen for location-based alerts from the tracking system
  useEffect(() => {
    const handleLocationAlert = (event: CustomEvent) => {
      addLog("📍 Location alert received from tracking system")
      triggerCombinedAlert()
    }

    // Listen for custom events from the tracking system
    window.addEventListener("grabbitAlert", handleLocationAlert as EventListener)

    return () => {
      window.removeEventListener("grabbitAlert", handleLocationAlert as EventListener)
    }
  }, [triggerCombinedAlert, addLog])

  return (
    <Card className="border-purple-500 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-600">
          <Vibrate className="w-5 h-5" />
          VIBRATION-ONLY System (Tracking Locked 🔒)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vibration Support Status */}
        <Alert className={isVibrationSupported ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
          <Vibrate className="h-4 w-4" />
          <AlertDescription>
            <strong>Vibration API:</strong> {isVibrationSupported ? "✅ SUPPORTED" : "❌ NOT SUPPORTED"}
            <br />
            <strong>Browser:</strong> {navigator.userAgent.includes("Chrome") ? "✅ Chrome" : "⚠️ Other"}
            <br />
            <strong>PWA:</strong>{" "}
            {window && window.matchMedia("(display-mode: standalone)").matches ? "✅ Installed" : "⚠️ Browser"}
          </AlertDescription>
        </Alert>

        {/* Test Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={triggerVibration} className="bg-purple-600 text-white" disabled={!isVibrationSupported}>
            <Vibrate className="w-4 h-4 mr-2" />
            Test Vibration
          </Button>

          <Button onClick={triggerAudio} variant="outline">
            <Volume2 className="w-4 h-4 mr-2" />
            Test Audio
          </Button>

          <Button onClick={triggerCombinedAlert} className="bg-red-600 text-white col-span-2">
            <Zap className="w-4 h-4 mr-2" />
            TEST FULL ALERT (Vibration + Audio + Popup)
          </Button>
        </div>

        {/* Last Test Time */}
        {lastVibrationTest && (
          <Alert className="border-blue-500 bg-blue-50">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <strong>Last vibration test:</strong> {lastVibrationTest.toLocaleTimeString()}
            </AlertDescription>
          </Alert>
        )}

        {/* Vibration Log */}
        {vibrationLog.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Vibration Debug Log:</h3>
              <Button onClick={() => setVibrationLog([])} size="sm" variant="outline">
                Clear
              </Button>
            </div>
            <div className="bg-purple-900 text-purple-100 p-3 rounded-lg max-h-40 overflow-y-auto font-mono text-xs">
              {vibrationLog.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <Alert className="bg-purple-50 border-purple-500">
          <Vibrate className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>🔒 TRACKING SYSTEM IS LOCKED</strong>
            <br />• Location tracking, store detection, and item matching are working
            <br />• This component ONLY handles vibration/alerts
            <br />• Test each method individually to find what works
            <br />• The tracking system will trigger alerts through this component
            <br />
            <br />
            <strong>If vibration doesn't work:</strong>
            <br />
            1. Try the "Test Vibration" button first
            <br />
            2. Check if you're in Chrome browser
            <br />
            3. Ensure PWA is properly installed
            <br />
            4. Audio alerts will work as backup
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
