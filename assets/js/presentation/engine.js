/* The presentation engine. Reads window.DECK (deck.js), builds one flat forward/backward sequence of slides,
   and moves between them with a fixed choreography:

     same chapter     slide fades out (180 ms), next slide fades in (320 ms)
     new chapter      slide fades out (350 ms), the camera travels along the path (about 2.2 s), the next slide fades in (450 ms)

   The camera only moves while no slide is on screen. Any key press during an animation completes it at once
   (it does not also advance), so a double click can never skip a slide by accident.

   Input is plain keyboard events, so a standard presentation clicker works with no special setup.
     Next:     ArrowRight  PageDown  Space  Enter  ArrowDown
     Previous: ArrowLeft   PageUp    Backspace  ArrowUp
     Also:     Home / End  F fullscreen  I skip animations  N speaker notes  D review tags  ? help
   Position lives in the address as #/chapter/slide (1-based), written with replaceState, so a refresh keeps
   your place and the browser's Back button leaves the page normally. Editing the hash jumps to that slide. */
(function () {
  'use strict';

  var DECK = window.DECK, chapters = DECK.chapters;
  var qs = new URLSearchParams(location.search);
  var body = document.body;
  var $ = function (id) { return document.getElementById(id); };
  var slideEl = $('slide'), canvas = $('gl'), stageEl = $('stage');

  // ---- The flat sequence ------------------------------------------------------
  var steps = [];
  chapters.forEach(function (c, ci) { c.slides.forEach(function (s, si) { steps.push({ c: ci, s: si, slide: s }); }); });
  var chapterStart = chapters.map(function (c, ci) { return steps.findIndex(function (st) { return st.c === ci; }); });

  // ---- Settings ---------------------------------------------------------------
  var reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) {} return null; }
  var instant;
  (function () {
    var m = qs.get('motion');
    if (m === 'off') instant = true; else if (m === 'on') instant = false;
    else if (store('wr-instant') !== null) instant = store('wr-instant') === '1';
    else instant = reducedMQ.matches;
  })();
  var showDrafts = qs.get('review') === '1' || store('wr-drafts') === '1';   // review tags are off by default: nothing unfinished-looking on the projector

  // ---- The mountain -------------------------------------------------------------
  var world = null;
  if (qs.get('scene') !== 'off') {
    try {
      if (typeof THREE === 'undefined' || !window.WorldKit) throw new Error('three missing');
      world = WorldKit.create({
        canvas: canvas, reduced: reducedMQ.matches,
        nodes: chapters.map(function (c) { return { x: c.node.x, z: c.node.z, kind: c.kind }; })
      });
    } catch (err) { world = null; }
  }
  if (!world) body.classList.add('no-scene'); else body.classList.add('has-scene');

  function nodePose(ci) {
    var n = chapters[ci].node;
    return { tx: n.x, ty: (world ? world.H(n.x, n.z) : 0) + 7, tz: n.z,
             az: n.az || 0, el: n.el == null ? 16 : n.el, dist: n.dist || 54, anchor: n.anchor == null ? 0.7 : n.anchor };
  }
  var OVERVIEW = { tx: 0, ty: 14, tz: -70, az: 0, el: 20, dist: 175, anchor: 0.5 };
  var curPose = null;
  function applyPose(p, progress) {
    curPose = p;
    if (!world) return;
    world.setPose(p); world.setAnchor(p.anchor, 0.42);
    if (progress !== undefined) world.setProgress(progress);
  }
  function ease(u) { return u * u * u * (u * (u * 6 - 15) + 10); }   // smootherstep: slow start, slow finish
  function lerp(a, b, t) { return a + (b - a) * t; }
  function travelPose(a, b, u) {
    var e = ease(u), A = nodePose(a), B = nodePose(b), p;
    if (world && world.curve) {
      var q = world.curve.getPoint(lerp(a, b, e) / (chapters.length - 1));
      p = { tx: q.x, ty: world.H(q.x, q.z) + 7, tz: q.z };
    } else { p = { tx: lerp(A.tx, B.tx, e), ty: lerp(A.ty, B.ty, e), tz: lerp(A.tz, B.tz, e) }; }
    p.az = lerp(A.az, B.az, e); p.el = lerp(A.el, B.el, e);
    p.dist = lerp(A.dist, B.dist, e) + Math.sin(Math.PI * e) * 9;   // a gentle pull back in the middle of the trip
    p.anchor = lerp(A.anchor, B.anchor, e);
    return p;
  }

  // ---- Animation timeline ---------------------------------------------------------
  // A list of phases {dur, fn(u)}. Pressing a key while one runs calls finishAnim(), which plays every
  // remaining phase to its end state immediately.
  var anim = null;
  function startAnim(phases, onDone) {
    anim = { phases: phases, i: 0, t0: null, onDone: onDone };
    if (instant) finishAnim();
  }
  function finishAnim() {
    var a = anim; if (!a) return; anim = null;
    for (; a.i < a.phases.length; a.i++) a.phases[a.i].fn(1);
    if (a.onDone) a.onDone();
  }
  function stepAnim(now) {
    var a = anim; if (!a) return;
    if (a.t0 === null) a.t0 = now;
    while (a.i < a.phases.length) {
      var ph = a.phases[a.i];
      var u = ph.dur > 0 ? Math.min(1, (now - a.t0) / ph.dur) : 1;
      ph.fn(u);
      if (u < 1) return;
      a.i++; a.t0 = now;
    }
    anim = null;
    if (a.onDone) a.onDone();
  }

  // ---- Slide overlay -----------------------------------------------------------------
  function setOverlay(o) {
    slideEl.style.opacity = o.toFixed(3);
    slideEl.style.transform = o >= 1 ? 'none' : 'translateY(' + ((1 - o) * 14).toFixed(1) + 'px)';
    slideEl.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function paragraphs(parent, body, cls) {
    (Array.isArray(body) ? body : [body]).forEach(function (t) { if (t) parent.appendChild(el('p', cls || 'sl-p', t)); });
  }
  function photo(img, cls) {
    var fig = el('figure', cls || 'sl-fig');
    var im = el('img'); im.src = img.src; im.alt = img.alt || ''; im.decoding = 'async';
    if (img.ratio) im.style.aspectRatio = img.ratio; if (img.pos) im.style.objectPosition = img.pos;
    fig.appendChild(im);
    if (img.caption) fig.appendChild(el('figcaption', 'sl-caption', img.caption));
    return fig;
  }
  function buildSlide(step) {
    var s = step.slide, ch = chapters[step.c];
    var root = el('div', 'sl sl--' + s.type);
    root.dataset.chapter = ch.id; root.dataset.status = s.status || 'draft';
    root.dataset.side = ch.node.anchor != null && ch.node.anchor < 0.5 ? 'right' : 'left';   // text goes opposite the waypoint
    var t = s.type, text;
    if (t === 'full') {
      text = el('div', 'sl-text');
      if (s.eyebrow) text.appendChild(el('p', 'sl-eyebrow', s.eyebrow));
      text.appendChild(el('h2', 'sl-title', s.title));
      paragraphs(text, s.body);
      root.appendChild(text);
    } else if (t === 'split') {
      text = el('div', 'sl-text');
      if (s.eyebrow) text.appendChild(el('p', 'sl-eyebrow', s.eyebrow));
      text.appendChild(el('h2', 'sl-title', s.title));
      paragraphs(text, s.body);
      root.appendChild(text);
    } else if (t === 'quote') {
      text = el('div', 'sl-text sl-text--quote');
      if (s.eyebrow) text.appendChild(el('p', 'sl-eyebrow', s.eyebrow));
      text.appendChild(el('h2', 'sl-title', s.title));
      var q = el('blockquote', 'sl-quote'); paragraphs(q, s.body, 'sl-quote__p'); text.appendChild(q);
      if (s.attribution) text.appendChild(el('p', 'sl-attrib', s.attribution));
      root.appendChild(text);
    } else if (t === 'timeline') {
      text = el('div', 'sl-text sl-text--wide');
      if (s.eyebrow) text.appendChild(el('p', 'sl-eyebrow', s.eyebrow));
      text.appendChild(el('h2', 'sl-title', s.title));
      var ol = el('ol', 'sl-timeline'); ol.style.setProperty('--n', (s.items || []).length || 3);
      (s.items || []).forEach(function (it) {
        var li = el('li', 'sl-timeline__item');
        li.appendChild(el('span', 'sl-timeline__when', it.when));
        li.appendChild(el('span', 'sl-timeline__what', it.what));
        ol.appendChild(li);
      });
      text.appendChild(ol); root.appendChild(text);
    } else if (t === 'closing') {
      text = el('div', 'sl-text sl-text--center');
      if (s.eyebrow) text.appendChild(el('p', 'sl-eyebrow', s.eyebrow));
      text.appendChild(el('h2', 'sl-title sl-title--big', s.title));
      paragraphs(text, s.body, 'sl-p sl-p--mono');
      root.appendChild(text);
    } else {   // title
      text = el('div', 'sl-text sl-text--title');
      if (s.eyebrow) text.appendChild(el('p', 'sl-eyebrow', s.eyebrow));
      text.appendChild(el('h1', 'sl-title sl-title--big', s.title));
      paragraphs(text, s.body, 'sl-p sl-p--lead');
      if (s.byline) text.appendChild(el('p', 'sl-byline', s.byline));
      root.appendChild(text);
    }
    // A photo sits under the words in the same column, so the mountain stays visible on the other side.
    if (s.image && s.image.src && text) text.appendChild(photo(s.image, t === 'full' ? 'sl-fig sl-fig--lg' : 'sl-fig'));
    var wanted = s.image && s.image.wanted && !/^none/i.test(s.image.wanted);
    if (showDrafts && (s.status !== 'verified' || wanted)) {
      var tag = (s.status !== 'verified' ? 'DRAFT' : '') + (s.status !== 'verified' && wanted ? ' · ' : '') + (wanted ? 'PHOTO WANTED: ' + s.image.wanted : '');
      root.appendChild(el('span', 'sl-draft', tag));
    }
    return root;
  }

  // ---- Chrome: counter, chapter name, progress, notes ------------------------------------
  var elCount = $('hud-count'), elChapter = $('hud-chapter'), elProg = $('hud-progress'), elLive = $('live'),
      elNotes = $('notes'), elNotesText = $('notes-text'), btnPrev = $('btn-prev'), btnNext = $('btn-next'),
      btnInstant = $('btn-instant'), btnFs = $('btn-fs'), btnNotes = $('btn-notes'), helpEl = $('help');
  var segs = [];
  chapters.forEach(function (c, ci) {
    var b = el('button', 'seg'); b.type = 'button';
    b.setAttribute('aria-label', 'Go to chapter ' + (ci + 1) + ': ' + c.title);
    b.title = (ci + 1) + '. ' + c.title;
    b.dataset.kind = c.kind;
    b.appendChild(el('span', 'seg__fill'));
    b.addEventListener('click', function () { b.blur(); jump(chapterStart[ci]); });
    elProg.appendChild(b); segs.push(b);
  });
  function updateChrome() {
    var st = steps[idx], ch = chapters[st.c];
    elCount.textContent = (idx + 1) + ' / ' + steps.length;
    elChapter.textContent = (st.c + 1) + '. ' + ch.title;
    segs.forEach(function (b, ci) {
      var n = chapters[ci].slides.length;
      var f = ci < st.c ? 1 : ci > st.c ? 0 : (st.s + 1) / n;
      b.firstChild.style.transform = 'scaleX(' + f.toFixed(3) + ')';
      b.classList.toggle('is-current', ci === st.c);
    });
    btnPrev.disabled = idx === 0; btnNext.disabled = idx === steps.length - 1;
    elLive.textContent = 'Slide ' + (idx + 1) + ' of ' + steps.length + '. ' + ch.title + '.';
    elNotesText.textContent = (ch.minutes ? '[' + ch.title + ' · about ' + ch.minutes + ' min' + (st.slide.editorial ? ' · editorial line' : '') + '] ' : '') + (st.slide.notes || '(no notes for this slide)') + (window.DECK_PRIVATE && window.DECK_PRIVATE[st.slide.id] ? '\n\nPRIVATE (offline edition only): ' + window.DECK_PRIVATE[st.slide.id] : '');
    body.dataset.status = st.slide.status || 'draft';
  }
  function writeHash() {
    var st = steps[idx], h = '#/' + (st.c + 1) + '/' + (st.s + 1);
    try { history.replaceState(null, '', location.pathname + location.search + h); } catch (e) {}
  }
  function readHash() {
    var m = /^#\/(\d+)\/(\d+)$/.exec(location.hash);
    if (!m) return -1;
    var c = Math.min(chapters.length, Math.max(1, +m[1])) - 1;
    var s = Math.min(chapters[c].slides.length, Math.max(1, +m[2])) - 1;
    return chapterStart[c] + s;
  }
  function preload(i) {
    [i - 1, i + 1, i + 2].forEach(function (j) {
      var st = steps[j]; if (st && st.slide.image && st.slide.image.src) { var im = new Image(); im.src = st.slide.image.src; }
    });
  }

  // ---- Moving between slides ----------------------------------------------------------------
  var idx = 0, shownIdx = -1;
  function showSlide(i) {
    shownIdx = i;
    slideEl.replaceChildren(buildSlide(steps[i]));
    updateChrome();
  }
  function go(target) {
    target = Math.max(0, Math.min(steps.length - 1, target));
    if (target === idx && shownIdx === idx) return;
    var from = steps[idx], to = steps[target], fromC = from.c, toC = to.c;
    idx = target; writeHash(); updateChrome(); preload(idx);
    var phases;
    if (fromC === toC) {
      phases = [
        { dur: 180, fn: function (u) { setOverlay(1 - u); } },
        { dur: 0, fn: function () { showSlide(target); } },
        { dur: 320, fn: function (u) { setOverlay(u); } }
      ];
    } else {
      var span = Math.abs(toC - fromC), travel = Math.min(3200, 2200 + 350 * (span - 1));
      phases = [
        { dur: 350, fn: function (u) { setOverlay(1 - u); } },
        { dur: travel, fn: function (u) {
            applyPose(travelPose(fromC, toC, u), lerp(fromC, toC, ease(u)));
          } },
        { dur: 0, fn: function () { showSlide(target); } },
        { dur: 450, fn: function (u) { setOverlay(u); } }
      ];
    }
    startAnim(phases);
  }
  var lastInput = 0, started = false, live = false;
  function input(dir) {
    if (!live) return;                         // the loading screen is still up
    var now = performance.now();
    if (now - lastInput < 90) return;          // contact bounce from a clicker
    lastInput = now;
    started = true;
    if (anim) { finishAnim(); return; }         // complete the running animation, do not also advance
    var target = idx + dir;
    if (target < 0 || target >= steps.length) { nudge(dir); return; }
    go(target);
  }
  function jump(target) { if (!live) return; lastInput = performance.now(); started = true; if (anim) finishAnim(); go(target); }
  function nudge(dir) {
    var b = dir > 0 ? btnNext : btnPrev;
    b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump');
  }

  // ---- Keyboard (a clicker is just a keyboard) -----------------------------------------------------
  var NEXT = { ArrowRight: 1, PageDown: 1, ' ': 1, Spacebar: 1, Enter: 1, ArrowDown: 1 };
  var PREV = { ArrowLeft: 1, PageUp: 1, Backspace: 1, ArrowUp: 1 };
  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;      // leave browser shortcuts alone
    var k = e.key;
    if (NEXT[k] || PREV[k]) {
      e.preventDefault();                                 // no page scroll, no button activation
      if (e.repeat) return;                               // a held key advances once
      input(NEXT[k] ? 1 : -1);
      return;
    }
    if (k === 'Home') { e.preventDefault(); jump(0); }
    else if (k === 'End') { e.preventDefault(); jump(steps.length - 1); }
    else if (k === 'f' || k === 'F') { e.preventDefault(); toggleFs(); }
    else if (k === 'i' || k === 'I') { e.preventDefault(); toggleInstant(); }
    else if (k === 'n' || k === 'N') { e.preventDefault(); toggleNotes(); }
    else if (k === 'd' || k === 'D') { e.preventDefault(); toggleDrafts(); }
    else if (k === '?' || k === 'h' || k === 'H') { e.preventDefault(); toggleHelp(); }
    else if (k === 'Escape') { helpEl.hidden = true; }
  }, true);
  window.addEventListener('keyup', function (e) {          // Space activates a focused button on key up
    if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
  }, true);

  // ---- On-screen controls ----------------------------------------------------------------------------
  btnPrev.addEventListener('click', function () { btnPrev.blur(); input(-1); });
  btnNext.addEventListener('click', function () { btnNext.blur(); input(1); });
  btnFs.addEventListener('click', function () { btnFs.blur(); toggleFs(); });
  btnInstant.addEventListener('click', function () { btnInstant.blur(); toggleInstant(); });
  btnNotes.addEventListener('click', function () { btnNotes.blur(); toggleNotes(); });
  $('btn-help').addEventListener('click', function (e) { e.currentTarget.blur(); toggleHelp(); });
  $('help-close').addEventListener('click', function () { helpEl.hidden = true; });

  function toggleFs() {
    var d = document, root = d.documentElement;
    var on = d.fullscreenElement || d.webkitFullscreenElement;
    try {
      var p = on ? (d.exitFullscreen || d.webkitExitFullscreen).call(d) : (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
  function onFs() {
    var on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    body.classList.toggle('is-fullscreen', on);
    btnFs.setAttribute('aria-pressed', on ? 'true' : 'false');
    resize();
  }
  document.addEventListener('fullscreenchange', onFs);
  document.addEventListener('webkitfullscreenchange', onFs);

  function toggleInstant() {
    instant = !instant; store('wr-instant', instant ? '1' : '0');
    btnInstant.setAttribute('aria-pressed', instant ? 'true' : 'false');
    body.classList.toggle('is-instant', instant);
    if (instant && anim) finishAnim();
  }
  function toggleNotes() {
    var on = elNotes.hidden; elNotes.hidden = !on;
    btnNotes.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  function toggleDrafts() {
    showDrafts = !showDrafts; store('wr-drafts', showDrafts ? '1' : '0');
    if (!anim && shownIdx >= 0) showSlide(shownIdx);
  }
  function toggleHelp() { helpEl.hidden = !helpEl.hidden; }

  // The hash is a way in as well as a record: editing it (or following a link to it) jumps to that slide.
  window.addEventListener('hashchange', function () {
    var i = readHash();
    if (i >= 0 && i !== idx) jump(i);
  });
  // Once the talk is under way in fullscreen, a stray Back swipe or shortcut asks before leaving.
  window.addEventListener('beforeunload', function (e) {
    if (started && body.classList.contains('is-fullscreen')) { e.preventDefault(); e.returnValue = ''; }
  });

  // ---- Idle chrome: the controls dim and the cursor hides while presenting ------------------------------------
  var idleTimer = 0;
  function wake() {
    body.classList.remove('is-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { body.classList.add('is-idle'); }, 3500);
  }
  ['mousemove', 'pointerdown', 'touchstart'].forEach(function (n) { window.addEventListener(n, wake, { passive: true }); });
  window.addEventListener('focusin', wake);

  // ---- Size and frame loop -----------------------------------------------------------------------------------------
  function resize() {
    var r = stageEl.getBoundingClientRect();
    if (world) world.setSize(r.width, r.height, window.devicePixelRatio || 1);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stageEl); else window.addEventListener('resize', resize);

  var last = 0, raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
    stepAnim(now);
    if (world) world.render(dt);
  }
  document.addEventListener('visibilitychange', function () { last = 0; });
  window.addEventListener('pagehide', function () { cancelAnimationFrame(raf); if (world) world.dispose(); });

  // ---- Start ---------------------------------------------------------------------------------------------------------------
  btnInstant.setAttribute('aria-pressed', instant ? 'true' : 'false');
  body.classList.toggle('is-instant', instant);
  var fromHash = readHash();
  idx = fromHash >= 0 ? fromHash : 0;
  var startC = steps[idx].c;
  setOverlay(0);
  resize();
  applyPose(idx === 0 && fromHash < 0 ? OVERVIEW : nodePose(startC), startC);
  updateChrome(); writeHash(); preload(idx); wake();
  raf = requestAnimationFrame(frame);

  var loader = $('loader');
  function begin() {
    if (loader) loader.classList.add('is-done');
    live = true;
    var phases = [];
    if (idx === 0 && fromHash < 0) {
      phases.push({ dur: 2400, fn: function (u) { applyPose(lerpPose(OVERVIEW, nodePose(0), ease(u)), 0); } });
    }
    phases.push({ dur: 0, fn: function () { showSlide(idx); } });
    phases.push({ dur: 600, fn: function (u) { setOverlay(u); } });
    startAnim(phases);
  }
  function lerpPose(a, b, t) {
    return { tx: lerp(a.tx, b.tx, t), ty: lerp(a.ty, b.ty, t), tz: lerp(a.tz, b.tz, t), az: lerp(a.az, b.az, t),
             el: lerp(a.el, b.el, t), dist: lerp(a.dist, b.dist, t), anchor: lerp(a.anchor, b.anchor, t) };
  }
  // let the scene draw a couple of frames (and the fonts arrive) before the loading screen lifts
  var ready = function () { requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(begin, instant ? 0 : 500); }); }); };
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1500); })]).then(ready); else ready();

  // exposed for tests and rehearsal
  window.__presentation = { steps: steps, get index() { return idx; }, get busy() { return !!anim; }, get world() { return world; } };
})();
