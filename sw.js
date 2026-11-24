// Metro Moro · funciona sin señal
const V="mccs-v23";
const SHELL=["./","index.html","app.js","data.js","config.js","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png",
 "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js","https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("mccs-v")&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  // la app: primero internet (para recibir mejoras), si no hay, lo guardado
  if(u.origin===location.origin){e.respondWith(fetch(r,{cache:"no-cache"}).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res;}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match("index.html"))));return;}
  // mapa, letras e íconos del mapa: primero lo guardado
  if(u.hostname==="tiles.openfreemap.org"||u.hostname==="unpkg.com"||u.hostname==="fonts.gstatic.com"||u.hostname==="fonts.googleapis.com"){
    e.respondWith(caches.open(u.hostname==="tiles.openfreemap.org"&&/\.pbf$/.test(u.pathname)?"mccs-tiles":V).then(c=>c.match(r).then(m=>{
      const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res;});
      if(m){if(!/\.pbf$/.test(u.pathname))net.catch(()=>{});return m;}
      return net;})));
  }
});
