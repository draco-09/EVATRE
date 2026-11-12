/* =====================================================================
   CONFIGURACIÓN
   ===================================================================== */
const VEL=20;                       // km/h para el tiempo aproximado
const ESPERA=8, TRANSBORDO=6;       // solo para elegir la mejor combinación (no se suman al tiempo mostrado)
const TODAS_PASAN_POR_CENTRO=true;  // según el equipo: todas las rutas pasan por el Parque Santander (poner false para desactivar)

/* =====================================================================
   DATOS. Las coordenadas de abajo son una estimación inicial: al arrancar,
   EVATRE las verifica con OpenStreetMap y corrige las que encuentra.
   Formato: id|Nombre|lat|lng|alias;alias
   ===================================================================== */
const NODOS_TXT = `
centro|Centro (Parque Santander)|7.8939|-72.5078|centro;parque santander;parque colon
terminal|Terminal de Transportes|7.8845|-72.5015|terminal;terminal de transportes
cenabastos|Cenabastos|7.8800|-72.4860|cenabastos
guaimaral|Guaimaral|7.9170|-72.5090|guaimaral
sevilla|Sevilla|7.8870|-72.5060|sevilla;av sevilla
americas|Av. Las Américas|7.9000|-72.5140|americas;las americas;av las americas
camilodaza|Camilo Daza|7.9215|-72.5130|camilo daza
antoniasantos|Antonia Santos|7.9010|-72.5200|antonia santos
escobal|Escobal|7.9140|-72.5250|escobal
barriobogota|Barrio Bogotá|7.8830|-72.5170|barrio bogota;bogota
santacecilia|Santa Cecilia|7.8890|-72.5230|santa cecilia
bellavista|Bellavista|7.8860|-72.5120|bellavista
nidia|Nidia|7.9060|-72.5400|nidia
desierto|El Desierto|7.9000|-72.5290|el desierto;desierto
atalaya|Ciudad Atalaya|7.9060|-72.5340|atalaya;ciudad atalaya
santaana|Santa Ana|7.9150|-72.5380|santa ana
launion|La Unión|7.9100|-72.5300|la union
pradosnorte|Prados Norte|7.9230|-72.4950|prados norte
hospital|Hospital Erasmo Meoz|7.9029|-72.4940|hospital;erasmo meoz;erasmo
cerropico|Cerro Pico|7.9000|-72.5470|cerro pico;cerropico
elprogreso|El Progreso|7.9010|-72.5500|el progreso
trigal|Trigal del Norte|7.9240|-72.4990|trigal;trigal del norte;trigal norte
belen|Belén|7.9150|-72.4800|belen
salado|El Salado|7.9060|-72.4840|salado;el salado;carcel modelo
portico|El Pórtico|7.9110|-72.4950|portico;el portico
cocacola|Coca Cola|7.9000|-72.5000|coca cola
montebello|Montebello|7.8450|-72.5200|montebello
villasilvania|Villa Silvania|7.8650|-72.5120|villa silvania;silvania
tierralinda|Tierra Linda (Los Patios)|7.8161|-72.5139|tierra linda;tierralinda
llanitos|Llanitos (Los Patios)|7.8210|-72.5030|llanitos;los llanitos
lospatios|Los Patios|7.8342|-72.5059|los patios;patios
laparada|La Parada|7.8300|-72.4480|la parada;parada
villadelrosario|Villa del Rosario|7.8335|-72.4730|villa del rosario;rosario
acacios|Los Acacios|7.8400|-72.4600|acacios;los acacios;acasios
palmita|La Palmita|7.8600|-72.4780|palmita;la palmita
garciaherreros|García Herreros|7.8560|-72.5070|garcia herreros
cuberos|Cuberos|7.8920|-72.5290|cuberos
losalpes|Los Alpes|7.8990|-72.5230|los alpes
vallesrodeo|Valles del Rodeo|7.9080|-72.4700|valles del rodeo;rincon del rodeo
zulima|Zulima|7.9000|-72.4790|zulima
siglo21|Siglo XXI|7.9180|-72.5200|siglo xxi;siglo 21
nogal|El Nogal|7.8700|-72.5200|nogal;el nogal
motilones|Motilones|7.8800|-72.5250|motilones
lasabana|La Sabana|7.8500|-72.5010|la sabana;sabana
sanmartin|San Martín|7.9120|-72.4870|san martin
colsag|Colsag|7.9025|-72.4870|colsag
molinos|Molinos|7.9270|-72.5080|molinos;aeropuerto;camilo daza aeropuerto
colinas|Colinas|7.9230|-72.5170|colinas
nuevohorizonte|Nuevo Horizonte|7.9120|-72.5420|nuevo horizonte
aguascalientes|Aguas Calientes|7.9280|-72.5300|aguas calientes
betania|Betania|7.8420|-72.5260|betania
chaparral|Chaparral|7.9290|-72.5180|chaparral
sena|SENA|7.9100|-72.4930|sena
udes|UDES (Universidad de Santander)|7.9085|-72.5090|udes;universidad de santander
usb|Universidad Simón Bolívar|7.8955|-72.5105|universidad simon bolivar;usb;unisimon;simon bolivar universidad
escalabrini|Escalabrini|7.9070|-72.5230|escalabrini
gaitan|Gaitán|7.9070|-72.5110|gaitan
sanluis|San Luis|7.9100|-72.5030|san luis
juanarangel|Juana Rangel|7.8800|-72.5290|juana rangel
mariapaz|María Paz|7.8950|-72.5350|maria paz
sancayetano|San Cayetano|7.8700|-72.6100|san cayetano
elzulia|El Zulia|7.9380|-72.5990|el zulia;zulia
pinar|Pinar del Río|7.8690|-72.4990|pinar del rio;pinar
sanrafael|San Rafael|7.8780|-72.5030|san rafael
cormoranes|Torres de Cormoranes|7.9170|-72.4720|cormoranes;cormonares;torres de cormoranes
pradoseste|Prados del Este|7.8960|-72.4720|prados del este
simonbolivar|Simón Bolívar (barrio)|7.9000|-72.5380|simon bolivar;barrio simon bolivar
porvenir|Porvenir|7.9170|-72.5330|porvenir
`.trim().split("\n").map(l=>{const p=l.split("|");return {id:p[0],n:p[1],ll:[+p[2],+p[3]],al:p[4].split(";"),ver:null};});
const IX={};NODOS_TXT.forEach((n,i)=>IX[n.id]=i);

