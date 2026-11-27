/* ============================================================
   Metro Moro · Buses en vivo
   Capa opcional que muestra la posición GPS de los buses en el
   mapa, consultando la API de monitoreo. Se auto-integra: crea su
   propio botón y no modifica la lógica existente.

   Requiere:
   1) En app.js, tras crear el mapa:  window.MM_MAP = map;
   2) En index.html, tras app.js:     <script src="vivo.js?v=65"></script>
   3) En config.js, dentro de APP_CONFIG, un bloque "busVivo" (ver config.js)
   ============================================================ */
(function () {
  "use strict";

  var CFG = (window.APP_CONFIG || {}).busVivo || {};
  var BASE = CFG.base || "";
  var TOKEN = CFG.token || "";
  var STATIONS = CFG.stations || [];      // ids para consultarCercanosEstacion
  var LINEAS = CFG.lineas || [];          // {linea_id, estacion_id} para consultarEstacionesLinea
  var REFRESH = Math.max(5, CFG.refreshSec || 12) * 1000;

  var map = null, on = false, timer = null, markers = {}, avisoCORS = false;

  // --- pequeño toast propio (reutiliza el #toast de la app si existe) ---
  function toast(msg, ms) {
    var t = document.getElementById("toast");
    if (!t) { return; }
    t.textContent = msg; t.style.display = "block";
    clearTimeout(t._hv); t._hv = setTimeout(function () { t.style.display = "none"; }, ms || 3600);
  }

  // --- extrae recursivamente todo lo que tenga latitud/longitud ---
  function extraer(obj, out) {
    if (Array.isArray(obj)) { obj.forEach(function (o) { extraer(o, out); }); return out; }
    if (obj && typeof obj === "object") {
      var lat = Number(obj.latitud != null ? obj.latitud : obj.lat);
      var lng = Number(obj.longitud != null ? obj.longitud : (obj.lon != null ? obj.lon : obj.lng));
      if (isFinite(lat) && isFinite(lng) && Math.abs(lat) > 0.1 && Math.abs(lng) > 0.1) {
        var bus = obj.numero_bus != null ? obj.numero_bus : obj.numero;
        if (bus != null) {
          out.push({
            id: String(bus), lat: lat, lng: lng,
            ruta: obj.nombre_ruta || obj.nombre || "",
            tiempo: obj.tiempo_llegada || obj.tiempo || ""
          });
        }
      }
      for (var k in obj) { if (obj[k] && typeof obj[k] === "object") extraer(obj[k], out); }
    }
    return out;
  }

  function peticiones() {
    var reqs = [];
    STATIONS.forEach(function (id) {
      reqs.push({ url: BASE + "consultarCercanosEstacion", body: { id: Number(id) } });
    });
    LINEAS.forEach(function (l) {
      reqs.push({ url: BASE + "consultarEstacionesLinea", body: { linea_id: Number(l.linea_id), estacion_id: Number(l.estacion_id) } });
    });
    return reqs;
  }

  function markerEl() {
    var el = document.createElement("div");
    el.style.cssText =
      "width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);" +
      "background:#E87722;border:2.5px solid #fff;box-shadow:0 2px 7px rgba(0,0,0,.45);" +
      "display:flex;align-items:center;justify-content:center;cursor:pointer";
    el.innerHTML = '<span style="transform:rotate(45deg);font-size:14px">🚍</span>';
    return el;
  }

  async function ciclo() {
    if (!on || !map) return;
    var reqs = peticiones();
    if (!reqs.length) { toast("Agrega estaciones o líneas en config.js → busVivo"); apagar(); return; }

    var buses = {}, fallos = 0;
    await Promise.all(reqs.map(async function (r) {
      try {
        var res = await fetch(r.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "TokenIDMTU": TOKEN },
          body: JSON.stringify(r.body)
        });
        if (!res.ok) { fallos++; return; }
        var data = await res.json();
        extraer(data, []).forEach(function (b) { buses[b.id] = b; });
      } catch (e) { fallos++; }
    }));

    if (fallos === reqs.length) {
      if (!avisoCORS) { avisoCORS = true; toast("No se pudo leer la API de buses (¿CORS o token?)"); }
      return;
    }
    avisoCORS = false;
    pintar(buses);
  }

  function pintar(buses) {
    var vistos = {};
    Object.keys(buses).forEach(function (id) {
      var b = buses[id]; vistos[id] = true;
      var pop = "<b>Bus " + id + "</b>" +
        (b.ruta ? "<br>Ruta: " + b.ruta : "") +
        (b.tiempo ? "<br>⏱ " + b.tiempo : "");
      if (markers[id]) {
        markers[id].setLngLat([b.lng, b.lat]);
        markers[id].getPopup().setHTML(pop);
      } else {
        markers[id] = new maplibregl.Marker({ element: markerEl(), anchor: "bottom-left" })
          .setLngLat([b.lng, b.lat])
          .setPopup(new maplibregl.Popup({ offset: 16 }).setHTML(pop))
          .addTo(map);
      }
    });
    // quitar los que ya no aparecen
    Object.keys(markers).forEach(function (id) {
      if (!vistos[id]) { markers[id].remove(); delete markers[id]; }
    });
  }

  function limpiar() {
    Object.keys(markers).forEach(function (id) { markers[id].remove(); });
    markers = {};
  }

  function encender() {
    on = true; btn.style.background = "#E87722"; btn.style.color = "#fff";
    btn.querySelector(".vtxt").textContent = "Buses en vivo";
    ciclo();
    clearInterval(timer); timer = setInterval(ciclo, REFRESH);
  }
  function apagar() {
    on = false; clearInterval(timer); timer = null; limpiar();
    btn.style.background = ""; btn.style.color = "";
    btn.querySelector(".vtxt").textContent = "Ver buses en vivo";
  }
  function toggle() { on ? apagar() : encender(); }

  // pausa cuando la pestaña no está visible (ahorra datos/batería)
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { clearInterval(timer); timer = null; }
    else if (on) { ciclo(); timer = setInterval(ciclo, REFRESH); }
  });

  // --- botón flotante ---
  var btn = document.createElement("button");
  btn.id = "busVivoBtn";
  btn.style.cssText =
    "position:fixed;left:12px;z-index:17;bottom:calc(var(--sheetH,150px) + 12px);" +
    "min-height:44px;padding:0 14px;border:0;border-radius:999px;background:var(--bg,#fff);" +
    "color:var(--ink,#16171b);box-shadow:0 6px 24px rgba(0,0,0,.18);font-weight:700;font-size:14px;" +
    "display:flex;align-items:center;gap:7px;transition:bottom .25s";
  btn.innerHTML = '<span style="font-size:17px">🚍</span><span class="vtxt">Ver buses en vivo</span>';
  btn.onclick = toggle;

  // --- esperar a que el mapa esté listo ---
  function init(m) {
    map = m;
    // No mostrar el botón hasta que busVivo esté configurado (token + estaciones/líneas)
    var listo = BASE && TOKEN && (STATIONS.length || LINEAS.length);
    if (!listo) return;
    document.body.appendChild(btn);
  }
  function esperar() {
    var m = window.MM_MAP;
    if (m && typeof m.loaded === "function") {
      if (m.loaded()) init(m); else m.on("load", function () { init(m); });
    } else {
      setTimeout(esperar, 300);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", esperar);
  } else { esperar(); }
})();
