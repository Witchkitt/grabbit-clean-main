/**
 * ⚠️ STABLE SETTINGS COMPONENT - DO NOT ADD NEW FEATURES ⚠️
 *
 * This settings component is complete and working.
 * User specifically requested NO additional features.
 *
 * Status: LOCKED - Perfect as is
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { SettingsIcon, Volume2, Vibrate, Mic, HelpCircle, Trash2, MapPin } from "lucide-react"
import { useState } from "react"

// ⚠️ DO NOT ADD NEW SETTINGS - COMPONENT IS COMPLETE ⚠️
export function Settings() {
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [soundVolume, setSoundVolume] = useState([75])
  const [vibrationStrength, setVibrationStrength] = useState([50])
  const [alertRadius, setAlertRadius] = useState([500])

  const clearAllData = () => {
    if (confirm("This will delete ALL your data and reload the app. Are you sure?")) {
      localStorage.clear()
      sessionStorage.clear()

      if ("indexedDB" in window) {
        indexedDB.deleteDatabase("grabbit-shopping-list")
      }

      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name)
          })
        })
      }

      window.location.reload()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Voice Settings - STABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              <Label htmlFor="voice">Enable Voice Input</Label>
            </div>
            <Switch id="voice" checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Location Alerts - STABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Store Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <Label>Alert Distance (when you're near a store)</Label>
            </div>
            <Slider
              value={alertRadius}
              onValueChange={setAlertRadius}
              min={100}
              max={1000}
              step={50}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">{alertRadius[0]} meters</p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings - STABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <Label>Sound Volume</Label>
            </div>
            <Slider value={soundVolume} onValueChange={setSoundVolume} max={100} step={1} className="w-full" />
            <p className="text-sm text-muted-foreground">{soundVolume[0]}%</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Vibrate className="w-4 h-4" />
              <Label>Vibration Strength</Label>
            </div>
            <Slider
              value={vibrationStrength}
              onValueChange={setVibrationStrength}
              max={100}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">{vibrationStrength[0]}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Reset App - STABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Reset App</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Clear all app data and cache to fix any issues</p>
          <Button variant="destructive" className="w-full" onClick={clearAllData}>
            <Trash2 className="w-4 h-4 mr-2" />
            Reset Everything
          </Button>
          <p className="text-xs text-red-500">⚠️ This will delete your shopping list and reload the app</p>
        </CardContent>
      </Card>

      {/* App Info - STABLE */}
      <Card>
        <CardHeader>
          <CardTitle>App Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="text-muted-foreground">1.0.1 Beta</span>
          </div>
          <Button variant="outline" className="w-full">
            <HelpCircle className="w-4 h-4 mr-2" />
            Help & Support
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