/* Texto con el que se busca cada parada en OpenStreetMap (por defecto: "Nombre, Cúcuta") */
const QUERY={
  tierralinda:"barrio Tierra Linda, Los Patios", llanitos:"barrio Llanitos, Los Patios", lospatios:"Los Patios, Norte de Santander",
  laparada:"La Parada, Villa del Rosario", villadelrosario:"Villa del Rosario, Norte de Santander", acacios:"Los Acacios, Villa del Rosario",
  montebello:"Montebello, Los Patios", lasabana:"La Sabana, Los Patios", elzulia:"El Zulia, Norte de Santander",
  sancayetano:"San Cayetano, Norte de Santander", centro:"Parque Santander, Cúcuta", terminal:"Terminal de Transporte, Cúcuta",
  hospital:"Hospital Universitario Erasmo Meoz, Cúcuta", udes:"Universidad de Santander, Cúcuta",
  usb:"Universidad Simón Bolívar, Cúcuta", sena:"SENA, Cúcuta", americas:"Avenida Las Américas, Cúcuta",
  molinos:"barrio Molinos, Cúcuta", sevilla:"barrio Sevilla, Cúcuta", pinar:"Pinar del Río, Cúcuta"
};

/* Empresas y rutas: [código, nombre, paradas (ids), vías (opcional, separadas por |)]
   Las "vías" solo están donde hay un documento que las describe. */
