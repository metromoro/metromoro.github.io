// ====== CONFIGURACIÓN DE LA APP ======
window.APP_CONFIG = {
  // Clave de Google Maps (Google Cloud → APIs y servicios → Credenciales).
  // Activa: Maps JavaScript API, Routes API y Geocoding API.
  // Si la dejas vacía, la app usa el mapa gratuito de OpenStreetMap.
  googleMapsApiKey: "",

  // ====== PUBLICIDAD ======
  // Cada anuncio puede ir atado a estaciones: sale cuando la persona entra o sale por ellas.
  // Los que no tienen "stations" salen en cualquier ruta. Cambia estos ejemplos por tus clientes reales.
  ads: [
    { stations: ["Chacaíto", "Sabana Grande", "Plaza Venezuela"], emoji: "☕",
      title: "Tu café aquí", text: "Anuncia tu negocio a la gente que sale por esta estación.",
      cta: "Escríbenos", url: "mailto:ingantoniosira@gmail.com" },
    { stations: ["Altamira", "Chacao", "Miranda"], emoji: "🍔",
      title: "Tu restaurante aquí", text: "Llega a miles de personas que pasan por el este todos los días.",
      cta: "Anúnciate", url: "mailto:ingantoniosira@gmail.com" },
    { emoji: "📣", title: "Anúnciate en Metro Moro",
      text: "Tu marca frente a quienes se mueven en metro por Caracas.",
      cta: "Más info", url: "mailto:ingantoniosira@gmail.com" }
  ]
};
