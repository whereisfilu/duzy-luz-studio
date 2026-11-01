/* Duży Luz Studio — intro, licznik cen, odtwarzacz przed/po */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BEAT = 60 / 90;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const curve = fn => { const c = new Float32Array(1024); for (let i = 0; i < 1024; i++) c[i] = fn(i / 511.5 - 1); return c; };
  const SAT = curve(x => Math.tanh(x * 2.4)), DIST = curve(x => Math.tanh(x * 7));

  /* ---------- dźwięk ---------- */
  let ac, out, noise;
  function initAudio() {
    if (ac) return; ac = new (window.AudioContext || window.webkitAudioContext)();
    out = ac.createGain(); out.gain.value = .6; const comp = ac.createDynamicsCompressor(); out.connect(comp); comp.connect(ac.destination);
    noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const ready = () => ac && ac.state === 'running';
  function clickN(t, d, v, hz, len) { const n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); n.buffer = noise; f.type = 'bandpass'; f.frequency.value = hz; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + len); n.connect(f); f.connect(g); g.connect(d); n.start(t); n.stop(t + len + .02); }
  const S = {
    // trap 808 z przesterem
    kick(v = 1, dest) { if (!ac) return; const t = ac.currentTime, d = dest || out;
      const o = ac.createOscillator(), g = ac.createGain(), sh = ac.createWaveShaper(), lp = ac.createBiquadFilter(), post = ac.createGain(); sh.curve = DIST; lp.type = 'lowpass'; lp.frequency.value = 2600; post.gain.value = .55;
      o.type = 'sine'; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(58, t + .05); o.frequency.exponentialRampToValueAtTime(40, t + .75);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * .9, t + .003); g.gain.setTargetAtTime(0, t + .45, .32);
      o.connect(g); g.connect(sh); sh.connect(lp); lp.connect(post); post.connect(d); o.start(t); o.stop(t + 2.2); clickN(t, d, v * .4, 4000, .01); },
    // scratch DJ-ski: dźwięk z „płyty” przesuwany w przód i w tył
    scratch(k = 0) { if (!ac) return; const buf = scrRender(k === 3 ? 'final' : 'baby'), src = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain();
      hp.type = 'highpass'; hp.frequency.value = 140; g.gain.value = 1.15; src.buffer = buf; src.connect(hp); hp.connect(g); g.connect(out); src.start(); },
    // dźwięk na wejście napisu (uderzenie 4)
    hit4() { if (!ac) return; const t = ac.currentTime;
      if (HIT4 === 'scratch') return this.scratch(3);
      if (HIT4 === 'rewind') { const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = scrRender('rewind'); g.gain.value = 1.2; src.connect(g); g.connect(out); src.start(); return; }
      if (HIT4 === 'drop') { const o = ac.createOscillator(), g = ac.createGain(), sh = ac.createWaveShaper(), lp = ac.createBiquadFilter(), post = ac.createGain(); sh.curve = DIST; lp.type = 'lowpass'; lp.frequency.value = 1800; post.gain.value = .6;
        o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(48, t + .12); o.frequency.exponentialRampToValueAtTime(28, t + 1.4);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + .005); g.gain.setTargetAtTime(0, t + .9, .3); o.connect(g); g.connect(sh); sh.connect(lp); lp.connect(post); post.connect(out); o.start(t); o.stop(t + 2.4); clickN(t, out, .5, 3500, .012); return; }
      if (HIT4 === 'horn') { [[0, .11], [.15, .11], [.3, .55]].forEach(([dt, len]) => { const tt = t + dt, bp = ac.createBiquadFilter(), sh = ac.createWaveShaper(), g = ac.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = .6; sh.curve = SAT;
          g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(.32, tt + .01); g.gain.setValueAtTime(.32, tt + len); g.gain.linearRampToValueAtTime(0, tt + len + .05); sh.connect(bp); bp.connect(g); g.connect(out);
          [330, 418, 496].forEach(hz => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(hz * 1.04, tt); o.frequency.exponentialRampToValueAtTime(hz, tt + .04); o.connect(sh); o.start(tt); o.stop(tt + len + .1); }); }); return; }
      if (HIT4 === 'crash') { this.kick(1.1); const n = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain(); n.buffer = noise; n.loop = true; hp.type = 'highpass'; hp.frequency.value = 4800;
        g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(.001, t + 2.2); n.connect(hp); hp.connect(g); g.connect(out); n.start(t); n.stop(t + 2.3);
        [ 1, 1.47, 1.92, 2.61, 3.15 ].forEach(r => { const o = ac.createOscillator(), og = ac.createGain(); o.type = 'square'; o.frequency.value = 520 * r; og.gain.setValueAtTime(.025, t); og.gain.exponentialRampToValueAtTime(.001, t + 1.4); o.connect(og); og.connect(hp); o.start(t); o.stop(t + 1.5); }); return; }
      if (HIT4 === 'stab') { const rv = ac.createConvolver(), len = ac.sampleRate * 1.8, ir = ac.createBuffer(2, len, ac.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5); } rv.buffer = ir;
        const dry = ac.createGain(), wet = ac.createGain(), lp = ac.createBiquadFilter(); dry.gain.value = .5; wet.gain.value = .35; lp.type = 'lowpass'; lp.frequency.setValueAtTime(5200, t); lp.frequency.exponentialRampToValueAtTime(900, t + .5);
        lp.connect(dry); lp.connect(rv); rv.connect(wet); dry.connect(out); wet.connect(out);
        [130.8, 155.6, 196, 261.6, 311.1, 392].forEach(hz => [-7, 7].forEach(det => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = hz; o.detune.value = det; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + .008); g.gain.exponentialRampToValueAtTime(.001, t + .55); o.connect(g); g.connect(lp); o.start(t); o.stop(t + .6); }));
        this.kick(.8); return; }
    },
    snare(v = .6, dest) { if (!ac) return; const t = ac.currentTime, n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); n.buffer = noise; f.type = 'bandpass'; f.frequency.value = 1900; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + .2); n.connect(f); f.connect(g); g.connect(dest || out); n.start(t); n.stop(t + .25); },
    hat(v = .3, dest) { if (!ac) return; const t = ac.currentTime, n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); n.buffer = noise; f.type = 'highpass'; f.frequency.value = 8000; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + .05); n.connect(f); f.connect(g); g.connect(dest || out); n.start(t); n.stop(t + .07); },
    clap(v = .5) { if (!ac) return; [0, .012, .024].forEach(dl => { const t = ac.currentTime + dl, n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); n.buffer = noise; f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.4; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + .14); n.connect(f); f.connect(g); g.connect(out); n.start(t); n.stop(t + .16); }); },
    boom(v = 1) { if (!ac) return; const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), sh = ac.createWaveShaper(); sh.curve = SAT; o.type = 'sine'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(41, t + .25); g.gain.setValueAtTime(v * .8, t); g.gain.setTargetAtTime(0, t + .5, .35); o.connect(g); g.connect(sh); sh.connect(out); o.start(t); o.stop(t + 2.2); }
  };

  // ---- scratch: źródło „aaah” (synteza addytywna z formantami) i symulacja ruchu płyty ----
  let HIT4 = 'crash';
  let SCR_SRC = null; const SCR_CACHE = {};
  const SCR_PAT = {
    baby: [[.07, 0, 2.6], [.05, 2.6, 0], [.08, 0, -2.4], [.05, -2.4, 0]],
    final: [[.06, 0, 2.3], [.04, 2.3, 0], [.06, 0, -2.3], [.03, -2.3, 0], [.05, 0, 3.0], [.28, 3.0, 1.0], [.22, 1.0, 0]],
    rewind: [[.06, 0, -3.2], [.42, -3.2, -6.5], [.22, -6.5, 0]]
  };
  const SCR_START = { rewind: 1.3 };
  function scrSource() {
    if (SCR_SRC) return SCR_SRC; const sr = ac.sampleRate, n = Math.floor(sr * 1.4), d = new Float32Array(n), f0 = 172;
    const F = [[760, 110, 1], [1180, 130, .55], [2650, 220, .28]];
    const amps = []; for (let k = 1; k <= 30; k++) { const fk = k * f0; let a = 0; F.forEach(([fc, bw, gn]) => a += gn * Math.exp(-((fk - fc) ** 2) / (2 * bw * bw))); amps.push(a / Math.sqrt(k) + .02 / k); }
    let ph = 0;
    for (let i = 0; i < n; i++) { const t = i / sr, vib = 1 + .012 * Math.sin(2 * Math.PI * 5.5 * t); ph += 2 * Math.PI * f0 * vib / sr; let v = 0; for (let k = 0; k < amps.length; k++) v += amps[k] * Math.sin(ph * (k + 1));
      const env = Math.min(1, t / .02) * Math.min(1, (1.4 - t) / .1); d[i] = (v * .55 + (Math.random() - .5) * .04) * env; }
    let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(d[i])); for (let i = 0; i < n; i++) d[i] /= mx || 1;
    return SCR_SRC = d;
  }
  function scrRender(name) {
    if (SCR_CACHE[name]) return SCR_CACHE[name]; const src = scrSource(), sr = ac.sampleRate, pat = SCR_PAT[name];
    const total = pat.reduce((a, p) => a + p[0], 0), N = Math.floor(total * sr), buf = ac.createBuffer(1, N, sr), o = buf.getChannelData(0);
    let pos = (SCR_START[name] || .06) * sr, seg = 0, segT = 0, sm = 0;
    for (let i = 0; i < N; i++) {
      while (seg < pat.length - 1 && segT >= pat[seg][0]) { segT -= pat[seg][0]; seg++; }
      const [dur, v0, v1] = pat[seg], k = Math.min(1, segT / dur), v = v0 + (v1 - v0) * (k * k * (3 - 2 * k));
      pos = Math.max(0, Math.min(src.length - 2, pos + v)); const i0 = Math.floor(pos), fr = pos - i0, smp = src[i0] * (1 - fr) + src[i0 + 1] * fr;
      const target = Math.min(1, Math.abs(v) / 1.1); sm += (target - sm) * .02;
      o[i] = smp * sm * .95; segT += 1 / sr;
    }
    return SCR_CACHE[name] = buf;
  }
  const play = (n, v) => { if (ready()) S[n](v); };

  /* ---------- wejście: REC, potem 4 uderzenia ---------- */
  const gate = $('#gate'), tap = $('#tap'), tcEl = $('#tc'), reelImgs = $$('#reel img'), cnt = $('#cnt'), fin = $('#fin'), words = $$('#fin .w'), fxw = $('#fxw');
  document.body.classList.add('locked');
  // REC: lampka i licznik; po chwili prośba o stuknięcie (dźwięk wymaga dotyku)
  const t0 = performance.now(); let tcOn = true;
  (function tick() { if (!tcOn) return; const ms = performance.now() - t0, f = Math.floor(ms / 40) % 25, sc = Math.floor(ms / 1000) % 60; tcEl.textContent = `00:00:${String(sc).padStart(2, '0')}:${String(f).padStart(2, '0')}`; requestAnimationFrame(tick); })();
  setTimeout(() => tap.classList.add('on'), 300);
  setTimeout(() => tap.classList.add('ask'), 900);
  const fx = el => { el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); };
  const shake = () => { if (RM) return; fxw.classList.remove('shake'); void fxw.offsetWidth; fxw.classList.add('shake'); };
  function cutTo(i) { reelImgs.forEach(m => m.classList.remove('on')); const m = reelImgs[i]; m.style.setProperty('--dx', i % 2 ? '-3%' : '3%'); void m.offsetWidth; m.classList.add('on'); }
  let running = false;
  async function intro() {
    if (running) return; running = true; tcOn = false;
    tap.classList.add('hide');
    if (!RM) for (let i = 0; i < 3; i++) {
      // uderzenia 1, 2, 3: zdjęcie + cyfra + kick
      cutTo(i); cnt.textContent = i + 1; cnt.classList.remove('slam'); void cnt.offsetWidth; cnt.classList.add('slam');
      if (i % 2 === 0) fx($('#flash'));
      shake(); play('scratch', i);
      await wait(BEAT * 1000);
    }
    // uderzenie 4: od razu napis, tylko kick
    cutTo(3); cnt.classList.remove('slam'); cnt.textContent = '';
    words.forEach(w => w.classList.add('in')); fx($('#flash')); shake(); play('hit4');
    await wait(RM ? 300 : 1300);
    gate.classList.add('gone'); document.body.classList.remove('locked');
    running = false;
  }
  tap.addEventListener('click', () => { initAudio(); try { scrRender('baby'); scrRender('final'); } catch (_) {} ac.resume().finally(() => intro()); });


  /* ---------- ceny: wbijają się w rytm ---------- */
  const prices = $('#prices'), rows = $$('.pr', prices);
  // licznik: każda cyfra to kolumna 0-9, która przewija się do właściwej wartości
  const odos = $$('.price', prices).map(p => {
    const txt = p.firstChild.textContent, unit = p.querySelector('small').outerHTML; let h = '';
    for (const ch of txt) h += /\d/.test(ch) ? `<span class="win"><span class="d">${'0123456789'.split('').map(c => `<span>${c}</span>`).join('')}</span></span>` : `<span class="x">${ch}</span>`;
    p.innerHTML = h + unit; p.setAttribute('aria-label', txt + ' ' + p.querySelector('small').textContent);
    const cols = $$('.d', p), digits = txt.replace(/\D/g, '');
    const set = (anim, delay = 0) => cols.forEach((c, i) => { c.style.transition = anim ? `transform ${1.1 + i * .25}s cubic-bezier(.2,.8,.2,1) ${delay}s` : 'none'; c.style.transform = `translateY(-${(anim ? +digits[i] : 0) * 1.3}em)`; });
    const final = () => cols.forEach((c, i) => { c.style.transition = 'none'; c.style.transform = `translateY(-${+digits[i]}em)`; });
    return { p, set, final };
  });
  odos.forEach(o => o.final());
  if ('IntersectionObserver' in window && !RM) {
    prices.classList.add('armed'); odos.forEach(o => o.set(false));
    const io = new IntersectionObserver(async es => {
      if (!es[0].isIntersecting) return; io.disconnect();
      for (let i = 0; i < rows.length; i++) {
        void odos[i].p.offsetWidth; odos[i].set(true, i * .18);
      }
    }, { threshold: .4 });
    io.observe(prices);
  }

  /* ---------- przed / po: prawdziwe pliki, 3 numery ---------- */
  const TRACKS = [
    { title: 'Piotr Pisarek', b: 'assets/audio/piotr-pisarek-przed.mp3', a: 'assets/audio/piotr-pisarek-po.mp3' },
    { title: 'Jak chce się płakać', b: 'assets/audio/jak-chce-sie-plakac-przed.mp3', a: 'assets/audio/jak-chce-sie-plakac-po.mp3' },
    { title: 'El Tripero', b: 'assets/audio/el-tripero-przed.mp3', a: 'assets/audio/el-tripero-po.mp3' }
  ];
  const cache = {}; let trk = 0, gA, gB, srcA, srcB, playing = false, startCtx = 0, offset = 0, abMode = 'A', token = 0;
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const stateEl = $('#abstate'), tcur = $('#tcur'), tdur = $('#tdur'), wave = $('#wave'), wcv = $('#wcv'), wx = wcv.getContext('2d');
  const decode = buf => new Promise((res, rej) => ac.decodeAudioData(buf, res, rej));
  const label = () => abMode === 'A' ? 'Po mixie' : 'Przed mixem';
  function peaks(b, n) { const d = b.getChannelData(0), e = b.numberOfChannels > 1 ? b.getChannelData(1) : d, step = Math.floor(d.length / n), out = [];
    for (let i = 0; i < n; i++) { let m = 0; for (let j = i * step; j < (i + 1) * step; j += 16) { const v = Math.max(Math.abs(d[j]), Math.abs(e[j])); if (v > m) m = v; } out.push(m); } return out; }
  function initGains() { if (gA) return; initAudio(); gA = ac.createGain(); gB = ac.createGain(); const m = ac.createGain(); m.gain.value = .9; gA.connect(m); gB.connect(m); m.connect(ac.destination); gA.gain.value = abMode === 'A' ? 1 : 0; gB.gain.value = abMode === 'B' ? 1 : 0; }
  function load(i) {
    if (cache[i]) return cache[i].p; initGains();
    const T = TRACKS[i], c = cache[i] = {};
    c.p = Promise.all([T.b, T.a].map(u => fetch(u).then(r => r.arrayBuffer()).then(decode))).then(([b, a]) => {
      Object.assign(c, { b, a, dur: Math.min(a.duration, b.duration), pA: peaks(a, 160), pB: peaks(b, 160), ok: true });
    }).catch(() => { delete cache[i]; });
    return c.p;
  }
  const T0 = () => cache[trk] && cache[trk].ok ? cache[trk] : null;
  const dur = () => T0() ? T0().dur : 0;
  const cur = () => playing ? Math.min(dur(), ac.currentTime - startCtx) : offset;
  function start(at) {
    const c = T0(); if (!c) return; const my = ++token; srcA = ac.createBufferSource(); srcB = ac.createBufferSource(); srcA.buffer = c.a; srcB.buffer = c.b; srcA.connect(gA); srcB.connect(gB);
    const t = ac.currentTime + .04; srcA.start(t, at); srcB.start(t, at); startCtx = t - at; playing = true; setIcon();
    srcA.onended = () => { if (my === token && playing) { playing = false; offset = 0; setIcon(); } };
  }
  function halt() { token++; try { srcA.stop(); srcB.stop(); } catch (_) {} }
  function pause() { if (!playing) return; offset = cur(); playing = false; halt(); setIcon(); }
  const abBtn = $('#abplay'), ico = $('#abico');
  function setIcon() { ico.innerHTML = playing ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>' : '<path d="M7 4.5v15l13-7.5z"/>'; abBtn.setAttribute('aria-label', playing ? 'Pauza' : 'Odtwórz'); }
  async function playNow() { initGains(); ac.resume(); const want = trk; if (!T0()) stateEl.textContent = 'Ładowanie…'; await load(want); if (want !== trk || !T0()) { if (!T0()) stateEl.textContent = 'Nie udało się wczytać nagrania'; return; } stateEl.textContent = label(); if (offset >= dur() - .05) offset = 0; if (!playing) start(offset); }
  abBtn.addEventListener('click', () => playing ? pause() : playNow());
  function setAB(m) { abMode = m; $('#segA').classList.toggle('sel', m === 'A'); $('#segB').classList.toggle('sel', m === 'B'); stateEl.textContent = label();
    if (gA) { gA.gain.setTargetAtTime(m === 'A' ? 1 : 0, ac.currentTime, .015); gB.gain.setTargetAtTime(m === 'B' ? 1 : 0, ac.currentTime, .015); }
    if (!playing) playNow(); }
  $('#segA').addEventListener('click', () => setAB('A')); $('#segB').addEventListener('click', () => setAB('B'));
  function seek(p) { p = Math.max(0, Math.min(dur() - .05, p)); if (playing) { halt(); start(p); } else offset = p; }
  wave.addEventListener('click', async e => { const r = wave.getBoundingClientRect(), k = (e.clientX - r.left) / r.width; if (!T0()) { await load(trk); offset = k * dur(); playNow(); } else seek(k * dur()); });
  wave.addEventListener('keydown', e => { if (e.key === 'ArrowRight') seek(cur() + 5); if (e.key === 'ArrowLeft') seek(cur() - 5); });
  // wybór numeru
  const tabs = $('#tracks');
  TRACKS.forEach((T, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'trk'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', i === trk);
    b.innerHTML = `<small>Numer ${i + 1}</small><b>${T.title}</b>`;
    b.addEventListener('click', () => pickTrack(i)); tabs.appendChild(b); });
  async function pickTrack(i) {
    if (i === trk) return; const was = playing; if (playing) { playing = false; halt(); setIcon(); }
    trk = i; offset = 0; $$('.trk', tabs).forEach((b, j) => b.setAttribute('aria-selected', j === i));
    if (!T0()) stateEl.textContent = 'Ładowanie…';
    await load(i); if (trk !== i) return;
    stateEl.textContent = T0() ? label() : 'Nie udało się wczytać nagrania';
    tdur.textContent = fmt(dur()); wave.setAttribute('aria-valuemax', Math.round(dur()));
    if (was) start(0);
  }
  // wczytaj pierwszy numer zawczasu, gdy ktoś zbliża się do sekcji
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); load(0).then(() => { if (trk === 0 && T0()) { tdur.textContent = fmt(dur()); wave.setAttribute('aria-valuemax', Math.round(dur())); } }); } }, { rootMargin: '600px' }).observe($('#roznica'));
  function drawWave() {
    const r = wcv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); if (wcv.width !== Math.round(r.width * d)) { wcv.width = r.width * d; wcv.height = r.height * d; }
    const c = T0(), W = wcv.width, H = wcv.height, pk = c ? (abMode === 'A' ? c.pA : c.pB) : [], n = pk.length || 160, bw = W / n, pos = c ? cur() / c.dur : 0;
    wx.clearRect(0, 0, W, H);
    for (let i = 0; i < n; i++) {
      const v = pk.length ? pk[i] : .12 + .06 * Math.sin(i * .5), h = Math.max(2 * d, Math.min(1, v) * H * .92), played = i / n < pos;
      wx.fillStyle = played ? (abMode === 'A' ? '#ff2d91' : '#c9c8c3') : (abMode === 'A' ? 'rgba(255,45,145,.28)' : 'rgba(201,200,195,.22)');
      wx.fillRect(i * bw + bw * .18, (H - h) / 2, bw * .64, h);
    }
    if (pk.length) { wx.fillStyle = '#fff'; wx.fillRect(pos * W - d, 0, 2 * d, H); }
    tcur.textContent = fmt(c ? cur() : 0); wave.setAttribute('aria-valuenow', Math.round(c ? cur() : 0));
    requestAnimationFrame(drawWave);
  }
  requestAnimationFrame(drawWave);

  /* ---------- kopiuj ---------- */
  $$('.copy').forEach(b => b.addEventListener('click', () => { const okk = () => { b.textContent = 'Skopiowano'; setTimeout(() => b.textContent = 'Kopiuj', 1500); }, sel = () => getSelection().selectAllChildren(b.previousElementSibling);
    navigator.clipboard ? navigator.clipboard.writeText(b.dataset.copy).then(okk).catch(sel) : sel(); }));
})();
