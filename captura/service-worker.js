/*
 * Service Worker de Captura de datos de campo.
 *
 * Este sitio vive en su propio origen, asi que lleva su propio
 * service worker. No comparte nada con el de Kronos-M y por eso no
 * hay disputa de alcance entre los dos.
 *
 * Su unico trabajo es que la app abra sin señal. Lo que el tecnico
 * capture sin conexion no lo guarda este archivo: lo guarda la app
 * en su cola local y lo reintenta al recuperar la señal. Aqui solo
 * se cachea el cascaron.
 *
 * Las llamadas a Supabase NUNCA se cachean. Una medicion vieja
 * servida desde el cache seria peor que un error de red: el error se
 * ve, el dato equivocado no.
 */

/* Al subir este numero, el navegador descarta el cache anterior y
   vuelve a bajar todo. Es la palanca para forzar actualizacion. */
const CACHE_NAME = "captura-v4";

/* Sin estos archivos la app no abre sin señal. Van con addAll, que
   es todo o nada: solo deben ir rutas que existan con certeza. Una
   ruta de carpeta depende de que el servidor resuelva el indice del
   directorio, y si no lo hace se lleva por delante toda la precarga. */
const ARCHIVOS_PROPIOS = [
  "./index.html",
  "./unidad.html",
  "./manifest.json",
  "./icons/captura-192.png",
  "./icons/captura-512.png",
  "./icons/captura-maskable-512.png",
  "./icons/captura-apple-180.png",
];

/* Sin esta libreria la app no arranca. Va aparte de los archivos
   propios porque depende de un CDN que puede estar lento o caido
   justo en el momento de la instalacion, y no queremos que eso deje
   el cache entero sin escribir. */
const LIBRERIAS = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
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

  /* Solo GET. Un cache.put con POST lanza excepcion. */
  if (req.method !== "GET") return;

  /* Todo lo de Supabase va siempre a la red: datos, autenticacion y
     archivos. Nada de eso tiene sentido cacheado. */
  if (url.includes(".supabase.co")) return;

  /* La pagina y el manifiesto van a la red primero, con el cache
     como respaldo. Al reves, despues de cada despliegue la primera
     carga mostraria la version anterior. Y con el manifiesto es peor:
     define la identidad de la app instalada, asi que una copia vieja
     puede hacer que el navegador la confunda con otra. */
  if (req.mode === "navigate" || url.endsWith("manifest.json")) {
    event.respondWith(
      fetch(req)
        .then((respuesta) => {
          if (respuesta && respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copia));
          }
          return respuesta;
        })
        .catch(() =>
          caches.match(req).then((g) => g || caches.match("./index.html"))
        )
    );
    return;
  }

  /* Para todo lo demas (iconos, librerias): responde de inmediato
     desde lo guardado y actualiza la copia en segundo plano. */
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
