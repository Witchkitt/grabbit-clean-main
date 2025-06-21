const CACHE_NAME = "grabbit-v1"
const urlsToCache = ["/", "/manifest.json", "/images/grabbit-logo.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      return fetch(event.request)
    }),
  )
})

// Handle background sync for notifications
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync())
  }
})

function doBackgroundSync() {
  // Handle background tasks
  return Promise.resolve()
}

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification.tag)

  // Close the notification
  event.notification.close()

  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // If we have a client, focus it
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus()
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow("/")
      }
    }),
  )
})

// Handle notification close events
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag)
})

// Handle push notifications (for future use)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || "/images/grabbit-logo.png",
        badge: "/images/grabbit-logo.png",
        vibrate: [300, 100, 300, 100, 300],
        requireInteraction: true,
        data: data.data,
      }),
    )
  }
})
