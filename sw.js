// Service Worker — Portal de Oportunidades
// Estratégia network-first: sempre tenta a rede (pega a versão mais nova),
// e usa o cache só como fallback offline. Assim atualizações do app no
// GitHub Pages aparecem sem ficar presas em cache antigo.
const CACHE = 'portal-canal-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Só lida com GET; deixa POST (Supabase) passar direto
  if (req.method !== 'GET') return;
  // Não intercepta chamadas a APIs externas (Supabase, CDNs) — deixa a rede cuidar
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
