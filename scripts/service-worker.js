const scope = new URL(self.registration.scope)
const prefix = 'kids-playground-' + scope.href + '-'
const cacheName = prefix + VERSION

self.addEventListener('install', event => {
  const requests = FILES.map(file => new Request(new URL(file, scope), { cache: 'reload' }))
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(requests)))
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    const older = names.filter(name =>
      name.startsWith(prefix) && name !== cacheName &&
      /^(?:\d{1,10}|[a-f0-9]{16})$/.test(name.slice(prefix.length)),
    )
    await Promise.all(older.map(name => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return

  const home = event.request.mode === 'navigate' &&
    (url.pathname === scope.pathname || url.pathname === new URL('index.html', scope).pathname)
  event.respondWith((async () => {
    const cache = await caches.open(cacheName)
    // Every cached response is a static build file. Vite's Origin header can vary.
    const cached = await cache.match(event.request, { ignoreVary: true })
    if (cached) return cached
    if (home) {
      const shell = await cache.match(new URL('index.html', scope), { ignoreVary: true })
      if (shell) return shell
    }
    return fetch(event.request)
  })())
})