const EMP=[
 {n:"Trasan S.A.",c:"#e53935",p:"TS",r:[
  ["1","Tierra Linda – Terminal – Centro","tierralinda lospatios pinar sanrafael terminal centro usb",
     "Av. 10|Pinar del Río|San Rafael|Av. 1|Diagonal Santander|Redoma El Terminal|Av. 8|Calle 9|Calle 13|Av. 6|Calle 15|Av. 2"],
  ["2","Tierra Linda – El Progreso","tierralinda lospatios pinar sanrafael terminal centro usb atalaya cerropico elprogreso",
     "Av. 10|Pinar del Río|San Rafael|Av. 1|Diagonal Santander|Redoma El Terminal|Av. 8|Autopista Atalaya|Cerro Pico|Calle 13|Av. 6|Calle 15|Av. 2"],
  ["(código por confirmar)","Tierra Linda – Cenabastos","tierralinda lospatios pinar sanrafael terminal cenabastos"],
  ["U12","Antonia Santos – Centro","antoniasantos americas centro"],
  ["U13","Antonia Santos – Escobal","antoniasantos escobal"],
  ["U11","Barrio Bogotá – Cenabastos","barriobogota terminal cenabastos"],
  ["U14","Barrio Bogotá – Centro","barriobogota centro"],
  ["U10","Barrio Bogotá – Santa Cecilia","barriobogota santacecilia"],
  ["U16","Camilo Daza – Guaimaral – Centro","camilodaza guaimaral centro"],
  ["U25","Escobal – San Luis – Gaitán","escobal sanluis gaitan"],
  ["U24","Escobal – Guaimaral – Gaitán","escobal guaimaral gaitan"],
  ["U17","Nidia – El Desierto – Centro","nidia desierto centro"],
  ["U18","Nidia – Centro","nidia centro"],
  ["U19","Nidia – Américas – Centro","nidia americas centro"],
  ["U20","Nidia – Santa Ana – La Unión","nidia santaana launion"],
  ["U1","Prados Norte – Faroles – Centro","pradosnorte portico centro"],
  ["U2","Prados Norte – Cerro Pico","pradosnorte centro cerropico"],
  ["U3","Prados Norte – Libertadores – Centro","pradosnorte hospital centro"],
  ["U22","Trigal Norte – Guaimaral – Centro","trigal guaimaral centro"],
  ["U21","Trigal Norte – Terminal – Centro","trigal terminal centro"],
  ["U9","Belén – Guaimaral – Cenabastos","belen guaimaral cenabastos"],
  ["U5","Salado – Centro","salado centro"],
  ["U6","Salado – El Pórtico","salado portico"],
  ["U7","Salado – Coca Cola","salado cocacola"],
  ["M3","Montebello – Villa Silvania","montebello villasilvania"],
  ["M4","Montebello – Cenabastos","montebello villasilvania cenabastos"],
  ["M5","Montebello – Américas","montebello nogal americas"]
 ]},
 {n:"Transguasimales",c:"#43a047",p:"GS",r:[
  ["(código por confirmar)","Tierra Linda – Cenabastos","tierralinda lospatios pinar sanrafael terminal cenabastos"],
  ["U18","Valles del Rodeo – Hospital – Zulima – Cenabastos","vallesrodeo hospital zulima cenabastos"],
  ["U14","Cuberos – Prados del Este","cuberos centro pradoseste"],
  ["U1","García Herreros – Los Alpes","garciaherreros villasilvania terminal losalpes"],
  ["M6","Montebello – El Nogal – Siglo XXI","montebello nogal siglo21"],
  ["M3","Montebello – El Nogal – Nidia","montebello nogal nidia"],
  ["M11V2","Montebello – Sevilla – Cenabastos – Guaimaral","montebello sevilla cenabastos guaimaral"],
  ["M4","Montebello – El Nogal – Motilones","montebello nogal motilones"],
  ["M5","Tierra Linda – García Herreros","tierralinda garciaherreros"],
  ["M9","La Sabana – Terminal","lasabana terminal"],
  ["M10","La Sabana – Guaimaral – Cenabastos","lasabana guaimaral cenabastos"]
 ]},
 {n:"Trans Tonchalá",c:"#6d4c41",p:"TC",r:[
  ["U4V1","Belén – San Martín","belen sanmartin"],
  ["U5","Belén – Guaimaral – Sevilla","belen guaimaral sevilla"],
  ["U4","Belén – Centro – Guaimaral – Cenabastos","belen centro guaimaral cenabastos"],
  ["U1","San Martín – Éxito – Camilo Daza","sanmartin camilodaza"],
  ["U3","San Martín – Colsag – Camilo Daza","sanmartin colsag camilodaza"],
  ["U10","Molinos – Bellavista","molinos bellavista"],
  ["U11","Molinos – Zulima – Centro","molinos zulima centro"],
  ["U9","Molinos – Sevilla – Centro","molinos sevilla centro"],
  ["U7","Colinas – Guaimaral – Camilo Daza","colinas guaimaral camilodaza"],
  ["U12","Nuevo Horizonte – Centro","nuevohorizonte centro"],
  ["U13","Nuevo Horizonte – Siglo XXI – Guaimaral – Centro","nuevohorizonte siglo21 guaimaral centro"],
  ["M1","Montebello – Molinos","montebello terminal molinos"],
  ["M2","Montebello – Nuevo Horizonte","montebello nogal nuevohorizonte"],
  ["M3","Montebello – Cenabastos","montebello cenabastos"],
  ["M4","Montebello – Escobal","montebello nogal escobal"],
  ["M5","Montebello – Zulima – Cenabastos","montebello zulima cenabastos"],
  ["M6","Montebello – SENA – Cenabastos","montebello sena cenabastos"],
  ["M8","Bellavista – Cerro Pico – El Zulia","bellavista cerropico elzulia"],
  ["M7","Bellavista – Vía Ureña – El Zulia","bellavista elzulia"]
 ]},
 {n:"Trans Oriental",c:"#00897b",p:"TO",r:[
  ["U2V1","Aguas Calientes – Cenabastos","aguascalientes americas cenabastos"],
  ["U2","Aguas Calientes – Américas","aguascalientes americas"],
  ["U12","Villa Silvania – Valles del Rodeo","villasilvania cenabastos vallesrodeo"],
  ["U11","Villa Silvania – Colsag – Valles del Rodeo","villasilvania colsag vallesrodeo"],
  ["U1","Valles del Rodeo – Escobal","vallesrodeo escobal"],
  ["U4","Valles del Rodeo – Villa Silvania","vallesrodeo villasilvania"],
  ["M6","Betania – Cenabastos","betania cenabastos"],
  ["M8V1","Betania – SENA","betania cenabastos sena"],
  ["M4V1","Betania – Motilones","betania motilones"],
  ["M3V1","Chaparral – Guaimaral","chaparral guaimaral"]
 ]},
 {n:"Coomicro Ltda.",c:"#1e88e5",p:"CM",r:[
  ["U1V2","Camilo Daza – Colsag – Bellavista","camilodaza colsag bellavista"],
  ["U2","Escalabrini – Gaitán","escalabrini gaitan"],
  ["U1V1","Escalabrini – Centro","escalabrini centro"],
  ["U9","Santa Ana – SENA – Nuevo Horizonte","santaana sena nuevohorizonte"],
  ["U3","Nuevo Horizonte – Belén – SENA","nuevohorizonte belen sena"],
  ["U8","Juana Rangel – Américas – Cenabastos – Guaimaral – Centro","juanarangel americas cenabastos guaimaral centro"],
  ["U7","Juana Rangel – Centro","juanarangel centro"],
  ["M1","Patios – Nuevo Horizonte","lospatios centro nuevohorizonte"]
 ]},
 {n:"Corta Distancia S.A.",c:"#fb8c00",p:"CD",r:[
  ["M2","Acacios – La Parada","acacios laparada"],
  ["M7","La Palmita – Centro – Terminal","palmita centro terminal"],
  ["M6","La Palmita – Sevilla – Cenabastos","palmita sevilla cenabastos"],
  ["M9","La Palmita – Terminal","palmita terminal"],
  ["M4","La Parada – Cenabastos","laparada villadelrosario cenabastos"],
  ["M12","La Parada – Cenabastos – Terminal","laparada cenabastos terminal"],
  ["M1","La Parada – Terminal","laparada villadelrosario lospatios pinar sanrafael terminal"],
  ["(ruta 1 reestructurada)","La Parada – Los Estoraques","laparada villadelrosario lospatios pinar sanrafael centro atalaya",
     "El Búnker|Anillo Vial Oriental|La Floresta|Pinar del Río|San Rafael|Barrio Blanco|Latino|Cúcuta 75|Niña Ceci|Belisario|Parque Colón|Av. 1|Av. 3|Intercambiador de Atalaya"],
  ["M3","La Parada – Villa Silvania","laparada villasilvania"]
 ]},
 {n:"Trans Petrólea",c:"#8e24aa",p:"TP",r:[
  ["U6","María Paz – Motilones","mariapaz motilones"],
  ["U7V1","Siglo XXI – San Martín","siglo21 sanmartin"],
  ["M1","Cenabastos – San Cayetano","cenabastos sancayetano"],
  ["2.0","Los Patios – El Zulia","lospatios terminal centro elzulia"],
  ["3.0","San Martín – Cenabastos","sanmartin cenabastos"],
  ["4.0","María Paz – Antonia Santos","mariapaz antoniasantos"]
 ]},
 {n:"Transontiveros",c:"#d81b60",p:"OT",r:[
  ["M4","Tierra Linda – Cenabastos","tierralinda lospatios pinar sanrafael terminal cenabastos"],
  ["M5","Torres de Cormoranes – Parque Colón","cormoranes motilones americas sevilla terminal usb centro",
     "Motilones|La Laguna|Curva del Pescado|Av. Las Américas|6 de Mayo|Cecilia Castro|Av. Sevilla|Parque Mercedes Ábrego|Calle 13|Calle 15|Unisimón|Parque Colón"],
  ["PE","Prados del Este – Centro","pradoseste centro"]
 ]},
 {n:"Cootransfronorte",c:"#546e7a",p:"CF",r:[
  ["U2","Simón Bolívar – Centro","simonbolivar centro"],
  ["U3","Simón Bolívar – Guaimaral – Centro","simonbolivar guaimaral centro"],
  ["U1","Porvenir – Centro","porvenir centro"],
  ["U4","Porvenir – Guaimaral – Centro","porvenir guaimaral centro"],
  ["U6","Porvenir – Escobal","porvenir escobal"]
 ]},
 /* Ruta que usted indicó y cuya empresa/código aún no se ha confirmado */
 {n:"Empresa por confirmar",c:"#455a64",p:"",r:[
  ["(código por confirmar)","Llanitos – UDES (pasa por el SENA)","llanitos tierralinda lospatios pinar sanrafael terminal sena udes"]
 ]}
];
const RUTAS=[];
EMP.forEach((e,ei)=>e.r.forEach(r=>RUTAS.push({ei,
  cod:(r[0].startsWith("(")||!e.p)?r[0]:e.p+"-"+r[0], nom:r[1],
  p:r[2].split(" ").map(id=>{if(!(id in IX))throw new Error("Nodo desconocido: "+id);return IX[id];}),
  vias:r[3]?r[3].split("|"):null, geo:null})));

