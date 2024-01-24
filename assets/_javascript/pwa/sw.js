/* PWA service worker */

function verifyHost(url) {
  for (const host of swconf.allowHosts) {
    const regex = RegExp(`^http(s)?://${host}/`);
    if (regex.test(url)) {
      return true;
    }
  }
  return false;
}

function verifyPath(url) {
  const requestPath = new URL(url).pathname;

  for (const path of swconf.denyPaths) {
    if (requestPath.startsWith(path)) {
      return false;
    }
  }
  return true;
}

self.addEventListener('install', (event) => {
  const swconfPath = '/assets/js/data/swconf.js';
  const params = new URL(location).searchParams;

  const swconfUrl = params.has('baseurl')
    ? `${params.get('baseurl')}${swconfPath}`
    : swconfPath;

  importScripts(swconfUrl);
  swconf.allowHosts.push(location.host);

  event.waitUntil(
    caches.open(swconf.cacheName).then((cache) => {
      return cache.addAll(swconf.resources);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== swconf.cacheName) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        if (
          event.request.method !== 'GET' ||
          !verifyHost(url) ||
          !verifyPath(url)
        ) {
          return response;
        }

        // See : <https://developers.google.com/web/fundamentals/primers/service-workers#cache_and_return_requests>
        let responseToCache = response.clone();

        caches.open(swconf.cacheName).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});
