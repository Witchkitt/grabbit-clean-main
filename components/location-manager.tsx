"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useShoppingStore } from "@/lib/shopping-store"
import { useGeolocation } from "@/hooks/use-geolocation"
import { geofencingService } from "@/lib/geofencing"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  MapPin,
  Bell,
  AlertCircle,
  RefreshCw,
  Activity,
  Store,
  List,
  Plus,
  Play,
  Clock,
  Wifi,
  CheckCircle,
  Zap,
  Database,
  Navigation,
} from "lucide-react"

// Predefined locations for quick testing
const PREDEFINED_LOCATIONS = [
  { name: "Moraga", lat: 37.8349, lng: -122.13 },
  { name: "Lafayette", lat: 37.8857, lng: -122.118 },
  { name: "Orinda", lat: 37.8771, lng: -122.1802 },
  { name: "Walnut Creek", lat: 37.9101, lng: -122.0652 },
]

export function LocationManager() {
  const [locationEnabled, setLocationEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [stores, setStores] = useState([])
  const [lastAlert, setLastAlert] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [apiStatus, setApiStatus] = useState<string | null>(null)
  const [apiDetails, setApiDetails] = useState<any>(null)
  const [geofencingStatus, setGeofencingStatus] = useState<any>(null)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const [storeSource, setStoreSource] = useState<string>("loading")
  const [isLoading, setIsLoading] = useState(false)
  const [showManualLocation, setShowManualLocation] = useState(false)
  const [manualLat, setManualLat] = useState("")
  const [manualLng, setManualLng] = useState("")
  const [locationUpdateCount, setLocationUpdateCount] = useState(0)
  const [locationMovement, setLocationMovement] = useState<string | null>(null)

  // Refs to prevent infinite loops
  const prevLocationRef = useRef<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })
  const hasAutoFetchedRef = useRef(false)
  const geofencingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initializedRef = useRef(false)

  const {
    latitude,
    longitude,
    accuracy,
    error: locationError,
    loading: locationLoading,
    lastUpdate,
    startWatching,
    stopWatching,
    getCurrentLocation,
    clearError,
    setManualLocation,
  } = useGeolocation()

  const { items, addItem } = useShoppingStore()

  const useLocation = useCallback(
    (name: string, lat: number, lng: number) => {
      setManualLocation(lat, lng)
      setStores([])
      hasAutoFetchedRef.current = false // Reset auto-fetch flag
      setApiStatus(`📍 Location set to ${name}. Fetching stores...`)
    },
    [setManualLocation],
  )

  // Initialize client state only once
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      setIsClient(true)

      // Set Moraga as default location if we don't have one yet
      if (!latitude && !longitude && !locationLoading) {
        setManualLocation(37.8349, -122.13) // Moraga coordinates
      }
    }
  }, []) // Empty dependency array

  // Track location changes (with proper guards)
  useEffect(() => {
    if (latitude && longitude) {
      const prevLat = prevLocationRef.current.lat
      const prevLng = prevLocationRef.current.lng

      if (prevLat !== null && prevLng !== null) {
        // Calculate distance moved
        const distMoved = Math.sqrt(
          Math.pow((latitude - prevLat) * 111000, 2) +
            Math.pow((longitude - prevLng) * 111000 * Math.cos((latitude * Math.PI) / 180), 2),
        )

        setLocationMovement(`Moved ${distMoved.toFixed(1)}m since last update`)
      }

      // Only update if location actually changed
      if (prevLat !== latitude || prevLng !== longitude) {
        prevLocationRef.current = { lat: latitude, lng: longitude }
        setLocationUpdateCount((prev) => prev + 1)
      }
    }
  }, [latitude, longitude])

  // Monitor geofencing status (with cleanup)
  useEffect(() => {
    if (!isClient) return

    geofencingIntervalRef.current = setInterval(() => {
      const status = geofencingService.getStatus()
      setGeofencingStatus(status)
      setIsActive(geofencingService.isGeofencingActive())
    }, 5000) // Increased interval to reduce load

    return () => {
      if (geofencingIntervalRef.current) {
        clearInterval(geofencingIntervalRef.current)
      }
    }
  }, [isClient])

  // Check notification permission only once
  useEffect(() => {
    if (isClient && typeof window !== "undefined" && "Notification" in window) {
      const granted = Notification.permission === "granted"
      setNotificationsEnabled(granted)
    }
  }, [isClient])

  // Auto-fetch stores when location is available (with guards to prevent infinite loops)
  useEffect(() => {
    if (
      isClient &&
      latitude &&
      longitude &&
      locationEnabled &&
      stores.length === 0 &&
      !isLoading &&
      !hasAutoFetchedRef.current
    ) {
      hasAutoFetchedRef.current = true
      fetchNearbyStores()
    }
  }, [isClient, latitude, longitude, locationEnabled, stores.length, isLoading])

  const fetchNearbyStores = useCallback(
    async (forceRefresh = false) => {
      if (!latitude || !longitude || isLoading) return

      setIsLoading(true)
      setApiStatus("🔍 Fetching stores...")
      setLastFetchTime(new Date())

      try {
        const params = new URLSearchParams({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          radius: "5000",
          limit: "20",
        })

        if (forceRefresh) {
          params.append("force", "true")
        }

        const response = await fetch(`/api/stores?${params}`)

        const data = await response.json()
        const foundStores = data.stores || []

        setStores(foundStores)
        setStoreSource(data.meta?.source || "unknown")

        // Set status based on source
        if (data.meta?.source === "yelp_live") {
          setApiStatus(`🔥 SUCCESS! ${foundStores.length} LIVE stores from Yelp API`)
          setApiDetails({
            isLiveData: true,
            timestamp: data.meta.timestamp,
            note: data.meta.note,
          })
        } else if (data.meta?.source === "cache") {
          const age = data.meta.age_minutes || 0
          setApiStatus(`✅ ${foundStores.length} stores (cached ${age}min ago)`)
          setApiDetails({
            cacheAge: age,
            isLiveData: false,
          })
        } else if (data.meta?.source === "fallback") {
          setApiStatus(`⚠️ ${foundStores.length} fallback stores (${data.meta.reason})`)
          setApiDetails({
            reason: data.meta.reason,
            isLiveData: false,
            nextRequestIn: data.meta.next_request_in,
            status: data.meta.status,
            details: data.meta.details,
            error_data: data.meta.error_data,
            debug_info: data.meta.debug_info,
          })
        }

        console.log(`✅ Loaded ${foundStores.length} stores from ${data.meta?.source}`)
      } catch (error) {
        setApiStatus("❌ Error loading stores")
        setApiDetails({
          error: error.message,
        })
        console.error("Error fetching stores:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [latitude, longitude, isLoading],
  )

  const forceLocationUpdate = useCallback(() => {
    console.log("🔄 Forcing location update...")
    getCurrentLocation()
    setStores([])
    hasAutoFetchedRef.current = false // Reset auto-fetch flag
    setApiStatus("🔄 Refreshing location and stores...")
  }, [getCurrentLocation])

  const forceRefreshStores = useCallback(() => {
    console.log("🔥 Forcing store refresh with API call...")
    fetchNearbyStores(true)
  }, [fetchNearbyStores])

  const handleManualLocation = useCallback(() => {
    const lat = Number.parseFloat(manualLat)
    const lng = Number.parseFloat(manualLng)

    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setManualLocation(lat, lng)
      setShowManualLocation(false)
      setManualLat("")
      setManualLng("")
      // Clear stores to force refresh
      setStores([])
      hasAutoFetchedRef.current = false // Reset auto-fetch flag
    } else {
      alert("Please enter valid coordinates (latitude: -90 to 90, longitude: -180 to 180)")
    }
  }, [manualLat, manualLng, setManualLocation])

  const addTestItems = useCallback(() => {
    addItem("eggs")
    addItem("milk")
    addItem("bread")
  }, [addItem])

  const startGeofencing = useCallback(() => {
    if (stores.length === 0) return

    const uncompletedItems = items.filter((item) => !item.completed)
    if (uncompletedItems.length === 0) return

    geofencingService.startWatching(
      stores,
      uncompletedItems,
      (alert) => {
        const alertMsg = `${alert.storeName}: ${alert.items.map((i) => i.name).join(", ")}`
        setLastAlert(alertMsg)
      },
      200,
    )
  }, [stores, items])

  // Auto-manage geofencing (with proper dependencies)
  useEffect(() => {
    if (
      isClient &&
      locationEnabled &&
      notificationsEnabled &&
      stores.length > 0 &&
      items.length > 0 &&
      latitude &&
      longitude
    ) {
      const uncompletedItems = items.filter((item) => !item.completed)
      if (uncompletedItems.length > 0) {
        startGeofencing()
      }
    } else {
      if (isClient) {
        geofencingService.stopWatching()
      }
    }

    return () => {
      if (isClient) {
        geofencingService.stopWatching()
      }
    }
  }, [
    isClient,
    locationEnabled,
    notificationsEnabled,
    stores.length,
    items.length,
    latitude,
    longitude,
    startGeofencing,
  ])

  // Handle location tracking toggle
  useEffect(() => {
    if (isClient) {
      if (locationEnabled) {
        startWatching()
      } else {
        stopWatching()
      }
    }
  }, [isClient, locationEnabled, startWatching, stopWatching])

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission()
        setNotificationsEnabled(permission === "granted")

        if (permission === "granted") {
          new Notification("Grabbit Notifications Enabled", {
            body: "You'll now receive alerts when near stores!",
            icon: "/images/grabbit-logo.png",
          })
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error)
      }
    }
  }, [])

  if (!isClient) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading location features...</div>
        </CardContent>
      </Card>
    )
  }

  const uncompletedItems = items.filter((item) => !item.completed)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Store Alerts
          {isActive && <Activity className="w-4 h-4 text-green-500 animate-pulse" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Tracking Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <Label htmlFor="location-toggle">Enable Location Tracking</Label>
          </div>
          <Switch id="location-toggle" checked={locationEnabled} onCheckedChange={setLocationEnabled} />
        </div>

        {/* Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <Label htmlFor="notifications-toggle">Store Alert Notifications</Label>
          </div>
          {notificationsEnabled ? (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Enabled
            </span>
          ) : (
            <Button onClick={requestNotificationPermission} size="sm">
              Enable
            </Button>
          )}
        </div>

        {/* Location Status */}
        {locationEnabled && (
          <div className="space-y-3">
            {locationError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div>{locationError}</div>
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={forceLocationUpdate} size="sm" variant="outline">
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry
                      </Button>
                      <Button onClick={() => setShowManualLocation(!showManualLocation)} size="sm" variant="outline">
                        <Navigation className="w-4 h-4 mr-1" />
                        Set Location
                      </Button>
                      <Button onClick={clearError} size="sm" variant="outline">
                        Clear Error
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : locationLoading ? (
              <Alert>
                <Wifi className="h-4 w-4 animate-pulse" />
                <AlertDescription>🔍 Getting your location...</AlertDescription>
              </Alert>
            ) : latitude && longitude ? (
              <Alert className="border-green-500">
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  ✅ Location: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  <br />🎯 Accuracy: {accuracy ? Math.round(accuracy) : "Unknown"}m
                  <br />📍 Found {stores.length} nearby stores
                  <br />⏰ Last update: {lastUpdate?.toLocaleTimeString() || "Never"}
                  <br />🔄 Updates: {locationUpdateCount} {locationMovement && `(${locationMovement})`}
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <Button onClick={forceLocationUpdate} size="sm" variant="outline">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh Location
                    </Button>
                    <Button onClick={() => setShowManualLocation(!showManualLocation)} size="sm" variant="outline">
                      <Navigation className="w-4 h-4 mr-1" />
                      Change Location
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>Initializing location services...</AlertDescription>
              </Alert>
            )}

            {/* Quick Location Selector */}
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_LOCATIONS.map((loc) => (
                <Button
                  key={loc.name}
                  onClick={() => useLocation(loc.name, loc.lat, loc.lng)}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  {loc.name}
                </Button>
              ))}
            </div>

            {/* Manual Location Input */}
            {showManualLocation && (
              <Alert>
                <Navigation className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <strong>Set Manual Location:</strong>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Latitude"
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Longitude"
                        value={manualLng}
                        onChange={(e) => setManualLng(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleManualLocation} size="sm">
                        Set
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* API Status */}
        {apiStatus && (
          <Alert
            className={
              apiStatus.includes("🔥") || apiStatus.includes("SUCCESS")
                ? "border-green-500 bg-green-50"
                : apiStatus.includes("❌")
                  ? "border-red-500"
                  : apiStatus.includes("⚠️")
                    ? "border-yellow-500"
                    : "border-blue-500"
            }
          >
            <Store className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <strong>Store Data Status:</strong>
                <div className="text-sm font-medium">{apiStatus}</div>

                {/* Live Data Indicator */}
                {storeSource === "yelp_live" && apiDetails?.isLiveData && (
                  <div className="text-xs text-green-700 bg-green-100 p-2 rounded flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <strong>🔥 LIVE YELP DATA!</strong> Fresh from the API
                  </div>
                )}

                {/* Cache Indicator */}
                {storeSource === "cache" && (
                  <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    Cached data ({apiDetails?.cacheAge} min old)
                  </div>
                )}

                {/* Fallback Indicator */}
                {storeSource === "fallback" && (
                  <div className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                    <strong>Fallback mode:</strong> {apiDetails?.reason}
                    {apiDetails?.nextRequestIn && <div>Next API attempt in {apiDetails.nextRequestIn}s</div>}
                  </div>
                )}

                {lastFetchTime && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last updated: {lastFetchTime.toLocaleTimeString()}
                  </div>
                )}
              </div>

              {/* Detailed Error Information */}
              {apiDetails && (storeSource === "fallback" || apiDetails.error) && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs space-y-1">
                  <div>
                    <strong>Debug Info:</strong>
                  </div>
                  {apiDetails.status && <div>HTTP Status: {apiDetails.status}</div>}
                  {apiDetails.details && <div>Error: {apiDetails.details}</div>}
                  {apiDetails.error_data && <div>Yelp Error: {JSON.stringify(apiDetails.error_data, null, 2)}</div>}
                  {apiDetails.debug_info && (
                    <div>
                      API Key: {apiDetails.debug_info.api_key_present ? "✅ Present" : "❌ Missing"}
                      {apiDetails.debug_info.api_key_length && ` (${apiDetails.debug_info.api_key_length} chars)`}
                    </div>
                  )}
                  {apiDetails.reason && <div>Reason: {apiDetails.reason}</div>}
                  {apiDetails.nextRequestIn && <div>Next attempt in: {apiDetails.nextRequestIn}s</div>}
                  {apiDetails.error && <div>Network Error: {apiDetails.error}</div>}
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <Button onClick={() => fetchNearbyStores()} size="sm" variant="outline" disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                  {isLoading ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Geofencing Status */}
        {geofencingStatus && (
          <Alert className={isActive ? "border-green-500" : "border-red-500"}>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>
                  <strong>Geofencing Status:</strong>
                  <br />
                  Active: {isActive ? "✅ Yes" : "❌ No"}
                  <br />
                  Stores: {geofencingStatus.storeCount}
                  <br />
                  Items: {geofencingStatus.itemCount}
                  <br />
                  Radius: {geofencingStatus.radiusMeters}m
                </div>

                {!isActive && stores.length > 0 && uncompletedItems.length > 0 && (
                  <Button onClick={startGeofencing} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Play className="w-4 h-4 mr-2" />
                    Start Geofencing
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Items */}
        {uncompletedItems.length > 0 ? (
          <Alert>
            <List className="h-4 w-4" />
            <AlertDescription>
              <strong>Items on list ({uncompletedItems.length}):</strong>
              <div className="mt-1 flex flex-wrap gap-1">
                {uncompletedItems.map((item) => (
                  <Badge key={item.id} variant="secondary" className="text-xs">
                    {item.name} ({item.primaryCategory?.name})
                  </Badge>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>No items on shopping list - alerts won't trigger</span>
              <Button onClick={addTestItems} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Test Items
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Last Alert */}
        {lastAlert && (
          <Alert className="border-blue-500">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <strong>Last Alert:</strong> {lastAlert}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
