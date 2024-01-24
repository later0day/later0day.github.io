/* PWA loader */

if ('serviceWorker' in navigator) {
  const $notification = $('#notification');
  const $btnRefresh = $('#notification .toast-body>button');

  const baseUrlTag = document.querySelector('meta[name="baseurl"]');
  let swUrl = '/sw.min.js';

  if (baseUrlTag) {
    const baseUrl = baseUrlTag.content;
    swUrl = `${baseUrl}${swUrl}?baseurl=${encodeURIComponent(baseUrl)}`;
  }

  navigator.serviceWorker.register(swUrl).then((registration) => {
    // In case the user ignores the notification
    if (registration.waiting) {
      $notification.toast('show');
    }

    registration.addEventListener('updatefound', () => {
      registration.installing.addEventListener('statechange', () => {
        if (registration.waiting) {
          if (navigator.serviceWorker.controller) {
            $notification.toast('show');
          }
        }
      });
    });

    $btnRefresh.on('click', () => {
      if (registration.waiting) {
        registration.waiting.postMessage('SKIP_WAITING');
      }
      $notification.toast('hide');
    });
  });

  let refreshing = false;

  // Detect controller change and refresh all the opened tabs
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      window.location.reload();
      refreshing = true;
    }
  });
}
