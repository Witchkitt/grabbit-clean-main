"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Play, Square, RefreshCw, Target, Satellite, Zap, RotateCcw, AlertTriangle } from "lucide-react"
import { useGeolocation } from "@/hooks/use-geolocation-real"

export function RealLocationTracker() {
  const [trackingDuration, setTrackingDuration] = useState(0)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)

  const {
    latitude,
    longitude,
    accuracy,
    error,
    loading,
    lastUpdate,
    isTracking,
    movementHistory,
    gpsStatus,
    updateCount,
    staticCount,
    lastMovedTime,
    isStatic,
    startTracking,
    stopTracking,
    getCurrentLocation,
    clearError,
    getDistanceMoved,
    forceUpdate,
    resetTracking,
  } = useGeolocation()

  // Track duration
  useEffect(() => {
    if (isTracking) {
      const id = setInterval(() => {
        setTrackingDuration((prev) => prev + 1)
      }, 1000)
      setIntervalId(id)
    } else {
      if (intervalId) {
        clearInterval(intervalId)
        setIntervalId(null)
      }
      setTrackingDuration(0)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isTracking])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const totalDistance = getDistanceMoved()

  // Calculate time since last movement
  const getStaticTime = () => {
    if (!lastMovedTime) return 0
    return Math.floor((Date.now() - lastMovedTime.getTime()) / 1000)
  }

  return (
    <Card className={isStatic ? "border-red-500 border-2" : "border-green-500 border-2"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <Satellite className="w-5 h-5" />
          SUPER AGGRESSIVE GPS Tracker
          {isTracking && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Static Warning */}
        {isStatic && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ STATIC POSITION DETECTED!</strong>
              <div>GPS is returning the same coordinates for {staticCount} updates.</div>
              <div>Static for {getStaticTime()} seconds.</div>
              <div className="mt-2">
                <Button onClick={resetTracking} size="sm" variant="outline">
                  <RotateCcw className="w-3 h-3 mr-1" /> Reset GPS
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* GPS Status */}
        <Alert
          className={
            isTracking ? (isStatic ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50") : "border-gray-500"
          }
        >
          <Target className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1 text-sm">
              <div>
                <strong>GPS Status:</strong> {gpsStatus}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>Updates:</strong> {updateCount}
                </div>
                <div>
                  <strong>Static:</strong> {staticCount}
                </div>
                <div>
                  <strong>Duration:</strong> {formatDuration(trackingDuration)}
                </div>
                <div>
                  <strong>Distance:</strong> {totalDistance.toFixed(1)}m
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Current Location - LIVE UPDATING */}
        {latitude && longitude && (
          <Alert
            key={`${latitude}-${longitude}-${updateCount}`}
            className={isStatic ? "border-red-500 bg-red-50" : "border-blue-500 bg-blue-50"}
          >
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>🛰️ LIVE GPS Position (Update #{updateCount}):</strong>
                </div>
                <div className="font-mono text-green-600 text-base">Lat: {latitude.toFixed(10)}</div>
                <div className="font-mono text-green-600 text-base">Lng: {longitude.toFixed(10)}</div>
                <div>GPS Accuracy: ±{accuracy ? Math.round(accuracy) : "Unknown"}m</div>
                <div>Last Update: {lastUpdate?.toLocaleTimeString() || "Never"}</div>
                <div className="text-xs text-green-600">🔄 Auto-updating every 2 seconds + continuous watching</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>GPS Error:</strong> {error}
              <div className="mt-2 flex gap-2">
                <Button onClick={clearError} size="sm" variant="outline">
                  Clear Error
                </Button>
                <Button onClick={getCurrentLocation} size="sm" variant="outline">
                  Retry GPS
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isTracking ? (
            <Button onClick={startTracking} className="flex-1 bg-green-600 text-white" disabled={loading}>
              <Play className="w-4 h-4 mr-2" />
              {loading ? "Starting GPS..." : "Start SUPER GPS"}
            </Button>
          ) : (
            <Button onClick={stopTracking} className="flex-1 bg-red-600 text-white">
              <Square className="w-4 h-4 mr-2" />
              Stop GPS
            </Button>
          )}

          <Button onClick={resetTracking} variant="outline" className="bg-purple-100">
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>

          <Button onClick={forceUpdate} variant="outline" disabled={loading} className="bg-yellow-100">
            <Zap className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Force
          </Button>

          <Button onClick={getCurrentLocation} variant="outline" disabled={loading} className="bg-blue-100">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Fresh
          </Button>
        </div>

        {/* Movement History */}
        {movementHistory.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Recent GPS Updates (Last 10):</h3>
            <div className="bg-gray-100 p-3 rounded-lg max-h-40 overflow-y-auto">
              {movementHistory.slice(-10).map((pos, index) => (
                <div
                  key={index}
                  className={`text-xs font-mono mb-1 ${index > 0 && pos.lat === movementHistory[index - 1].lat && pos.lng === movementHistory[index - 1].lng ? "text-red-500" : ""}`}
                >
                  {pos.timestamp.toLocaleTimeString()} [{pos.source}]: {pos.lat.toFixed(10)}, {pos.lng.toFixed(10)}
                  {index > 0 && pos.lat === movementHistory[index - 1].lat && pos.lng === movementHistory[index - 1].lng
                    ? " ⚠️ STATIC"
                    : ""}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debugging Info */}
        <Alert className="bg-yellow-50 border-yellow-500">
          <Satellite className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>STATIC POSITION DETECTION:</strong>
            <br />• This tracker now detects when GPS returns the same coordinates
            <br />• Red warning appears when position is static for multiple updates
            <br />• Use "Reset" button to completely restart GPS tracking
            <br />• Static positions are highlighted in red in the history
            <br />
            <br />
            <strong>Common causes of static GPS:</strong>
            <br />
            1. Browser is returning cached positions (try Reset)
            <br />
            2. Poor GPS signal indoors (go outside)
            <br />
            3. Device GPS hardware issues
            <br />
            4. Browser throttling location updates in background
            <br />
            5. Battery saving mode limiting GPS updates
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
