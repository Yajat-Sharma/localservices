self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.message,
      icon: data.icon || "/icon-192.png",
      badge: "/icon-192.png",
      data: { link: data.link },
      vibrate: [100, 50, 100],
      actions: [
        { action: "open", title: "Open App" },
        { action: "close", title: "Dismiss" },
      ],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;
  const link = event.notification.data?.link || "/";
  event.waitUntil(clients.openWindow(link));
});