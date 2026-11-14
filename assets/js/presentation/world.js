/* Presentation world: the SAME Blue Ridge night landscape as the homepage hero (assets/js/mountain.js),
   packaged as a factory so the presentation can place its own waypoints and drive its own camera.
   The terrain, contour shader, sky dome, stars, moon, clouds, fog, colors and beacon art are copied
   verbatim from mountain.js (lines 63 to 243 and the beacon look at 245 to 276). The homepage file is untouched.
   Needs three.js r128 (assets/js/vendor). */
(function (root) {
  'use strict';

  function createWorld(opts) {
    var canvas = opts.canvas, reduced = !!opts.reduced;
    var D2R = Math.PI / 180;
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
    // ---- verbatim from mountain.js: scene, fog, camera, terrain, sky, textures, sky furniture ----
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

    // ---- Waypoints (the presentation's own, configurable) -----------------------
    var NODES = opts.nodes || [];
    var COL = { lamp: new THREE.Color('#FFC46B'), beacon: new THREE.Color('#8FE3C8') };
    var coreGeo = new THREE.SphereGeometry(0.5, 20, 14);
    var beacons = [];
    NODES.forEach(function (p, i) {
      var col = COL[p.kind] || COL.beacon;
      var g = new THREE.Group();
      var core = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: col, fog: false, depthTest: false, transparent: true }));
      var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false }));
      var ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, color: col, transparent: true, opacity: 0, depthWrite: false, depthTest: false, fog: false }));
      glow.scale.set(7, 7, 1);
      glow.renderOrder = 10; ring.renderOrder = 11; core.renderOrder = 12;
      g.add(glow); g.add(ring); g.add(core);
      scene.add(g);
      var gm = function (tex, op) {
        return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col, transparent: true, opacity: op, depthWrite: false, depthTest: false, fog: false }));
      };
      var inner = gm(ringThickTex, 0.7), outer = gm(ringTex, 0.34);
      inner.renderOrder = 8; outer.renderOrder = 7;
      scene.add(inner); scene.add(outer);
      var stemGeo = new THREE.BufferGeometry();
      stemGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      var stem = new THREE.Line(stemGeo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.4, depthWrite: false, depthTest: false, fog: false }));
      stem.renderOrder = 9; stem.frustumCulled = false;
      scene.add(stem);
      var gh = H(p.x, p.z);
      g.position.set(p.x, gh + 2.6, p.z);
      inner.position.set(p.x, gh + 0.4, p.z); outer.position.copy(inner.position);
      beacons.push({ stem: stem, g: g, core: core, glow: glow, ring: ring, gr: [inner, outer], gy: gh + 0.4, hv: 0, lit: 0 });
    });

    // ---- The path: a winding trail of small lights across the terrain through every waypoint ----
    var path = { pts: [], walked: null, ahead: null, curve: null };
    var curve = null;
    if (NODES.length > 1) {
      curve = new THREE.CatmullRomCurve3(NODES.map(function (p) { return new THREE.Vector3(p.x, 0, p.z); }), false, 'catmullrom', 0.5);
      var STEPS = 46 * (NODES.length - 1), pArr = [];
      for (var s = 0; s <= STEPS; s++) {
        var q = curve.getPoint(s / STEPS);
        pArr.push([q.x, H(q.x, q.z) + 0.9, q.z, s / STEPS * (NODES.length - 1)]);
      }
      path.pts = pArr;
      var dotMat = function (op) {
        return new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, map: glowTex, color: 0xFFE2B0, transparent: true, opacity: op,
          blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false });
      };
      path.walked = new THREE.Points(new THREE.BufferGeometry(), dotMat(0.95));
      path.ahead = new THREE.Points(new THREE.BufferGeometry(), dotMat(0.32));
      path.walked.renderOrder = path.ahead.renderOrder = 6; path.walked.frustumCulled = path.ahead.frustumCulled = false;
      scene.add(path.walked); scene.add(path.ahead);
    }
    var lastSplit = -1;
    function splitPath(prog) {
      if (!path.pts.length) return;
      var key = Math.round(prog * 40);
      if (key === lastSplit) return; lastSplit = key;
      var w = [], a = [];
      path.pts.forEach(function (p) { (p[3] <= prog + 0.0001 ? w : a).push(p[0], p[1], p[2]); });
      // the first "ahead" dot repeats the last walked one so the trail has no gap
      if (w.length) a.unshift(w[w.length - 3], w[w.length - 2], w[w.length - 1]);
      path.walked.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(w), 3));
      path.ahead.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(a), 3));
    }

    // ---- Pose, anchor, size ------------------------------------------------------
    var pose = { tx: 0, ty: 16, tz: -48, az: 0, el: 14, dist: 92 };
    var anchorX = 0.5, anchorY = 0.5, progress = 0, W = 1, Hh = 1, T = 0;
    var moon = { x: 0, y: 0, glow: 160, disc: 27 };
    function layoutMoon() {
      var glow = clamp(W * 0.15, 136, 208), disc = glow * 0.17;
      moon.x = W * 0.14; moon.y = Hh * 0.2; moon.glow = glow; moon.disc = disc;
    }
    function applyView() {
      var aspect = W / Hh, portrait = aspect < 1;
      camera.fov = portrait ? 52 : 40; camera.aspect = aspect;
      var dx = (anchorX - 0.5) * W, dy = (anchorY - 0.5) * Hh;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) camera.setViewOffset(W, Hh, -dx, -dy, W, Hh); else camera.clearViewOffset();
      skyMat.uniforms.uDrop.value = 0;
      camera.updateProjectionMatrix();
    }
    function setSize(w, h, dpr) {
      W = Math.max(1, Math.round(w)); Hh = Math.max(1, Math.round(h));
      renderer.setPixelRatio(Math.min(dpr || 1, 1.5));
      renderer.setSize(W, Hh, false);
      layoutMoon(); applyView();
    }
    function setPose(p) { pose.tx = p.tx; pose.ty = p.ty; pose.tz = p.tz; pose.az = p.az; pose.el = p.el; pose.dist = p.dist; }
    function setAnchor(ax, ay) { if (ax !== anchorX || ay !== anchorY) { anchorX = ax; anchorY = ay; applyView(); } }
    function setProgress(p) { progress = p; splitPath(p); }

    var tmp = new THREE.Vector3();
    function render(dt) {
      T += dt;
      var a = pose.az * D2R, el = pose.el * D2R, rd = pose.dist;
      camera.position.set(
        pose.tx + rd * Math.cos(el) * Math.sin(a),
        pose.ty + rd * Math.sin(el),
        pose.tz + rd * Math.cos(el) * Math.cos(a));
      var floorY = H(camera.position.x, camera.position.z) + 3.5;   // never dip under the terrain
      if (camera.position.y < floorY) camera.position.y = floorY;
      camera.lookAt(pose.tx, pose.ty, pose.tz);
      camera.updateMatrixWorld();
      sky.position.copy(camera.position); stars.position.copy(camera.position);

      var mx = (moon.x / W) * 2 - 1, my = 1 - (moon.y / Hh) * 2;
      var moonDir = new THREE.Vector3(mx, my, 0.5).unproject(camera).sub(camera.position).normalize();
      moonGlow.position.copy(camera.position).addScaledVector(moonDir, 800);
      moonDisc.position.copy(moonGlow.position);
      var unit = 2 * Math.tan(camera.fov * D2R / 2) * 800 / Hh;
      moonGlow.scale.set(moon.glow * unit, moon.glow * unit, 1);
      moonDisc.scale.set(moon.disc * unit, moon.disc * unit, 1);

      for (var ci = 0; ci < clouds.length; ci++) {
        var cs = clouds[ci];
        cs.position.x = cs.userData.x0 + (reduced ? 0 : Math.sin(T * 0.035 + cs.userData.ph) * 14);
      }

      for (var i = 0; i < beacons.length; i++) {
        var b = beacons[i];
        var d = camera.position.distanceTo(b.g.position);
        var s = Math.pow(d / 98, 0.8);
        // a waypoint is "lit" once the journey has reached it, and glows fullest while we are there
        var want = progress >= i - 0.001 ? 1 : 0;
        var here = clamp(1 - Math.abs(progress - i), 0, 1);
        b.hv += (want - b.hv) * (1 - Math.exp(-dt * 6));
        b.g.scale.setScalar(s * (0.78 + 0.5 * here));
        b.core.scale.setScalar(1 + 0.35 * here);
        b.core.material.opacity = 0.35 + 0.65 * b.hv;
        b.glow.material.opacity = 0.18 + 0.4 * b.hv + 0.3 * here;
        b.glow.scale.set(7 + 2.4 * here, 7 + 2.4 * here, 1);
        var ph0 = 0, pp = 0;
        if (reduced) { b.ring.material.opacity = 0; }
        else {
          var ph = (((T - i * 0.55) % 4.5) + 4.5) % 4.5 / 4.5;
          var sc = 2 * (0.6 + 1.8 * (1 - Math.pow(1 - ph, 4)));
          b.ring.scale.set(sc, sc, 1);
          b.ring.material.opacity = (ph < 0.35 ? 0.55 * (ph / 0.35) : 0.55 * (1 - (ph - 0.35) / 0.65)) * (0.25 + 0.75 * b.hv);
          pp = ph < 0.35 ? ph / 0.35 : 1 - (ph - 0.35) / 0.65; ph0 = ph;
        }
        b.gr[0].material.opacity = (0.62 + 0.3 * here + 0.2 * pp) * (0.3 + 0.7 * b.hv);
        var ripOp = reduced ? 0.3 : 0.62 * Math.pow(1 - ph0, 1.6) * Math.min(1, ph0 / 0.05);
        b.gr[1].material.opacity = ripOp * (1 + 0.5 * here) * (0.25 + 0.75 * b.hv);
        var gp = b.gr[0].position;
        var elv = Math.atan2(camera.position.y - gp.y, Math.hypot(camera.position.x - gp.x, camera.position.z - gp.z));
        var rr = 1.75 * Math.pow(d / 98, 0.6);
        var asp = clamp(Math.sin(elv) * 1.7, 0.24, 0.9), dia = 2 * rr / 0.92;
        b.gr[0].scale.set(dia, dia * asp, 1);
        var rip = reduced ? 1.7 : 1 + 0.95 * (1 - Math.pow(1 - ph0, 3));
        b.gr[1].scale.set(dia * rip, dia * rip * asp, 1);
        var sp = b.stem.geometry.attributes.position.array;
        sp[0] = gp.x; sp[1] = gp.y; sp[2] = gp.z;
        sp[3] = b.g.position.x; sp[4] = b.g.position.y - 0.62 * s; sp[5] = b.g.position.z;
        b.stem.geometry.attributes.position.needsUpdate = true;
        b.stem.material.opacity = (0.34 + 0.25 * here) * (0.3 + 0.7 * b.hv);
      }
      renderer.render(scene, camera);
    }

    function dispose() {
      scene.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.dispose(); }); }
      });
      textures.forEach(function (t) { t.dispose(); });
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch (e) {}
    }

    return { H: H, curve: curve, nodes: NODES, setSize: setSize, setPose: setPose, setAnchor: setAnchor,
             setProgress: setProgress, render: render, dispose: dispose, renderer: renderer };
  }

  root.WorldKit = { create: createWorld };
})(window);
