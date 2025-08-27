// sw.js (ขั้นต่ำสำหรับ PWA + Push)
self.addEventListener('install', ()=> self.skipWaiting());
self.addEventListener('activate', (e)=> e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'MediSafe', body: 'แจ้งเตือนจาก MediSafe' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'MediSafe', {
      body: data.body || '',
      icon: 'medisafelogo.png',
      badge: 'medisafelogo.png'
    })
  );
});

self.addEventListener('notificationclick', (event)=>{
  event.notification.close();
  event.waitUntil(clients.openWindow('./'));
});
