'use strict';
/* =====================================================================
   EVATRE · MODELO (MVC)
   Datos + lógica de rutas. No dibuja nada: la vista está en app.js.
   Requiere datos.js (PARADAS_TXT y RUTAS_TXT).
   ===================================================================== */

/* ---------- Configuración ---------- */
const VEL = 20;                  // km/h de la buseta para el tiempo aproximado
const VEL_CAMINAR = 5;           // km/h caminando hasta/desde la parada
const ESPERA = 8;                // minutos de espera (solo para comparar opciones con transbordo)
const TRANSBORDO = 45;           // costo de cambiar de buseta: muy alto para preferir SIEMPRE una sola buseta
const TODAS_PASAN_POR_CENTRO = false;   // según el equipo, todas las rutas pasan por el Parque Santander
const RADIO_PUNTO_LIBRE = 1.5;   // km: paradas cercanas a un lugar escrito o a "mi ubicación"
const MAX_PARADAS_CERCA = 3;     // paradas más cercanas que se consideran para un punto libre
const MAX_CANDIDATAS = 8;        // máximo de busetas que se dibujan por tramo

const OFFLINE = (typeof window === 'undefined') || (typeof EVATRE_OFFLINE !== 'undefined' && EVATRE_OFFLINE);
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const INCLUYE = {   // nombres de OpenStreetMap que contienen estas frases sirven para ubicar la parada
  terminal: ['terminal de transporte'], hospital: ['erasmo meoz'], usb: ['universidad simon bolivar'],
  udes: ['universidad de santander'], cenabastos: ['central de abastos'], centro: ['parque santander'],
  sena: ['servicio nacional de aprendizaje']
};

