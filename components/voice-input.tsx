"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, Plus, AlertCircle, Smartphone } from "lucide-react"
import { useVoiceInput } from "@/hooks/use-voice-input"
import { useShoppingStore } from "@/lib/shopping-store"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function VoiceInput() {
  const [manualInput, setManualInput] = useState("")
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useVoiceInput()
  const addItem = useShoppingStore((state) => state.addItem)
  const [showPermissionAlert, setShowPermissionAlert] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [lastAddedItem, setLastAddedItem] = useState("")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    // Detect mobile device
    if (typeof window !== "undefined") {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }

    // Check microphone permissions
    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === "denied") {
            setShowPermissionAlert(true)
          }

          permissionStatus.onchange = () => {
            setShowPermissionAlert(permissionStatus.state === "denied")
          }
        })
        .catch(() => {
          console.log("Permissions API not fully supported")
        })
    }
  }, [isClient])

  // Auto-add when speech recognition completes
  useEffect(() => {
    if (!isClient) return

    if (transcript && !isListening && transcript !== lastAddedItem) {
      // Remove common wake words
      const cleanedTranscript = transcript.replace(/^(hey grabbit|grabbit|add|i need)/i, "").trim()

      if (cleanedTranscript && cleanedTranscript.length > 1) {
        addItem(cleanedTranscript)
        setLastAddedItem(transcript)

        // Haptic feedback on mobile
        if (isMobile && typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]) // Success pattern
        }

        // Clear transcript after a short delay
        setTimeout(() => {
          resetTranscript()
          setLastAddedItem("")
        }, 2000)
      }
    }
  }, [isClient, transcript, isListening, addItem, resetTranscript, lastAddedItem, isMobile])

  const handleManualAdd = () => {
    if (manualInput.trim()) {
      addItem(manualInput.trim())
      setManualInput("")

      // Haptic feedback on mobile
      if (isClient && isMobile && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(50)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleManualAdd()
    }
  }

  const handleVoiceButtonClick = () => {
    if (!isClient) return

    // Haptic feedback for voice button
    if (isMobile && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(isListening ? 200 : 100)
    }

    if (isListening) {
      stopListening()
    } else {
      resetTranscript()
      setLastAddedItem("")
      startListening()
    }
  }

  if (!isClient) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading voice input...</div>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Add Items</h2>

        {showPermissionAlert && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isMobile
                ? "Microphone access is blocked. Please enable it in your browser settings to use voice input."
                : "Microphone access is blocked. Please enable it in your browser settings to use voice input."}
            </AlertDescription>
          </Alert>
        )}

        {/* Mobile-specific voice tip */}
        {isMobile && isSupported && (
          <Alert className="mb-4">
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              💡 Tip: Speak clearly and the item will be added automatically when you finish speaking.
            </AlertDescription>
          </Alert>
        )}

        {/* Voice Input */}
        {isSupported ? (
          <div className="space-y-3">
            <Button
              onClick={handleVoiceButtonClick}
              size="lg"
              className={`w-full h-20 text-lg font-semibold touch-manipulation ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : "bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white shadow-lg active:scale-95 transition-transform"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-8 h-8 mr-3" />
                  <div className="flex flex-col">
                    <span>Listening...</span>
                    <span className="text-sm opacity-80">Speak now</span>
                  </div>
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8 mr-3" />
                  <div className="flex flex-col">
                    <span>Say Grabbit I need</span>
                    <span className="text-sm opacity-80">Tap and speak</span>
                  </div>
                </>
              )}
            </Button>

            {transcript && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{isListening ? "Listening..." : "Adding to list..."}</p>
                <p className="font-medium bg-muted p-3 rounded-lg text-lg">{transcript}</p>
                {!isListening && <p className="text-sm text-green-600">✓ Item will be added automatically</p>}
              </div>
            )}
          </div>
        ) : (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isMobile
                ? "Voice input is not supported in this browser. Try using Chrome or Samsung Internet for the best experience."
                : "Voice input is not supported in this browser. Please use Chrome, Edge, or Safari for the best experience."}
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Input */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Or type manually:</p>
          <div className="flex gap-2">
            <Input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter item name..."
              className="flex-1 h-12 text-lg"
            />
            <Button
              onClick={handleManualAdd}
              disabled={!manualInput.trim()}
              className="h-12 w-12 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
