// This is the custom Service Worker injected by next-pwa
// We use this to listen for incoming Push Notifications from the Vercel Cron

self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();

            const options = {
                body: data.body || 'You have new activity in Momentum OS.',
                icon: data.icon || '/icon-192x192.png',
                badge: data.badge || '/icon-192x192.png',
                vibrate: [200, 100, 200, 100, 200, 100, 200], // Fun vibration pattern
                data: {
                    url: data.url || '/'
                }
            };

            event.waitUntil(
                self.registration.showNotification(data.title || 'Momentum OS', options)
            );
        } catch (e) {
            console.error('Error parsing push data', e);
        }
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