/* ================= Utilidades ================= */
const $=id=>document.getElementById(id);
const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dormir=ms=>new Promise(r=>setTimeout(r,ms));
function hav(a,b){const R=6371,r=x=>x*Math.PI/180,dl=r(b[0]-a[0]),dg=r(b[1]-a[1]);
  const h=Math.sin(dl/2)**2+Math.cos(r(a[0]))*Math.cos(r(b[0]))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(h));}

/* =====================================================================
   MODELO  (datos + lógica; no sabe nada de pantallas)
   ===================================================================== */
class ServicioMapas{                      // Adapter: OSRM (carreteras) y Nominatim/OpenStreetMap (lugares)
  constructor(){this.mem=new Map();this.cola=Promise.resolve();this.ultimo=0;}
  limitado(fn){                           // Nominatim permite 1 consulta por segundo
    const p=this.cola.then(async()=>{const w=this.ultimo+1100-Date.now();if(w>0)await dormir(w);this.ultimo=Date.now();return fn();});
    this.cola=p.catch(()=>{});return p;
  }
  async tabla(pts){
    const c=pts.map(p=>p[1]+','+p[0]).join(';');
    return (await (await fetch(`https://router.project-osrm.org/table/v1/driving/${c}?annotations=distance`)).json()).distances;
  }
  /* Geometría que SIGUE LAS CALLES; nunca devuelve líneas rectas */
  async ruta(pts){
    const k='evatre:r:'+pts.map(p=>p[0].toFixed(4)+','+p[1].toFixed(4)).join(';');
    if(this.mem.has(k))return this.mem.get(k);
    try{const g=localStorage.getItem(k);if(g){const v=JSON.parse(g);this.mem.set(k,v);return v;}}catch(e){}
    const c=pts.map(p=>p[1]+','+p[0]).join(';');
    for(let i=0;i<3;i++){
      try{
        const j=await (await fetch(`https://router.project-osrm.org/route/v1/driving/${c}?overview=full&geometries=geojson`)).json();
        if(j.routes&&j.routes[0]){
          const g=j.routes[0].geometry.coordinates.map(q=>[+q[1].toFixed(5),+q[0].toFixed(5)]);
          this.mem.set(k,g);try{localStorage.setItem(k,JSON.stringify(g));}catch(e){}
          return g;
        }
      }catch(e){}
      await dormir(700);
    }
    return null;
  }
  /* Busca un lugar en OpenStreetMap y devuelve el resultado más cercano a la estimación (máx. 8 km) */
  async lugar(q,ref){
    const k='evatre:g:'+q;let lista=null;
    try{const g=localStorage.getItem(k);if(g)lista=JSON.parse(g);}catch(e){}
    if(!lista){
      try{
        lista=await this.limitado(async()=>{
          const url=`https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=co&viewbox=-72.75,8.05,-72.30,7.70&bounded=1&q=${encodeURIComponent(q)}`;
          const j=await (await fetch(url)).json();
          return j.map(x=>[parseFloat(x.lat),parseFloat(x.lon)]);
        });
        try{localStorage.setItem(k,JSON.stringify(lista));}catch(e){}
      }catch(e){return null;}
    }
    let best=null,bd=8;lista.forEach(p=>{const d=hav(p,ref);if(d<bd){bd=d;best=p;}});
    return best;
  }
  async geocodificar(q){
    try{
      return await this.limitado(async()=>{
        const url=`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&viewbox=-72.75,8.05,-72.30,7.70&bounded=1&q=${encodeURIComponent(q+', Cúcuta')}`;
        const j=await (await fetch(url)).json();
        return j.length?[parseFloat(j[0].lat),parseFloat(j[0].lon)]:null;
      });
    }catch(e){return null;}
  }
}

