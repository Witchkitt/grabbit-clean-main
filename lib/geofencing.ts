"use client"

import type { YelpBusiness } from "./yelp-api"
import type { ShoppingItem } from "./categorization"
import { mapYelpBusinessToGrabbitCategories } from "./yelp-api"

interface GeofenceAlert {
  storeId: string
  storeName: string
  items: ShoppingItem[]
  distance: number
}

export class GeofencingService {
  private watchId: number | null = null
  private intervalId: number | null = null
  private lastPosition: GeolocationPosition | null = null
  private alertCallback: ((alert: GeofenceAlert) => void) | null = null
  private alertedStores = new Set<string>()
  private stores: YelpBusiness[] = []
  private items: ShoppingItem[] = []
  private radiusMeters = 200
  private isActive = false

  constructor() {
    // Request notification permission on startup
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }

  startWatching(
    stores: YelpBusiness[],
    items: ShoppingItem[],
    onAlert: (alert: GeofenceAlert) => void,
    radiusMeters = 200,
  ) {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      console.error("❌ Geolocation not supported")
      return
    }

    // Stop any existing watching
    this.stopWatching()

    // Validate inputs
    if (!stores || stores.length === 0) {
      console.error("❌ No stores provided for geofencing")
      return
    }

    if (!items || items.length === 0) {
      console.error("❌ No items provided for geofencing")
      return
    }

    if (!onAlert || typeof onAlert !== "function") {
      console.error("❌ No valid alert callback provided")
      return
    }

    this.stores = stores
    this.items = items.filter((item) => !item.completed)
    this.alertCallback = onAlert
    this.radiusMeters = Math.max(radiusMeters, 200) // Minimum 200m
    this.isActive = true
    this.alertedStores.clear()

    console.log(
      `🎯 Starting geofencing: ${stores.length} stores, ${this.items.length} items, ${this.radiusMeters}m radius`,
    )

