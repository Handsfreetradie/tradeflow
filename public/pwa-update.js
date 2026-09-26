// Registers the service worker and shows an "Update now" banner when a new version is ready.
//
// This is a plain, unbundled static file (loaded via a <script> tag in index.html) rather than
// TypeScript imported into the main app bundle. That's deliberate: this project's build (Vite 8
// on its new Rolldown bundler) was silently eliminating this exact logic no matter how it was
// written or where it was called from — confirmed even for a bare top-level console.log, even
// unminified, even from inside a React effect. Keeping it outside the bundled/tree-shaken graph
// entirely sidesteps that bug rather than fighting it.
//
// A new version never applies itself: the worker sits in "waiting" (see src/sw.ts, which only
// calls self.skipWaiting() on an explicit SKIP_WAITING message) until the user taps "Update now".
// Update checks happen on load (registration itself), whenever the tab/PWA returns to the
// foreground, and every 30 minutes while it's open.
(function () {
  if (!('serviceWorker' in navigator)) return

  var UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000
  var reloaded = false

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (reloaded) return
    reloaded = true
    window.location.reload()
  })

  function showUpdateBanner(waitingWorker) {
    if (document.getElementById('pwa-update-banner')) return

    var banner = document.createElement('div')
    banner.id = 'pwa-update-banner'
    banner.setAttribute(
      'style',
      'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);' +
        'z-index:2147483647;display:flex;align-items:center;gap:12px;' +
        'background:#fff;color:#0f172a;border:1px solid #e2e8f0;border-radius:12px;' +
        'box-shadow:0 10px 25px -5px rgba(0,0,0,0.15),0 8px 10px -6px rgba(0,0,0,0.1);' +
        'padding:10px 14px;font:500 13px/1.4 Inter,system-ui,-apple-system,sans-serif;' +
        'max-width:calc(100vw - 32px);'
    )

    var label = document.createElement('span')
    label.textContent = 'A new version is available'
    banner.appendChild(label)

    var button = document.createElement('button')
    button.textContent = 'Update now'
    button.setAttribute(
      'style',
      'background:#2563eb;color:#fff;border:none;border-radius:8px;padding:6px 12px;' +
        'font:600 13px/1.4 Inter,system-ui,-apple-system,sans-serif;cursor:pointer;white-space:nowrap;'
    )
    button.addEventListener('click', function () {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
      button.disabled = true
      button.textContent = 'Updating…'
    })
    banner.appendChild(button)

    document.body.appendChild(banner)
  }

  navigator.serviceWorker
    .register('/sw.js')
    .then(function (registration) {
      if (registration.waiting && navigator.serviceWorker.controller) {
        showUpdateBanner(registration.waiting)
      }

      registration.addEventListener('updatefound', function () {
        var newWorker = registration.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', function () {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner(newWorker)
          }
        })
      })

      setInterval(function () {
        registration.update().catch(function () {})
      }, UPDATE_CHECK_INTERVAL_MS)

      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
          registration.update().catch(function () {})
        }
      })
    })
    .catch(function (error) {
      console.error('Service worker registration failed', error)
    })
})()