/* ---------- Utilidades ---------- */
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const sinPrefijo = n => n.replace(/^(barrio|urbanizacion|urb|ciudadela|conjunto residencial|sector|ciudad|colonia|invasion|asentamiento) /, '').trim();
function hav(a, b) {
  const R = 6371, r = x => x * Math.PI / 180, dl = r(b[0] - a[0]), dg = r(b[1] - a[1]);
  const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dg / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const dormir = ms => new Promise(r => setTimeout(r, ms));
async function pool(items, n, fn) {   // ejecuta fn sobre items con máximo n tareas a la vez
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; await fn(items[k], k); }
  }));
}
function hashTxt(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

/* ---------- Geometría para la ubicación en tiempo real ---------- */
const RUMBOS = ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'];
const nombreRumbo = g => RUMBOS[Math.round(((g % 360) + 360) % 360 / 45) % 8];

/** Punto de un trazado [[lat,lng],...] más cercano a una posición: distancia, lado y sentido de avance. */
function puntoMasCercano(geo, ll) {
  if (!geo || geo.length < 2) return null;
  const k = 111.32, c = Math.cos(ll[0] * Math.PI / 180);
  let mejor = null;
  for (let i = 0; i < geo.length - 1; i++) {
    const ax = (geo[i][1] - ll[1]) * k * c, ay = (geo[i][0] - ll[0]) * k;
    const bx = (geo[i + 1][1] - ll[1]) * k * c, by = (geo[i + 1][0] - ll[0]) * k;
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    let t = L ? -(ax * dx + ay * dy) / L : 0;
    t = Math.max(0, Math.min(1, t));
    const px = ax + t * dx, py = ay + t * dy, d = Math.hypot(px, py);
    if (!mejor || d < mejor.d) mejor = { d, px, py, dx, dy, i };
  }
  const grados = (Math.atan2(mejor.px, mejor.py) * 180 / Math.PI + 360) % 360;      // de usted hacia el punto (0 = norte)
  const sentido = (Math.atan2(mejor.dx, mejor.dy) * 180 / Math.PI + 360) % 360;     // hacia dónde avanza la buseta ahí
  return {
    metros: mejor.d * 1000, lat: ll[0] + mejor.py / k, lng: ll[1] + mejor.px / (k * c),
    lado: nombreRumbo(grados), sentido: nombreRumbo(sentido), indice: mejor.i
  };
}

/* ---------- Datos: paradas, empresas y rutas ---------- */
const NODOS = PARADAS_TXT.trim().split(/\r?\n/).map(l => {
  const p = l.trim().split('|');
  return { id: p[0], n: p[1], ll: [+p[2], +p[3]], al: p[4].split(';'), ver: null };
});
const IX = {}; NODOS.forEach((n, i) => IX[n.id] = i);
const EMP = [], RUTAS = [];
(function () {
  let e = -1;
  RUTAS_TXT.trim().split(/\r?\n/).forEach(linea => {
    const l = linea.trim(); if (!l) return;
    if (l[0] === '@') { const p = l.slice(1).split(';'); EMP.push({ n: p[0], c: p[1], p: p[2] || '' }); e++; return; }
    const p = l.split(';');
    const asig = p[0][0] === '*', cod = p[0].replace('*', '');
    RUTAS.push({
      ei: e, cod: EMP[e].p ? EMP[e].p + '-' + cod : cod, asig, nom: p[1],
      p: p[2].trim().split(' ').map(id => { if (!(id in IX)) throw new Error('Parada desconocida en la ruta ' + cod + ': ' + id); return IX[id]; }),
      vias: p[3] ? p[3].split('|') : [], geo: null
    });
  });
})();

/* ---------- Servicios externos (patrón Adapter) ---------- */
class ServicioMapas {
  constructor() { this.mem = new Map(); this.cola = Promise.resolve(); this.ultimo = 0; }
  leer(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin espacio: se ignora */ } }
  async fetchT(url, opt, ms) {
    const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
    try { return await fetch(url, { ...opt, signal: c.signal }); } finally { clearTimeout(t); }
  }
  limitado(fn) {   // Nominatim permite 1 consulta por segundo
    const p = this.cola.then(async () => { const w = this.ultimo + 1100 - Date.now(); if (w > 0) await dormir(w); this.ultimo = Date.now(); return fn(); });
    this.cola = p.catch(() => { });
    return p;
  }
  /** Matriz de distancias por carretera en km entre todas las paradas (se guarda en el navegador). */
  async tabla(pts) {
    if (OFFLINE) return null;
    const c = pts.map(p => p[1].toFixed(5) + ',' + p[0].toFixed(5)).join(';'), k = 'evatre:t3:' + hashTxt(c);
    let t = this.leer(k);
    if (t) return t;
    try {
      const r = await this.fetchT(`https://router.project-osrm.org/table/v1/driving/${c}?annotations=distance`, {}, 25000);
      const j = await r.json();
      t = j.distances.map(f => f.map(v => v == null ? null : Math.round(v / 10) / 100));
      this.guardar(k, t);
      return t;
    } catch (e) { return null; }
  }
  /** Trazado que SIGUE LAS CALLES por los puntos dados; null si no se pudo (nunca líneas rectas). */
  async ruta(pts) {
    if (OFFLINE) return null;
    const k = 'evatre:r3:' + hashTxt(pts.map(p => p[0].toFixed(4) + ',' + p[1].toFixed(4)).join(';'));
    if (this.mem.has(k)) return this.mem.get(k);
    const c = this.leer(k); if (c) { this.mem.set(k, c); return c; }
    const cs = pts.map(p => p[1].toFixed(5) + ',' + p[0].toFixed(5)).join(';');
    for (let i = 0; i < 3; i++) {
      try {
        const r = await this.fetchT(`https://router.project-osrm.org/route/v1/driving/${cs}?overview=full&geometries=geojson`, {}, 15000);
        const j = await r.json();
        if (j.routes && j.routes[0]) {
          const g = j.routes[0].geometry.coordinates.map(q => [+q[1].toFixed(5), +q[0].toFixed(5)]);
          this.mem.set(k, g); this.guardar(k, g);
          return g;
        }
      } catch (e) { /* reintento */ }
      await dormir(600);
    }
    return null;
  }
  /** Barrios, universidades, terminales y hospitales con nombre en OpenStreetMap: UNA sola consulta, luego guardada. */
  async lugaresOSM() {
    if (OFFLINE) return null;
    const k = 'evatre:osm:v3', c = this.leer(k);
    if (c) return c;
    const bb = '(7.70,-72.75,8.05,-72.30)';
    const q = '[out:json][timeout:25];(node["place"~"^(neighbourhood|suburb|quarter|village|hamlet|town|city|locality)$"]["name"]' + bb
      + ';nwr["amenity"~"^(university|college|bus_station|hospital|marketplace)$"]["name"]' + bb
      + ';way["landuse"="residential"]["name"]' + bb + ';);out center qt;';
    for (const u of OVERPASS) {
      try {
        const r = await this.fetchT(u, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, 25000);
        const j = await r.json();
        if (!j.elements) continue;
        const lista = j.elements.map(e => {
          const ll = e.type === 'node' ? [e.lat, e.lon] : (e.center ? [e.center.lat, e.center.lon] : null);
          return ll && e.tags && e.tags.name ? [e.tags.name, +ll[0].toFixed(5), +ll[1].toFixed(5)] : null;
        }).filter(Boolean);
        this.guardar(k, lista);
        return lista;
      } catch (e) { /* siguiente servidor */ }
    }
    return null;
  }
  /** Ubica un lugar o dirección escrito por el usuario. */
  async geocodificar(q) {
    if (OFFLINE) return null;
    const k = 'evatre:g3:' + norm(q), c = this.leer(k);
    if (c) return c.length ? c : null;
    try {
      const j = await this.limitado(async () => {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&viewbox=-72.75,8.05,-72.30,7.70&bounded=1&q=${encodeURIComponent(q + ', Cúcuta')}`;
        return (await this.fetchT(url, {}, 15000)).json();
      });
      const ll = j.length ? [parseFloat(j[0].lat), parseFloat(j[0].lon)] : [];
      this.guardar(k, ll);
      return ll.length ? ll : null;
    } catch (e) { return null; }
  }
}

/* ---------- Modelo (fachada + Observer) ---------- */
class Modelo extends EventTarget {
  constructor() {
    super();
    this.nodos = NODOS; this.rutas = RUTAS; this.empresas = EMP;
    this.servicio = new ServicioMapas();
    this.miPos = null;           // ubicación en tiempo real {lat,lng,precision}
    this.listo = this.iniciar();
  }
  emit(t, d) { this.dispatchEvent(new CustomEvent(t, { detail: d })); }
  rutasDe(ei) { return this.rutas.map((r, i) => r.ei === ei ? i : -1).filter(i => i >= 0); }

  async iniciar() {
    try { await this.verificarNodos(); } catch (e) { /* se sigue con las coordenadas estimadas */ }
    if (TODAS_PASAN_POR_CENTRO) this.aplicarCentro();
    await this.cargarDistancias();
    this.emit('listo', {});
  }

  /** Busca cada parada entre los lugares con nombre de OpenStreetMap y toma la coincidencia más cercana. */
  async verificarNodos() {
    let manual = {}; try { manual = JSON.parse(localStorage.getItem('evatre:manual') || '{}'); } catch (e) { /* vacío */ }
    this.emit('verificando', {});
    const lista = await this.servicio.lugaresOSM();
    const idx = new Map();
    if (lista) lista.forEach(([nom, la, lo]) => {
      const n = sinPrefijo(norm(nom)); if (!n) return;
      if (!idx.has(n)) idx.set(n, []);
      idx.get(n).push([la, lo]);
    });
    let ok = 0;
    this.nodos.forEach(nd => {
      if (manual[nd.id]) { nd.ll = manual[nd.id]; nd.ver = 'manual'; return; }
      const nombres = new Set([sinPrefijo(norm(nd.n.replace(/ \(.*\)/, '')))]);
      nd.al.map(norm).filter(s => s.length >= 4).forEach(s => nombres.add(s));
      let mejor = null, bd = 3;
      nombres.forEach(n => (idx.get(n) || []).forEach(ll => { const d = hav(nd.ll, ll); if (d < bd) { bd = d; mejor = ll; } }));
      const inc = INCLUYE[nd.id];
      if (!mejor && inc) idx.forEach((v, k) => { if (inc.some(s => k.includes(s))) v.forEach(ll => { const d = hav(nd.ll, ll); if (d < bd) { bd = d; mejor = ll; } }); });
      if (mejor) { nd.ll = mejor; nd.ver = 'osm'; ok++; } else nd.ver = 'aprox';
    });
    this.emit('verificado', { ok, total: this.nodos.length });
  }

  /** Inserción opcional del Parque Santander; desactivada para respetar las paradas declaradas. */
  aplicarCentro() {
    const c = IX.centro, C = this.nodos[c].ll;
    this.rutas.forEach(r => {
      if (r.p.includes(c)) return;
      let best = 0, bd = 1e9;
      for (let k = 0; k <= r.p.length; k++) {
        const A = k > 0 ? this.nodos[r.p[k - 1]].ll : null, B = k < r.p.length ? this.nodos[r.p[k]].ll : null;
        const d = (A && B) ? hav(A, C) + hav(C, B) - hav(A, B) : hav(A || B, C);
        if (d < bd) { bd = d; best = k; }
      }
      r.p = [...r.p.slice(0, best), c, ...r.p.slice(best)];
    });
  }

  /** Matriz de adyacencia (km) entre paradas consecutivas de cada ruta; 999 = sin vía directa. */
  async cargarDistancias() {
    const t = await this.servicio.tabla(this.nodos.map(n => n.ll)), n = this.nodos.length;
    this.KM = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 0 : 999));
    this.rutas.forEach(r => {
      for (let k = 0; k < r.p.length - 1; k++) {
        const a = r.p[k], b = r.p[k + 1];
        const v = (t && t[a] && t[a][b] != null) ? t[a][b] : hav(this.nodos[a].ll, this.nodos[b].ll) * 1.3;
        this.KM[a][b] = this.KM[b][a] = v;
      }
    });
    this.construirGrafo();
  }

  /** Grafo de estados (parada, ruta): avanzar cuesta km/VEL; cambiar de buseta cuesta TRANSBORDO. */
  construirGrafo() {
    this.ST = []; this.porNodo = Array.from({ length: this.nodos.length }, () => []);
    this.rutas.forEach((r, ri) => { r.sid = r.p.map((nodo, i) => { this.ST.push({ ri, i, nodo }); this.porNodo[nodo].push(this.ST.length - 1); return this.ST.length - 1; }); });
    this.ADY = this.ST.map(() => []);
    this.rutas.forEach(r => {
      for (let k = 0; k < r.p.length - 1; k++) {
        const a = r.sid[k], b = r.sid[k + 1], w = this.KM[r.p[k]][r.p[k + 1]] / VEL * 60;
        this.ADY[a].push([b, w]); this.ADY[b].push([a, w]);
      }
    });
    this.porNodo.forEach(l => l.forEach(a => l.forEach(b => { if (a !== b && this.ST[a].ri !== this.ST[b].ri) this.ADY[a].push([b, TRANSBORDO]); })));
  }

  /** Dijkstra: camino mínimo entre dos paradas, dividido en tramos (uno por buseta). */
  caminoConTransbordos(origen, destino) {
    const V = this.ST.length, dist = Array(V).fill(Infinity), prev = Array(V).fill(-1), vis = Array(V).fill(false);
    this.porNodo[origen].forEach(s => dist[s] = ESPERA);
    for (let k = 0; k < V; k++) {
      let u = -1;
      for (let v = 0; v < V; v++) if (!vis[v] && dist[v] < Infinity && (u === -1 || dist[v] < dist[u])) u = v;
      if (u === -1) break;
      vis[u] = true;
      this.ADY[u].forEach(([v, w]) => { if (!vis[v] && dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; } });
    }
    let best = -1;
    this.porNodo[destino].forEach(s => { if (dist[s] < Infinity && (best === -1 || dist[s] < dist[best])) best = s; });
    if (best === -1) return null;
    const path = []; for (let s = best; s !== -1; s = prev[s]) path.unshift(s);
    const segs = [];
    path.forEach(s => {
      const st = this.ST[s];
      if (!segs.length || segs[segs.length - 1].ri !== st.ri) segs.push({ ri: st.ri, nodos: [st.nodo] });
      else { const g = segs[segs.length - 1]; if (g.nodos[g.nodos.length - 1] !== st.nodo) g.nodos.push(st.nodo); }
    });
    return segs.filter(s => s.nodos.length > 1);
  }

  moverNodo(i, ll) {
    const nd = this.nodos[i]; nd.ll = ll; nd.ver = 'manual';
    try { const m = JSON.parse(localStorage.getItem('evatre:manual') || '{}'); m[nd.id] = ll; localStorage.setItem('evatre:manual', JSON.stringify(m)); } catch (e) { /* ignorar */ }
    this.rutas.forEach(r => { if (r.p.includes(i)) r.geo = null; });
    this.listo = this.listo.then(() => this.cargarDistancias());
    this.emit('nodoMovido', { i });
  }

  // ------------------------------------------------------------------ texto -> punto
  async resolverPunto(txt) {
    const t = norm(txt);
    if (!t) throw new Error('Escriba el origen y el destino.');
    if (['mi ubicacion', 'ubicacion actual', 'mi posicion', 'donde estoy'].includes(t)) {
      if (!this.miPos) throw new Error('Aún no tengo su ubicación. Permita el acceso a la ubicación y espere unos segundos.');
      return { ll: [this.miPos.lat, this.miPos.lng], nodo: -1, etiqueta: 'Mi ubicación', viva: true };
    }
    let mejor = -1, len = 0;
    this.nodos.forEach((nd, i) => {
      [norm(nd.n.replace(/ \(.*\)/, '')), norm(nd.n), ...nd.al.map(norm)].forEach(k => {
        if (t === k) { if (len < 1000) { mejor = i; len = 1000 + k.length; } }
        else if (len < 1000 && k.length >= 4 && (t.includes(k) || (t.length >= 4 && k.includes(t))) && k.length > len) { mejor = i; len = k.length; }
      });
    });
    if (mejor >= 0) return { ll: this.nodos[mejor].ll, nodo: mejor, etiqueta: this.nodos[mejor].n };
    const ll = await this.servicio.geocodificar(txt);
    if (!ll) throw new Error('No encontré “' + txt + '”. Pruebe con un barrio o lugar de la lista.');
    return { ll, nodo: -1, etiqueta: txt, geo: true };
  }

  /** Paradas servidas más cercanas a un punto libre: [{i, km}] */
  paradasCerca(ll, k, maxKm) {
    return this.nodos.map((n, i) => ({ i, km: hav(ll, n.ll) })).filter(x => this.porNodo[x.i].length && x.km <= maxKm)
      .sort((a, b) => a.km - b.km).slice(0, k);
  }

  // ------------------------------------------------------------------ busetas que SIRVEN de origen a destino
  /** Todas las rutas que van directo (una sola buseta) de las paradas del origen a las del destino. */
  opcionesDirectas(O, D) {
    const so = O.nodo >= 0 ? [{ i: O.nodo, km: 0 }] : this.paradasCerca(O.ll, MAX_PARADAS_CERCA, RADIO_PUNTO_LIBRE);
    const sd = D.nodo >= 0 ? [{ i: D.nodo, km: 0 }] : this.paradasCerca(D.ll, MAX_PARADAS_CERCA, RADIO_PUNTO_LIBRE);
    const mO = new Map(so.map(s => [s.i, s.km])), mD = new Map(sd.map(s => [s.i, s.km]));
    const out = [];
    this.rutas.forEach((r, ri) => {
      let mejor = null;
      r.p.forEach((na, ia) => {
        if (!mO.has(na)) return;
        r.p.forEach((nb, ib) => {
          if (ia === ib || na === nb || !mD.has(nb)) return;
          const seq = ia < ib ? r.p.slice(ia, ib + 1) : r.p.slice(ib, ia + 1).reverse();
          let km = 0; for (let k = 0; k < seq.length - 1; k++) km += this.KM[seq[k]][seq[k + 1]];
          const total = km / VEL * 60 + (mO.get(na) + mD.get(nb)) / VEL_CAMINAR * 60;
          if (!mejor || total < mejor.total) mejor = { ri, nodos: seq, km, total, caminaO: mO.get(na) * 1000, caminaD: mD.get(nb) * 1000 };
        });
      });
      if (mejor) out.push(mejor);
    });
    return out.sort((a, b) => a.total - b.total);
  }

  /** Todas las busetas que cubren el tramo a→b (para tramos de un viaje con transbordo). */
  candidatos(a, b) {
    const out = [];
    this.rutas.forEach((r, ri) => {
      const ia = r.p.indexOf(a), ib = r.p.indexOf(b); if (ia < 0 || ib < 0 || ia === ib) return;
      const seq = ia < ib ? r.p.slice(ia, ib + 1) : r.p.slice(ib, ia + 1).reverse();
      let km = 0; for (let k = 0; k < seq.length - 1; k++) km += this.KM[seq[k]][seq[k + 1]];
      out.push({ ri, nodos: seq, km, total: km / VEL * 60, caminaO: 0, caminaD: 0 });
    });
    return out.sort((x, y) => x.km - y.km);
  }

  // ------------------------------------------------------------------ búsqueda completa
  async buscar(tO, tD) {
    await this.listo;
    const O = await this.resolverPunto(tO), D = await this.resolverPunto(tD);
    if (O.nodo >= 0 && O.nodo === D.nodo) throw new Error('El origen y el destino quedan en la misma parada.');
    let tramos, modo;
    const directas = this.opcionesDirectas(O, D);
    if (directas.length) {
      modo = 'directo';
      const c0 = directas[0];
      tramos = [{ desde: c0.nodos[0], hasta: c0.nodos[c0.nodos.length - 1], cands: directas.slice(0, MAX_CANDIDATAS) }];
    } else {   // ninguna buseta va directo: se buscan combinaciones con el menor número de cambios
      modo = 'transbordo';
      const cerca = (P) => P.nodo >= 0 ? P.nodo : (this.paradasCerca(P.ll, 1, 3)[0] || {}).i;
      const no = cerca(O), nd = cerca(D);
      if (no == null || nd == null) throw new Error('No hay paradas cercanas a ese lugar con las rutas cargadas.');
      if (no === nd) throw new Error('El origen y el destino quedan en la misma parada.');
      const camino = this.caminoConTransbordos(no, nd);
      if (!camino || !camino.length) throw new Error('No hay ruta de busetas entre esos puntos con las rutas cargadas.');
      tramos = camino.map(t => {
        const a = t.nodos[0], b = t.nodos[t.nodos.length - 1];
        return { desde: a, hasta: b, cands: this.candidatos(a, b).slice(0, MAX_CANDIDATAS) };
      });
      const p0 = tramos[0].cands[0], pN = tramos[tramos.length - 1].cands[0];
      if (O.nodo < 0) p0.caminaO = hav(O.ll, this.nodos[no].ll) * 1000;
      if (D.nodo < 0) pN.caminaD = hav(D.ll, this.nodos[nd].ll) * 1000;
    }
    const todas = tramos.flatMap(t => t.cands);
    this.emit('progreso', { txt: 'Ajustando los recorridos a la carretera…' });
    await pool(todas, 4, async c => { c.geo = await this.servicio.ruta(c.nodos.map(i => this.nodos[i].ll)); });
    return { origen: O, destino: D, modo, tramos };
  }

  async geometriaRuta(ri) {
    const r = this.rutas[ri];
    if (!r.geo) r.geo = await this.servicio.ruta(r.p.map(x => this.nodos[x].ll));
    return r.geo;
  }

  /** Parada servida más cercana a una posición. */
  masCercana(ll) { const c = this.paradasCerca(ll, 1, 99)[0]; return c ? { i: c.i, metros: c.km * 1000 } : null; }

  /** Ubicación en tiempo real: dónde pasa cada buseta respecto a usted (lado, distancia y sentido de avance). */
  proximidad(cands, ll) {
    return cands.map((c, j) => {
      const r = this.rutas[c.ri];
      const pt = puntoMasCercano(c.geo, ll);
      let paradaCerca = null, bd = 1e9;
      c.nodos.forEach(i => { const d = hav(ll, this.nodos[i].ll) * 1000; if (d < bd) { bd = d; paradaCerca = { nombre: this.nodos[i].n, metros: d }; } });
      return { j, ri: c.ri, pt, paradaCerca, rutaGeo: !!pt };
    }).sort((a, b) => (a.pt ? a.pt.metros : 1e9) - (b.pt ? b.pt.metros : 1e9));
  }
}

if (typeof module !== 'undefined') module.exports = { Modelo, NODOS, RUTAS, EMP, puntoMasCercano, hav, norm };
