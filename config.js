// ====== CONFIGURACIÓN DE LA APP ======
window.APP_CONFIG = {
  // Clave de Google Maps (Google Cloud → APIs y servicios → Credenciales).
  // Activa: Maps JavaScript API, Routes API y Geocoding API.
  // Si la dejas vacía, la app usa el mapa gratuito de OpenStreetMap.
  googleMapsApiKey: "",

  // Correo de contacto (reportes y firma del creador)
  contact: "ingantoniosira@gmail.com",

  // Sin publicidad: Metro Moro es gratis para todos
  ads: [],

  // ====== BUSES EN VIVO (opcional) ======
  // Muestra la posición GPS de los buses en el mapa (módulo vivo.js).
  // Deja "token" vacío para desactivar la función.
  busVivo: {
    // Apunta al proxy (Cloudflare Worker) que guarda el token y resuelve el CORS
    base: "https://metromoro-buses.ingenieroantoniosira.workers.dev/",
    token: "proxy",         // placeholder: el token real vive en el Worker, no aquí
    refreshSec: 12,         // cada cuántos segundos refrescar
    stations: [113],        // ids de estación con buses GPS (agrega más cuando funcione)
    lineas: []              // o por línea, ej: [{ linea_id: 2, estacion_id: 113 }]
  },

  // ====== INVÍTAME UN CAFÉ ======
  // Llena solo los que uses; los vacíos no se muestran.
  support: {
    pagoMovil: { banco: "", telefono: "", cedula: "" },
    binancePayId: "",
    binanceEmail: "antoniojsirap@gmail.com",
    paypal: ""   // ej: https://paypal.me/tuusuario
  }
};