class Grafo{                              // Grafo de estados (parada, ruta) + Dijkstra
  constructor(nodos,rutas){
    this.nodos=nodos;this.rutas=rutas;this.n=nodos.length;
    this.KM=Array.from({length:this.n},(_,i)=>Array.from({length:this.n},(_,j)=>i===j?0:999));
  }
  estados(){
    this.ST=[];this.porNodo=Array.from({length:this.n},()=>[]);
    this.rutas.forEach((r,ri)=>{r.sid=r.p.map((nodo,i)=>{this.ST.push({ri,i,nodo});this.porNodo[nodo].push(this.ST.length-1);return this.ST.length-1;});});
  }
  construir(){
    this.ADY=this.ST.map(()=>[]);
    this.rutas.forEach(r=>{for(let k=0;k<r.p.length-1;k++){
      const a=r.sid[k],b=r.sid[k+1],w=this.KM[r.p[k]][r.p[k+1]]/VEL*60;
      this.ADY[a].push([b,w]);this.ADY[b].push([a,w]);
    }});
    this.porNodo.forEach(l=>l.forEach(a=>l.forEach(b=>{if(a!==b&&this.ST[a].ri!==this.ST[b].ri)this.ADY[a].push([b,TRANSBORDO]);})));
  }
  dijkstra(origen,destino){
    const V=this.ST.length,dist=Array(V).fill(Infinity),prev=Array(V).fill(-1),vis=Array(V).fill(false);
    this.porNodo[origen].forEach(s=>dist[s]=ESPERA);
    for(let k=0;k<V;k++){
      let u=-1;for(let v=0;v<V;v++)if(!vis[v]&&dist[v]<Infinity&&(u===-1||dist[v]<dist[u]))u=v;
      if(u===-1)break;vis[u]=true;
      this.ADY[u].forEach(([v,w])=>{if(!vis[v]&&dist[u]+w<dist[v]){dist[v]=dist[u]+w;prev[v]=u;}});
    }
    let best=-1;this.porNodo[destino].forEach(s=>{if(dist[s]<Infinity&&(best===-1||dist[s]<dist[best]))best=s;});
    if(best===-1)return null;
    const path=[];for(let s=best;s!==-1;s=prev[s])path.unshift(s);return path;
  }
  tramos(path){
    const segs=[];
    path.forEach(s=>{const st=this.ST[s];
      if(!segs.length||segs[segs.length-1].ri!==st.ri)segs.push({ri:st.ri,nodos:[st.nodo]});
      else{const g=segs[segs.length-1];if(g.nodos[g.nodos.length-1]!==st.nodo)g.nodos.push(st.nodo);}
    });
    return segs.filter(s=>s.nodos.length>1);
  }
}

class Modelo extends EventTarget{         // Fachada + Observer (avisa con eventos)
  constructor(){
    super();
    this.nodos=NODOS_TXT;this.rutas=RUTAS;this.empresas=EMP;
    this.servicio=new ServicioMapas();this.grafo=new Grafo(this.nodos,this.rutas);
    this.listo=this.verificarNodos().then(()=>{this.aplicarCentro();this.grafo.estados();return this.cargarDistancias();});
  }
  emit(t,d){this.dispatchEvent(new CustomEvent(t,{detail:d}));}
  rutasDe(ei){return this.rutas.map((r,i)=>r.ei===ei?i:-1).filter(i=>i>=0);}

  /* Verifica cada parada contra OpenStreetMap (una vez; el resultado queda guardado en el navegador) */
  async verificarNodos(){
    let manual={};try{manual=JSON.parse(localStorage.getItem('evatre:manual')||'{}');}catch(e){}
    let hechos=0;const total=this.nodos.length;
    for(let i=0;i<total;i++){
      const nd=this.nodos[i];
      if(manual[nd.id]){nd.ll=manual[nd.id];nd.ver='manual';}
      else{
        const res=await this.servicio.lugar(QUERY[nd.id]||(nd.n.replace(/ \(.*\)/,"")+', Cúcuta'),nd.ll);
        if(res){nd.ll=res;nd.ver='osm';}else nd.ver='aprox';
      }
      hechos++;this.emit('verificando',{hechos,total,i});
    }
    this.emit('verificado',{});
  }
  /* Todas las rutas pasan por el Parque Santander: se inserta donde menos desvío cause */
  aplicarCentro(){
    if(!TODAS_PASAN_POR_CENTRO)return;
    const c=IX.centro,C=this.nodos[c].ll;
    this.rutas.forEach(r=>{
      if(r.p.includes(c))return;
      let best=0,bd=1e9;
      for(let k=0;k<=r.p.length;k++){
        const A=k>0?this.nodos[r.p[k-1]].ll:null,B=k<r.p.length?this.nodos[r.p[k]].ll:null;
        const d=(A&&B)?hav(A,C)+hav(C,B)-hav(A,B):hav(A||B,C);
        if(d<bd){bd=d;best=k;}
      }
      r.p=[...r.p.slice(0,best),c,...r.p.slice(best)];
    });
  }
  async cargarDistancias(){
    let tabla=null;try{tabla=await this.servicio.tabla(this.nodos.map(n=>n.ll));}catch(e){}
    const g=this.grafo;
    this.rutas.forEach(r=>{for(let k=0;k<r.p.length-1;k++){const a=r.p[k],b=r.p[k+1];
      g.KM[a][b]=g.KM[b][a]=(tabla&&tabla[a][b]!=null)?tabla[a][b]/1000:hav(this.nodos[a].ll,this.nodos[b].ll)*1.3;}});
  }
  moverNodo(i,ll){
    const nd=this.nodos[i];nd.ll=ll;nd.ver='manual';
    try{const m=JSON.parse(localStorage.getItem('evatre:manual')||'{}');m[nd.id]=ll;localStorage.setItem('evatre:manual',JSON.stringify(m));}catch(e){}
    this.rutas.forEach(r=>{if(r.p.includes(i))r.geo=null;});
    this.listo=this.listo.then(()=>this.cargarDistancias());this.emit('nodoMovido',{i});
  }
  async resolver(txt){
    const t=norm(txt);if(!t)throw new Error('Escriba el origen y el destino.');
    let mejor=-1,len=0;
    this.nodos.forEach((nd,i)=>{
      [norm(nd.n.replace(/ \(.*\)/,"")),norm(nd.n),...nd.al.map(norm)].forEach(k=>{
        if(t===k){if(len<1000){mejor=i;len=1000+k.length;}}
        else if(len<1000&&k.length>=4&&(t.includes(k)||(t.length>=4&&k.includes(t)))&&k.length>len){mejor=i;len=k.length;}
      });
    });
    if(mejor>=0)return {nodo:mejor,extra:null};
    const ll=await this.servicio.geocodificar(txt);
    if(!ll)throw new Error('No encontré “'+txt+'”. Pruebe con un barrio o lugar de la lista.');
    let b=0,bd=1e9;this.nodos.forEach((nd,i)=>{if(!this.grafo.porNodo[i].length)return;const d=hav(ll,nd.ll);if(d<bd){bd=d;b=i;}});
    return {nodo:b,extra:{txt,ll,hacia:this.nodos[b].ll,km:bd}};
  }
  /* Todas las busetas que cubren el tramo a→b (cada ruta con su propio recorrido entre esas dos paradas) */
  candidatos(a,b){
    const out=[];
    this.rutas.forEach((r,ri)=>{
      const ia=r.p.indexOf(a),ib=r.p.indexOf(b);if(ia<0||ib<0||ia===ib)return;
      const seq=ia<ib?r.p.slice(ia,ib+1):r.p.slice(ib,ia+1).reverse();
      let km=0;for(let k=0;k<seq.length-1;k++)km+=this.grafo.KM[seq[k]][seq[k+1]];
      out.push({ri,nodos:seq,km,min:km/VEL*60});
    });
    return out.sort((x,y)=>x.km-y.km);
  }
  async buscar(tO,tD){
    await this.listo;this.grafo.construir();
    const O=await this.resolver(tO),D=await this.resolver(tD);
    if(O.nodo===D.nodo)throw new Error('El origen y el destino quedan en la misma parada.');
    const path=this.grafo.dijkstra(O.nodo,D.nodo);
    if(!path)throw new Error('No hay ruta de busetas entre esos puntos con las rutas cargadas.');
    const legs=this.grafo.tramos(path).map(t=>{const a=t.nodos[0],b=t.nodos[t.nodos.length-1];return {a,b,cands:this.candidatos(a,b),sel:0,geo:null};});
    for(let i=0;i<legs.length;i++){
      this.emit('progreso',{txt:`Ajustando el recorrido a la carretera (${i+1}/${legs.length})…`});
      legs[i].geo=await this.servicio.ruta(legs[i].cands[0].nodos.map(x=>this.nodos[x].ll));
    }
    const res={o:O.nodo,d:D.nodo,legs,extras:[O.extra,D.extra].filter(Boolean)};
    this.emit('resultado',res);return res;
  }
  async geometriaRuta(ri){
    const r=this.rutas[ri];
    if(!r.geo)r.geo=await this.servicio.ruta(r.p.map(x=>this.nodos[x].ll));
    return r.geo;
  }
}

