
const CACHE_NAME='site-cache-v1';
const urlsToCache=["/icons/icon-192.png", "/icons/icon-512.png", "/manifest.webmanifest", "/responsive.css" , '/offline.html'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(urlsToCache))
  );
});
self.addEventListener('fetch', event => {
  if(event.request.mode === 'navigate'){
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
    return;
  }
});
