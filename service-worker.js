/*
 * Service Worker de Control Equipos GTE.
 *
 * Guarda en el navegador la pagina principal y las librerias externas
 * (Supabase, Excel) la primera vez que se abre con señal, para que
 * despues la app abra sin necesitar internet.
 *
 * Las llamadas a la API de Supabase (datos en vivo) NO se guardan aqui a
 * proposito -- esas siempre intentan ir a internet, y si fallan, la app
 * misma (no este archivo) las guarda en su cola local y las reintenta
 * despues. Este archivo solo se encarga de que la app en si (el "cascaron")
 * cargue sin señal.
 */

const CACHE_NAME = "equipos-gte-v9";

const ARCHIVOS_A_GUARDAR = [
  "./",
  "./index.html",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./icons/favicon-16.png",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ARCHIVOS_A_GUARDAR))
      .catch((err) => console.warn("No se pudieron guardar todos los archivos:", err))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Las peticiones a la base de datos de Supabase (equipos, movimientos, etc.)
  // siempre van directo a internet -- no se guardan aqui.
  if (url.includes(".supabase.co/rest/") || url.includes(".supabase.co/auth/")) {
    return;
  }

  // Para todo lo demas (la pagina, las librerias): intenta primero desde
  // la memoria guardada, y si hay señal, actualiza la copia en segundo plano.
  event.respondWith(
    caches.match(event.request).then((guardado) => {
      const buscarEnRed = fetch(event.request)
        .then((respuesta) => {
          if (respuesta && respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          }
          return respuesta;
        })
        .catch(() => guardado);
      return guardado || buscarEnRed;
    })
  );
});
