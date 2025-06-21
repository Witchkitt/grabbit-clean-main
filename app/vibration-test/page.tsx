"use client"

import { DirectVibrationSystem } from "@/components/direct-vibration-system"
import { VibrationAlertSystem } from "@/components/vibration-alert-system"

export default function VibrationTestPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6">Grabbit Vibration Test</h1>

      <DirectVibrationSystem />

      <div className="h-6"></div>

      <VibrationAlertSystem />
    </div>
  )
}