/* =====================================================================
   VISTA  (todo lo que se dibuja)
   ===================================================================== */
class Vista{
  constructor(modelo){
    this.m=modelo;
    const sat=L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Imágenes © Esri'}),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19})]);
    const calles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'});
    this.map=L.map('map',{layers:[sat]}).setView([7.885,-72.51],12);
    L.control.layers({"🛰️ Satélite + carreteras":sat,"🗺️ Mapa de calles":calles},null,{position:'bottomright'}).addTo(this.map);
    this.capaParadas=L.layerGroup().addTo(this.map);this.capaLineas=L.layerGroup().addTo(this.map);
    this.capaRuta=L.layerGroup().addTo(this.map);this.capaGrafo=L.layerGroup();
    this.marcadores=[];this.dibujadas=new Map();this.extra=[];this.legLayers=[];this.ultimo=null;this.modoG=false;
    this.pintarLista();
  }
  pin(c){return L.divIcon({className:'',html:'<div class="pin '+(c||'')+'"></div>',iconSize:[14,14],iconAnchor:[7,7]});}
  estado(txt,info){const e=$('estado');e.textContent=txt||'';e.className=info?'info':'';}

  pintarParadas(alArrastrar){
    this.m.nodos.forEach((nd,i)=>{
      const mk=L.marker(nd.ll,{icon:this.pin('unv'),draggable:true}).addTo(this.capaParadas).bindTooltip(nd.n,{direction:'top',offset:[0,-8]});
      mk.dragging.disable();
      mk.on('dragend',()=>{const p=mk.getLatLng();alArrastrar(i,[p.lat,p.lng]);});
      this.marcadores.push(mk);
      $('lugares').appendChild(new Option(nd.n,nd.n));
    });
  }
  actualizarNodo(i){
    const nd=this.m.nodos[i],mk=this.marcadores[i];
    mk.setLatLng(nd.ll);mk.setIcon(this.pin(nd.ver==='aprox'?'unv':''));
    mk.setTooltipContent(nd.n+(nd.ver==='aprox'?' (ubicación aproximada, sin verificar)':nd.ver==='manual'?' (ajustada por usted)':''));
  }
  permitirArrastre(on){this.marcadores.forEach(mk=>on?mk.dragging.enable():mk.dragging.disable());$('copiar').style.display=on?'block':'none';}

  pintarLista(){
    $('lineas').innerHTML='<b>Líneas por empresa</b><button class="mini" data-ocultar="1">Ocultar todas</button>'+
      this.m.empresas.map((e,ei)=>`<div class="emp"><label><input type="checkbox" data-e="${ei}"><i style="background:${e.c}"></i>${esc(e.n)} <small>(${e.r.length})</small></label>
      <div class="chips">${this.m.rutasDe(ei).map(ri=>`<button class="chip" data-r="${ri}" style="border-color:${e.c}" title="${esc(this.m.rutas[ri].nom)}">${esc(this.m.rutas[ri].cod)}</button>`).join('')}</div></div>`).join('');
  }
  dibujarRuta(ri,geo,ajustar){
    this.quitarRuta(ri);
    const r=this.m.rutas[ri],col=this.m.empresas[r.ei].c,g=L.layerGroup();
    L.polyline(geo,{color:'#fff',weight:8,opacity:.9}).addTo(g);
    L.polyline(geo,{color:col,weight:5}).addTo(g).bindTooltip(`${esc(this.m.empresas[r.ei].n)} · ${esc(r.cod)}<br>${esc(r.nom)}`,{sticky:true});
    g.addTo(this.capaLineas);this.dibujadas.set(ri,g);
    const chip=document.querySelector(`.chip[data-r="${ri}"]`);if(chip){chip.classList.add('on');chip.style.background=col;}
    if(ajustar)this.map.fitBounds(L.latLngBounds(geo),{padding:[80,80]});
  }
  quitarRuta(ri){
    const g=this.dibujadas.get(ri);if(g){this.capaLineas.removeLayer(g);this.dibujadas.delete(ri);}
    const chip=document.querySelector(`.chip[data-r="${ri}"]`);if(chip){chip.classList.remove('on');chip.style.background='#fff';}
  }
  ocultarTodas(){[...this.dibujadas.keys()].forEach(ri=>this.quitarRuta(ri));document.querySelectorAll('#lineas input[type=checkbox]').forEach(c=>c.checked=false);}