    // ✅ START BOTH METHODS FOR MAXIMUM RELIABILITY
    this.startLocationWatching()
    this.startIntervalChecking()

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log(
          `📍 Initial position: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
        )
        this.lastPosition = position
        this.checkGeofences(position)
      },
      (error) => {
        console.error("📍 Initial position error:", error)
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  private startLocationWatching() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return

    console.log("📍 Starting location watching...")

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.lastPosition = position
          this.checkGeofences(position)
          console.log(`📍 Location: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`)
        },
        (error) => {
          console.error("📍 Location error:", error)
          // Don't stop on timeout errors
          if (error.code !== error.TIMEOUT) {
            console.log("📍 Location error - continuing with interval method")
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 60000,
        },
      )

      console.log(`📍 Location watching started (ID: ${this.watchId})`)
    } catch (error) {
      console.error("❌ Error starting location watching:", error)
    }
  }

  private startIntervalChecking() {
    console.log("⏰ Starting interval location checking...")

    this.intervalId = setInterval(() => {
      if (!this.isActive) return

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.lastPosition = position
          this.checkGeofences(position)
        },
        (error) => {
          console.log("⏰ Interval position error:", error.message)
          // Use last known position if available
          if (this.lastPosition) {
            this.checkGeofences(this.lastPosition)
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 120000,
        },
      )
    }, 30000) // Check every 30 seconds

    console.log(`⏰ Interval checking started (ID: ${this.intervalId})`)
  }

  stopWatching() {
    console.log("🛑 Stopping geofencing...")

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }

    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.isActive = false
    this.alertCallback = null
    this.alertedStores.clear()
    this.lastPosition = null

    console.log("🛑 Geofencing stopped")
  }

  private checkGeofences(position: GeolocationPosition) {
    const userLat = position.coords.latitude
    const userLng = position.coords.longitude

    this.stores.forEach((store) => {
      const distance = this.calculateDistance(userLat, userLng, store.coordinates.latitude, store.coordinates.longitude)

      // Check if user is within geofence radius
      if (distance <= this.radiusMeters && !this.alertedStores.has(store.id)) {
        console.log(`📍 Within ${this.radiusMeters}m of ${store.name} (${Math.round(distance)}m away)`)

        // Find relevant items for this store
        const relevantItems = this.getRelevantItems(store, this.items)

        if (relevantItems.length > 0) {
          const alert: GeofenceAlert = {
            storeId: store.id,
            storeName: store.name,
            items: relevantItems,
            distance: distance,
          }

          this.alertedStores.add(store.id)
          this.triggerAlert(alert)
        }
      }

      // Reset alert if user moves far away (3x radius)
      if (distance > this.radiusMeters * 3) {
        if (this.alertedStores.has(store.id)) {
          console.log(`🚶 Moved away from ${store.name} - resetting alert`)
          this.alertedStores.delete(store.id)
        }
      }
    })
  }

  private getRelevantItems(store: YelpBusiness, items: ShoppingItem[]): ShoppingItem[] {
    const storeGrabbitCategories = mapYelpBusinessToGrabbitCategories(store)

    const relevantItems = items.filter((item) => {
      if (item.completed) return false

      // Handle multi-category format
      if (item.allCategories && Array.isArray(item.allCategories)) {
        return item.allCategories.some((category) => storeGrabbitCategories.includes(category.id))
      }

      // Fallback for old format
      const categoryId = item.primaryCategory?.id
      return categoryId ? storeGrabbitCategories.includes(categoryId) : false
    })

    return relevantItems
  }

  private async triggerAlert(alert: GeofenceAlert) {
    // 🚨 TRIGGER VIBRATION SYSTEM (NEW)
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("grabbitAlert", {
          detail: { storeName: alert.storeName, items: alert.items, distance: alert.distance },
        }),
      )
    }
    const itemNames = alert.items.map((item) => item.name).join(", ")
    const message = `Don't forget: ${itemNames}`

    console.log(`🚨 ALERT: ${alert.storeName} - ${message}`)

    // ✅ SHOW NOTIFICATION
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        // Try Service Worker notification first
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready
          if (registration && registration.showNotification) {
            await registration.showNotification(`🐰 Grabbit - ${alert.storeName}`, {
              body: `🛒 ${message}`,
              icon: "/images/grabbit-logo.png",
              badge: "/images/grabbit-logo.png",
              tag: `grabbit-${alert.storeId}`,
              requireInteraction: true,
              silent: false,
              renotify: true,
              vibrate: [500, 200, 500, 200, 500],
            })
            console.log("📱 Service Worker notification sent")
          }
        } else {
          // Fallback to direct notification
          const notification = new Notification(`🐰 Grabbit - ${alert.storeName}`, {
            body: `🛒 ${message}`,
            icon: "/images/grabbit-logo.png",
            tag: `grabbit-${alert.storeId}`,
            requireInteraction: true,
            silent: false,
            renotify: true,
            vibrate: [500, 200, 500, 200, 500],
          })
          console.log("📱 Direct notification sent")
        }
      } catch (error) {
        console.error("❌ Notification error:", error)
      }
    }

    // ✅ VIBRATION
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      const vibratePattern = [500, 200, 500, 200, 500, 200, 300, 100, 300]
      navigator.vibrate(vibratePattern)
      console.log("📳 Vibration triggered")
    }

    // ✅ AUDIO ALERT
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.3)

      console.log("🔊 Audio alert played")
    } catch (error) {
      console.log("🔇 Audio alert not available")
    }

    // Call the callback
    if (this.alertCallback) {
      this.alertCallback(alert)
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  // ✅ PUBLIC METHODS FOR STATUS CHECKING
  public isGeofencingActive(): boolean {
    const hasRequirements = this.isActive && this.stores.length > 0 && this.items.length > 0
    const hasActiveTracking = this.watchId !== null || this.intervalId !== null
    return hasRequirements && hasActiveTracking
  }

  public getStatus() {
    return {
      isActive: this.isActive,
      watchId: this.watchId,
      intervalId: this.intervalId,
      storeCount: this.stores.length,
      itemCount: this.items.length,
      alertedStores: Array.from(this.alertedStores),
      lastPosition: this.lastPosition
        ? {
            lat: this.lastPosition.coords.latitude,
            lng: this.lastPosition.coords.longitude,
            timestamp: this.lastPosition.timestamp,
          }
        : null,
      radiusMeters: this.radiusMeters,
    }
  }
}

// Global instance
export const geofencingService = new GeofencingService()
