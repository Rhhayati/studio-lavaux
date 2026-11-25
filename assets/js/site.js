/* =========================================================
   Studio Lavaux · scripts du site (v3 « film »)
   GSAP + ScrollTrigger + SplitText + Lenis (copies locales)
   ========================================================= */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var LANG = (root.getAttribute('lang') || 'fr').slice(0, 2);
  var I18N = {
    fr: { cpm: ' clients/mois', cpm1: ' client/mois', months: ' mois', notyet: 'pas encore', menu: 'Menu', close: 'Fermer', typing: 'écrit…', online: 'en ligne',
      sending: 'Envoi…', retry: 'Réessayer l\u2019envoi', fail: 'L\u2019envoi n\u2019a pas abouti. Réessayez dans un instant ou écrivez-nous à bonjour@studio-lavaux.ch.',
      step: 'Étape', start: 'Pour {n}, on commencerait par\u00a0: ', and: ' et ',
      names: { commerce: 'un commerce', artisan: 'un artisan', services: 'une PME de services', cabinet: 'un cabinet', industrie: 'une entreprise industrielle' } },
    en: { cpm: ' customers/month', cpm1: ' customer/month', months: ' months', notyet: 'not yet', menu: 'Menu', close: 'Close', typing: 'typing…', online: 'online',
      sending: 'Sending…', retry: 'Try again', fail: 'Sending failed. Please try again in a moment or email us at bonjour@studio-lavaux.ch.',
      step: 'Step', start: 'For {n}, we would start with: ', and: ' and ',
      names: { commerce: 'a shop', artisan: 'a tradesperson', services: 'a service business', cabinet: 'a practice', industrie: 'an industrial company' } },
    de: { cpm: ' Kunden/Monat', cpm1: ' Kunde/Monat', months: ' Monaten', notyet: 'noch nicht', menu: 'Menü', close: 'Schliessen', typing: 'schreibt…', online: 'online',
      sending: 'Wird gesendet…', retry: 'Erneut senden', fail: 'Das Senden hat nicht geklappt. Bitte versuchen Sie es gleich nochmals oder schreiben Sie uns an bonjour@studio-lavaux.ch.',
      step: 'Schritt', start: 'Für {n} würden wir so beginnen: ', and: ' und ',
      names: { commerce: 'ein Geschäft', artisan: 'einen Handwerksbetrieb', services: 'ein Dienstleistungs-KMU', cabinet: 'eine Praxis', industrie: 'ein Industrieunternehmen' } }
  };
  var T = I18N[LANG] || I18N.fr;
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Calculateur (fonctionne même sans animations) ---------- */
  function initCalc() {
    var form = $('[data-calc]'); if (!form) return;
    var panier = $('#panier', form), clients = $('#clients', form), out = $('#clients-out', form);
    var fmt = function (n) { return Math.round(n).toLocaleString('fr-CH').replace(/ |,/g, ' '); };
    var gainEl = $('[data-out="gain"]'), roiEl = $('[data-out="roi"]'), seuilEl = $('[data-out="seuil"]'), amEl = $('[data-out="amorti"]');
    var barG = $('.co-bar-gain'), barP = $('.co-bar-pack');
    var shown = 0;
    function update(fromSector) {
      if (fromSector) { var r = $('input[name="secteur"]:checked', form); if (r) panier.value = r.value; }
      var p = Math.max(0, parseFloat(panier.value) || 0);
      var c = parseInt(clients.value, 10) || 0;
      var pack = parseFloat(($('input[name="pack"]:checked', form) || {}).value || 199);
      out.textContent = c;
      var gain = p * c;
      var roi = pack ? gain / pack : 0;
      roiEl.textContent = roi.toLocaleString(LANG + '-CH', { maximumFractionDigits: 1, minimumFractionDigits: roi < 10 ? 1 : 0 }) + ' ×';
      var seuil = p > 0 ? Math.ceil(pack / p) : 0;
      seuilEl.textContent = p > 0 ? seuil + (seuil > 1 ? T.cpm : T.cpm1) : '–';
      var net = gain - pack;
      if (net > 0) { var m = Math.ceil(2900 / net); amEl.textContent = m + T.months; }
      else amEl.textContent = T.notyet;
      var max = Math.max(gain, pack, 1);
      barG.style.width = (gain / max * 100) + '%';
      barP.style.width = (pack / max * 100) + '%';
      if (hasGsap && !reduce) {
        var o = { v: shown };
        gsap.to(o, { v: gain, duration: .6, ease: 'power3.out', onUpdate: function () { gainEl.textContent = fmt(o.v); } });
      } else gainEl.textContent = fmt(gain);
      shown = gain;
    }
    form.addEventListener('input', function (e) { update(e.target.name === 'secteur'); });
    form.addEventListener('change', function (e) { update(e.target.name === 'secteur'); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    update(true);
  }

  /* ---------- Formulaires (démo, ou Web3Forms si une clé est renseignée) ---------- */
  function initSteps(f) {
    var steps = $$('.mstep', f); if (steps.length < 2) return;
    var prog = $$('.mform-progress li', f), count = $('.mform-count', f);
    var prev = $('[data-prev]', f), next = $('[data-next]', f), sub = $('[data-submit]', f);
    var cur = 0;
    f.classList.add('is-steps');
    function show(i, focus) {
      cur = i;
      steps.forEach(function (s, k) { s.classList.toggle('is-cur', k === i); });
      prog.forEach(function (p, k) { p.classList.toggle('is-done', k < i); p.classList.toggle('is-cur', k === i); });
      count.textContent = T.step + ' ' + (i + 1) + ' ' + f.getAttribute('data-of') + ' ' + steps.length;
      prev.hidden = i === 0; next.hidden = i === steps.length - 1; sub.hidden = i !== steps.length - 1;
      if (hasGsap && !reduce) gsap.fromTo(steps[i], { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: .45, ease: 'power3.out', clearProps: 'transform,opacity' });
      if (focus) { var first = $('input:not([type=hidden]), select, textarea', steps[i]); if (first) first.focus({ preventScroll: true }); }
    }
    function valid(i) {
      var bad = $$('input, select, textarea', steps[i]).filter(function (el) { return !el.checkValidity(); });
      if (bad.length) { bad[0].reportValidity(); return false; }
      return true;
    }
    next.addEventListener('click', function () { if (valid(cur)) show(cur + 1, true); });
    prev.addEventListener('click', function () { show(cur - 1, true); });
    f.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && cur < steps.length - 1) { e.preventDefault(); next.click(); }
    });
    show(0, false);
  }

  function initForms() {
    $$('form[data-form]').forEach(function (f) {
      initSteps(f);
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!f.checkValidity()) { f.reportValidity(); return; }
        var ok = $('.form-ok', f.parentNode), btn = $('button[type="submit"]', f);
        var key = (f.querySelector('input[name="access_key"]') || {}).value;
        var done = function (msg) {
          f.hidden = true; ok.classList.add('is-visible');
          if (msg) $('p', ok).textContent = msg;
          ok.setAttribute('tabindex', '-1'); ok.focus();
        };
        if (!key) { done(); return; } // mode démonstration
        var demoNote = $('.form-ok-demo', ok); if (demoNote) demoNote.hidden = true;
        btn.disabled = true; btn.textContent = T.sending;
        fetch('https://api.web3forms.com/submit', { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
          .then(function (r) { return r.json(); })
          .then(function (j) { if (j.success) done(); else throw new Error(); })
          .catch(function () { btn.disabled = false; btn.textContent = T.retry; alert(T.fail); });
      });
    });
  }

  /* ---------- Menu mobile ---------- */
  function initMenu() {
    var btn = $('.menu-toggle'), menu = $('#menu'); if (!btn || !menu) return;
    var label = $('.menu-toggle-label', btn);
    function open() {
      menu.hidden = false; root.classList.add('menu-open'); btn.setAttribute('aria-expanded', 'true'); label.textContent = T.close;
      if (window.__lenis) window.__lenis.stop();
      if (hasGsap && !reduce) {
        gsap.fromTo(menu, { clipPath: 'circle(0% at 90% 3%)' }, { clipPath: 'circle(150% at 90% 3%)', duration: .9, ease: 'expo.inOut' });
        gsap.fromTo($$(':scope > nav a', menu), { yPercent: 120, rotate: 4, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, stagger: .045, duration: .9, delay: .25, ease: 'expo.out' });
        gsap.fromTo($('.menu-media', menu), { scale: 1.25 }, { scale: 1, duration: 1.6, ease: 'expo.out' });
        gsap.fromTo($$('.menu-langs, .menu-note', menu), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .7, delay: .6, stagger: .08 });
      }
      var first = $('nav a', menu); if (first) first.focus();
    }
    function close() {
      var end = function () { menu.hidden = true; root.classList.remove('menu-open'); };
      btn.setAttribute('aria-expanded', 'false'); label.textContent = T.menu;
      if (window.__lenis) window.__lenis.start();
      if (hasGsap && !reduce) gsap.to(menu, { clipPath: 'circle(0% at 90% 3%)', duration: .6, ease: 'expo.inOut', onComplete: end });
      else end();
    }
    btn.addEventListener('click', function () { btn.getAttribute('aria-expanded') === 'true' ? close() : open(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { close(); btn.focus(); } });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { if (a.hash && a.pathname === location.pathname) close(); }); });
  }

  /* ---------- En-tête ---------- */
  function initHeader() {
    var h = $('.site-header'); if (!h) return;
    var onScroll = function () { h.classList.toggle('is-scrolled', (window.scrollY || 0) > 40); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Sélecteur « Votre secteur » (Au-delà du site web) ---------- */
  function initBeyond() {
    var pick = $('[data-beyond]'), list = $('.beyond-list'); if (!pick || !list) return;
    var live = $('.beyond-live', pick);
    var names = T.names;
    function update() {
      var r = $('input[name="metier"]:checked', pick); if (!r) return;
      var hits = [];
      list.classList.add('has-sel');
      $$('li', list).forEach(function (li) {
        var on = (' ' + li.getAttribute('data-s') + ' ').indexOf(' ' + r.value + ' ') > -1;
        li.classList.toggle('is-hit', on);
        if (on) { var t = $('b', li).textContent.replace(/\s+/g, ' '); hits.push(LANG === 'de' ? t : t.charAt(0).toLowerCase() + t.slice(1)); }
      });
      live.textContent = T.start.replace('{n}', names[r.value]) + hits.slice(0, -1).join(', ') + T.and + hits[hits.length - 1] + '.';
    }
    pick.addEventListener('change', update);
    update();
  }

  /* ---------- Galerie de concepts : filtres par secteur ---------- */
  function initFilters() {
    var grid = $('.cc-grid'); if (!grid) return;
    var btns = $$('.filter'), cards = $$('.cc', grid), live = $('.filters-live');
    var canFlip = !!(window.gsap && window.Flip) && !reduce;
    if (canFlip) gsap.registerPlugin(Flip);
    function apply(key, animate) {
      var state = canFlip && animate ? Flip.getState(cards) : null;
      var n = 0;
      btns.forEach(function (b) { var on = b.getAttribute('data-filter') === key; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      cards.forEach(function (c) { var show = key === 'tous' || c.getAttribute('data-s') === key; c.hidden = !show; if (show) n++; });
      var label = $('.filter[data-filter="' + key + '"]');
      live.textContent = n + (n > 1 ? ' concepts' : ' concept') + (key === 'tous' ? '' : ' · ' + label.childNodes[0].textContent.trim());
      if (state) {
        Flip.from(state, { duration: .6, ease: 'power3.inOut', absolute: true, scale: true,
          onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, scale: .92 }, { opacity: 1, scale: 1, duration: .5, delay: .15 }); },
          onLeave: function (els) { return gsap.to(els, { opacity: 0, scale: .92, duration: .3 }); },
          onComplete: function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); } });
      }
    }
    btns.forEach(function (b) { b.addEventListener('click', function () {
      var k = b.getAttribute('data-filter'); apply(k, true);
      try { history.replaceState(null, '', k === 'tous' ? location.pathname : '#' + k); } catch (e) {}
    }); });
    var h = (location.hash || '').slice(1);
    apply($('.filter[data-filter="' + h + '"]') ? h : 'tous', false);
  }

  initCalc(); initForms(); initMenu(); initHeader(); initBeyond(); initFilters();

  /* =========================================================
     FILM DU HERO : séquence d'images WebP dessinée sur canvas
     ========================================================= */
  var heroEl = $('.hero');
  var film = null;
  function Film(hero) {
    var M = window.HERO_FRAMES; if (!M || !M.n) return null;
    var canvas = $('.hero-canvas', hero), ctx = canvas.getContext('2d', { alpha: false });
    var base = hero.getAttribute('data-frames') || 'assets/hero/';
    var self = { progress: 0, zoom: 1, ready: false, onProgress: null, n: M.n };
    var set = null, imgs = [], loaded = [], loadedCount = 0, coarseTotal = 0, coarseDone = 0, drawn = -1, dirty = true;
    function pickSet() { return (window.innerWidth / window.innerHeight) < 1 ? 'p' : 'l'; }
    function srcOf(k, i) {
      if (M.src && M.src[k]) { var arr = M.src[k]; return arr[Math.min(arr.length - 1, Math.round(i * (arr.length - 1) / Math.max(1, M.n - 1)))]; }
      return base + k + '/' + ('00' + (i + 1)).slice(-3) + '.webp';
    }
    function order(n) { // première image, puis une sur 8, 4, 2, puis toutes : le défilement trouve toujours une image proche
      var seen = {}, out = [];
      [n, 8, 4, 2, 1].forEach(function (step, si) {
        for (var i = 0; i < n; i += (si === 0 ? n : step)) if (!seen[i]) { seen[i] = 1; out.push(i); }
      });
      return out;
    }
    function load(k) {
      set = k; imgs = new Array(M.n); loaded = new Array(M.n); loadedCount = 0; drawn = -1;
      var seq = order(M.n), coarse = seq.slice(0);
      coarseTotal = coarse.length; coarseDone = 0;
      var idx = 0, inflight = 0, MAX = 6;
      function next() {
        while (inflight < MAX && idx < seq.length) {
          (function (i, isCoarse) {
            var im = new Image(); im.decoding = 'async'; inflight++;
            im.onload = im.onerror = function () {
              inflight--; if (k !== set) return;
              if (im.naturalWidth) { loaded[i] = true; loadedCount++; }
              if (isCoarse) { coarseDone++; if (self.onProgress) self.onProgress(coarseDone / coarseTotal); }
              dirty = true; next();
            };
            im.src = srcOf(k, i); imgs[i] = im;
          })(seq[idx], idx < coarseTotal);
          idx++;
        }
      }
      next();
    }
    function nearest(i) {
      if (loaded[i]) return i;
      for (var d = 1; d < M.n; d++) { if (loaded[i - d]) return i - d; if (loaded[i + d]) return i + d; }
      return -1;
    }
    var W = 0, H = 0;
    function size() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.round(canvas.clientWidth * dpr); H = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      dirty = true;
    }
    var shownP = 0, shownZ = 1, first = true;
    function cover(im, alpha) {
      var iw = im.naturalWidth, ih = im.naturalHeight;
      var s = Math.max(W / iw, H / ih) * shownZ, dw = iw * s, dh = ih * s;
      ctx.globalAlpha = alpha; ctx.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh); ctx.globalAlpha = 1;
    }
    function draw() {
      if (!W) return;
      // lissage : la position affichée glisse vers la cible, sans à-coups ni images figées
      if (first) { shownP = self.progress; shownZ = self.zoom; first = false; }
      var dp = self.progress - shownP, dz = self.zoom - shownZ;
      if (Math.abs(dp) < 1e-4 && Math.abs(dz) < 1e-4 && !dirty) return;
      shownP += dp * .14; shownZ += dz * .14;
      if (Math.abs(dp) < 1e-4) shownP = self.progress;
      var f = shownP * (M.n - 1), i = Math.floor(f), t = f - i;
      if (i >= M.n - 1) { i = M.n - 1; t = 0; }
      var a = nearest(i); if (a < 0) return;
      var b = (t > 0 && loaded[i + 1]) ? i + 1 : -1;
      cover(imgs[a], 1);
      if (b > 0) { var e = t * t * (3 - 2 * t); cover(imgs[b], e); }
      dirty = (a !== i) || Math.abs(self.progress - shownP) > 1e-4 || Math.abs(self.zoom - shownZ) > 1e-4;
      self.ready = true;
    }
    self.set = function (p, z) { if (p !== self.progress || z !== self.zoom) { self.progress = p; self.zoom = z || 1; dirty = true; } };
    self.tick = draw;
    self.resize = function () { var k = pickSet(); if (k !== set) load(k); size(); };
    self.frame = function () { return Math.round(self.progress * (M.n - 1)); };
    load(pickSet()); size();
    return self;
  }

  /* ---------- Sans GSAP ou en mouvement réduit : version statique (image de fin du film) ---------- */
  if (!hasGsap || reduce) {
    root.classList.remove('has-intro', 'anim');
    if (heroEl) {
      var still = (heroEl.getAttribute('data-frames') || 'assets/hero/');
      var pic = $('.hero-poster', heroEl);
      if (pic && !(window.HERO_FRAMES && window.HERO_FRAMES.src)) {
        var so = $('source', pic), im0 = $('img', pic);
        if (so) so.srcset = still + 'still-p.webp'; if (im0) im0.src = still + 'still.webp';
      }
    }
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  var mm = gsap.matchMedia();
  var isDesk = function () { return window.matchMedia('(min-width: 1000px)').matches; };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Défilement fluide (molette ; le tactile reste natif) ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href*="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (a.pathname !== location.pathname || !a.hash) return;
        var t = d.getElementById(a.hash.slice(1)); if (!t) return;
        e.preventDefault(); lenis.scrollTo(t, { offset: -70, duration: 1.6 }); history.replaceState(null, '', a.hash);
      });
    });
  }

  function splitLines(el) {
    if (!window.SplitText || !el) return null;
    return new SplitText(el, { type: 'lines', linesClass: 'line', mask: 'lines' });
  }

  /* =========================================================
     HERO
     ========================================================= */
  var heroIntro = function () {};
  if (heroEl) {
    film = Film(heroEl);
    var pinEl = $('.hero-pin', heroEl), media = $('.hero-media', heroEl);
    var dim = d.createElement('div'); dim.className = 'hero-dim'; media.appendChild(dim);
    var tc = $('.hero-tc', heroEl);
    var title = $('.hero-title', heroEl), ha = $('.ht-a', heroEl), hb = $('.ht-b', heroEl), hc = $('.ht-c', heroEl);
    var sa = splitLines(ha);
    var sb = window.SplitText ? new SplitText(hb, { type: 'chars', charsClass: 'ch' }) : null;
    var sc = window.SplitText ? new SplitText(hc, { type: 'words', wordsClass: 'wd' }) : null;
    var desk = $('.dv-desk', heroEl), p1 = $('.dv-p1', heroEl), p2 = $('.dv-p2', heroEl), stage = $('.dv-stage', heroEl);
    var endEl = $('.hero-end', heroEl), endTitle = $('.hero-end-title', heroEl);
    var se = splitLines(endTitle);
    var copy = $('.hero-copy', heroEl), devs = $('.hero-devices', heroEl);

    // états de départ
    gsap.set([copy, devs, endEl], { visibility: 'visible' });
    if (sa) gsap.set(sa.lines, { yPercent: 110 });
    if (sb) gsap.set(sb.chars, { yPercent: 70, opacity: 0 });
    if (sc) gsap.set(sc.words, { opacity: 0, y: 14 });
    gsap.set(desk, { z: -900, rotateX: 38, y: 80, opacity: 0, transformPerspective: 1600 });
    gsap.set(p1, { x: -120, y: 260, rotateY: 50, rotateZ: -6, opacity: 0 });
    gsap.set(p2, { x: 120, y: 300, rotateY: -50, rotateZ: 6, opacity: 0 });
    if (se) gsap.set(se.lines, { yPercent: 110 });
    gsap.set($$('.hero-sub, .hero-actions, .hero-note', endEl), { opacity: 0, y: 20 });
    gsap.set(endEl, { pointerEvents: 'none' });

    var fp = { f: 0, z: 1.08 };
    var tl = gsap.timeline({ defaults: { ease: 'none' } });
    // le film : la révélation du lac arrive vers 60 % de la vidéo, au moment où le titre se pose
    tl.to(fp, { f: 1, z: 1, duration: 8.4 }, 0)
      .to('.hero-open', { y: -40, opacity: 0, duration: 1.2, ease: 'power1.in' }, .25)
      .to('.hero-top', { opacity: 0, duration: 1 }, 6.6);
    if (sa) tl.to(sa.lines, { yPercent: 0, duration: 1.1, ease: 'power3.out', stagger: .12 }, 4.3);
    if (sb) tl.to(sb.chars, { yPercent: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: .07 }, 4.5);
    if (sc) tl.to(sc.words, { opacity: 1, y: 0, duration: .6, stagger: .05, ease: 'power2.out' }, 5.1);
    // le titre grandit et se dissout dans l'image
    tl.to(title, { scale: 1.32, duration: 1.4, ease: 'power1.in' }, 6.4);
    if (sb) tl.to(sb.chars, { opacity: 0, yPercent: -20, duration: 1, stagger: { each: .05, from: 'center' }, ease: 'power1.in' }, 6.5);
    if (sa) tl.to(sa.lines, { opacity: 0, duration: .9 }, 6.5);
    if (sc) tl.to(sc.words, { opacity: 0, duration: .7, stagger: .02 }, 6.4);
    tl.to(dim, { opacity: .5, duration: 1.4 }, 6.8)
      .to(desk, { z: 0, rotateX: 0, y: 0, opacity: 1, duration: 1.6, ease: 'power3.out' }, 7.0)
      .to(p1, { x: 0, y: 0, rotateY: 16, rotateZ: -2, opacity: 1, z: 80, duration: 1.5, ease: 'power3.out' }, 7.35)
      .to(p2, { x: 0, y: 0, rotateY: -16, rotateZ: 2, opacity: 1, z: 40, duration: 1.5, ease: 'power3.out' }, 7.55);
    if (se) tl.to(se.lines, { yPercent: 0, duration: 1, stagger: .12, ease: 'power3.out' }, 8.0);
    tl.to($$('.hero-sub, .hero-actions, .hero-note', endEl), { opacity: 1, y: 0, duration: .8, stagger: .12, ease: 'power2.out' }, 8.4)
      .set(endEl, { pointerEvents: 'auto' }, 8.6)
      .to({}, { duration: .9 });

    var fps = 24, dur = 8;
    var heroST = ScrollTrigger.create({
      trigger: heroEl, start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * (isDesk() ? 3.4 : 3.1)); },
      pin: pinEl, pinSpacing: true, scrub: .5, animation: tl, anticipatePin: 1, invalidateOnRefresh: true
    });
    // pas d'écran figé : un souffle très lent tant que l'on n'a pas défilé
    var breathe = { b: 0 };
    gsap.to(breathe, { b: 1, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    var lastTc = '';
    gsap.ticker.add(function () {
      if (!film) return;
      var z = fp.z + (heroST.progress < .02 ? breathe.b * .025 : 0);
      film.set(fp.f, z); film.tick();
      var sec = fp.f * dur, s = Math.floor(sec), fr = Math.floor((sec - s) * fps);
      var t = '00:0' + s + ':' + (fr < 10 ? '0' : '') + fr;
      if (tc && t !== lastTc) { tc.textContent = t; lastTc = t; }
    });
    window.addEventListener('resize', function () { if (film) film.resize(); });

    // inclinaison 3D des appareils : souris (desktop) et glisser du doigt (mobile), plus une lente flottaison
    var tilt = { x: 0, y: 0 }, tx = gsap.quickTo(tilt, 'x', { duration: .9, ease: 'power3' }), ty = gsap.quickTo(tilt, 'y', { duration: .9, ease: 'power3' });
    var drag = null;
    heroEl.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse') { tx((e.clientX / window.innerWidth - .5) * 2); ty((e.clientY / window.innerHeight - .5) * 2); }
      else if (drag) { tx(Math.max(-1, Math.min(1, (e.clientX - drag.x) / 120))); ty(Math.max(-1, Math.min(1, (e.clientY - drag.y) / 160))); }
    });
    heroEl.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') drag = { x: e.clientX, y: e.clientY }; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { heroEl.addEventListener(ev, function () { drag = null; tx(0); ty(0); }); });
    var glares = $$('.dv-glare', heroEl), t0 = performance.now();
    gsap.ticker.add(function () {
      if (heroST.progress < .62) return;
      var t = (performance.now() - t0) / 1000;
      var ry = tilt.x * 9 + Math.sin(t * .6) * 2.2, rx = -tilt.y * 7 + Math.cos(t * .5) * 1.6;
      stage.style.transform = 'rotateY(' + ry.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg) translateY(' + (Math.sin(t * .8) * 6).toFixed(1) + 'px)';
      var g = (30 + tilt.x * 30 + Math.sin(t * .6) * 8).toFixed(1) + '%';
      for (var i = 0; i < glares.length; i++) glares[i].style.setProperty('--gx', g);
    });

    heroIntro = function () {
      var it = gsap.timeline({ defaults: { ease: 'power3.out' } });
      var si = splitLines($('.hero-intro', heroEl));
      if (si) it.from(si.lines, { yPercent: 110, duration: 1.1, stagger: .1 }, .1);
      it.from('.hero-eyebrow', { opacity: 0, y: -10, duration: .9 }, .2)
        .from('.hero-cue', { opacity: 0, duration: 1 }, .6)
        .fromTo(media, { scale: 1.12 }, { scale: 1, duration: 2.4, ease: 'power2.out' }, 0);
    };
  }

  /* ---------- Chargement 0 → 100 (accueil, une fois par session) ---------- */
  var intro = $('.intro');
  if (root.classList.contains('has-intro') && intro) {
    store.set('intro-vue', '1');
    var cnt = $('[data-count]', intro), bar = $('.intro-bar i', intro);
    var shown = { v: 0 }, target = 0, finished = false, startT = performance.now();
    var fontsOk = false; (d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve()).then(function () { fontsOk = true; });
    if (film) film.onProgress = function (p) { target = Math.max(target, p); }; else target = 1;
    gsap.from('.intro-name', { yPercent: 40, opacity: 0, duration: 1.2, ease: 'power3.out' });
    var upd = function () {
      var goal = Math.min(target, fontsOk ? 1 : .9);
      if (performance.now() - startT > 6000) goal = 1; // réseau lent : on n'attend pas plus de 6 s
      shown.v += (goal - shown.v) * .08; if (goal - shown.v < .004) shown.v = goal;
      cnt.textContent = Math.round(shown.v * 100); bar.style.transform = 'scaleX(' + shown.v + ')';
      if (shown.v >= 1 && !finished && performance.now() - startT > 900) { finished = true; gsap.ticker.remove(upd); leave(); }
    };
    gsap.ticker.add(upd);
    var leave = function () {
      gsap.timeline({ onComplete: function () { root.classList.remove('has-intro'); } })
        .to('.intro-name, .intro-top, .intro-foot, .intro-bar', { y: -30, opacity: 0, duration: .5, ease: 'power2.in', stagger: .04 })
        .to(intro, { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'expo.inOut' }, '-=0.15')
        .add(heroIntro, '-=0.55');
    };
    $('.intro-skip', intro).addEventListener('click', function () { target = 1; shown.v = 1; });
  } else {
    root.classList.remove('has-intro');
    heroIntro();
  }

  /* ---------- Transitions entre pages (rideau) ---------- */
  var veil = $('.veil');
  if (veil) {
    if (store.get('veil') === '1') {
      store.set('veil', '0');
      gsap.fromTo(veil, { clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)', duration: .8, ease: 'expo.inOut', delay: .05 });
    }
    $$('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || a.target || /^(https?:|mailto:|tel:|#)/.test(href) || a.hasAttribute('download') || a.hasAttribute('data-apercu')) return;
      a.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (a.pathname === location.pathname && a.hash) return;
        e.preventDefault(); store.set('veil', '1');
        gsap.fromTo(veil, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: .55, ease: 'expo.in', onComplete: function () { location.href = a.href; } });
      });
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) gsap.set(veil, { clipPath: 'inset(100% 0 0 0)' }); });
  }

  /* ---------- En-tête : se cache en descendant, revient en remontant ---------- */
  var header = $('.site-header'), lastY = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (self) {
    var y = self.scroll(), down = y > lastY + 4, up = y < lastY - 4;
    if (root.classList.contains('menu-open')) return;
    if (down && y > 400) header.classList.add('is-hidden'); else if (up || y < 400) header.classList.remove('is-hidden');
    lastY = y;
  } });

  /* ---------- Curseur personnalisé + boutons magnétiques (souris uniquement) ---------- */
  var cur = $('.cursor');
  if (cur && finePointer && window.innerWidth >= 1000) {
    root.classList.add('has-cursor');
    var dot = $('.cursor-dot', cur), ring = $('.cursor-ring', cur), lab = $('.cursor-label', cur);
    var dx = gsap.quickTo(dot, 'x', { duration: .08 }), dy = gsap.quickTo(dot, 'y', { duration: .08 });
    var rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); cur.classList.add('is-on'); });
    d.addEventListener('pointerleave', function () { cur.classList.remove('is-on'); });
    var LBL = { fr: ['Voir', 'Glisser'], en: ['View', 'Drag'], de: ['Ansehen', 'Ziehen'] }[LANG] || ['Voir', 'Glisser'];
    $$('a, button, summary, label, input[type=range]').forEach(function (el) {
      el.addEventListener('pointerenter', function () { cur.classList.add('is-big'); });
      el.addEventListener('pointerleave', function () { cur.classList.remove('is-big'); });
    });
    $$('.concept-shot, .cc-shot, .hero-devices').forEach(function (el) {
      el.addEventListener('pointerenter', function () { lab.textContent = LBL[0]; cur.classList.add('is-label'); });
      el.addEventListener('pointerleave', function () { cur.classList.remove('is-label'); });
    });
    $$('.btn, .magnetic, .menu-toggle').forEach(function (b) {
      var bx = gsap.quickTo(b, 'x', { duration: .6, ease: 'elastic.out(1, .4)' }), by = gsap.quickTo(b, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
      b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); bx((e.clientX - r.left - r.width / 2) * .28); by((e.clientY - r.top - r.height / 2) * .38); });
      b.addEventListener('pointerleave', function () { bx(0); by(0); });
    });
  }

  /* ---------- Retour visuel au toucher (onde) ---------- */
  d.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.btn, .ab-item, .filter, .chips span, .seg span');
    if (!b) return;
    var host = b.classList.contains('btn') || b.classList.contains('ab-item') ? b : null; if (!host) { gsap.fromTo(b, { scale: .94 }, { scale: 1, duration: .5, ease: 'elastic.out(1, .5)' }); return; }
    var r = host.getBoundingClientRect(), s = d.createElement('span');
    s.className = 'ripple'; s.style.left = (e.clientX - r.left) + 'px'; s.style.top = (e.clientY - r.top) + 'px';
    host.appendChild(s); setTimeout(function () { s.remove(); }, 700);
  }, { passive: true });

  /* ---------- Titres : lignes masquées ---------- */
  $$('.reveal-lines, .section h2.h-display, .plans-head .h-display, .faq .h-display, .calc .h-display').forEach(function (el) {
    if (el.closest('.promise')) return;
    var s = splitLines(el); if (!s) return;
    gsap.from(s.lines, { yPercent: 108, duration: 1.15, ease: 'power4.out', stagger: .09, scrollTrigger: { trigger: el, start: 'top 86%' } });
  });

  /* ---------- Promesse : la phrase s'allume mot à mot ---------- */
  var ph2 = $('.promise .h-display');
  if (ph2 && window.SplitText) {
    var pw = new SplitText(ph2, { type: 'words', wordsClass: 'w' });
    gsap.to(pw.words, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: ph2, start: 'top 82%', end: 'bottom 42%', scrub: .6 } });
  }
  if ($('.promise-item')) gsap.from('.promise-item', { y: 50, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.promise-grid', start: 'top 85%' } });
  $$('.count').forEach(function (el) {
    var to = parseFloat(el.getAttribute('data-to')), o = { v: 0 };
    el.textContent = '0';
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () {
      gsap.to(o, { v: to, duration: 1.8, ease: 'expo.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
    } });
  });

  /* ---------- Concepts : défilement horizontal épinglé (desktop), inclinaison au survol / au doigt ---------- */
  var concepts = $('.concepts');
  if (concepts) {
    mm.add('(min-width: 1000px)', function () {
      concepts.classList.add('is-h');
      var track = $('.concepts-track', concepts);
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tween = gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: concepts, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true } });
      $$('.concept-shot', concepts).forEach(function (fig) {
        gsap.fromTo(fig, { clipPath: 'inset(14% 20% 14% 0% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', ease: 'none',
          scrollTrigger: { trigger: fig, containerAnimation: tween, start: 'left 95%', end: 'left 45%', scrub: true } });
        gsap.fromTo($('img', fig), { scale: 1.2 }, { scale: 1, ease: 'none',
          scrollTrigger: { trigger: fig, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      return function () { concepts.classList.remove('is-h'); gsap.set(track, { x: 0 }); };
    });
    mm.add('(max-width: 999px)', function () {
      $$('.concept-shot', concepts).forEach(function (fig) {
        gsap.fromTo(fig, { clipPath: 'inset(0% 0% 100% 0% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: concepts, start: 'top 55%' } });
      });
    });
  }
  $$('.concept-shot, .cc-shot').forEach(function (el) {
    var qx = gsap.quickTo(el, 'rotationY', { duration: .8, ease: 'power3' }), qy = gsap.quickTo(el, 'rotationX', { duration: .8, ease: 'power3' });
    gsap.set(el, { transformPerspective: 900 });
    var move = function (e) { var r = el.getBoundingClientRect(); qx(((e.clientX - r.left) / r.width - .5) * 10); qy(-((e.clientY - r.top) / r.height - .5) * 8); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', function () { qx(0); qy(0); });
    el.addEventListener('pointerup', function () { qx(0); qy(0); });
  });

  /* ---------- Comment ça marche : cadran épinglé (desktop), lignes qui se remplissent (mobile) ---------- */
  var steps = $('.steps');
  if (steps) {
    var stepEls = $$('.step', steps), dialItems = $$('.dial-list li', steps), dialI = $('.dial-i', steps), ring = $('.dial-fg', steps);
    var N = stepEls.length, curS = -1;
    var setStep = function (i) {
      if (i === curS) return; curS = i;
      stepEls.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      dialItems.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      if (dialI) dialI.textContent = i + 1;
    };
    mm.add('(min-width: 1000px)', function () {
      steps.classList.add('steps-live'); setStep(0);
      var st = ScrollTrigger.create({ trigger: steps, start: 'top top', end: '+=' + (N * 520), pin: true, scrub: true,
        onUpdate: function (self) {
          var p = self.progress; setStep(Math.min(N - 1, Math.floor(p * N * .9999)));
          ring.style.setProperty('--dash', (1 - p).toFixed(4));
          stepEls.forEach(function (s, k) { s.style.setProperty('--p', Math.max(0, Math.min(1, p * N - k)).toFixed(3)); });
        } });
      return function () { steps.classList.remove('steps-live'); st.kill(); };
    });
    mm.add('(max-width: 999px)', function () {
      stepEls.forEach(function (s) {
        gsap.from(s, { y: 30, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 90%' } });
        ScrollTrigger.create({ trigger: s, start: 'top 75%', end: 'bottom 45%', scrub: true, onUpdate: function (self) { s.style.setProperty('--p', self.progress.toFixed(3)); } });
      });
    });
  }

  /* =========================================================
     SÉQUENCE SIGNATURE : WhatsApp → assistant IA → agenda → SMS → avis Google
     ========================================================= */
  var flow = $('.flow');
  if (flow) {
    var phone = $('.iphone', flow), screen = $('.ip-screen', flow), box = d.createElement('div');
    box.className = 'iphone-box'; phone.parentNode.insertBefore(box, phone); box.appendChild(phone);
    var fsteps = $$('.fs', flow), copyEl = $('.flow-copy', flow);
    var prog = d.createElement('div'); prog.className = 'flow-progress';
    fsteps.forEach(function () { prog.appendChild(d.createElement('i')); });
    copyEl.insertBefore(prog, copyEl.firstChild);
    var bars = $$('i', prog);
    var wa = $('.ip-wa', flow), cal = $('.ip-cal', flow), lock = $('.ip-lock', flow), clock = $('.ip-time', flow);
    var chatEls = $$('.wa-chat > *', flow), newEv = $('.cal-new', flow);
    var lt = $('.lock-time', flow), ld = $('.lock-date', flow);
    var lt1 = lt.textContent, ld1 = ld.textContent, lt2 = lt.getAttribute('data-b'), ld2 = ld.getAttribute('data-b');
    var n1 = $('.n-sms', flow), n2 = $('.n-ask', flow), n3 = $('.n-review', flow), stars = $$('.ipn-stars i', flow), pub = $('.ipn-pub', flow);
    var pubTxt = pub.textContent;
    var waStatus = $('.wa-status', flow), waSub = waStatus.textContent;

    function fit() {
      var avail;
      if (isDesk()) avail = Math.min(window.innerHeight - 150, 680);
      else avail = window.innerHeight - (parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) * 16 || 68) - copyEl.offsetHeight - 118;
      var s = Math.max(.62, Math.min(1.08, avail / 620));
      phone.style.setProperty('--s', s.toFixed(3)); box.style.setProperty('--s', s.toFixed(3));
    }
    flow.classList.add('flow-live'); fit();

    gsap.set(chatEls, { display: 'none' });
    gsap.set(cal, { xPercent: 100 }); gsap.set(lock, { autoAlpha: 0, scale: 1.08 });
    gsap.set(newEv, { autoAlpha: 0, y: -46, scale: 1.06 });
    gsap.set([n1, n2, n3], { autoAlpha: 0, y: -24, scale: .96 });
    gsap.set(stars, { scale: 0 });
    gsap.set('.ipn-reply, .ipn-actions', { autoAlpha: 0, height: 0, marginTop: 0 });

    var ft = gsap.timeline({ defaults: { ease: 'power2.out' } });
    var show = function (el, at) {
      ft.set(el, { display: el.classList.contains('wa-typing') ? 'flex' : 'block' }, at)
        .fromTo(el, { autoAlpha: 0, y: 14, scale: .94, transformOrigin: el.classList.contains('in') || el.classList.contains('wa-typing') ? '0% 100%' : '100% 100%' }, { autoAlpha: 1, y: 0, scale: 1, duration: .5, ease: 'back.out(1.7)' }, at);
    };
    var hide = function (el, at) { ft.to(el, { autoAlpha: 0, duration: .15 }, at).set(el, { display: 'none' }, at + .16); };
    // 0 : le client écrit
    ft.addLabel('s0', 0); show(chatEls[0], .2);
    // 1 : l'assistant répond et réserve
    ft.addLabel('s1', 1.2);
    show(chatEls[1], 1.3); hide(chatEls[1], 2.1);
    show(chatEls[2], 2.25);
    show(chatEls[3], 3.1);
    show(chatEls[4], 3.9); hide(chatEls[4], 4.6);
    show(chatEls[5], 4.75);
    show(chatEls[6], 5.6);
    // 2 : agenda
    ft.addLabel('s2', 6.5)
      .to(wa, { xPercent: -28, autoAlpha: .4, duration: .8, ease: 'power3.inOut' }, 6.6)
      .to(cal, { xPercent: 0, duration: .8, ease: 'power3.inOut' }, 6.6)
      .to(newEv, { autoAlpha: 1, y: 0, scale: 1, duration: .7, ease: 'back.out(2)' }, 7.5)
      .fromTo(newEv, { boxShadow: '0 0 0 0 rgba(240,138,36,.6)' }, { boxShadow: '0 0 0 14px rgba(240,138,36,0)', duration: .8 }, 8.1);
    // 3 : samedi, le rappel SMS
    ft.addLabel('s3', 9)
      .to(cal, { scale: .92, autoAlpha: 0, duration: .7, ease: 'power2.in' }, 9.1)
      .to(lock, { autoAlpha: 1, scale: 1, duration: .8, ease: 'power3.out' }, 9.4)
      .to(n1, { autoAlpha: 1, y: 0, scale: 1, duration: .6, ease: 'back.out(1.6)' }, 10.1);
    // 4 : dimanche, la demande d'avis puis l'avis et la réponse rédigée par l'IA
    ft.addLabel('s4', 11.2)
      .to(lt, { autoAlpha: 0, y: -12, duration: .3 }, 11.3).to(lt, { autoAlpha: 1, y: 0, duration: .4 }, 11.7)
      .to(n1, { autoAlpha: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: -8, duration: .5 }, 11.4)
      .to(n2, { autoAlpha: 1, y: 0, scale: 1, duration: .6, ease: 'back.out(1.6)' }, 11.9)
      .to(n3, { autoAlpha: 1, y: 0, scale: 1, duration: .6, ease: 'back.out(1.6)' }, 12.7)
      .to(stars, { scale: 1, duration: .4, stagger: .08, ease: 'back.out(3)' }, 13.1)
      .to('.ipn-reply', { autoAlpha: 1, height: 'auto', marginTop: 0, duration: .6 }, 13.6)
      .to('.ipn-actions', { autoAlpha: 1, height: 'auto', marginTop: 8, duration: .5 }, 14)
      .fromTo(pub, { scale: 1 }, { scale: .9, duration: .15, yoyo: true, repeat: 1 }, 14.9)
      .addLabel('done', 15.2)
      .to({}, { duration: .9 });

    var L = ft.labels, keys = ['s0', 's1', 's2', 's3', 's4'], curF = -1;
    var sync = function () {
      var t = ft.time(), k = 0;
      for (var i = 0; i < keys.length; i++) if (t >= L[keys[i]] - .05) k = i;
      if (k !== curF) { curF = k; fsteps.forEach(function (s, j) { s.classList.toggle('is-on', j === k); }); }
      bars.forEach(function (b, j) {
        var a = L[keys[j]], z = j < keys.length - 1 ? L[keys[j + 1]] : L.done;
        b.style.setProperty('--f', Math.max(0, Math.min(1, (t - a) / (z - a))).toFixed(3));
      });
      var isLock = t >= 9.5;
      screen.classList.toggle('is-lock', isLock);
      clock.textContent = t < 9.5 ? (t < 3.0 ? '17:42' : '17:43') : (t < 11.6 ? lt1 : lt2);
      lt.textContent = t < 11.6 ? lt1 : lt2; ld.textContent = t < 11.6 ? ld1 : ld2;
      var typing = (t > 1.3 && t < 2.2) || (t > 3.9 && t < 4.7);
      waStatus.textContent = typing ? T.typing : waSub;
      var done = t >= 15;
      pub.classList.toggle('is-done', done); pub.textContent = done ? pub.getAttribute('data-done') : pubTxt;
    };
    ft.eventCallback('onUpdate', sync);
    mm.add('(min-width: 1000px)', function () {
      var st = ScrollTrigger.create({ trigger: $('.flow-pin', flow), start: 'top top', end: '+=3400', pin: true, scrub: .6, animation: ft });
      return function () { st.kill(); };
    });
    mm.add('(max-width: 999px)', function () {
      var st = ScrollTrigger.create({ trigger: $('.flow-pin', flow), start: 'top top', end: '+=3000', pin: true, scrub: .6, animation: ft });
      return function () { st.kill(); };
    });
    sync();
    window.addEventListener('resize', fit);
    // reflet qui suit le défilement
    var glare = $('.ip-glare', flow);
    ScrollTrigger.create({ trigger: flow, start: 'top bottom', end: 'bottom top', onUpdate: function (s) { glare.style.setProperty('--gx', (10 + s.progress * 80).toFixed(1) + '%'); } });
  }

  /* ---------- Offres : cartes empilées en sticky, la précédente recule ---------- */
  var plans = $$('.stack .plan');
  plans.forEach(function (p, i) {
    gsap.from(p, { y: 80, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 95%' } });
    var nxt = plans[i + 1]; if (!nxt) return;
    gsap.fromTo(p, { scale: 1, filter: 'brightness(1)' }, { scale: .92, filter: 'brightness(.8)', ease: 'none',
      scrollTrigger: { trigger: nxt, start: 'top 85%', end: function () { return 'top ' + (parseFloat(getComputedStyle(nxt).top) || 80) + 'px'; }, scrub: true, invalidateOnRefresh: true } });
  });
  if ($('.setups')) gsap.from('.setup-item', { y: 40, opacity: 0, duration: 1, stagger: .1, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.setups', start: 'top 85%' } });

  /* ---------- Transitions de sections : rideau arrondi qui s'ouvre ---------- */
  $$('.calc, .request, .concepts, .flow').forEach(function (sec) {
    gsap.fromTo(sec, { clipPath: 'inset(0% 4% 0% 4% round 36px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 35%', scrub: true } });
  });

  /* ---------- FAQ : ouverture fluide ---------- */
  $$('.faq-list details').forEach(function (det) {
    var sum = $('summary', det), body = $('p', det); if (!sum || !body) return;
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      if (det.open) { gsap.to(body, { height: 0, opacity: 0, duration: .45, ease: 'power3.inOut', onComplete: function () { det.open = false; gsap.set(body, { clearProps: 'all' }); } }); }
      else { det.open = true; gsap.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: .55, ease: 'power3.out', onComplete: function () { gsap.set(body, { clearProps: 'all' }); ScrollTrigger.refresh(); } }); }
    });
  });

  /* ---------- Listes et blocs des pages intérieures ---------- */
  if ($('.cc-grid')) gsap.from('.filters, .filters-live, .cc-grid', { y: 30, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out', delay: .3, clearProps: 'transform,opacity' });
  $$('.sector2, .method li, .pledges div, .res-list li, .not-list li, .beyond-list li, .faq-list details').forEach(function (el) {
    gsap.from(el, { y: 34, opacity: 0, duration: .9, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
  $$('.sector, .plan-detail').forEach(function (s) {
    gsap.from(s.children, { y: 36, opacity: 0, duration: .9, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 85%' } });
  });
  $$('.auto-list li').forEach(function (li) {
    gsap.from(li, { clipPath: 'inset(0 100% 0 0 round 12px)', duration: 1, ease: 'expo.inOut', scrollTrigger: { trigger: li, start: 'top 92%' } });
  });

  /* ---------- Bandeau des pages intérieures ---------- */
  var ph = $('.page-hero, .notfound');
  if (ph) {
    var s1 = splitLines($('h1', ph));
    var ptl = gsap.timeline({ delay: .15 });
    ptl.fromTo($('.page-hero-media', ph), { scale: 1.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 2, ease: 'power3.out' }, 0);
    if (s1) ptl.from(s1.lines, { yPercent: 110, duration: 1.15, stagger: .09, ease: 'power4.out' }, .15);
    ptl.from($$('.wrap > p, .wrap > .hero-actions, .wrap > nav', ph), { y: 24, opacity: 0, duration: .8, stagger: .08, ease: 'power3.out' }, .5);
    var pm = $('.page-hero-media', ph);
    if (pm) ScrollTrigger.create({ trigger: ph, start: 'top top', end: 'bottom top', scrub: true, onUpdate: function (s) { pm.style.setProperty('--py', (s.progress * 70).toFixed(1) + 'px'); } });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