  limpiarResultado(){
    if(this.modoG)this.vistaMapa();
    this.capaRuta.clearLayers();this.legLayers=[];this.extra.forEach(x=>this.map.removeLayer(x));this.extra=[];
    $('card').style.display='none';$('btnG').disabled=true;this.ultimo=null;
  }
  dibujarTramo(i,l){
    if(this.legLayers[i]){this.capaRuta.removeLayer(this.legLayers[i]);this.legLayers[i]=null;}
    if(!l.geo)return;
    const col=this.m.empresas[this.m.rutas[l.cands[l.sel].ri].ei].c,g=L.layerGroup();
    L.polyline(l.geo,{color:'#fff',weight:14,opacity:.95}).addTo(g);L.polyline(l.geo,{color:col,weight:8}).addTo(g);
    g.addTo(this.capaRuta);this.legLayers[i]=g;
  }
  mostrarResultado(res){
    const m=this.m,todos=[];this.legLayers=[];
    res.legs.forEach((l,i)=>{this.dibujarTramo(i,l);if(l.geo)todos.push(...l.geo);});
    res.extras.forEach(x=>{
      this.extra.push(L.marker(x.ll,{icon:this.pin('user')}).addTo(this.map).bindTooltip(x.txt,{permanent:true,direction:'top',offset:[0,-8]}));
      this.extra.push(L.polyline([x.ll,x.hacia],{color:'#00e676',weight:3,dashArray:'6 6'}).addTo(this.map));
    });
    L.marker(m.nodos[res.o].ll,{icon:this.pin('user')}).addTo(this.capaRuta).bindTooltip('Salida: '+m.nodos[res.o].n,{permanent:true,direction:'top',offset:[0,-8]});
    L.marker(m.nodos[res.d].ll,{icon:this.pin('go')}).addTo(this.capaRuta).bindTooltip('Llegada: '+m.nodos[res.d].n,{permanent:true,direction:'top',offset:[0,-8]});
    const bounds=L.latLngBounds(todos.length?todos:[m.nodos[res.o].ll,m.nodos[res.d].ll]);
    this.map.fitBounds(bounds,{padding:[90,90]});
    this.ultimo={res,bounds};$('btnG').disabled=false;this.pintarCard(res);
    if(res.legs.some(l=>!l.geo))this.estado('No se pudo ajustar parte del recorrido a la carretera (servicio de mapas ocupado). Intente de nuevo.');
  }
  pintarCard(res){
    const m=this.m;let km=0;res.legs.forEach(l=>km+=l.cands[l.sel].km);
    let h=`<div class="resumen">⏱ ≈ ${Math.round(km/VEL*60)} min · ${km.toFixed(1)} km</div>
      <div class="nota">Tiempo aproximado, calculado a ${VEL} km/h, sin contar esperas ni transbordos.</div>`;
    res.extras.forEach(x=>{h+=`<div class="nota">“${esc(x.txt)}”: se usa la parada más cercana (≈${x.km.toFixed(1)} km en línea recta).</div>`;});
    res.legs.forEach((l,i)=>{
      h+=`<div class="nota" style="margin-top:10px"><b>${res.legs.length>1?(i+1)+'. ':''}${esc(m.nodos[l.a].n)} → ${esc(m.nodos[l.b].n)}</b> · ${l.cands.length} buseta(s) cubren este tramo (toque una para verla en el mapa):</div>`;
      l.cands.forEach((c,j)=>{
        const r=m.rutas[c.ri],e=m.empresas[r.ei];
        h+=`<div class="cand ${j===l.sel?'sel':''}" data-leg="${i}" data-c="${j}" style="border-left-color:${e.c}"><b>${esc(e.n)}</b> · ${esc(r.cod)}${j===0?'<span class="badge">más rápida</span>':''}<br>${esc(r.nom)}<br><span class="nota">≈ ${Math.round(c.min)} min · ${c.km.toFixed(1)} km${r.vias?'<br>Vías: '+esc(r.vias.join(' · ')):''}</span></div>`;
      });
      const vias=new Map();
      l.cands.forEach(c=>{const r=m.rutas[c.ri];(r.vias||[]).forEach(v=>{if(!vias.has(v))vias.set(v,[]);vias.get(v).push(r.cod);});});
      if(vias.size)h+='<div class="nota" style="margin-top:6px"><b>Por estas vías pasan:</b></div>'+[...vias].map(([v,cs])=>`<div class="via"><b>${esc(v)}</b>: ${cs.map(esc).join(', ')}</div>`).join('');
    });
    $('card').innerHTML=h;$('card').style.display='block';
  }
  vistaGrafo(){
    const m=this.m;this.modoG=true;$('btnG').textContent='Volver al mapa';
    [this.capaParadas,this.capaRuta,this.capaLineas].forEach(l=>this.map.removeLayer(l));this.extra.forEach(x=>this.map.removeLayer(x));
    this.map.getPane('tilePane').style.display='none';$('map').style.background='#f4f6f9';
    this.capaGrafo.clearLayers();const pts=[];
    this.ultimo.res.legs.forEach(l=>{
      const c=l.cands[l.sel],col=m.empresas[m.rutas[c.ri].ei].c;
      L.polyline(c.nodos.map(i=>m.nodos[i].ll),{color:col,weight:6}).addTo(this.capaGrafo);
      c.nodos.forEach(i=>{L.circleMarker(m.nodos[i].ll,{radius:9,color:col,weight:4,fillColor:'#fff',fillOpacity:1}).addTo(this.capaGrafo)
        .bindTooltip(m.nodos[i].n,{permanent:true,direction:'top',offset:[0,-8]});pts.push(m.nodos[i].ll);});
    });
    this.capaGrafo.addTo(this.map);this.map.fitBounds(L.latLngBounds(pts),{padding:[100,100]});
  }
  vistaMapa(){
    this.modoG=false;$('btnG').textContent='Grafo';
    this.map.getPane('tilePane').style.display='';$('map').style.background='#dfe5ea';
    this.map.removeLayer(this.capaGrafo);
    [this.capaParadas,this.capaLineas,this.capaRuta].forEach(l=>l.addTo(this.map));this.extra.forEach(x=>x.addTo(this.map));
    if(this.ultimo)this.map.fitBounds(this.ultimo.bounds,{padding:[90,90]});
  }
}

