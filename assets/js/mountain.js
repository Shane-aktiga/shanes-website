/* The 3D landscape hero on the homepage. Needs three.js r128 (assets/js/vendor) and the markup in components/mountain.html. */
(function () {
  'use strict';

  var PATHS = [
    { id: 'work',    kind: 'lamp',
      x: 14, z: -58, delay: 0.6 },
    { id: 'fly',     kind: 'beacon',
      x: -46, z: -94, delay: 1.1 },
    { id: 'play',    kind: 'lamp',
      x: 22, z: -10, delay: 1.75 },
    { id: 'drive',   kind: 'beacon',
      x: 60, z: -106, delay: 3.0 },
    { id: 'build',   kind: 'lamp',
      x: -56, z: -68, delay: 0 },
    { id: 'optimism', kind: 'beacon',
      x: -6, z: -128, delay: 2.1 },
    { id: 'journal', kind: 'beacon',
      x: -12, z: -10, delay: 2.3 }
  ];

  // Names, notes, card copy, images and links come from the page's own HTML (the list inside #fallback),
  // so the words a visitor reads here are the same words a crawler sees.
  (function () {
    PATHS.forEach(function (p) {
      var li = document.querySelector('#fallback-list [data-id="' + p.id + '"]');
      var a = li.querySelector('a.fb-link'), im = li.querySelector('img');
      p.name = li.querySelector('.fb-name').textContent.trim();
      p.note = li.querySelector('.fb-note').textContent.trim();
      p.title = li.querySelector('.fb-title').textContent.trim();
      p.text = li.querySelector('.fb-text').textContent.trim();
      p.url = a.getAttribute('href');
      p.img = im.getAttribute('src');
      p.alt = im.getAttribute('alt');
    });
  })();


  var stage = document.getElementById('stage');
  var canvas = document.getElementById('gl');
  var labelsEl = document.getElementById('labels');
  var cardsEl = document.getElementById('cards');
  var backdrop = document.getElementById('backdrop');
  var hintEl = document.getElementById('hint');
  var resetBtn = document.getElementById('reset');
  var introEl = document.querySelector('.intro');

  var renderer = null;
  try {
    if (typeof THREE === 'undefined') throw new Error('three missing');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (err) {
    stage.classList.add('no-webgl');
    return;
  }
  stage.classList.add('has-scene');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var D2R = Math.PI / 180;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  // ---- Scene, fog, camera -------------------------------------------------
  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x19374F, 55, 300);
  var camera = new THREE.PerspectiveCamera(40, 1, 1, 1500);
  var TARGET = new THREE.Vector3(0, 16, -48);

  // ---- Terrain: parallel Blue Ridge ridges, one continuous heightfield ----
  var RZ = [-176, -130, -92, -58, -26, 4];
  var RA = [32, 29, 24, 20, 15, 10];
  var RS = [18, 17, 16, 15, 14, 13];
  function ridgeN(x, k) {
    return 0.5 + 0.5 * (Math.sin(x * 0.021 + k * 1.7) * 0.44 + Math.sin(x * 0.047 + k * 3.1) * 0.28 +
      Math.sin(x * 0.093 + k * 5.3) * 0.16 + Math.sin(x * 0.19 + k * 2.3) * 0.08 + Math.sin(x * 0.37 + k * 4.1) * 0.04);
  }
  // Summits: x, z, height, radius. A few sit near the beacons, the rest fill out the ranges.
  var PEAKS = [
    [-46, -96, 11, 13], [-4, -130, 11, 14], [58, -104, 10, 13], [14, -60, 8, 11], [-56, -68, 8, 11],
    [-118, -110, 11, 16], [112, -82, 10, 15], [-88, -68, 7, 11], [92, -40, 6, 11], [4, -160, 11, 17],
    [-62, -150, 10, 15], [72, -148, 10, 16], [150, -120, 10, 16], [-152, -62, 7, 13], [30, -22, 4, 9], [-30, 8, 4, 10]
  ];
  function H(x, z) {
    var h = 0, k, zc, d;
    for (k = 0; k < RZ.length; k++) {
      zc = RZ[k] + 7 * Math.sin(x * 0.018 + k * 2.1) + 3 * Math.sin(x * 0.05 + k);
      d = (z - zc) / RS[k];
      h += RA[k] * (0.4 + 0.6 * ridgeN(x, k)) * Math.exp(-Math.pow(Math.abs(d), 1.45) * 1.1);
    }
    var q, dx, dz;
    for (q = 0; q < PEAKS.length; q++) {
      dx = x - PEAKS[q][0]; dz = z - PEAKS[q][1];
      h += PEAKS[q][2] * Math.exp(-(dx * dx + dz * dz) / (2 * PEAKS[q][3] * PEAKS[q][3]));
    }
    h += 2.0 + 1.6 * (Math.sin(x * 0.045 + z * 0.03 + 1.0) * Math.sin(z * 0.05 - x * 0.02 + 2.0) + 0.5 * Math.sin(x * 0.09 - z * 0.075));
    h += 0.9 * Math.sin(x * 0.13 + z * 0.07) * Math.sin(z * 0.11 - x * 0.05);
    var e = smooth(0, 1, (250 - Math.abs(x)) / 70);
    return Math.max(0, h) * e;
  }

  var RC = ['#2A4F6A', '#1E3D58', '#15304A', '#0F263B', '#0A1B2A', '#05101A'].map(function (c) { return new THREE.Color(c); });
  var terrainGeo = new THREE.PlaneGeometry(540, 380, 270, 190);
  terrainGeo.rotateX(-Math.PI / 2);
  terrainGeo.translate(0, 0, -60);
  (function buildTerrain() {
    var pos = terrainGeo.attributes.position;
    var n = pos.count, i;
    for (i = 0; i < n; i++) pos.setY(i, H(pos.getX(i), pos.getZ(i)));
    terrainGeo.computeVertexNormals();
    var nor = terrainGeo.attributes.normal;
    var col = new Float32Array(n * 3);
    var c = new THREE.Color();
    var L = new THREE.Vector3(-0.35, 0.8, 0.45).normalize();
    for (i = 0; i < n; i++) {
      var z = pos.getZ(i), k = 0;
      while (k < RZ.length - 2 && z > RZ[k + 1]) k++;
      var u = clamp((z - RZ[k]) / (RZ[k + 1] - RZ[k]), 0, 1);
      c.copy(RC[k]).lerp(RC[k + 1], smooth(0.3, 0.7, u));
      var dot = nor.getX(i) * L.x + nor.getY(i) * L.y + nor.getZ(i) * L.z;
      var shade = 0.8 + 0.34 * clamp(dot, 0, 1);
      col[i * 3] = c.r * shade; col[i * 3 + 1] = c.g * shade; col[i * 3 + 2] = c.b * shade;
    }
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  })();
  var terrainMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  terrainMat.extensions = { derivatives: true };
  // Contour lines at fixed heights, one pixel wide, fading out where they bunch up.
  // They are mixed into the base color before fog, so distant lines dissolve with the haze.
  var CONTOUR = [
    'float cf = vHeight / 1.5;',
    'float cw = max(fwidth(cf), 0.0001);',
    'float cd = abs(fract(cf - 0.5) - 0.5) / cw;',
    'float cl = 1.0 - smoothstep(0.35, 1.25, cd);',
    'float cd5 = abs(fract(cf / 5.0 - 0.5) - 0.5) * 5.0 / cw;',
    'float cl5 = 1.0 - smoothstep(0.45, 1.5, cd5);',
    'float cfade = (1.0 - smoothstep(0.3, 0.6, cw)) * smoothstep(0.3, 1.2, vHeight);',
    'float ca = (cl * 0.04 + cl5 * 0.075) * cfade;',
    'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.80, 0.92), ca);'
  ].join('\n');
  terrainMat.onBeforeCompile = function (sh) {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vHeight;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHeight = position.y;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vHeight;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + CONTOUR);
  };
  var terrain = new THREE.Mesh(terrainGeo, terrainMat);
  scene.add(terrain);

  // ---- Sky dome with the warm horizon light --------------------------------
  var skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uDrop: { value: 0 } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'varying vec3 vDir; uniform float uDrop;',
      'vec3 sky(float s){',
      '  vec3 a = vec3(0.005,0.013,0.040); vec3 b = vec3(0.014,0.040,0.088);',
      '  vec3 c = vec3(0.034,0.088,0.158); vec3 d = vec3(0.068,0.158,0.248); vec3 e = vec3(0.098,0.215,0.310);',
      '  if (s < 0.28) return mix(a, b, s / 0.28);',
      '  if (s < 0.5)  return mix(b, c, (s - 0.28) / 0.22);',
      '  if (s < 0.72) return mix(c, d, (s - 0.5) / 0.22);',
      '  return mix(d, e, (s - 0.72) / 0.28);',
      '}',
      'void main(){',
      '  vec3 d = normalize(vDir);',
      '  float h = d.y + uDrop;',
      '  float s = pow(1.0 - clamp((h + 0.01) / 0.34, 0.0, 1.0), 2.5);',
      '  vec3 col = sky(s);',
      '  float az = atan(d.x, -d.z);',
      '  float g = exp(-pow((az - 0.05) / 0.6, 2.0)) * exp(-pow((h - 0.0) / 0.04, 2.0));',
      '  col = mix(col, vec3(0.95, 0.67, 0.41), g * 0.34);',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n')
  });
  var skyGeo = new THREE.SphereGeometry(900, 32, 16);
  var sky = new THREE.Mesh(skyGeo, skyMat);
  sky.renderOrder = -10;
  scene.add(sky);

  // ---- Textures ------------------------------------------------------------
  var textures = [];
  function canvasTex(size, draw) {
    var c = document.createElement('canvas'); c.width = c.height = size;
    draw(c.getContext('2d'), size);
    var t = new THREE.CanvasTexture(c); textures.push(t); return t;
  }
  function radial(size, stops) {
    return canvasTex(size, function (g, s) {
      var gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      stops.forEach(function (st) { gr.addColorStop(st[0], st[1]); });
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
    });
  }
  var glowTex = radial(128, [[0, 'rgba(255,255,255,0.95)'], [0.2, 'rgba(255,255,255,0.4)'], [0.55, 'rgba(255,255,255,0.08)'], [1, 'rgba(255,255,255,0)']]);
  var ringTex = canvasTex(128, function (g, s) {
    g.strokeStyle = '#fff'; g.lineWidth = s * 0.014; g.beginPath(); g.arc(s / 2, s / 2, s * 0.46, 0, Math.PI * 2); g.stroke();
  });
  var ringThickTex = canvasTex(128, function (g, s) {
    g.strokeStyle = '#fff'; g.lineWidth = s * 0.04; g.beginPath(); g.arc(s / 2, s / 2, s * 0.46, 0, Math.PI * 2); g.stroke();
  });
  var cloudTex = radial(128, [[0, 'rgba(159,185,204,0.30)'], [0.7, 'rgba(159,185,204,0.09)'], [1, 'rgba(159,185,204,0)']]);
  var moonGlowTex = radial(128, [[0, 'rgba(220,234,244,0.42)'], [0.55, 'rgba(168,198,218,0.10)'], [1, 'rgba(168,198,218,0)']]);
  var moonDiscTex = canvasTex(64, function (g, s) {
    g.fillStyle = 'rgba(234,243,249,0.88)'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.46, 0, Math.PI * 2); g.fill();
  });

  // ---- Sky furniture: stars, moon, a slow cloud bank -----------------------
  var starGeo = new THREE.BufferGeometry();
  (function () {
    var N = 760, p = new Float32Array(N * 3), c = new Float32Array(N * 3), i;
    for (i = 0; i < N; i++) {
      var h = 0.012 + Math.pow(Math.random(), 1.35) * 0.5;
      var th = Math.random() * Math.PI * 2;
      var r = Math.sqrt(1 - h * h);
      p[i * 3] = Math.cos(th) * r * 850; p[i * 3 + 1] = h * 850; p[i * 3 + 2] = Math.sin(th) * r * 850;
      var b = 0.42 + Math.random() * 0.58;
      c[i * 3] = 0.84 * b; c[i * 3 + 1] = 0.91 * b; c[i * 3 + 2] = 0.96 * b;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  })();
  var starMat = new THREE.PointsMaterial({ size: 2.0, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, fog: false });
  var stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  var moonGlowMat = new THREE.SpriteMaterial({ map: moonGlowTex, transparent: true, depthWrite: false, fog: false });
  var moonDiscMat = new THREE.SpriteMaterial({ map: moonDiscTex, transparent: true, depthWrite: false, fog: false });
  var moonGlow = new THREE.Sprite(moonGlowMat), moonDisc = new THREE.Sprite(moonDiscMat);
  var moonDir = new THREE.Vector3();
  var moon = { x: 0, y: 0, glow: 160, disc: 27 };
  scene.add(moonGlow); scene.add(moonDisc);

  var clouds = [];
  var cloudMat = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false });
  [[-120, 26, 190, 26], [-30, 31, 160, 22], [70, 24, 210, 28], [150, 30, 170, 24]].forEach(function (c, i) {
    var s = new THREE.Sprite(cloudMat);
    s.position.set(c[0], c[1], -170); s.scale.set(c[2], c[3], 1);
    s.userData.x0 = c[0]; s.userData.ph = i * 1.7;
    scene.add(s); clouds.push(s);
  });

  // ---- The seven beacons ---------------------------------------------------
  var COL = { lamp: new THREE.Color('#FFC46B'), beacon: new THREE.Color('#8FE3C8') };
  var coreGeo = new THREE.SphereGeometry(0.5, 20, 14);
  var hitGeo = new THREE.SphereGeometry(4.2, 8, 6);
  var hitMat = new THREE.MeshBasicMaterial({ visible: false });
  var beacons = [];
  PATHS.forEach(function (p, i) {
    var col = COL[p.kind];
    var g = new THREE.Group();
    var core = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: col, fog: false, depthTest: false, transparent: true }));
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false }));
    var ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, color: col, transparent: true, opacity: 0, depthWrite: false, depthTest: false, fog: false }));
    var hit = new THREE.Mesh(hitGeo, hitMat);
    hit.userData.index = i;
    glow.scale.set(7, 7, 1);
    glow.renderOrder = 10; ring.renderOrder = 11; core.renderOrder = 12;
    g.add(glow); g.add(ring); g.add(core); g.add(hit);
    scene.add(g);
    var gm = function (tex, op) {
      return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col, transparent: true, opacity: op, depthWrite: false, depthTest: false, fog: false }));
    };
    var inner = gm(ringThickTex, 0.7), outer = gm(ringTex, 0.34);
    inner.renderOrder = 8; outer.renderOrder = 7;
    scene.add(inner); scene.add(outer);
    // a faint stem from the ring up to the sphere, so the light reads as standing on its spot
    var stemGeo = new THREE.BufferGeometry();
    stemGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    var stem = new THREE.Line(stemGeo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.4, depthWrite: false, depthTest: false, fog: false }));
    stem.renderOrder = 9; stem.frustumCulled = false;
    scene.add(stem);
    beacons.push({ stem: stem, g: g, core: core, glow: glow, ring: ring, hit: hit, gr: [inner, outer], hv: 0, sx: 0, sy: 0, vis: false, dist: 100 });
  });
  // sx squeezes the layout sideways on narrow screens; zs spreads it in depth on tall ones,
  // which puts the near paths lower and the far ones higher so labels get more room.
  function placeBeacons(sx, zs) {
    PATHS.forEach(function (p, i) {
      var x = p.x * sx, z = -40 + (p.z + 40) * zs, b = beacons[i], gh = H(x, z);
      b.g.position.set(x, gh + 2.6, z);
      b.gy = gh + 0.4;
      b.gr[0].position.set(x, b.gy, z); b.gr[1].position.copy(b.gr[0].position);
    });
  }

  // ---- HTML labels (real buttons) and cards --------------------------------
  var labelBtns = [], cards = [], labelTxt = [];
  PATHS.forEach(function (p, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'wp'; b.dataset.kind = p.kind;
    b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'card-' + p.id);
    b.innerHTML = '<span class="wp__hit" aria-hidden="true"></span><span class="wp__text"><span class="wp__name"></span><span class="wp__note"></span></span>';
    b.querySelector('.wp__name').textContent = p.name;
    b.querySelector('.wp__note').textContent = p.note;
    labelsEl.appendChild(b); labelBtns.push(b);

    var c = document.createElement('div');
    c.className = 'card'; c.id = 'card-' + p.id; c.dataset.kind = p.kind; c.dataset.open = 'false';
    c.setAttribute('role', 'region'); c.setAttribute('aria-label', p.name);
    c.innerHTML =
      '<img class="card__media" width="960" height="540" loading="lazy" alt="">' +
      '<div class="card__body"><p class="card__kicker"></p><h2 class="card__title"></h2><p class="card__text"></p>' +
      '<a class="card__link"></a></div>' +
      '<button class="card__close" type="button" aria-label="Close"><span aria-hidden="true">×</span></button>';
    var img = c.querySelector('img');
    img.alt = p.alt; img.src = p.img;
    c.querySelector('.card__kicker').textContent = p.name;
    c.querySelector('.card__title').textContent = p.title;
    c.querySelector('.card__text').textContent = p.text;
    var a = c.querySelector('a.card__link');
    a.href = p.url; a.textContent = p.name + ' →'; a.setAttribute('aria-label', 'Go to ' + p.name);
    c.querySelector('.card__close').addEventListener('click', function () { closeCard(); });
    cardsEl.appendChild(c); cards.push(c);

    b.addEventListener('click', function (e) {
      if (current === i) closeCard(); else openCard(i, e.detail === 0);
    });
    b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') labelHover[i] = true; });
    b.addEventListener('pointerleave', function () { labelHover[i] = false; });
    b.addEventListener('focus', function () { labelFocus[i] = true; });
    b.addEventListener('blur', function () { labelFocus[i] = false; });
  });

  var current = -1, lastOpener = -1, openedByKey = false;
  var labelHover = [], labelFocus = [], rayHover = -1;
  var sheetMQ = window.matchMedia('(max-width: 899px)');

  function openCard(i, byKey) {
    if (current === i) return;
    if (current >= 0) closeCard(true);
    current = i; openedByKey = !!byKey;
    cards[i].dataset.open = 'true';
    labelBtns[i].setAttribute('aria-expanded', 'true');
    backdrop.classList.toggle('is-on', sheetMQ.matches);
    placeCard();
    if (byKey) {
      var link = cards[i].querySelector('a.card__link');
      setTimeout(function () { try { link.focus({ preventScroll: true }); } catch (e) {} }, 30);
    }
  }
  function closeCard(silent) {
    if (current < 0) return;
    var i = current; current = -1;
    cards[i].dataset.open = 'false';
    labelBtns[i].setAttribute('aria-expanded', 'false');
    backdrop.classList.remove('is-on');
    if (!silent && openedByKey) { try { labelBtns[i].focus({ preventScroll: true }); } catch (e) {} }
    openedByKey = false;
  }
  backdrop.addEventListener('click', function () { closeCard(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCard(); });

  var W = 1, Hh = 1;
  function placeCard() {
    if (current < 0 || sheetMQ.matches) { if (current >= 0) { cards[current].style.left = ''; cards[current].style.top = ''; } return; }
    var c = cards[current], b = beacons[current];
    var w = c.offsetWidth, h = c.offsetHeight;
    var left = b.sx + 34; if (left + w > W - 12) left = b.sx - 34 - w;
    left = clamp(left, 12, Math.max(12, W - w - 12));
    var top = clamp(b.sy - 50, 56, Math.max(56, Hh - h - 12));
    c.style.left = left + 'px'; c.style.top = top + 'px';
  }

  // ---- Camera state and guided orbit ----------------------------------------
  var DEF = { az: 0, el: 14, dist: 92 };
  var LIM = { az: 40, elMin: 5, elMax: 26, dMin: 62, dMax: 125 };
  var tgt = { az: 0, el: DEF.el, dist: DEF.dist };
  var cur = { az: 0, el: DEF.el, dist: DEF.dist };
  var autoOn = !reduced.matches, phase = 0, AMP = 7, PERIOD = 80;
  var userMoved = false, resetAnim = null;

  // The moon sits in the free sky beside the headline when there is room, and
  // under it on narrow screens, so it never lands behind the type.
  function layoutMoon() {
    var sr = stage.getBoundingClientRect(), ir = introEl.getBoundingClientRect();
    var glow = clamp(W * 0.15, 136, 208), disc = glow * 0.17;
    var gutter = ir.left - sr.left, x, y;
    if (gutter >= disc + 64) {
      x = Math.max(disc / 2 + 24, Math.min(gutter * 0.5, W * 0.17));
      y = ir.top - sr.top + ir.height * 0.4;
    } else {
      x = clamp(W * 0.22, glow * 0.5, W - glow * 0.5);
      y = ir.bottom - sr.top + disc / 2 + glow * 0.16 + 14;
    }
    moon.x = x; moon.y = y; moon.glow = glow; moon.disc = disc;
    stage.dataset.moon = [x, y, disc, glow].map(Math.round).join(',');
  }

  function applyLayout() {
    var aspect = W / Hh;
    var portrait = aspect < 1;
    camera.fov = portrait ? 52 : 40;
    camera.aspect = aspect;
    var f = portrait ? 1.3 * clamp(0.55 / aspect, 1, 1.4) : (aspect < 1.5 ? 1.12 : 1);   // very tall screens pull back to keep every path in view
    DEF.dist = 92 * f; LIM.dMin = 44 * f; LIM.dMax = 190 * f;
    var tall = clamp((1.5 - aspect) / 0.7, 0, 1);   // 0 on desktop shapes, 1 on phones and portrait tablets
    DEF.el = 8 + 10 * tall;                          // a higher camera spreads the paths out vertically
    LIM.elMin = 3; LIM.elMax = portrait ? 32 : 26;
    // slide the picture down: on short windows to clear the headline, on tall ones to keep the sky
    var drop = Math.max(Hh < 700 ? (700 - Hh) * 0.8 : 0, tall * 0.1 * Hh) + (W < 900 ? 36 : 0);   // on phones the headline sits lower, under the site header
    if (drop) camera.setViewOffset(W, Hh, 0, -drop, W, Hh); else camera.clearViewOffset();
    skyMat.uniforms.uDrop.value = 0.05 * tall;   // on tall screens the ridges sit lower, so the horizon glow follows them down
    camera.updateProjectionMatrix();
    placeBeacons(clamp(aspect / 1.6, 0.26, 1) * (portrait ? 1 : 0.84), 1);
    layoutMoon();
    if (!userMoved && !resetAnim) { tgt.dist = DEF.dist; tgt.el = DEF.el; cur.dist = DEF.dist; cur.el = DEF.el; }
    else { tgt.dist = clamp(tgt.dist, LIM.dMin, LIM.dMax); }
  }

  function takeControl() {
    if (autoOn) { tgt.az += AMP * Math.sin(phase); autoOn = false; phase = 0; }
    resetAnim = null; userMoved = true;
    hintEl.classList.add('is-gone');
  }
  function clampTargets() {
    tgt.az = clamp(tgt.az, -LIM.az, LIM.az);
    tgt.el = clamp(tgt.el, LIM.elMin, LIM.elMax);
    tgt.dist = clamp(tgt.dist, LIM.dMin, LIM.dMax);
  }
  function startReset() {
    resetAnim = { t: 0, dur: reduced.matches ? 0.01 : 1.2, az: tgt.az, el: tgt.el, dist: tgt.dist };
    resetBtn.classList.remove('is-on');
    hintEl.classList.remove('is-gone');   // the how-to line comes back with the reset view
  }
  resetBtn.addEventListener('click', startReset);

  // ---- Pointer input ----------------------------------------------------------
  var ptrs = {}, nptr = 0, drag = null, pinchD = 0;
  var raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pickAt(cx, cy) {
    var r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    var hits = raycaster.intersectObjects(beacons.map(function (b) { return b.hit; }), false);
    return hits.length ? hits[0].object.userData.index : -1;
  }
  function pdist() {
    var ids = Object.keys(ptrs); if (ids.length < 2) return 0;
    var a = ptrs[ids[0]], b = ptrs[ids[1]];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  // Listening on the whole stage (not just the canvas) means a drag or a pinch still works when a finger
  // lands on a label. Cards and buttons keep their own taps.
  function onScene(e) { return !e.target.closest('.card, .zoom, .reset, .backdrop'); }
  stage.addEventListener('pointerdown', function (e) {
    if (!onScene(e)) return;
    if (e.target === canvas) { try { canvas.setPointerCapture(e.pointerId); } catch (x) {} }
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; nptr++;
    if (nptr === 1) drag = { sx: e.clientX, sy: e.clientY, t: performance.now(), moved: false };
    else if (nptr === 2) { pinchD = pdist(); if (drag) drag.moved = true; takeControl(); }
  });
  stage.addEventListener('pointermove', function (e) {
    var p = ptrs[e.pointerId];
    if (!p) {
      if (e.pointerType === 'mouse' && e.target === canvas) { rayHover = pickAt(e.clientX, e.clientY); canvas.style.cursor = rayHover >= 0 ? 'pointer' : ''; }
      return;
    }
    var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (nptr >= 2) {
      var nd = pdist();
      if (pinchD > 0 && nd > 0) { tgt.dist *= Math.pow(pinchD / nd, 1.9); pinchD = nd; clampTargets(); }
    } else if (drag) {
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) {
        // a finger moving mostly up or down is scrolling the page, so the scene leaves it alone
        if (e.pointerType === 'touch' && Math.abs(e.clientY - drag.sy) > Math.abs(e.clientX - drag.sx)) { drag.scroll = true; }
        else { drag.moved = true; takeControl(); canvas.classList.add('is-dragging'); }
      }
      if (drag.moved) {
        tgt.az -= dx * 0.16;
        if (e.pointerType !== 'touch') tgt.el += dy * 0.1;   // on touch, up and down is for scrolling
        clampTargets();
      }
    }
  });
  function endPtr(e) {
    if (!ptrs[e.pointerId]) return;
    delete ptrs[e.pointerId]; nptr = Math.max(0, nptr - 1);
    canvas.classList.remove('is-dragging');
    if (nptr === 0 && drag) {
      if (e.type === 'pointerup' && !drag.moved && !drag.scroll && e.target === canvas && performance.now() - drag.t < 600) {
        var i = pickAt(e.clientX, e.clientY);
        if (i >= 0) { if (current === i) closeCard(); else openCard(i, false); } else closeCard();
      }
      drag = null;
    } else if (nptr === 1) { drag = { sx: 0, sy: 0, t: 0, moved: true }; pinchD = 0; }
  }
  stage.addEventListener('pointerup', endPtr);
  stage.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !ptrs[e.pointerId]) { rayHover = -1; canvas.style.cursor = ''; } });
  // The wheel belongs to the page: plain up and down scrolling moves down the site.
  // Only two gestures are taken: a trackpad pinch (which browsers report as ctrl + wheel) zooms,
  // and a mostly sideways swipe turns the view.
  canvas.addEventListener('wheel', function (e) {
    if (e.ctrlKey) {
      e.preventDefault(); takeControl();
      var dy = clamp(e.deltaY * (e.deltaMode === 1 ? 16 : 1), -120, 120);
      tgt.dist *= Math.exp(dy * 0.011);
      clampTargets();
    } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5) {
      e.preventDefault(); takeControl();
      tgt.az += clamp(e.deltaX, -60, 60) * 0.05;
      clampTargets();
    }
  }, { passive: false });
  // Safari on a Mac reports a trackpad pinch as gesture events instead.
  var gBase = 0;
  canvas.addEventListener('gesturestart', function (e) { e.preventDefault(); gBase = tgt.dist; });
  canvas.addEventListener('gesturechange', function (e) {
    e.preventDefault();
    if (nptr > 0 || !(e.scale > 0)) return;
    takeControl(); tgt.dist = gBase / e.scale; clampTargets();
  });
  // the chevron: scroll on down past the scene to the page's first section
  document.getElementById('cue').addEventListener('click', function () {
    var top = railEl.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo({ top: top, behavior: reduced.matches ? 'auto' : 'smooth' });
  });
  function zoomBy(f) { takeControl(); tgt.dist *= f; clampTargets(); }
  document.getElementById('zoom-in').addEventListener('click', function () { zoomBy(1 / 1.22); });
  document.getElementById('zoom-out').addEventListener('click', function () { zoomBy(1.22); });
  stage.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === '+' || k === '=' || k === '-' || k === '_') {
      takeControl();
      if (k === 'ArrowLeft') tgt.az -= 4;
      else if (k === 'ArrowRight') tgt.az += 4;
      else if (k === '-' || k === '_') tgt.dist *= 1.15;
      else tgt.dist /= 1.15;
      clampTargets();
    }
  });

  // ---- Sizing -------------------------------------------------------------------
  function resize() {
    var r = stage.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); Hh = Math.max(1, Math.round(r.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, Hh, false);
    applyLayout();
  }
  var ro = ('ResizeObserver' in window) ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(stage); else window.addEventListener('resize', resize);
  sheetMQ.addEventListener && sheetMQ.addEventListener('change', function () {
    backdrop.classList.toggle('is-on', sheetMQ.matches && current >= 0);
    placeCard();
  });
  reduced.addEventListener && reduced.addEventListener('change', function () {
    if (reduced.matches) { autoOn = false; } else if (!userMoved) { autoOn = true; }
  });

  // ---- Frame loop ----------------------------------------------------------------
  var tmp = new THREE.Vector3();
  var running = true, raf = 0, last = 0, T = 0, onScreen = true;

  // ---- The rail: scrolling the page glides the camera forward -----------------
  // The stage is pinned inside a tall box (#rail). How far through that box the page has scrolled
  // (0 to 1) moves the camera along a short path: nearer, a little lower, deeper into the valley.
  var railEl = document.getElementById('rail'), railCur = 0, railGoal = 0, lastRp = 0;
  function readRail() {
    if (reduced.matches || !railEl) return 0;
    var span = railEl.offsetHeight - stage.offsetHeight;
    return span > 0 ? clamp(-railEl.getBoundingClientRect().top / span, 0, 1) : 0;
  }
  var RAIL = { dist: 0.12, drop: 2, forward: 8, lower: 1 };

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!running) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now; T += dt;

    // automatic drift: camera moves, terrain stays put. Held still while a card is open.
    if (autoOn && !reduced.matches && current < 0) phase += dt * Math.PI * 2 / PERIOD;
    var azAuto = autoOn ? AMP * Math.sin(phase) : 0;

    if (resetAnim) {
      resetAnim.t += dt;
      var u = clamp(resetAnim.t / resetAnim.dur, 0, 1), e = u * u * (3 - 2 * u);
      tgt.az = resetAnim.az * (1 - e); tgt.el = resetAnim.el + (DEF.el - resetAnim.el) * e; tgt.dist = resetAnim.dist + (DEF.dist - resetAnim.dist) * e;
      if (u >= 1) { resetAnim = null; tgt.az = 0; tgt.el = DEF.el; tgt.dist = DEF.dist; userMoved = false; autoOn = !reduced.matches; phase = 0; }
    }
    var k = reduced.matches ? 1 : 1 - Math.exp(-dt * 6);
    cur.az += (tgt.az + azAuto - cur.az) * k;
    cur.el += (tgt.el - cur.el) * k;
    cur.dist += (tgt.dist - cur.dist) * k;

    railGoal = readRail();
    railCur += (railGoal - railCur) * (reduced.matches ? 1 : 1 - Math.exp(-dt * 12));
    var rp = railCur * railCur * (3 - 2 * railCur);          // eased, so the glide starts and ends gently
    if (current >= 0 && Math.abs(rp - lastRp) > 0.004) closeCard();   // scrolling on closes an open card
    lastRp = rp;
    hintEl.classList.toggle('is-away', rp > 0.03);
    stage.classList.toggle('is-scrolled', rp > 0.03 || window.scrollY > 40);
    introEl.style.opacity = (1 - clamp(rp * 2.6, 0, 1)).toFixed(3);
    stage.style.setProperty('--fade', rp.toFixed(3));   // melts the scene's bottom edge into the page as it scrolls away

    var a = cur.az * D2R, el = (cur.el - RAIL.drop * rp) * D2R, rd = cur.dist * (1 - RAIL.dist * rp);
    var tx = TARGET.x, ty = TARGET.y - RAIL.lower * rp, tz = TARGET.z - RAIL.forward * rp;
    camera.position.set(
      tx + rd * Math.cos(el) * Math.sin(a),
      ty + rd * Math.sin(el),
      tz + rd * Math.cos(el) * Math.cos(a));
    // never let the camera dip under the terrain
    var floorY = H(camera.position.x, camera.position.z) + 3.5;
    if (camera.position.y < floorY) camera.position.y = floorY;
    camera.lookAt(tx, ty, tz);
    camera.updateMatrixWorld();
    sky.position.copy(camera.position); stars.position.copy(camera.position);

    // moon: placed on screen, with a little parallax so it still feels far away
    var mx = (moon.x / W) * 2 - 1 + (cur.az / LIM.az) * 0.12;
    var my = 1 - (moon.y / Hh) * 2 + (cur.el - DEF.el) * 0.012;
    moonDir.set(mx, my, 0.5).unproject(camera).sub(camera.position).normalize();
    moonGlow.position.copy(camera.position).addScaledVector(moonDir, 800);
    moonDisc.position.copy(moonGlow.position);
    var unit = 2 * Math.tan(camera.fov * D2R / 2) * 800 / Hh;
    moonGlow.scale.set(moon.glow * unit, moon.glow * unit, 1);
    moonDisc.scale.set(moon.disc * unit, moon.disc * unit, 1);

    // reset button only after the visitor has moved away from the default view
    var away = userMoved && !resetAnim && (Math.abs(tgt.az) > 1.5 || Math.abs(tgt.el - DEF.el) > 1.5 || Math.abs(tgt.dist - DEF.dist) > 3);
    resetBtn.classList.toggle('is-on', away);

    // clouds drift very slowly
    for (var ci = 0; ci < clouds.length; ci++) {
      var cs = clouds[ci];
      cs.position.x = cs.userData.x0 + (reduced.matches ? 0 : Math.sin(T * 0.035 + cs.userData.ph) * 14);
    }

    // beacons: size, pulse, glow, hover, and label projection
    for (var i = 0; i < beacons.length; i++) {
      var b = beacons[i];
      var d = camera.position.distanceTo(b.g.position);
      b.dist = d;
      var s = Math.pow(d / 98, 0.8);
      var want = (rayHover === i || labelHover[i] || labelFocus[i] || current === i) ? 1 : 0;
      b.hv += (want - b.hv) * (1 - Math.exp(-dt * 10));
      b.g.scale.setScalar(s);
      b.core.scale.setScalar(1 + 0.35 * b.hv);
      b.glow.material.opacity = 0.55 + 0.3 * b.hv;
      var pp = 0, pe = 0, ph0 = 0;   // ground ring pulse, in step with the sphere's pulse ring
      b.glow.scale.set(7 + 2.4 * b.hv, 7 + 2.4 * b.hv, 1);
      if (reduced.matches) { b.ring.material.opacity = 0; }
      else {
        var ph = (((T - PATHS[i].delay) % 4.5) + 4.5) % 4.5 / 4.5;
        var sc = 2 * (0.6 + 1.8 * (1 - Math.pow(1 - ph, 4)));
        b.ring.scale.set(sc, sc, 1);
        b.ring.material.opacity = ph < 0.35 ? 0.55 * (ph / 0.35) : 0.55 * (1 - (ph - 0.35) / 0.65);
        pp = ph < 0.35 ? ph / 0.35 : 1 - (ph - 0.35) / 0.65;
        pe = 1 - Math.pow(1 - ph, 4);
        ph0 = ph;
      }
      b.gr[0].material.opacity = 0.62 + 0.3 * b.hv + 0.2 * pp;
      // the outer ring is a ripple: it leaves the inner circle, widens, fades to nothing, and starts again
      var ripOp = reduced.matches ? 0.3 : 0.62 * Math.pow(1 - ph0, 1.6) * Math.min(1, ph0 / 0.05);
      b.gr[1].material.opacity = ripOp * (1 + 0.5 * b.hv);
      tmp.copy(b.g.position).project(camera);
      b.vis = tmp.z < 1;
      b.sx = (tmp.x * 0.5 + 0.5) * W; b.sy = (-tmp.y * 0.5 + 0.5) * Hh;
      // the ground ring is a flat ellipse, squashed by how low we are looking, so it reads as lying on the ground
      var gp = b.gr[0].position;
      var elv = Math.atan2(camera.position.y - gp.y, Math.hypot(camera.position.x - gp.x, camera.position.z - gp.z));
      // ring size grows gently with distance, so far rings still shrink on screen but less sharply than perspective alone
      b.rr = 1.75 * Math.pow(d / 98, 0.6);
      var asp = clamp(Math.sin(elv) * 1.7, 0.24, 0.9), dia = 2 * b.rr / 0.92;
      b.gr[0].scale.set(dia, dia * asp, 1);
      var rip = reduced.matches ? 1.7 : 1 + 0.95 * (1 - Math.pow(1 - ph0, 3));   // from the circle's own size out to about 1.95x
      b.gr[1].scale.set(dia * rip, dia * rip * asp, 1);
      // stem: from the ring centre up to the underside of the sphere
      var sp = b.stem.geometry.attributes.position.array;
      sp[0] = gp.x; sp[1] = gp.y; sp[2] = gp.z;
      sp[3] = b.g.position.x; sp[4] = b.g.position.y - 0.62 * s; sp[5] = b.g.position.z;
      b.stem.geometry.attributes.position.needsUpdate = true;
      b.stem.material.opacity = 0.34 + 0.25 * b.hv + 0.12 * pp;
      // the label hangs just under the ring, so sphere, ring and name read as one marker
      tmp.copy(gp).project(camera);
      var ppu = Hh / (2 * Math.tan(camera.fov * D2R / 2) * d);
      if (!labelTxt[i]) labelTxt[i] = labelBtns[i].querySelector('.wp__text');
      labelTxt[i].style.marginTop = clamp((-tmp.y * 0.5 + 0.5) * Hh - b.sy + b.rr * 1.7 * asp * ppu + 6, 16, 170).toFixed(1) + 'px';
      var btn = labelBtns[i];
      btn.style.transform = 'translate3d(' + b.sx.toFixed(1) + 'px,' + b.sy.toFixed(1) + 'px,0)';
      btn.style.visibility = b.vis ? '' : 'hidden';
      btn.classList.toggle('is-lit', want === 1);
    }
    if (current >= 0) placeCard();
    renderer.render(scene, camera);
  }

  document.addEventListener('visibilitychange', function () { running = !document.hidden && onScreen; last = 0; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; running = onScreen && !document.hidden; last = 0; }).observe(stage);
  }

  // ---- Cleanup -------------------------------------------------------------------
  function dispose() {
    cancelAnimationFrame(raf); running = false;
    if (ro) ro.disconnect();
    scene.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.dispose(); }); }
    });
    textures.forEach(function (t) { t.dispose(); });
    renderer.dispose();
    try { renderer.forceContextLoss(); } catch (e) {}
  }
  window.addEventListener('pagehide', dispose);

  resize();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutMoon);
  raf = requestAnimationFrame(frame);
  // drop the loading screen once the scene has drawn a couple of frames (and it has been up long enough to read)
  var loaderEl = document.getElementById('loader'), loadStart = performance.now();
  var perfStart = performance.now();
  requestAnimationFrame(function () { requestAnimationFrame(function () {
    var ready = performance.now();
    showPerf(ready);
    setTimeout(function () { loaderEl.classList.add('is-done'); }, Math.max(0, 900 - (performance.now() - loadStart)));
  }); });

  // Add ?perf=1 to the address for a timing readout. Everything is measured from the start of navigation.
  function showPerf(sceneReadyAt) {
    var out = { sceneReadyMs: Math.round(sceneReadyAt) };
    try {
      var nav = performance.getEntriesByType('navigation')[0];
      if (nav) { out.responseEndMs = Math.round(nav.responseEnd); out.domContentLoadedMs = Math.round(nav.domContentLoadedEventEnd); out.loadMs = Math.round(nav.loadEventEnd); }
      performance.getEntriesByType('paint').forEach(function (e) { out[e.name === 'first-contentful-paint' ? 'firstContentfulPaintMs' : 'firstPaintMs'] = Math.round(e.startTime); });
      performance.getEntriesByType('resource').forEach(function (e) {
        var key = /three\.r128/.test(e.name) ? 'three' : /mountain\.js/.test(e.name) ? 'appJs' : /mountain\.css/.test(e.name) ? 'css' : '';
        if (key) out[key] = Math.round(e.duration) + ' ms, ' + Math.round((e.transferSize || e.encodedBodySize) / 1024) + ' KB';
      });
    } catch (err) {}
    window.__labPerf = out;
    if (/[?&]perf=1/.test(location.search)) {
      var el = document.createElement('pre'); el.className = 'perf';
      el.textContent = Object.keys(out).map(function (k) { return k + ': ' + out[k]; }).join('\n');
      stage.appendChild(el);
    }
  }
})();
