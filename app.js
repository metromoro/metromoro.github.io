"use strict";
(function(){
// ================= DATOS =================
const CFG=window.APP_CONFIG||{},MD=window.METRO_DATA;
const ST=MD.st;
const LINES={
 L1:{name:"Línea 1",short:"1",color:"#E2231A",paths:[{s:["Propatria","Pérez Bonalde","Plaza Sucre","Gato Negro","Agua Salud","Caño Amarillo","Capitolio","La Hoyada","Parque Carabobo","Bellas Artes","Colegio de Ingenieros","Plaza Venezuela","Sabana Grande","Chacaíto","Chacao","Altamira","Miranda","Los Dos Caminos","Los Cortijos","La California","Petare","Palo Verde"],fwd:"Palo Verde",back:"Propatria"}]},
 L2:{name:"Línea 2",short:"2",color:"#00965E",paths:[
   {s:["El Silencio","Capuchinos","Maternidad","Artigas","La Paz","La Yaguara","Carapita","Antímano","Mamera","Ruiz Pineda","Las Adjuntas"],fwd:"Las Adjuntas",back:"El Silencio"},
   {s:["Mamera","Caricuao","Zoológico"],fwd:"Zoológico",back:"El Silencio"}]},
 L3:{name:"Línea 3",short:"3",color:"#0067B1",paths:[{s:["Plaza Venezuela","Ciudad Universitaria","Los Símbolos","La Bandera","El Valle","Los Jardines","Coche","Mercado","La Rinconada"],fwd:"La Rinconada",back:"Plaza Venezuela"}]},
 L4:{name:"Línea 4",short:"4",color:"#F2B705",dark:true,paths:[{s:["Capuchinos","Teatros","Nuevo Circo","Parque Central","Zona Rental"],fwd:"Zona Rental",back:"Capuchinos"}]},
 L5:{name:"Línea 5",short:"5",color:"#8E44AD",paths:[{s:["Zona Rental","Bello Monte"],fwd:"Bello Monte",back:"Zona Rental"}]},
 LT:{name:"Metro Los Teques",short:"LT",color:"#8A6A3B",paths:[{s:["Las Adjuntas","Alí Primera","Guaicaipuro","Independencia"],fwd:"Independencia",back:"Las Adjuntas"}]}
};
const PLACES=[["Plaza Bolívar","🏛️",10.5061,-66.9146],["Panteón Nacional","🏛️",10.5112,-66.9098],["Torres de Parque Central","🏢",10.4978,-66.9008],["UCV – Ciudad Universitaria","🎓",10.4905,-66.8905],["Hospital Universitario","🏥",10.4925,-66.8930],["Bulevar de Sabana Grande","🛍️",10.4957,-66.8745],["Sambil Chacao","🛍️",10.4903,-66.8540],["Plaza Altamira","⛲",10.4965,-66.8490],["Parque del Este","🌳",10.4925,-66.8390],["CCCT","🏢",10.4835,-66.8450],["Las Mercedes","🍽️",10.4825,-66.8605],["Casco de Petare","⛪",10.4772,-66.8068],["Terminal La Bandera","🚌",10.4785,-66.9010],["Bulevar de Catia","🛍️",10.5088,-66.9405],["Zoológico de Caricuao","🦁",10.4290,-66.9860]].map(([n,e,la,lo])=>({name:n,em:e,lat:la,lon:lo}));
const OPEN=[5*60+30,23*60]; // horario según OpenStreetMap (Mo-Su 05:30-23:00)
const URL_BASE=location.origin+location.pathname;
const CONTACT=(CFG.ads||[]).map(a=>a.url||"").find(u=>u.startsWith("mailto:"))||"";

// ================= UTILIDADES =================
const $=id=>document.getElementById(id);
const hav=(a,b)=>{const r=Math.PI/180,dl=(b[0]-a[0])*r,dn=(b[1]-a[1])*r;const h=Math.sin(dl/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dn/2)**2;return 2*6371*Math.asin(Math.sqrt(h));};
const walkMin=(a,b)=>hav(a,b)*1.35/4.5*60;
const norm=s=>(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();
const fmt=m=>{m=Math.max(1,Math.round(m));return m<60?m+" min":Math.floor(m/60)+" h "+(m%60)+" min";};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clock=d=>d.toLocaleTimeString("es-VE",{hour:"numeric",minute:"2-digit"});
const gmWalk=(a,b)=>`https://www.google.com/maps/dir/?api=1&origin=${a[0]},${a[1]}&destination=${b[0]},${b[1]}&travelmode=walking`;
const store={get(k,d){try{const v=localStorage.getItem("mccs-"+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem("mccs-"+k,JSON.stringify(v));}catch(e){}}};
function toast(msg,ms=3200){const t=$("toast");t.textContent=msg;t.style.display="block";clearTimeout(t._h);t._h=setTimeout(()=>t.style.display="none",ms);}
const stationLines={};for(const L in LINES)for(const p of LINES[L].paths)for(const s of p.s)(stationLines[s]??=new Set()).add(L);
const isTransfer=n=>stationLines[n].size>1||["Capitolio","El Silencio","Zona Rental","Plaza Venezuela"].includes(n);
const chip=L=>`<span class="chip${LINES[L].dark?" y":""}" style="background:${LINES[L].color}">${LINES[L].short}</span>`;
const chips=n=>[...stationLines[n]].map(chip).join(" ");
function pickAd(stations){const ads=CFG.ads||[];if(!ads.length)return null;const m=ads.filter(a=>a.stations&&a.stations.some(s=>stations.includes(s)));const pool=m.length?m:ads.filter(a=>!a.stations);return pool.length?pool[Math.floor(Math.random()*pool.length)]:null;}
const LOGO=`<svg viewBox="-6 -6 112 112" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="square"><rect x="0" y="0" width="100" height="100"/><circle cx="50" cy="50" r="50"/><path d="M0 0 L100 100 M100 0 L0 100 M50 0 L0 100 M50 0 L100 100"/></g></svg>`;
const SIGN=`<span class="sign">${LOGO}<span><b>Ing. Antonio Sira</b><small>Creador de Metro CCS</small></span></span>`;
function adHTML(a){if(!a)return"";
  if((a.url||"").startsWith("mailto:"))return `<a class="ad brand" target="_blank" rel="noopener" href="${esc(a.url)}"><span class="bl">${LOGO}</span><span class="bt"><span class="ap">Publicidad · Ing. Antonio Sira</span><span class="at">${esc(a.title)}</span><span class="ax">${esc(a.text||"")}</span></span>${a.cta?`<span class="ac">${esc(a.cta)}</span>`:""}</a>`;
  return `<a class="ad" target="_blank" rel="noopener sponsored" href="${esc(a.url||"#")}"><span class="ae">${esc(a.emoji||"📣")}</span><span><span class="ap">Patrocinado</span><div class="at">${esc(a.title)}</div><div class="ax">${esc(a.text||"")}</div></span>${a.cta?`<span class="ac">${esc(a.cta)}</span>`:""}</a>`;}
function metroOpen(){const d=new Date(),m=d.getHours()*60+d.getMinutes();return m>=OPEN[0]&&m<OPEN[1];}
const statusHTML=()=>metroOpen()?`<span class="status"><i></i>Metro abierto · cierra 11:00 p. m.</span>`:`<span class="status off"><i></i>Metro cerrado · abre 5:30 a. m.</span>`;

// ================= SALIDAS Y TRAZADO =================
const EXITS={};for(const n in ST)EXITS[n]=(MD.exits[n]&&MD.exits[n].length?MD.exits[n]:[[ST[n][0],ST[n][1],""]]).map(([la,lo,nm])=>({ll:[la,lo],name:nm}));
function bestExit(p,n){let b=null,bw=Infinity;for(const e of EXITS[n]){const w=walkMin(p,e.ll);if(w<bw){bw=w;b=e;}}return{w:bw,ex:b};}
const exName=e=>e&&e.name?`la salida <b>${esc(e.name)}</b>`:"la salida más cercana";
const exPlain=e=>e&&e.name?`la salida ${e.name}`:"la salida más cercana";
function nearIdx(sh,p){let bi=0,bd=Infinity;for(let i=0;i<sh.length;i++){const d=hav(sh[i],p);if(d<bd){bd=d;bi=i;}}return{i:bi,d:bd};}
function shapeBetween(L,a,b){for(const sh of MD.shapes[L]||[]){const A=nearIdx(sh,ST[a]),B=nearIdx(sh,ST[b]);if(A.d<0.35&&B.d<0.35&&A.i!==B.i)return A.i<B.i?sh.slice(A.i,B.i+1):sh.slice(B.i,A.i+1).reverse();}return[ST[a],ST[b]];}
function pathShape(L,stops){let out=[];for(let i=0;i<stops.length-1;i++){const s=shapeBetween(L,stops[i],stops[i+1]);out=out.length?out.concat(s.slice(1)):s;}return out;}

// ================= GRAFO + RUTA =================
const adj={},nodes={},nid=(L,s)=>L+"|"+s;
(function build(){
  const add=(a,b,w,info)=>(adj[a]??=[]).push({to:b,w,...info});
  for(const L in LINES)for(const p of LINES[L].paths){
    p.s.forEach(s=>nodes[nid(L,s)]={line:L,st:s});
    for(let i=0;i<p.s.length-1;i++){const a=p.s[i],b=p.s[i+1],t=hav(ST[a],ST[b])/30*60+0.6;
      add(nid(L,a),nid(L,b),t,{type:"ride",line:L,sense:1,dir:p.fwd});add(nid(L,b),nid(L,a),t,{type:"ride",line:L,sense:-1,dir:p.back});}}
  const x=(a,b,w)=>{add(a,b,w,{type:"xfer"});add(b,a,w,{type:"xfer"});};
  for(const s in stationLines){const ls=[...stationLines[s]];for(let i=0;i<ls.length;i++)for(let j=i+1;j<ls.length;j++)x(nid(ls[i],s),nid(ls[j],s),4);}
  x(nid("L1","Capitolio"),nid("L2","El Silencio"),5);
  for(const a of["L1","L3"])for(const b of["L4","L5"])x(nid(a,"Plaza Venezuela"),nid(b,"Zona Rental"),6);
})();
function route(from,to){
  const fp=[from.lat,from.lon],tp=[to.lat,to.lon],direct=walkMin(fp,tp),names=Object.keys(ST);
  const pick=p=>names.map(n=>({n,...bestExit(p,n)})).sort((a,b)=>a.w-b.w).filter((x,i)=>i<3||x.w<=30);
  const srcs=pick(fp),dsts=pick(tp),dist={},prev={},done=new Set();
  for(const s of srcs)for(const L of stationLines[s.n]){const id=nid(L,s.n),d=s.w+3;if(dist[id]==null||d<dist[id]){dist[id]=d;prev[id]={start:true,walk:s.w,ex:s.ex};}}
  for(;;){let u=null,b=Infinity;for(const k in dist)if(!done.has(k)&&dist[k]<b){b=dist[k];u=k;}if(!u)break;done.add(u);
    for(const e of adj[u]||[]){const d=dist[u]+e.w;if(dist[e.to]==null||d<dist[e.to]-1e-9){dist[e.to]=d;prev[e.to]={from:u,e};}}}
  let end=null,bt=Infinity;
  for(const d of dsts)for(const L of stationLines[d.n]){const id=nid(L,d.n);if(dist[id]==null)continue;const t=dist[id]+d.w;if(t<bt){bt=t;end={id,walk:d.w,ex:d.ex};}}
  if(!end||direct<=bt)return{walkOnly:true,total:direct,direct};
  const seq=[];let c=end.id;while(!prev[c].start){seq.unshift({to:c,...prev[c]});c=prev[c].from;}
  const legs=[{type:"walk",first:true,to:nodes[c].st,min:prev[c].walk,ex:prev[c].ex}];let cur=null;
  for(const s of seq){
    if(s.e.type==="ride"){
      if(cur&&cur.line===s.e.line&&cur.sense===s.e.sense){cur.stops++;cur.min+=s.e.w;cur.to=nodes[s.to].st;cur.dir=s.e.dir;cur.path.push(nodes[s.to].st);}
      else{if(cur)legs.push(cur);cur={type:"ride",line:s.e.line,sense:s.e.sense,dir:s.e.dir,from:nodes[s.from].st,to:nodes[s.to].st,stops:1,min:s.e.w,path:[nodes[s.from].st,nodes[s.to].st]};}
    }else{if(cur){legs.push(cur);cur=null;}legs.push({type:"xfer",from:nodes[s.from].st,to:nodes[s.to].st,toLine:nodes[s.to].line,min:s.e.w});}
  }
  if(cur)legs.push(cur);
  legs.push({type:"walk",last:true,from:nodes[end.id].st,min:end.walk,ex:end.ex});
  return{walkOnly:false,total:bt,legs,direct};
}
const nearest=p=>{let b=null,bw=Infinity;for(const n in ST){const e=bestExit(p,n);if(e.w<bw){bw=e.w;b={n,...e};}}return b;};

// caminata real (OpenStreetMap); sin señal se usa la estimación
const walkCache={};
async function walkRoute(a,b){
  const key=a.join()+";"+b.join();if(walkCache[key])return walkCache[key];
  try{const c=new AbortController();setTimeout(()=>c.abort(),6000);
    const res=await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`,{signal:c.signal});
    const j=await res.json();const rt=j.routes&&j.routes[0];
    if(rt)return walkCache[key]={path:rt.geometry.coordinates.map(([x,y])=>[y,x]),min:rt.duration/60,m:rt.distance};
  }catch(e){}
  return null;
}

// ================= MAPA =================
const DARK=matchMedia("(prefers-color-scheme: dark)").matches;
let map=null,mapReady=false;
const LL=p=>[p[1],p[0]];
const fc=f=>({type:"FeatureCollection",features:f});
const lineF=(pts,props)=>({type:"Feature",properties:props||{},geometry:{type:"LineString",coordinates:pts.map(LL)}});
const ptF=(p,props)=>({type:"Feature",properties:props||{},geometry:{type:"Point",coordinates:LL(p)}});
function setData(id,data){const s=map&&map.getSource(id);if(s)s.setData(data);}
function initMap(){
  if(!window.maplibregl){$("sc").innerHTML=`<p class="hint">No se pudo cargar el mapa. Revisa tu conexión y vuelve a abrir la app.</p>`;return;}
  map=new maplibregl.Map({container:"map",style:`https://tiles.openfreemap.org/styles/${DARK?"dark":"liberty"}`,center:[-66.89,10.49],zoom:11.6,maxZoom:19,dragRotate:false,pitchWithRotate:false,attributionControl:{compact:true}});
  map.touchZoomRotate.disableRotation();
  map.on("load",()=>{
    const net=[];for(const L in LINES)for(const sh of(MD.shapes[L]||[]))net.push(lineF(sh,{c:LINES[L].color}));
    map.addSource("net",{type:"geojson",data:fc(net)});
    map.addSource("route",{type:"geojson",data:fc([])});
    map.addSource("walk",{type:"geojson",data:fc([])});
    const stF=Object.keys(ST).map(n=>ptF(ST[n],{n,c:LINES[[...stationLines[n]][0]].color,x:isTransfer(n)?1:0}));
    map.addSource("st",{type:"geojson",data:fc(stF)});
    const exF=[];for(const n in ST)if(MD.exits[n])for(const e of EXITS[n])exF.push(ptF(e.ll,{n,name:e.name||"Salida"}));
    map.addSource("ex",{type:"geojson",data:fc(exF)});
    const W=(a,b)=>["interpolate",["linear"],["zoom"],10,a,16,b];
    map.addLayer({id:"net-case",type:"line",source:"net",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":DARK?"#17181c":"#fff","line-width":W(4,12)}});
    map.addLayer({id:"net",type:"line",source:"net",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":["get","c"],"line-width":W(2.5,8)}});
    map.addLayer({id:"walk",type:"line",source:"walk",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#1a73e8","line-width":W(3,6),"line-dasharray":[0.2,1.8]}});
    map.addLayer({id:"route-case",type:"line",source:"route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#fff","line-width":W(7,16)}});
    map.addLayer({id:"route",type:"line",source:"route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":["get","c"],"line-width":W(5,12)}});
    map.addLayer({id:"ex",type:"circle",source:"ex",minzoom:15,paint:{"circle-radius":6,"circle-color":"#16171b","circle-stroke-color":"#fff","circle-stroke-width":2}});
    map.addLayer({id:"ex-lbl",type:"symbol",source:"ex",minzoom:16.3,layout:{"text-field":["get","name"],"text-font":["Noto Sans Regular"],"text-size":11,"text-offset":[0,1.2],"text-anchor":"top","text-optional":true},paint:{"text-color":DARK?"#eee":"#222","text-halo-color":DARK?"#000":"#fff","text-halo-width":1.5}});
    map.addLayer({id:"st",type:"circle",source:"st",paint:{"circle-radius":["interpolate",["linear"],["zoom"],10,["case",["==",["get","x"],1],4,3],15,["case",["==",["get","x"],1],9,7]],"circle-color":["case",["==",["get","x"],1],"#fff",["get","c"]],"circle-stroke-color":["case",["==",["get","x"],1],"#16171b","#fff"],"circle-stroke-width":["case",["==",["get","x"],1],2.5,2]}});
    map.addLayer({id:"st-lbl",type:"symbol",source:"st",layout:{"text-field":["get","n"],"text-font":["Noto Sans Bold"],"text-size":["interpolate",["linear"],["zoom"],11,11,15,14],"text-offset":[0.9,0],"text-anchor":"left","text-optional":true,"symbol-sort-key":["-",1,["get","x"]]},paint:{"text-color":DARK?"#fff":"#16171b","text-halo-color":DARK?"#000":"#fff","text-halo-width":2}});
    map.setFilter("st-lbl",null);
    const lblZoom=()=>{const z=map.getZoom();map.setFilter("st-lbl",z>=13.3?null:["==",["get","x"],1]);};map.on("zoomend",lblZoom);lblZoom();
    for(const id of["st","ex"]){map.on("click",id,e=>{const f=e.features[0];if(f)openStation(f.properties.n);});map.on("mouseenter",id,()=>map.getCanvas().style.cursor="pointer");map.on("mouseleave",id,()=>map.getCanvas().style.cursor="");}
    map.on("click",e=>{if(map.queryRenderedFeatures(e.point,{layers:["st","ex"]}).length)return;if(pickOnMap){const w=pickOnMap;pickOnMap=null;setPoint(w,{lat:e.lngLat.lat,lon:e.lngLat.lng,name:"Punto en el mapa"});}});
    mapReady=true;
    if(!ME&&!TO)fitAll();
    render();
  });
}
function padding(){return{top:($("top").offsetHeight||120)+20,bottom:Math.min(sheetPx(),innerHeight*0.6)+30,left:40,right:40};}
function fit(pts){if(!mapReady||!pts.length)return;const b=new maplibregl.LngLatBounds();pts.forEach(p=>b.extend(LL(p)));map.fitBounds(b,{padding:padding(),maxZoom:16.5,duration:500});}
function fitAll(){fit(Object.keys(ST).filter(n=>!["Alí Primera","Guaicaipuro","Independencia"].includes(n)).map(n=>ST[n]));}
const markers={};
function marker(key,p,cls){if(!map)return;if(!p){if(markers[key]){markers[key].remove();delete markers[key];}return;}
  if(!markers[key]){const el=document.createElement("div");el.className=cls;markers[key]=new maplibregl.Marker({element:el,anchor:cls==="pin"?"bottom-left":"center"}).setLngLat(LL(p)).addTo(map);}else markers[key].setLngLat(LL(p));}

// ================= PANEL INFERIOR =================
const sheet=$("sheet");let sheetState="peek";
const H={peek:()=>VIEW==="route"?240:170,half:()=>Math.round(innerHeight*0.52),full:()=>Math.round(innerHeight*0.9)};
function sheetPx(){return H[sheetState]();}
function setSheet(s){sheetState=s;document.documentElement.style.setProperty("--sheetH",H[s]()+"px");}
(function drag(){let y0=null,h0=0,moved=0;const g=$("grab");
  const down=e=>{y0=e.clientY;h0=sheetPx();moved=0;sheet.classList.add("drag");g.setPointerCapture(e.pointerId);};
  const move=e=>{if(y0==null)return;const h=Math.max(120,Math.min(innerHeight*0.92,h0+(y0-e.clientY)));moved=Math.abs(y0-e.clientY);document.documentElement.style.setProperty("--sheetH",h+"px");};
  const up=e=>{if(y0==null)return;sheet.classList.remove("drag");const h=h0+(y0-e.clientY);y0=null;
    if(moved<6){setSheet(sheetState==="peek"?"half":sheetState==="half"?"full":"peek");return;}
    const opts=["peek","half","full"].map(k=>[k,Math.abs(H[k]()-h)]).sort((a,b)=>a[1]-b[1]);setSheet(opts[0][0]);};
  g.addEventListener("pointerdown",down);g.addEventListener("pointermove",move);g.addEventListener("pointerup",up);g.addEventListener("pointercancel",up);
})();
addEventListener("resize",()=>setSheet(sheetState));

// ================= ESTADO =================
let FROM=null,TO=null,ME=null,VIEW="idle",TRIP=null,pickOnMap=null,renderTok=0,cardStation=null;
const recents=()=>store.get("recents",[]);
function addRecent(p){if(!p||p.live||/^Punto en el mapa|^Mi ubicación/.test(p.name))return;const r=recents().filter(x=>x.name!==p.name);r.unshift({name:p.name,lat:p.lat,lon:p.lon});store.set("recents",r.slice(0,8));}
const saved=k=>store.get(k,null);
function setPoint(which,p){
  if(!p)return;
  if(which==="home"||which==="work"){store.set(which,{name:p.name,lat:p.lat,lon:p.lon});toast(which==="home"?"Casa guardada":"Trabajo guardado");render(true);return;}
  if(which==="from")FROM=p;else{TO=p;addRecent(p);}
  TRIP=null;VIEW=TO?"route":"idle";render();
}
function clearDest(){TO=null;TRIP=null;VIEW="idle";if(FROM&&!FROM.live)FROM=ME?{...ME,name:"Mi ubicación",live:true}:null;render();if(ME&&mapReady)map.easeTo({center:LL([ME.lat,ME.lon]),zoom:14.5,duration:500});}

function drawQuick(){
  if(TO||VIEW==="trip"){$("quick").innerHTML="";return;}
  const q=[];const h=saved("home"),w=saved("work");
  q.push(`<button class="qc" data-q="home">🏠 Casa${h?"":" <small>Agregar</small>"}</button>`);
  q.push(`<button class="qc" data-q="work">💼 Trabajo${w?"":" <small>Agregar</small>"}</button>`);
  recents().slice(0,5).forEach((r,i)=>q.push(`<button class="qc" data-q="r${i}">🕘 ${esc(r.name.split(",")[0])}</button>`));
  $("quick").innerHTML=q.join("");
}
$("quick").onclick=e=>{const b=e.target.closest(".qc");if(!b)return;const k=b.dataset.q;
  if(k==="home"||k==="work"){const s=saved(k);if(s)setPoint("to",{...s});else openPicker(k);return;}
  const r=recents()[+k.slice(1)];if(r)setPoint("to",{...r});};

// ================= VISTAS =================
function render(keepView){
  const tok=++renderTok;
  $("stext").textContent=TO?TO.name:"¿A dónde vas?";$("stext").classList.toggle("ph",!TO);$("clr").style.display=TO?"grid":"none";
  drawQuick();
  marker("from",FROM&&!FROM.live?[FROM.lat,FROM.lon]:null,"fromdot");
  marker("to",TO?[TO.lat,TO.lon]:null,"pin");
  if(mapReady){setData("route",fc([]));setData("walk",fc([]));map.setPaintProperty("net","line-opacity",1);map.setPaintProperty("net-case","line-opacity",1);}
  if(VIEW==="trip")return renderTrip();
  if(VIEW==="station")return renderStation();
  if(!TO)return renderIdle(tok);
  if(!FROM){VIEW="route";$("sc").innerHTML=`<h2>${esc(TO.name)}</h2><p class="hint">¿Desde dónde sales? Activa la ubicación del teléfono o elige el punto de partida.</p><div class="btns"><button class="btn pri" id="bFrom">Elegir punto de partida</button><button class="btn" id="bGps">Usar mi ubicación</button></div>`;
    $("bFrom").onclick=()=>openPicker("from");$("bGps").onclick=()=>useGPS(true);setSheet("half");if(mapReady&&!keepView)map.easeTo({center:LL([TO.lat,TO.lon]),zoom:15});return;}
  renderRoute(tok,keepView);
}
function renderIdle(tok){
  VIEW="idle";let h="";
  if(FROM){const a=[FROM.lat,FROM.lon],nb=nearest(a);
    h+=`<div class="row"><span class="em">Ⓜ️</span><div class="tx"><div class="t2">Estación más cercana</div><div class="t1">${esc(nb.n)} ${chips(nb.n)}</div><div class="t2">${fmt(nb.w)} a pie hasta ${exName(nb.ex)}</div></div><a class="btn sm" target="_blank" rel="noopener" href="${gmWalk(a,nb.ex.ll)}">Ir ↗</a></div>`;
    walkRoute(a,nb.ex.ll).then(w=>{if(w&&tok===renderTok&&mapReady)setData("walk",fc([lineF(w.path)]));});
  }else h+=`<div class="row"><span class="em">📍</span><div class="tx"><div class="t1">Activa tu ubicación</div><div class="t2">Así te digo cuál es tu estación más cercana.</div></div><button class="btn sm" id="bGps">Activar</button></div>`;
  h+=`<div class="row"><span class="em">🕒</span><div class="tx">${statusHTML()}<div class="t2">Todos los días, 5:30 a. m. – 11:00 p. m.</div></div></div>`;
  const hm=saved("home"),wk=saved("work");
  h+=`<div class="sec">Tus lugares</div>`;
  h+=`<div class="row" data-go="home"><span class="em">🏠</span><div class="tx"><div class="t1">Casa</div><div class="t2">${hm?esc(hm.name):"Toca para guardarla"}</div></div>${hm?`<button class="link" data-edit="home">Cambiar</button>`:""}</div>`;
  h+=`<div class="row" data-go="work"><span class="em">💼</span><div class="tx"><div class="t1">Trabajo</div><div class="t2">${wk?esc(wk.name):"Toca para guardarlo"}</div></div>${wk?`<button class="link" data-edit="work">Cambiar</button>`:""}</div>`;
  const rc=recents();if(rc.length){h+=`<div class="sec">Recientes</div>`;rc.slice(0,5).forEach((r,i)=>h+=`<div class="row" data-go="r${i}"><span class="em">🕘</span><div class="tx"><div class="t1">${esc(r.name)}</div></div></div>`);}
  h+=adHTML(pickAd(FROM?[nearest([FROM.lat,FROM.lon]).n]:[]));
  h+=`<p class="note">Estaciones y salidas: © colaboradores de OpenStreetMap. Tiempos estimados; no refleja estaciones cerradas ni fallas del servicio.</p>`;
  $("sc").innerHTML=h;setSheet(sheetState==="full"?"half":sheetState);
  const g=$("bGps");if(g)g.onclick=()=>useGPS(true);
}
$("sc").addEventListener("click",e=>{
  const ed=e.target.closest("[data-edit]");if(ed){e.stopPropagation();openPicker(ed.dataset.edit);return;}
  const r=e.target.closest("[data-go]");if(!r)return;const k=r.dataset.go;
  if(k==="home"||k==="work"){const s=saved(k);if(s)setPoint("to",{...s});else openPicker(k);return;}
  if(k[0]==="r"){const x=recents()[+k.slice(1)];if(x)setPoint("to",{...x});return;}
  if(k[0]==="x"){const [n,i]=k.slice(1).split("|");const ex=EXITS[n][+i];setPoint("to",{lat:ex.ll[0],lon:ex.ll[1],name:`${n} · ${ex.name?"salida "+ex.name:"salida"}`});}
});

function legFlow(r){return r.legs.map(g=>g.type==="walk"?"🚶":g.type==="ride"?chip(g.line):"").filter(Boolean).join(" › ");}
function stepsHTML(r){
  let li="";
  r.legs.forEach(g=>{
    if(g.type==="walk"&&g.first)li+=`<li><span class="ic walk">🚶</span><div>Camina a <b>${esc(g.to)}</b> ${chips(g.to)} y entra por ${exName(g.ex)}<span class="t">${fmt(g.min)}${g.m?" · "+Math.round(g.m)+" m":""} · luego ~3 min esperando el tren</span><a class="link" target="_blank" rel="noopener" href="${gmWalk([FROM.lat,FROM.lon],g.ex.ll)}">Ver caminata en Google Maps ↗</a></div></li>`;
    else if(g.type==="ride"){const L=LINES[g.line];li+=`<li><span class="ic" style="background:${L.color};color:${L.dark?"#3a2b00":"#fff"}">${L.short}</span><div>Toma la <b>${L.name}</b> dirección <b>${esc(g.dir)}</b> y bájate en <b>${esc(g.to)}</b><span class="t">${g.stops} ${g.stops===1?"estación":"estaciones"} · ${fmt(g.min)}</span></div></li>`;}
    else if(g.type==="xfer"){const L=LINES[g.toLine];li+=`<li><span class="ic xfer">⇄</span><div>Transbordo ${g.from===g.to?"en <b>"+esc(g.from)+"</b>":"de <b>"+esc(g.from)+"</b> a <b>"+esc(g.to)+"</b> por el pasillo"} hacia la ${L.name}<span class="t">~${fmt(g.min)}</span></div></li>`;}
    else if(g.type==="walk"&&g.last)li+=`<li><span class="ic walk">🏁</span><div>Sal de <b>${esc(g.from)}</b> por ${exName(g.ex)} y camina a <b>${esc(TO.name)}</b><span class="t">${fmt(g.min)}${g.m?" · "+Math.round(g.m)+" m":""}</span><a class="link" target="_blank" rel="noopener" href="${gmWalk(g.ex.ll,[TO.lat,TO.lon])}">Ver caminata en Google Maps ↗</a></div></li>`;
  });
  return `<ul class="steps">${li}</ul>`;
}
function routeHTML(r){
  const arr=new Date(Date.now()+r.total*60000);
  let h=`<div class="sum"><b>${fmt(r.total)}</b><span>llegas ~${clock(arr)}${r.walkOnly?" · a pie":" · a pie serían "+fmt(r.direct)}</span></div>`;
  if(!r.walkOnly)h+=`<div class="flow">${legFlow(r)}</div>`;
  if(!metroOpen()&&!r.walkOnly)h+=`<p class="hint" style="color:var(--acc);margin:6px 0 0">El Metro está cerrado ahora (abre 5:30 a. m.).</p>`;
  h+=`<div class="btns">${r.walkOnly?`<a class="btn pri" target="_blank" rel="noopener" href="${gmWalk([FROM.lat,FROM.lon],[TO.lat,TO.lon])}">Ir caminando ↗</a>`:`<button class="btn pri" id="bTrip">▶ Iniciar viaje</button>`}<button class="btn" id="bShare">Compartir</button></div>`;
  h+=`<button class="from" id="bFrom2"><span class="d"></span><span style="flex:1"><span style="display:block;font-size:12px;color:var(--mut)">Desde</span><b>${esc(FROM.name)}</b></span><span class="link">Cambiar</span></button>`;
  if(r.walkOnly)h+=`<p class="hint">Te queda más rápido ir caminando que tomar el Metro.</p>`;else h+=stepsHTML(r);
  h+=`<div class="btns"><button class="btn sm" data-save="home">🏠 Guardar como Casa</button><button class="btn sm" data-save="work">💼 Guardar como Trabajo</button></div>`;
  h+=adHTML(r.ad);
  h+=`<p class="note">Tiempos estimados: tren ≈30 km/h, 3 min de espera, 4–6 min por transbordo. No refleja estaciones cerradas ni fallas del servicio.</p>`;
  return h;
}
function bindRoute(r){
  const t=$("bTrip");if(t)t.onclick=()=>startTrip(r);
  $("bShare").onclick=()=>share(r);$("bFrom2").onclick=()=>openPicker("from");
  $("sc").querySelectorAll("[data-save]").forEach(b=>b.onclick=()=>setPoint(b.dataset.save,{...TO}));
}
function renderRoute(tok,keepView){
  VIEW="route";const a=[FROM.lat,FROM.lon],b=[TO.lat,TO.lon];const r=route(FROM,TO);
  if(!r.walkOnly)r.ad=pickAd(r.legs.filter(g=>g.type==="ride").flatMap(g=>[g.from,g.to]));
  $("sc").innerHTML=routeHTML(r);bindRoute(r);if(!keepView)setSheet(sheetState==="peek"?"half":sheetState);
  if(!mapReady)return;
  const pts=[a,b];
  if(r.walkOnly){walkRoute(a,b).then(w=>{if(tok!==renderTok)return;setData("walk",fc([lineF(w?w.path:[a,b])]));});if(!keepView)fit(pts);return;}
  map.setPaintProperty("net","line-opacity",.28);map.setPaintProperty("net-case","line-opacity",.28);
  const rides=r.legs.filter(g=>g.type==="ride").map(g=>{const s=pathShape(g.line,g.path);s.forEach(p=>pts.push(p));return lineF(s,{c:LINES[g.line].color});});
  setData("route",fc(rides));
  const first=r.legs[0],last=r.legs[r.legs.length-1];pts.push(first.ex.ll,last.ex.ll);
  setData("walk",fc([lineF([a,first.ex.ll]),lineF([last.ex.ll,b])]));
  if(!keepView)fit(pts);
  Promise.all([walkRoute(a,first.ex.ll),walkRoute(last.ex.ll,b)]).then(([w1,w2])=>{
    if(tok!==renderTok)return;
    setData("walk",fc([lineF(w1?w1.path:[a,first.ex.ll]),lineF(w2?w2.path:[last.ex.ll,b])]));
    if(w1){r.total+=w1.min-first.min;first.min=w1.min;first.m=w1.m;}
    if(w2){r.total+=w2.min-last.min;last.min=w2.min;last.m=w2.m;}
    if((w1||w2)&&VIEW==="route"){const st=$("sc").scrollTop;$("sc").innerHTML=routeHTML(r);bindRoute(r);$("sc").scrollTop=st;}
  });
}

// --- estación ---
function openStation(n){if(pickOnMap){const w=pickOnMap;pickOnMap=null;setPoint(w,stPoint(n));return;}if(VIEW==="trip")return;cardStation=n;VIEW="station";render();setSheet("half");if(mapReady)map.easeTo({center:LL(ST[n]),zoom:Math.max(map.getZoom(),16),duration:500});}
const stPoint=n=>({lat:ST[n][0],lon:ST[n][1],name:"Estación "+n});
function renderStation(){
  const n=cardStation,ex=MD.exits[n]?EXITS[n]:[];
  let h=`<h2>${esc(n)} ${chips(n)}</h2><div class="btns"><button class="btn pri" id="sTo">Ir aquí</button><button class="btn" id="sFrom">Salir desde aquí</button></div>`;
  if(ex.length){h+=`<div class="sec">${ex.length} ${ex.length===1?"salida":"salidas"} · toca una para ir hasta ella</div>`;ex.forEach((e,i)=>h+=`<div class="row" data-go="x${esc(n)}|${i}"><span class="em">⬆️</span><div class="tx"><div class="t1">${e.name?esc(e.name):"Salida "+(i+1)}</div></div></div>`);}
  h+=adHTML(pickAd([n]));
  h+=`<p class="note"><button class="link" id="sBack">← Volver</button></p>`;
  $("sc").innerHTML=h;
  $("sTo").onclick=()=>setPoint("to",stPoint(n));$("sFrom").onclick=()=>setPoint("from",stPoint(n));
  $("sBack").onclick=()=>{VIEW=TO?"route":"idle";render(true);};
}

// --- compartir ---
async function share(r){
  const u=new URL(URL_BASE);u.searchParams.set("to",`${TO.lat.toFixed(5)},${TO.lon.toFixed(5)}`);u.searchParams.set("tn",TO.name);
  if(FROM&&!FROM.live){u.searchParams.set("from",`${FROM.lat.toFixed(5)},${FROM.lon.toFixed(5)}`);u.searchParams.set("fn",FROM.name);}
  let txt=`Cómo llegar a ${TO.name} en Metro (${fmt(r.total)}):`;
  if(!r.walkOnly){for(const g of r.legs){if(g.type==="walk"&&g.first)txt+=`\n• Entra en ${g.to}${g.ex&&g.ex.name?" por la salida "+g.ex.name:""}`;else if(g.type==="ride")txt+=`\n• ${LINES[g.line].name} dirección ${g.dir} hasta ${g.to}`;else if(g.type==="walk"&&g.last)txt+=`\n• Sal${g.ex&&g.ex.name?" por la salida "+g.ex.name:""} y camina ${fmt(g.min)}`;}}
  else txt+=`\n• Mejor ve caminando`;
  txt+=`\n\nVe la ruta en el mapa: ${u.toString()}`;
  if(navigator.share){try{await navigator.share({title:"Metro CCS",text:txt});return;}catch(e){if(e.name==="AbortError")return;}}
  location.href="https://wa.me/?text="+encodeURIComponent(txt);
}

// --- modo en el tren ---
function startTrip(r){
  const seq=[];r.legs.forEach((g,li)=>{if(g.type==="ride")g.path.forEach((s,i)=>{if(i===0&&seq.length&&seq[seq.length-1].st===s){seq[seq.length-1].xfer=true;return;}seq.push({st:s,leg:li,line:g.line});});});
  TRIP={r,seq,i:0};VIEW="trip";render();setSheet("full");
  if(mapReady)map.easeTo({center:LL(ST[seq[0].st]),zoom:15,duration:500});
  try{if(navigator.wakeLock)navigator.wakeLock.request("screen").then(l=>{if(TRIP)TRIP.lock=l;}).catch(()=>{});}catch(e){}
}
function endTrip(){if(TRIP&&TRIP.lock)try{TRIP.lock.release();}catch(e){}TRIP=null;VIEW=TO?"route":"idle";render(true);}
function renderTrip(){
  const T=TRIP,r=T.r,n=T.seq.length,cur=T.seq[T.i],next=T.seq[T.i+1];
  const finalLeg=r.legs[r.legs.length-1];
  // ¿dónde se baja uno de esta línea? (último índice del tramo)
  const legEnd=k=>{let j=k;while(j+1<n&&T.seq[j+1].leg===T.seq[k].leg)j++;return j;};
  const nextLegOf=k=>T.seq[legEnd(k)+1];
  let box;
  if(T.i===n-1)box={k:"Llegaste a",v:cur.st,x:`Sal por ${exPlain(finalLeg.ex)} y camina ${fmt(finalLeg.min)} hasta ${TO.name}.`,c:"#1aa260"};
  else if(legEnd(T.i)===T.i){const nl=nextLegOf(T.i);box={k:"Transbordo",v:`Bájate aquí: ${cur.st}`,x:`Cambia a la ${LINES[nl.line].name} dirección ${r.legs[nl.leg].dir}.`,c:LINES[nl.line].color};}
  else if(legEnd(T.i)===T.i+1){const fin=T.i+1===n-1;box={k:"¡Bájate en la próxima!",v:next.st,x:fin?`Luego sal por ${exPlain(finalLeg.ex)}.`:`Ahí haces transbordo a la ${LINES[nextLegOf(T.i+1).line].name}.`,c:"#d7261e"};}
  else{const leg=r.legs[cur.leg],rem=legEnd(T.i)-T.i;box={k:`${LINES[leg.line].name} · dirección ${leg.dir}`,v:`Próxima: ${next.st}`,x:`Te bajas en ${T.seq[legEnd(T.i)].st} · faltan ${rem} estaciones.`,c:LINES[leg.line].color};}
  let h=`<div class="trip-now" style="background:${box.c};${box.c==="#F2B705"?"color:#2a2000":""}"><div class="k">${esc(box.k)}</div><div class="v">${esc(box.v)}</div><div class="x">${esc(box.x)}</div></div>`;
  h+=`<ul class="stops">`;T.seq.forEach((s,k)=>{const end=legEnd(k)===k;h+=`<li class="${k<T.i?"done":k===T.i?"cur":end?"end":""}" style="--lc:${LINES[s.line].color}">${esc(s.st)}${end&&k>=T.i?`<span class="tag">${k===n-1?"Bájate":"Transbordo"}</span>`:""}</li>`;});h+=`</ul>`;
  h+=`<div class="btns">${T.i===n-1?`<button class="btn pri" id="tEnd">Terminar viaje</button>`:`<button class="btn pri" id="tNext">Llegué a ${esc(next.st)}</button><button class="btn" id="tEnd" style="flex:.5">Salir</button>`}</div>`;
  h+=`<p class="note">Abajo casi no hay GPS: toca «Llegué» en cada estación. Si tu teléfono tiene señal cerca de una estación, avanzo solo.</p>`;
  $("sc").innerHTML=h;
  const nb=$("tNext");if(nb)nb.onclick=()=>{TRIP.i++;render();if(mapReady)map.easeTo({center:LL(ST[TRIP.seq[TRIP.i].st]),duration:400});if(navigator.vibrate)navigator.vibrate(30);};
  $("tEnd").onclick=endTrip;
  const c=$("sc").querySelector(".stops .cur");if(c)c.scrollIntoView({block:"center"});
}

// ================= BUSCADOR =================
let choosing="to",searchTimer=null,searchResults=[];
function openPicker(which){choosing=which;$("picker").classList.add("on");$("q").value="";searchResults=[];
  $("q").placeholder=which==="from"?"¿Desde dónde sales?":which==="home"?"Dirección de tu casa":which==="work"?"Dirección de tu trabajo":"¿A dónde vas?";drawList();setTimeout(()=>$("q").focus(),80);}
$("pclose").onclick=()=>$("picker").classList.remove("on");
$("q").oninput=()=>{searchResults=[];drawList();clearTimeout(searchTimer);const v=$("q").value.trim();if(v.length>=3)searchTimer=setTimeout(()=>geoSearch(v),550);};
$("q").onkeydown=e=>{if(e.key==="Enter"){clearTimeout(searchTimer);geoSearch($("q").value.trim());}};
async function geoSearch(q){if(!q)return;let out=[],fail=false;
  try{const c=new AbortController();setTimeout(()=>c.abort(),7000);
    const res=await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=ve&viewbox=-67.10,10.56,-66.70,10.30&bounded=1&accept-language=es&q=${encodeURIComponent(q)}`,{signal:c.signal});
    out=(await res.json()).map(x=>({name:x.display_name.split(",").slice(0,3).join(","),lat:+x.lat,lon:+x.lon}));}catch(e){fail=true;}
  if($("q").value.trim()!==q)return;searchResults=out;drawList(fail?"offline":"done");}
function drawList(state){
  const f=norm($("q").value);let h="";
  if(!f){if(choosing!=="home"&&choosing!=="work")h+=`<div class="row" data-k="gps"><span class="em">📍</span><div class="tx"><div class="t1">Mi ubicación</div><div class="t2">GPS del teléfono</div></div></div>`;
    h+=`<div class="row" data-k="map"><span class="em">👆</span><div class="tx"><div class="t1">Marcar en el mapa</div><div class="t2">Toca el punto exacto</div></div></div>`;
    if(choosing==="to"||choosing==="from"){for(const k of["home","work"]){const s=saved(k);if(s)h+=`<div class="row" data-k="${k}"><span class="em">${k==="home"?"🏠":"💼"}</span><div class="tx"><div class="t1">${k==="home"?"Casa":"Trabajo"}</div><div class="t2">${esc(s.name)}</div></div></div>`;}
      const rc=recents();if(rc.length){h+=`<div class="sec">Recientes</div>`+rc.map((r,i)=>`<div class="row" data-k="c:${i}"><span class="em">🕘</span><div class="tx"><div class="t1">${esc(r.name)}</div></div></div>`).join("");}}}
  if(searchResults.length)h+=`<div class="sec">Direcciones</div>`+searchResults.map((r,i)=>`<div class="row" data-k="r:${i}"><span class="em">🔎</span><div class="tx"><div class="t1">${esc(r.name)}</div></div></div>`).join("");
  else if(state==="offline")h+=`<p class="hint">Sin conexión para buscar direcciones. Elige una estación o un lugar de la lista, o márcalo en el mapa.</p>`;
  else if(state==="done"&&f)h+=`<p class="hint">No encontré esa dirección. Prueba con otro nombre o márcala en el mapa.</p>`;
  else if(f.length>=3)h+=`<p class="hint">Buscando direcciones…</p>`;
  const sl=Object.keys(ST).filter(n=>!f||norm(n).includes(f)).sort((a,b)=>a.localeCompare(b,"es"));
  const pl=PLACES.filter(p=>!f||norm(p.name).includes(f));
  const stRows=()=>sl.map(n=>`<div class="row" data-k="s:${esc(n)}"><span class="em">Ⓜ️</span><div class="tx"><div class="t1">${esc(n)} ${chips(n)}</div></div></div>`).join("");
  if(f&&sl.length)h+=`<div class="sec">Estaciones</div>`+stRows();
  if(pl.length)h+=`<div class="sec">Lugares</div>`+pl.map(p=>`<div class="row" data-k="p:${PLACES.indexOf(p)}"><span class="em">${p.em}</span><div class="tx"><div class="t1">${esc(p.name)}</div></div></div>`).join("");
  if(!f)h+=`<div class="sec">Estaciones</div>`+stRows();
  $("plist").innerHTML=h;
}
$("plist").onclick=e=>{const o=e.target.closest(".row");if(!o)return;const k=o.dataset.k;$("picker").classList.remove("on");const w=choosing;
  if(k==="map"){pickOnMap=w;toast(w==="from"?"Toca el mapa donde estás":"Toca el mapa en el lugar",3500);setSheet("peek");return;}
  if(k==="gps"){if(ME)setPoint(w,{...ME,name:"Mi ubicación",live:w==="from"});else{pendingGPS=w;useGPS(true);}return;}
  if(k==="home"||k==="work")return setPoint(w,{...saved(k)});
  if(k.startsWith("c:"))return setPoint(w,{...recents()[+k.slice(2)]});
  if(k.startsWith("r:"))return setPoint(w,{...searchResults[+k.slice(2)]});
  if(k.startsWith("p:")){const p=PLACES[+k.slice(2)];return setPoint(w,{lat:p.lat,lon:p.lon,name:p.name});}
  if(k.startsWith("s:"))return setPoint(w,stPoint(k.slice(2)));};
$("search").onclick=e=>{if(e.target.id==="clr"){e.stopPropagation();clearDest();return;}openPicker("to");};

// ================= GPS =================
let watching=false,pendingGPS=null;
function useGPS(user){
  if(!navigator.geolocation){if(user)toast("Tu navegador no permite usar la ubicación.");return;}
  if(watching){if(ME&&mapReady)map.easeTo({center:LL([ME.lat,ME.lon]),zoom:15.5,duration:500});else if(user)toast("Buscando tu ubicación…");return;}
  watching=true;if(user)toast("Buscando tu ubicación… acepta el permiso.");
  navigator.geolocation.watchPosition(p=>{
    const first=!ME;ME={lat:p.coords.latitude,lon:p.coords.longitude};marker("me",[ME.lat,ME.lon],"mefix");
    if(pendingGPS){const w=pendingGPS;pendingGPS=null;setPoint(w,{...ME,name:"Mi ubicación",live:w==="from"});}
    else if(first){if(!FROM){FROM={...ME,name:"Mi ubicación",live:true};render();}if(mapReady&&!TO)map.easeTo({center:LL([ME.lat,ME.lon]),zoom:14.5,duration:600});}
    else if(FROM&&FROM.live&&hav([FROM.lat,FROM.lon],[ME.lat,ME.lon])>0.06&&VIEW!=="trip"&&VIEW!=="station"){FROM={...ME,name:"Mi ubicación",live:true};render(true);}
    if(TRIP){const nx=TRIP.seq[TRIP.i+1];if(nx&&hav([ME.lat,ME.lon],ST[nx.st])<0.2&&p.coords.accuracy<150){TRIP.i++;render();if(navigator.vibrate)navigator.vibrate([60,40,60]);}}
  },err=>{watching=false;if(err.code===1&&(user||!FROM))toast("Sin permiso de ubicación. Actívalo en Ajustes › Safari › Ubicación, o elige tu punto de partida.",5000);},{enableHighAccuracy:true,maximumAge:10000,timeout:20000});
}
$("gps").onclick=()=>useGPS(true);

// ================= MENÚ =================
function openMenu(){
  let h=`<div class="row" data-m="dl"><span class="em">📶</span><div class="tx"><div class="t1">Guardar el mapa para usar sin señal</div><div class="t2">Descarga el mapa de Caracas (unos 10–20 MB). Mejor con Wi-Fi.${store.get("offline",0)?" · Ya lo guardaste":""}</div></div></div>`;
  if(!navigator.standalone)h+=`<div class="row" data-m="ios"><span class="em">📲</span><div class="tx"><div class="t1">Instalar como app</div><div class="t2">iPhone: Safari › Compartir › «Agregar a pantalla de inicio»</div></div></div>`;
  h+=`<div class="row" data-m="net"><span class="em">🗺️</span><div class="tx"><div class="t1">Ver toda la red</div><div class="t2">Las 5 líneas y el Metro Los Teques</div></div></div>`;
  h+=`<div class="row"><span class="em">🕒</span><div class="tx">${statusHTML()}<div class="t2">Todos los días, 5:30 a. m. – 11:00 p. m. (según OpenStreetMap)</div></div></div>`;
  if(CONTACT)h+=`<div class="row" data-m="ads"><span class="em">📣</span><div class="tx"><div class="t1">Anuncia tu negocio aquí</div><div class="t2">Escríbenos por correo</div></div></div>`;
  h+=`<div class="row" data-m="clr"><span class="em">🧹</span><div class="tx"><div class="t1">Borrar Casa, Trabajo y recientes</div></div></div>`;
  h+=`<div class="credit">${SIGN}</div>`;
  h+=`<p class="note">Mapa: OpenFreeMap · © OpenMapTiles · © colaboradores de OpenStreetMap. Estaciones y salidas de OpenStreetMap; si ves un error, avísanos.</p>`;
  $("mlist").innerHTML=h;$("menu").classList.add("on");
}
$("mbtn").onclick=openMenu;$("mclose").onclick=()=>$("menu").classList.remove("on");
$("mlist").onclick=e=>{const r=e.target.closest("[data-m]");if(!r)return;const m=r.dataset.m;
  if(m==="dl"){$("menu").classList.remove("on");downloadMap();}
  if(m==="ios"){$("menu").classList.remove("on");$("iosTip").style.display="block";$("welcome").classList.add("on");}
  if(m==="net"){$("menu").classList.remove("on");clearDest();fitAll();}
  if(m==="ads")location.href=CONTACT+"?subject="+encodeURIComponent("Publicidad en Metro CCS");
  if(m==="clr"){store.set("home",null);store.set("work",null);store.set("recents",[]);toast("Listo, borrado.");$("menu").classList.remove("on");render(true);}
};

// ================= SIN SEÑAL =================
async function downloadMap(){
  if(!("caches" in window)){toast("Tu navegador no permite guardar el mapa.");return;}
  try{
    const tj=await (await fetch("https://tiles.openfreemap.org/planet")).json();const tpl=tj.tiles[0];
    const bb=[-67.06,10.33,-66.78,10.53],list=[];
    const tx=(lon,z)=>Math.floor((lon+180)/360*2**z),ty=(lat,z)=>{const r=lat*Math.PI/180;return Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*2**z);};
    for(let z=9;z<=14;z++)for(let x=tx(bb[0],z);x<=tx(bb[2],z);x++)for(let y=ty(bb[3],z);y<=ty(bb[1],z);y++)list.push(tpl.replace("{z}",z).replace("{x}",x).replace("{y}",y));
    const total=list.length,cache=await caches.open("mccs-tiles");let done=0,fail=0;
    toast(`Guardando el mapa… 0 de ${total}`,60000);
    const worker=async()=>{while(list.length){const u=list.shift();try{if(!(await cache.match(u))){const r=await fetch(u);if(r.ok)await cache.put(u,r);else fail++;}}catch(e){fail++;}done++;if(done%10===0)toast(`Guardando el mapa… ${done} de ${total}`,60000);}};
    await Promise.all([1,2,3,4,5,6].map(worker));
    store.set("offline",Date.now());
    toast(fail?`Mapa guardado (${fail} partes no se pudieron bajar; vuelve a intentarlo).`:"¡Listo! El mapa de Caracas quedó guardado para usar sin señal.",4500);
  }catch(e){toast("No pude descargar el mapa ahora. Intenta con Wi-Fi.");}
}
if("serviceWorker" in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));

// ================= ARRANQUE =================
(function start(){
  const sp=new URLSearchParams(location.search);
  const pp=(k,nk)=>{const v=sp.get(k);if(!v)return null;const [la,lo]=v.split(",").map(Number);return isFinite(la)&&isFinite(lo)?{lat:la,lon:lo,name:sp.get(nk)||"Punto compartido"}:null;};
  const t=pp("to","tn"),f=pp("from","fn");if(t){TO=t;VIEW="route";}if(f)FROM=f;
  setSheet("peek");initMap();render();
  const ios=/iPhone|iPad/.test(navigator.userAgent)&&!navigator.standalone;
  if(!store.get("welcomed",false)&&!t){$("welcome").classList.add("on");if(!ios)$("iosTip").style.display="none";}
  else useGPS(false);
  $("wgo").onclick=()=>{store.set("welcomed",true);$("welcome").classList.remove("on");useGPS(true);};
})();
})();
