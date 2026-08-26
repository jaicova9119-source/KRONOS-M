/*
 * Service Worker de Kronos-M.
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

const CACHE_NAME = "kronos-m-v38";

/* Archivos propios. Estos tienen que quedar guardados si o si: sin ellos
   la app no abre sin señal. */
const ARCHIVOS_PROPIOS = [
  "./",
  "./index.html",
  "./fo016.js",
  "./fo016-logo.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./icons/favicon-16.png",
];

/* Librerias externas. Se guardan aparte de las propias porque dependen de
   un CDN que puede estar lento o caido en el momento de la instalacion. */
const LIBRERIAS = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
  "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js",
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      /* addAll es todo o nada: si UNA sola direccion falla, rechaza y no
         guarda ninguna. Con el catch de antes el error quedaba en la
         consola, la instalacion se daba por buena y el cache quedaba
         vacio -- la app dejaba de abrir sin señal y nada lo avisaba.
         Por eso los archivos propios van con addAll (deben estar todos)
         y las librerias una por una, para que la caida de un CDN no se
         lleve por delante todo el cache. */
      await cache.addAll(ARCHIVOS_PROPIOS);
      await Promise.allSettled(
        LIBRERIAS.map((url) =>
          cache.add(url).catch((err) =>
            console.warn("No se pudo guardar la libreria", url, err)
          )
        )
      );
    }).catch((err) => console.warn("Fallo la instalacion del cache:", err))
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
  const req = event.request;
  const url = req.url;

  /* Solo se manejan GET. Un cache.put con POST lanza excepcion. */
  if (req.method !== "GET") return;

  /* Datos en vivo de Supabase: siempre a internet, nunca al cache. */
  if (url.includes(".supabase.co/rest/") || url.includes(".supabase.co/auth/")) {
    return;
  }

  /* Supabase Storage guarda los documentos tecnicos del modulo documental.
     Antes entraban al cache como cualquier otro archivo: cada PDF abierto
     se quedaba en el telefono para siempre y el cache crecia sin tope.
     Se dejan pasar directo a la red. */
  if (url.includes(".supabase.co/storage/")) {
    return;
  }

  /* La pagina en si va primero a la red, con el cache como respaldo.
     Con la estrategia contraria, despues de cada despliegue la primera
     carga mostraba la version anterior y habia que recargar de nuevo
     para ver los cambios. Sin señal sigue funcionando igual: si la red
     falla, responde lo guardado. */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((respuesta) => {
          if (respuesta && respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copia));
          }
          return respuesta;
        })
        .catch(() => caches.match(req).then((g) => g || caches.match("./index.html")))
    );
    return;
  }

  /* Los manifiestos van a la red primero, como las paginas. Con la
     estrategia de "cache primero" el navegador podia leer un
     manifiesto viejo despues de un cambio, y como el manifiesto
     define el alcance y la identidad de la app instalada, eso hacia
     que una app nueva se confundiera con otra ya instalada. Es un
     archivo pequeno y se consulta poco: no vale la pena cachearlo
     de forma agresiva. */
  if (url.endsWith("manifest.json") || url.includes("manifest")) {
    event.respondWith(
      fetch(req)
        .then((respuesta) => {
          if (respuesta && respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copia));
          }
          return respuesta;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  /* Los scripts propios van a la red primero, igual que la pagina.
     Con "cache primero y actualiza en segundo plano" el navegador entrega
     SIEMPRE la version anterior y guarda la nueva para la proxima carga:
     la app queda un despliegue atrasada de forma permanente. Con index.html
     no se notaba porque las paginas ya iban a la red primero, pero los .js
     externalizados si lo sufren. */
  if (url.startsWith(self.location.origin) &&
      new URL(url).pathname.endsWith(".js")) {
    event.respondWith(
      fetch(req)
        .then((respuesta) => {
          if (respuesta && respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copia));
          }
          return respuesta;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  /* Para todo lo demas (iconos, librerias de CDN): responde de inmediato
     desde la memoria guardada y actualiza la copia en segundo plano. */
  event.respondWith(
    caches.match(req).then((guardado) => {
      const buscarEnRed = fetch(req)
        .then((respuesta) => {
          if (respuesta && respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copia));
          }
          return respuesta;
        })
        .catch(() => guardado);
      return guardado || buscarEnRed;
    })
  );
});