/* =====================================================================
   CONTROLADOR  (eventos de pantalla ↔ modelo ↔ vista)
   ===================================================================== */
class Controlador{
  constructor(m,v){
    this.m=m;this.v=v;
    v.pintarParadas((i,ll)=>m.moverNodo(i,ll));
    m.addEventListener('verificando',e=>{v.actualizarNodo(e.detail.i);v.estado(`Verificando ubicaciones con OpenStreetMap… ${e.detail.hechos}/${e.detail.total}`,true);});
    m.addEventListener('verificado',()=>{
      const n=m.nodos.filter(x=>x.ver==='aprox').length;
      v.estado(n?`Listo. ${n} parada(s) en gris no se encontraron en OpenStreetMap: arrástrelas con “Ajustar paradas”.`:'Ubicaciones verificadas con OpenStreetMap ✔',true);
    });
    m.addEventListener('progreso',e=>v.estado(e.detail.txt,true));
    m.addEventListener('nodoMovido',e=>{v.actualizarNodo(e.detail.i);m.rutas.forEach((r,ri)=>{if(r.p.includes(e.detail.i))v.quitarRuta(ri);});});

    $('sim').onclick=()=>this.buscar();
    $('btnG').onclick=()=>{if(!v.ultimo)return;v.modoG?v.vistaMapa():v.vistaGrafo();};
    $('btnL').onclick=()=>{const p=$('lineas');p.style.display=p.style.display==='block'?'none':'block';};
    $('ajus').onchange=e=>v.permitirArrastre(e.target.checked);
    $('copiar').onclick=function(){
      const t=m.nodos.map(n=>[n.id,n.n,n.ll[0].toFixed(4),n.ll[1].toFixed(4),n.al.join(";")].join("|")).join("\n");
      (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>{this.textContent='¡Copiado!';setTimeout(()=>this.textContent='Copiar coordenadas corregidas',1500);})
        .catch(()=>prompt('Copie este texto y péguelo en NODOS_TXT:',t));
    };
    $('lineas').onchange=e=>{if(e.target.dataset.e!==undefined)this.alternarEmpresa(+e.target.dataset.e,e.target.checked);};
    $('lineas').onclick=e=>{
      if(e.target.dataset.ocultar)v.ocultarTodas();
      else if(e.target.dataset.r!==undefined)this.alternarRuta(+e.target.dataset.r);
    };
    $('card').onclick=e=>{const el=e.target.closest('.cand');if(el)this.elegir(+el.dataset.leg,+el.dataset.c);};
  }
  async buscar(){
    const v=this.v,btn=$('sim');btn.disabled=true;btn.textContent='Calculando...';
    v.limpiarResultado();
    try{const res=await this.m.buscar($('o').value,$('d').value);v.estado('');v.mostrarResultado(res);}
    catch(e){v.estado(e.message);}
    btn.disabled=false;btn.textContent='Buscar ruta';
  }
  async elegir(i,j){
    const res=this.v.ultimo&&this.v.ultimo.res;if(!res)return;
    const l=res.legs[i];if(l.sel===j)return;
    this.v.estado('Ajustando a la carretera…',true);
    const geo=await this.m.servicio.ruta(l.cands[j].nodos.map(x=>this.m.nodos[x].ll));
    this.v.estado(geo?'':'No se pudo ajustar este recorrido a la carretera.');
    if(!geo)return;
    l.sel=j;l.geo=geo;this.v.dibujarTramo(i,l);this.v.pintarCard(res);
  }
  async alternarEmpresa(ei,on){
    const lista=this.m.rutasDe(ei);
    if(!on){lista.forEach(ri=>this.v.quitarRuta(ri));this.v.estado('');return;}
    await this.m.listo;let fallos=0;
    for(let k=0;k<lista.length;k++){
      if(!$('lineas').querySelector(`input[data-e="${ei}"]`).checked)return;
      this.v.estado(`Ajustando ${this.m.empresas[ei].n} a la carretera (${k+1}/${lista.length})…`,true);
      const geo=await this.m.geometriaRuta(lista[k]);
      if(geo)this.v.dibujarRuta(lista[k],geo,false);else fallos++;
      await dormir(120);
    }
    this.v.estado(fallos?`${fallos} ruta(s) no se pudieron ajustar a la carretera; vuelva a marcar la empresa.`:'');
  }
  async alternarRuta(ri){
    if(this.v.dibujadas.has(ri)){this.v.quitarRuta(ri);return;}
    await this.m.listo;this.v.estado('Ajustando la ruta a la carretera…',true);
    const geo=await this.m.geometriaRuta(ri);
    this.v.estado(geo?'':'No se pudo ajustar esta ruta a la carretera; intente de nuevo.');
    if(geo)this.v.dibujarRuta(ri,geo,true);
  }
}

/* ================= Arranque ================= */
const modelo=new Modelo(), vista=new Vista(modelo);
new Controlador(modelo,vista);