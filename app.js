'use strict';
/* =====================================================================
   EVATRE · VISTA + CONTROLADOR (MVC)
   El modelo (datos, grafo, Dijkstra, rutas directas) está en modelo.js.
   ===================================================================== */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtM = m => m < 1000 ? Math.round(m) + ' m' : (m / 1000).toFixed(1) + ' km';
const sv = (d, w) => `<svg viewBox="0 0 24 24" width="${w || 15}" height="${w || 15}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON = {
  reloj: sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 14),
  regla: sv('<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>', 14),
  gente: sv('<circle cx="9" cy="8" r="3"/><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M17 11a3 3 0 1 0 0-6M21 20v-1a4 4 0 0 0-3-4"/>', 14),
  mano: sv('<path d="M9 11V5a2 2 0 0 1 4 0v5M13 10V8a2 2 0 0 1 4 0v4M17 11a2 2 0 0 1 4 0v4a7 7 0 0 1-7 7h-1a7 7 0 0 1-5-2l-4-5a2 2 0 0 1 3-2l2 2"/>', 15),
  camina: sv('<circle cx="13" cy="4" r="2"/><path d="m9 22 2-7-3-3 2-5 3 2 3 1M8 12l-2 3M14 15l2 7"/>', 14),
  ruta: sv('<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h7a4 4 0 0 0 0-8H8a4 4 0 0 1 0-8h7"/>', 15)
};

/* =====================================================================
   VISTA
   ===================================================================== */
class Vista {
  constructor(m) {
    this.m = m;
    const sat = L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Imágenes © Esri' }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 })]);
    const calles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' });
    this.base = 'sat'; this.satelite = sat; this.calles = calles;
    this.map = L.map('map', { zoomControl: false, layers: [sat] }).setView([7.885, -72.51], 12);
    L.control.zoom({ position: 'bottomleft' }).addTo(this.map);
    this.capaParadas = L.layerGroup().addTo(this.map);
    this.capaRes = L.layerGroup().addTo(this.map);
    this.capaCaminata = L.layerGroup().addTo(this.map);
    this.capaCerca = L.layerGroup().addTo(this.map);
    this.capaEmp = L.layerGroup().addTo(this.map);
    this.capaUser = L.layerGroup().addTo(this.map);
    this.capaExtra = L.layerGroup().addTo(this.map);
    this.capaGrafo = L.layerGroup(); this.modoGrafo = false;
    this.marcas = []; this.res = null; this.verTodas = true; this.empActiva = 0; this.empRutas = new Map();
    this.cb = {};   // callbacks que asigna el controlador
  }
  estado(txt, info) { const e = $('estado'); e.textContent = txt || ''; e.className = 'estado' + (info ? ' info' : ''); }
  cambiarBase() {
    if (this.modoGrafo) this.salirGrafo();
    if (this.base === 'sat') { this.map.removeLayer(this.satelite); this.calles.addTo(this.map); this.base = 'calles'; }
    else { this.map.removeLayer(this.calles); this.satelite.addTo(this.map); this.base = 'sat'; }
  }

  verGrafo() {
    if (!this.res) return;
    this.modoGrafo = true;
    [this.satelite, this.calles, this.capaParadas, this.capaRes, this.capaCaminata,
      this.capaCerca, this.capaEmp, this.capaUser, this.capaExtra].forEach(c => {
      if (this.map.hasLayer(c)) this.map.removeLayer(c);
    });
    this.capaGrafo.clearLayers();
    const vistos = new Set(), puntos = [];
    this.res.tramos.forEach(t => {
      const j = t.sel >= 0 ? t.sel : 0, c = t.cands[j];
      if (!c) return;
      const ids = c.nodos;
      for (let k = 0; k < ids.length; k++) {
        const nd = this.m.nodos[ids[k]];
        if (!nd) continue;
        puntos.push(nd.ll);
        if (!vistos.has(ids[k])) {
          vistos.add(ids[k]);
          L.circleMarker(nd.ll, { radius: 7, color: '#fff', weight: 2, fillColor: '#2563eb', fillOpacity: 1 })
            .addTo(this.capaGrafo).bindTooltip(nd.n, { permanent: true, direction: 'top', offset: [0, -8] });
        }
        if (k > 0) {
          const ant = this.m.nodos[ids[k - 1]];
          L.polyline([ant.ll, nd.ll], { color: '#f59e0b', weight: 4, opacity: .95 }).addTo(this.capaGrafo);
        }
      }
    });
    this.capaGrafo.addTo(this.map);
    if (puntos.length) this.map.fitBounds(L.latLngBounds(puntos), { padding: [55, 55] });
    const b = $('btnGrafo'); if (b) b.textContent = 'Volver al mapa';
  }
  salirGrafo() {
    if (!this.modoGrafo) return;
    this.modoGrafo = false;
    if (this.map.hasLayer(this.capaGrafo)) this.map.removeLayer(this.capaGrafo);
    (this.base === 'sat' ? this.satelite : this.calles).addTo(this.map);
    [this.capaParadas, this.capaRes, this.capaCaminata, this.capaCerca,
      this.capaEmp, this.capaUser, this.capaExtra].forEach(c => c.addTo(this.map));
    const b = $('btnGrafo'); if (b) b.textContent = 'Ver Grafo';
  }

  // ------------------------------------------------------------------ paradas
  iconoParada(nd) { return L.divIcon({ className: '', html: `<div class="dot ${nd.ver === 'aprox' ? 'unv' : nd.ver === 'manual' ? 'man' : ''}"></div>`, iconSize: [13, 13], iconAnchor: [6, 6] }); }
  pintarParadas() {
    this.m.nodos.forEach((nd, i) => {
      const mk = L.marker(nd.ll, { icon: this.iconoParada(nd), draggable: true }).addTo(this.capaParadas);
      mk.bindTooltip(nd.n, { direction: 'top', offset: [0, -6] });
      mk.bindPopup(() => this.popupParada(i));
      mk.dragging.disable();
      mk.on('dragend', () => { const p = mk.getLatLng(); this.cb.mover(i, [p.lat, p.lng]); });
      this.marcas.push(mk);
    });
    $('lugares').innerHTML = this.m.nodos.map(n => `<option value="${esc(n.n)}">`).join('');
  }
  actualizarParadas() { this.m.nodos.forEach((nd, i) => { this.marcas[i].setLatLng(nd.ll); this.marcas[i].setIcon(this.iconoParada(nd)); }); }
  popupParada(i) {
    const p = this.m.nodos[i], est = { osm: 'verificada con OpenStreetMap', manual: 'ajustada por usted', aprox: 'aproximada (sin verificar)' }[p.ver] || 'aproximada';
    return `<div class="pp"><b>${esc(p.n)}</b><div class="pp-s">${p.ll[0].toFixed(5)}, ${p.ll[1].toFixed(5)}<br>${est}</div>
      <a href="https://www.google.com/maps?q=${p.ll[0]},${p.ll[1]}" target="_blank" rel="noopener">Ver en Google Maps</a>
      <button onclick="corregirParada(${i})">Corregir con coordenadas de Google Maps</button></div>`;
  }
  permitirArrastre(on) { this.marcas.forEach(mk => on ? mk.dragging.enable() : mk.dragging.disable()); }

  // ------------------------------------------------------------------ resultado
  limpiar() {
    this.salirGrafo();
    this.res = null;
    [this.capaRes, this.capaCaminata, this.capaCerca, this.capaExtra].forEach(c => c.clearLayers());
    $('resultado').classList.add('oculto');
  }
  etiqueta(cls, txt, ll) {
    return L.marker(ll, { interactive: false, zIndexOffset: 900, icon: L.divIcon({ className: '', html: `<div class="et ${cls}"><span>${esc(txt)}</span><i></i></div>`, iconSize: [0, 0] }) });
  }
  mostrar(res, conservar) {
    if (conservar && this.res) {   // búsqueda automática: mantener la buseta que el usuario ya había elegido
      res.tramos.forEach((t, ti) => {
        const antes = this.res.tramos[ti], previa = antes && antes.sel >= 0 ? antes.cands[antes.sel].ri : null;
        const k = previa == null ? -1 : t.cands.findIndex(c => c.ri === previa);
        t.sel = k >= 0 ? k : (t.cands.length === 1 ? 0 : -1);
      });
    } else res.tramos.forEach(t => { t.sel = t.cands.length === 1 ? 0 : -1; });
    this.res = res;
    const b = this.dibujar();
    if (!conservar) { if (b.length) this.map.fitBounds(L.latLngBounds(b), { padding: [90, 90] }); }
    this.renderPanel();
  }
  /** Dibuja las busetas de cada tramo; si hay varias, se ven todas y el usuario elige. */
  dibujar() {
    const r = this.res, m = this.m, pts = [];
    this.capaRes.clearLayers(); this.capaCaminata.clearLayers(); this.capaExtra.clearLayers();
    r.tramos.forEach((t, ti) => {
      const sel = t.sel;
      let vis = t.cands.map((c, j) => j).filter(j => t.cands[j].geo);
      if (!this.verTodas) vis = vis.filter(j => sel >= 0 ? j === sel : j === 0);
      vis.forEach(j => {
        const fuerte = sel < 0 || j === sel;
        L.polyline(t.cands[j].geo, { color: '#fff', weight: fuerte ? 12 : 8, opacity: fuerte ? .95 : .45 }).addTo(this.capaRes);
      });
      const orden = vis.filter(j => j !== sel); if (sel >= 0 && vis.includes(sel)) orden.push(sel);
      orden.forEach((j, k) => {
        const c = t.cands[j], ru = m.rutas[c.ri], em = m.empresas[ru.ei], esSel = j === sel;
        const lin = L.polyline(c.geo, { color: em.c, weight: esSel ? 7 : (sel >= 0 ? 3 : Math.max(4, 9 - 2 * k)), opacity: (esSel || sel < 0) ? 1 : .4, dashArray: '12 9' }).addTo(this.capaRes);
        lin.bindTooltip(`${esc(em.n)} · ${esc(ru.cod)}<br>${esc(ru.nom)}`, { sticky: true });
        lin.on('click', () => this.cb.elegir(ti, j));
        c.geo.forEach(p => pts.push(p));
      });
    });
    const O = r.origen, D = r.destino, t0 = r.tramos[0], tN = r.tramos[r.tramos.length - 1];
    const c0 = t0.sel >= 0 ? t0.cands[t0.sel] : t0.cands[0], cN = tN.sel >= 0 ? tN.cands[tN.sel] : tN.cands[0];
    if (O.nodo < 0 && c0) L.polyline([O.ll, m.nodos[c0.nodos[0]].ll], { color: '#22c55e', weight: 3, dashArray: '5 7' }).addTo(this.capaCaminata);
    if (D.nodo < 0 && cN) L.polyline([D.ll, m.nodos[cN.nodos[cN.nodos.length - 1]].ll], { color: '#ef4444', weight: 3, dashArray: '5 7' }).addTo(this.capaCaminata);
    this.etiqueta('o', 'Origen: ' + O.etiqueta, O.ll).addTo(this.capaExtra);
    this.etiqueta('d', 'Destino: ' + D.etiqueta, D.ll).addTo(this.capaExtra);
    pts.push(O.ll, D.ll);
    return pts;
  }
  renderPanel() {
    const r = this.res, m = this.m;
    const directo = r.modo === 'directo', n = r.tramos[0].cands.length;
    $('resTitulo').textContent = directo ? `${n} ${n === 1 ? 'Ruta Directa Disponible' : 'Rutas Directas Disponibles'}` : `Sin ruta directa · ${r.tramos.length - 1} transbordo${r.tramos.length > 2 ? 's' : ''}`;
    $('resSub').textContent = `${r.origen.etiqueta} → ${r.destino.etiqueta}`;
    $('resInfo').innerHTML = directo
      ? '📍 ' + (n > 1 ? `${n} opciones en carretera. Toque para elegir su buseta:` : 'Una sola buseta lo lleva:')
      : '📍 Ninguna buseta va directo. Combine estas:';
    let h = '', asig = false;
    r.tramos.forEach((t, ti) => {
      if (!directo) h += `<div class="tramo-tit">Tramo ${ti + 1}: ${esc(m.nodos[t.desde].n)} → ${esc(m.nodos[t.hasta].n)}</div>`;
      t.cands.forEach((c, j) => {
        const ru = m.rutas[c.ri], em = m.empresas[ru.ei], sel = j === t.sel; if (ru.asig) asig = true;
        const min = Math.round(c.km / VEL * 60);
        const vias = ru.vias.length ? `<div class="c-vias"><b>Carreteras y vías:</b> ${esc(ru.vias.slice(0, 4).join(' · '))}${ru.vias.length > 4 ? '…' : ''}</div>` : '';
        const camina = (c.caminaO > 30 || c.caminaD > 30) ? `<div class="c-camina">${ICON.camina} ${c.caminaO > 30 ? 'Camine ≈ ' + fmtM(c.caminaO) + ' hasta la parada. ' : ''}${c.caminaD > 30 ? 'Al bajar, ≈ ' + fmtM(c.caminaD) + ' a pie.' : ''}</div>` : '';
        h += `<div class="cand${sel ? ' sel' : ''}" data-t="${ti}" data-c="${j}" style="--col:${em.c}">
          <div class="c-top"><span class="c-dot"></span><b class="c-emp">${esc(em.n)}</b><span class="c-cod">${esc(ru.cod)}${ru.asig ? '*' : ''}</span>${j === 0 && t.cands.length > 1 ? '<span class="c-tag">Más rápida</span>' : ''}<span class="c-min">${ICON.reloj} ≈ ${min} min</span></div>
          <div class="c-nom">${esc(ru.nom)}</div>
          <div class="c-met"><span>${ICON.regla} ${c.km.toFixed(1)} km</span><i>•</i><span>${ICON.gente} ${c.nodos.length} paradas</span><i>•</i><span>${VEL} km/h</span></div>
          <div class="c-sube">Sube en <b>${esc(m.nodos[c.nodos[0]].n)}</b> · baja en <b>${esc(m.nodos[c.nodos[c.nodos.length - 1]].n)}</b></div>
          ${camina}${vias}
          <div class="c-pie">${ICON.mano} ${sel && t.cands.length > 1 ? 'Opción elegida · toque otra para cambiar' : (t.cands.length > 1 ? 'Toca para elegir esta opción' : 'Ruta única en este tramo')}<span class="c-chev">›</span></div></div>`;
      });
    });
    $('resLista').innerHTML = h;
    // nota inferior: tiempo total y aclaraciones
    let km = 0, completo = true;
    r.tramos.forEach(t => { const c = t.sel >= 0 ? t.cands[t.sel] : null; if (c) km += c.km; else completo = false; });
    let nota = completo ? `<b>Tiempo total aproximado: ≈ ${Math.round(km / VEL * 60)} min</b> (${km.toFixed(1)} km). ` : 'Elija una buseta en cada tramo para ver el tiempo total. ';
    nota += `Tiempos aproximados, calculados a ${VEL} km/h, sin contar esperas ni transbordos.`;
    if (asig) nota += ' * Código asignado por el equipo (no oficial).';
    $('resNota').innerHTML = nota;
    $('resultado').classList.remove('oculto');
    this.renderCerca();
  }
  elegir(ti, j) {
    const t = this.res.tramos[ti]; if (t.cands.length === 1) return;
    t.sel = t.sel === j ? -1 : j;
    this.dibujar(); this.renderPanel();
  }

  // ------------------------------------------------------------------ ubicación en tiempo real
  dibujarUsuario(pos) {
    this.capaUser.clearLayers();
    L.circle([pos.lat, pos.lng], { radius: pos.precision, color: '#2563ff', weight: 1, fillColor: '#2563ff', fillOpacity: .12 }).addTo(this.capaUser);
    L.marker([pos.lat, pos.lng], { zIndexOffset: 1000, icon: L.divIcon({ className: '', html: '<div class="yo"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }) })
      .addTo(this.capaUser).bindTooltip('Usted está aquí');
  }
  /** "Cerca de usted": por qué lado pasa cada buseta y hacia dónde avanza, según donde esté ahora. */
  renderCerca() {
    this.capaCerca.clearLayers();
    const box = $('resCerca'), r = this.res, pos = this.m.miPos;
    if (!r || !pos) { box.classList.add('oculto'); return; }
    const t0 = r.tramos[0], cands = t0.cands;
    const prox = this.m.proximidad(cands, [pos.lat, pos.lng]).filter(p => p.pt);
    if (!prox.length) { box.classList.add('oculto'); return; }
    const dest = esc(r.tramos[0].cands.length ? this.m.nodos[t0.hasta].n : r.destino.etiqueta);
    let h = '<div class="cerca-t">📍 Cerca de usted ahora <small>(se actualiza mientras se mueve)</small></div>';
    prox.slice(0, 5).forEach((p, k) => {
      const c = cands[p.j], ru = this.m.rutas[c.ri], em = this.m.empresas[ru.ei], mt = p.pt.metros;
      const donde = mt <= 60
        ? `<b>Usted está sobre la ruta.</b> Espere aquí la buseta: en este punto avanza hacia el <b>${p.pt.sentido}</b>.`
        : `Pasa a <b>${fmtM(mt)}</b> al <b>${p.pt.lado}</b> de usted. Allí las busetas hacia ${dest} avanzan hacia el <b>${p.pt.sentido}</b>.`;
      h += `<div class="cerca-i" style="--col:${em.c}"><b>${esc(ru.cod)}</b> · ${esc(em.n)}<br>${donde}${p.paradaCerca ? `<br><span class="nota">Parada de esta ruta más cercana: ${esc(p.paradaCerca.nombre)} (≈ ${fmtM(p.paradaCerca.metros)}).</span>` : ''}</div>`;
      if (k < 4 && mt > 25) {
        L.polyline([[pos.lat, pos.lng], [p.pt.lat, p.pt.lng]], { color: em.c, weight: 3, dashArray: '3 6' }).addTo(this.capaCerca);
        L.marker([p.pt.lat, p.pt.lng], { interactive: false, icon: L.divIcon({ className: '', html: `<div class="cp" style="background:${em.c}">${esc(ru.cod)}</div>`, iconSize: [0, 0] }) }).addTo(this.capaCerca);
      }
    });
    box.innerHTML = h; box.classList.remove('oculto');
  }
  hintUbicacion(info) {
    const h = $('hintUbic');
    if (!info) { h.classList.add('oculto'); return; }
    h.innerHTML = `📍 Parada más cercana a usted: <b>${esc(info.nombre)}</b> (≈ ${fmtM(info.metros)}) <button id="usarMiUbic">Usar mi ubicación como origen</button>`;
    h.classList.remove('oculto');
  }

  // ------------------------------------------------------------------ líneas por empresa
  pintarEmpresas() {
    const m = this.m;
    $('empTabs').innerHTML = m.empresas.map((e, i) => `<button class="tab${i === this.empActiva ? ' act' : ''}" data-e="${i}"><i style="background:${e.c}"></i>${esc(e.n.replace(/\s+(S\.A\.|Ltda\.)$/, ''))} <small>(${m.rutasDe(i).length})</small></button>`).join('');
    const e = m.empresas[this.empActiva], lista = m.rutasDe(this.empActiva);
    let h = `<div class="emp-card"><i style="background:${e.c}"></i><div><b>${esc(e.n)}</b><span>${lista.length} rutas registradas en el área metropolitana</span></div></div>`;
    lista.forEach(ri => {
      const ru = m.rutas[ri]; let km = null;
      if (m.KM) { km = 0; for (let k = 0; k < ru.p.length - 1; k++) km += m.KM[ru.p[k]][ru.p[k + 1]]; }
      const vias = ru.vias.length ? `<div class="r-vias"><b>Vías:</b> ${esc(ru.vias.slice(0, 5).join(' · '))}${ru.vias.length > 5 ? '…' : ''}</div>` : '';
      h += `<div class="rcard"><div class="r-top"><span class="r-cod">${esc(ru.cod)}${ru.asig ? '*' : ''}</span><div class="r-nom">${esc(ru.nom)}</div></div>
        <div class="r-met"><span>${ICON.reloj} ${km == null ? '—' : '≈ ' + Math.round(km / VEL * 60) + ' min'}</span><i>•</i><span>${ICON.regla} ${km == null ? '—' : km.toFixed(1) + ' km'}</span><i>•</i><span>${VEL} km/h</span><i>•</i><span>${ICON.gente} ${ru.p.length} paradas</span></div>
        ${vias}
        <div class="r-act"><button class="r-ver" data-ver="${ri}">${ICON.ruta} ${this.empRutas.has(ri) ? 'Ocultar recorrido' : 'Ver recorrido en carretera'}</button><button class="r-usar" data-usar="${ri}">Usar ruta</button></div></div>`;
    });
    $('empLista').innerHTML = h;
  }
  dibujarRecorrido(ri, geo) {
    const ru = this.m.rutas[ri], em = this.m.empresas[ru.ei], g = L.layerGroup();
    L.polyline(geo, { color: '#fff', weight: 11, opacity: .95 }).addTo(g);
    L.polyline(geo, { color: em.c, weight: 6, dashArray: '12 9' }).addTo(g).bindTooltip(`${esc(em.n)} · ${esc(ru.cod)}<br>${esc(ru.nom)}`, { sticky: true });
    g.addTo(this.capaEmp); this.empRutas.set(ri, g);
    this.map.fitBounds(L.latLngBounds(geo), { padding: [80, 80] });
  }
  quitarRecorrido(ri) { const g = this.empRutas.get(ri); if (g) { this.capaEmp.removeLayer(g); this.empRutas.delete(ri); } }
  ocultarTrazado() { this.capaEmp.clearLayers(); this.empRutas.clear(); }
}

/* =====================================================================
   CONTROLADOR
   ===================================================================== */
class Controlador {
  constructor(m, v) {
    this.m = m; this.v = v; this.ultimaBusqueda = null; this.watch = null; this.ultCercana = 0; this.buscando = false;
    v.cb.mover = (i, ll) => m.moverNodo(i, ll);
    v.cb.elegir = (ti, j) => v.elegir(ti, j);
    v.pintarParadas(); v.pintarEmpresas();

    m.addEventListener('verificando', () => v.estado('Verificando ubicaciones con OpenStreetMap…', true));
    m.addEventListener('verificado', e => {
      v.actualizarParadas();
      const { ok, total } = e.detail;
      v.estado(ok < total ? `Ubicaciones verificadas: ${ok} de ${total}. Las paradas grises no se encontraron en OpenStreetMap: toque una y corríjala.` : 'Ubicaciones verificadas con OpenStreetMap ✔', true);
      setTimeout(() => { if (!this.buscando) v.estado(''); }, 9000);
    });
    m.addEventListener('listo', () => { v.pintarEmpresas(); });
    m.addEventListener('progreso', e => v.estado(e.detail.txt, true));
    m.addEventListener('nodoMovido', e => { v.actualizarParadas(); v.estado('Parada corregida y guardada ✔', true); setTimeout(() => v.estado(''), 3000); });

    // formulario
    $('btnBuscar').onclick = () => this.buscar(false);
    $('btnLimpiar').onclick = () => { v.salirGrafo(); $('origen').value = ''; $('destino').value = ''; v.limpiar(); v.hintUbicacion(null); v.estado(''); this.refrescarHint(); };
    $('btnSwap').onclick = () => { const o = $('origen').value; $('origen').value = $('destino').value; $('destino').value = o; };
    document.querySelectorAll('[data-limpia]').forEach(b => b.onclick = () => { $(b.dataset.limpia).value = ''; $(b.dataset.limpia).focus(); });
    ['origen', 'destino'].forEach(id => $(id).addEventListener('keydown', e => { if (e.key === 'Enter') this.buscar(false); }));
    const FREC = [['Univ. Simón Bolívar', 'Universidad Simón Bolívar'], ['Los Patios (Centro)', 'Los Patios'], ['El Zulia', 'El Zulia'], ['Tierra Linda (Los Patios)', 'Tierra Linda (Los Patios)'], ['Parque Santander (Centro)', 'Centro (Parque Santander)']];
    $('frecuentes').innerHTML = FREC.map(([t, val]) => `<button class="fr" data-v="${esc(val)}">${esc(t)}</button>`).join('');
    $('frecuentes').onclick = e => { const b = e.target.closest('.fr'); if (!b) return; const o = $('origen'), d = $('destino'); (o.value.trim() ? (d.value.trim() ? o : d) : o).value = b.dataset.v; };
    $('chkAjustar').onchange = e => v.permitirArrastre(e.target.checked);
    $('btnCapas').onclick = () => v.cambiarBase();

    // resultado
    $('resCerrar').onclick = () => { v.salirGrafo(); $('resultado').classList.add('oculto'); };
    $('btnGrafo').onclick = () => v.modoGrafo ? v.salirGrafo() : v.verGrafo();
    $('chkTodas').onchange = e => { v.verTodas = e.target.checked; if (v.res) v.dibujar(); };
    $('resLista').onclick = e => { const c = e.target.closest('.cand'); if (c) v.elegir(+c.dataset.t, +c.dataset.c); };

    // empresas
    $('btnEmpresas').onclick = () => { $('empresas').classList.remove('oculto'); $('panel').classList.add('oculto'); v.pintarEmpresas(); };
    $('empCerrar').onclick = () => { $('empresas').classList.add('oculto'); $('panel').classList.remove('oculto'); };
    $('empTabs').onclick = e => { const b = e.target.closest('.tab'); if (b) { v.empActiva = +b.dataset.e; v.pintarEmpresas(); } };
    $('empLista').onclick = e => {
      const ver = e.target.closest('[data-ver]'), usar = e.target.closest('[data-usar]');
      if (ver) this.verRecorrido(+ver.dataset.ver);
      if (usar) this.usarRuta(+usar.dataset.usar);
    };
    $('empOcultar').onclick = () => { v.ocultarTrazado(); v.pintarEmpresas(); };

    // ubicación
    $('btnUbic').onclick = () => this.pedirUbicacion(true);
    $('btnSimularUbic').onclick = () => this.simularUbicacion();
    $('hintUbic').onclick = e => { if (e.target.id === 'usarMiUbic') { $('origen').value = 'Mi ubicación'; } };
    $('ubPermitir').onclick = () => { localStorage.setItem('evatre:ubic', 'si'); $('modalUbic').classList.add('oculto'); this.iniciarUbicacion(); };
    $('ubCancelar').onclick = () => { localStorage.setItem('evatre:ubic', 'no'); $('modalUbic').classList.add('oculto'); v.estado(''); };
    const dec = localStorage.getItem('evatre:ubic');
    if (dec === 'si') this.iniciarUbicacion(); else if (dec !== 'no') setTimeout(() => $('modalUbic').classList.remove('oculto'), 700);

    window.corregirParada = i => this.corregirParada(i);
  }

  async buscar(auto) {
    const v = this.v, btn = $('btnBuscar');
    const o = $('origen').value.trim(), d = $('destino').value.trim();
    if (!o || !d) { v.estado('Escriba el origen y el destino.'); return; }
    if (this.buscando) return;
    this.buscando = true;
    if (!auto) { v.limpiar(); btn.disabled = true; btn.querySelector('span').textContent = 'Buscando…'; v.estado('Preparando la red de transporte…', true); }
    try {
      const res = await this.m.buscar(o, d);
      v.estado(''); v.mostrar(res, auto);
      this.ultimaBusqueda = { t: Date.now(), pos: this.m.miPos ? { ...this.m.miPos } : null };
    } catch (e) { if (!auto) v.estado(e.message); }
    this.buscando = false;
    if (!auto) { btn.disabled = false; btn.querySelector('span').textContent = 'Buscar Ruta Directa'; }
  }

  // ------------------------------------------------------------------ líneas por empresa
  async verRecorrido(ri) {
    const v = this.v;
    if (v.empRutas.has(ri)) { v.quitarRecorrido(ri); v.pintarEmpresas(); return; }
    v.estado('Ajustando el recorrido a la carretera…', true);
    await this.m.listo;
    const geo = await this.m.geometriaRuta(ri);
    v.estado(geo ? '' : 'No se pudo ajustar este recorrido a la carretera; intente de nuevo.');
    if (geo) { v.dibujarRecorrido(ri, geo); v.pintarEmpresas(); }
  }
  usarRuta(ri) {
    const ru = this.m.rutas[ri], a = ru.p[0], b = ru.p[ru.p.length - 1];
    $('origen').value = this.m.nodos[a].n; $('destino').value = this.m.nodos[b].n;
    $('empresas').classList.add('oculto'); $('panel').classList.remove('oculto');
    this.buscar(false);
  }

  // ------------------------------------------------------------------ corrección de paradas con Google Maps
  corregirParada(i) {
    const nd = this.m.nodos[i];
    const txt = prompt(`Coordenadas de «${nd.n}».\nEn Google Maps: clic derecho sobre el punto exacto y clic en los números (se copian). Péguelos aquí:`, `${nd.ll[0].toFixed(5)}, ${nd.ll[1].toFixed(5)}`);
    if (!txt) return;
    const m = txt.match(/(-?\d+\.\d+)[\s,;]+(-?\d+\.\d+)/);
    if (!m) { this.v.estado('No entendí las coordenadas. Ejemplo: 7.81611, -72.51386'); return; }
    const lat = +m[1], lng = +m[2];
    if (lat < 7.5 || lat > 8.3 || lng < -72.9 || lng > -72.1) { this.v.estado('Esas coordenadas están fuera del área de Cúcuta.'); return; }
    this.m.moverNodo(i, [lat, lng]); this.v.map.closePopup();
  }

  // ------------------------------------------------------------------ ubicación en tiempo real
  pedirUbicacion(usarComoOrigen) {
    if (this.m.miPos) { if (usarComoOrigen) $('origen').value = 'Mi ubicación'; this.v.map.flyTo([this.m.miPos.lat, this.m.miPos.lng], 15); return; }
    const dec = localStorage.getItem('evatre:ubic');
    if (dec === 'si') { this.iniciarUbicacion(); this.v.estado('Buscando su ubicación…', true); }
    else $('modalUbic').classList.remove('oculto');
  }
  simularUbicacion() {
    // Punto de demostración céntrico en Cúcuta; no requiere GPS ni permiso del navegador.
    if (this.watch != null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watch); this.watch = null;
    }
    const pos = { lat: 7.8939, lng: -72.5078, precision: 35, simulada: true };
    this.m.miPos = pos;
    this.v.dibujarUsuario(pos);
    this.v.map.flyTo([pos.lat, pos.lng], 15);
    $('origen').value = 'Mi ubicación';
    this.refrescarHint();
    this.v.renderCerca();
    this.v.estado('Ubicación simulada en el Parque Santander, Cúcuta.', true);
  }
  iniciarUbicacion() {
    if (!('geolocation' in navigator)) { this.v.estado('Este navegador no permite obtener la ubicación.'); return; }
    if (this.watch != null) return;
    this.v.estado('Buscando su ubicación…', true);
    this.watch = navigator.geolocation.watchPosition(p => this.alPosicion(p), e => this.errorUbicacion(e), { enableHighAccuracy: true, maximumAge: 5000, timeout: 25000 });
  }
  errorUbicacion(e) {
    if (e.code === 1) { localStorage.setItem('evatre:ubic', 'no'); navigator.geolocation.clearWatch(this.watch); this.watch = null; this.v.estado('Permiso de ubicación denegado. Puede activarlo en el candado de la barra de direcciones.'); }
    else this.v.estado('No se pudo obtener su ubicación todavía (' + (e.message || 'sin señal') + '). Si abrió el archivo directamente, ábralo desde NetBeans (http://localhost).');
  }
  alPosicion(p) {
    const pos = { lat: p.coords.latitude, lng: p.coords.longitude, precision: p.coords.accuracy };
    const primera = !this.m.miPos;
    this.m.miPos = pos; this.v.dibujarUsuario(pos);
    if (primera) {
      this.v.estado('');
      const dentro = pos.lat > 7.70 && pos.lat < 8.05 && pos.lng > -72.75 && pos.lng < -72.30;
      if (dentro) this.v.map.flyTo([pos.lat, pos.lng], 15); else this.v.estado('Su ubicación está fuera del área de Cúcuta; se muestra igualmente.');
    }
    this.refrescarHint();
    this.v.renderCerca();                         // lado y sentido de cada buseta respecto a usted
    // si el origen es "Mi ubicación", se vuelve a buscar cuando usted se desplaza
    const orig = $('origen').value.trim().toLowerCase();
    if (this.v.res && (orig === 'mi ubicación' || orig === 'mi ubicacion') && this.ultimaBusqueda && this.ultimaBusqueda.pos) {
      const mov = hav([pos.lat, pos.lng], [this.ultimaBusqueda.pos.lat, this.ultimaBusqueda.pos.lng]) * 1000;
      if (mov > 150 && Date.now() - this.ultimaBusqueda.t > 20000) this.buscar(true);
    }
  }
  refrescarHint() {
    if (!this.m.miPos) { this.v.hintUbicacion(null); return; }
    const c = this.m.masCercana([this.m.miPos.lat, this.m.miPos.lng]);
    this.v.hintUbicacion(c ? { nombre: this.m.nodos[c.i].n, metros: c.metros } : null);
  }
}

/* ---------- Arranque ---------- */
const modelo = new Modelo();
const vista = new Vista(modelo);
new Controlador(modelo, vista);
