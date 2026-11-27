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
    base: "https://monitoreo-transporte-urbano-service-dot-colombia-gcp.ue.r.appspot.com/api/calcularTiempoDeTrafico/",
    token: "",              // pega aquí tu TokenIDMTU
    refreshSec: 12,         // cada cuántos segundos refrescar
    stations: [],           // ids de estación a consultar, ej: [113, 114]
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
