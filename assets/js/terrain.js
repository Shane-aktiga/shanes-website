/* ==========================================================================
   terrain.js — Component 2: Interactive Terrain
   --------------------------------------------------------------------------
   Vanilla, dependency-free, no build step. Load with `defer`.
   Supports more than one .sp-terrain on a page.

   Responsibilities, and nothing else:
     - pointer parallax on the ridge layers
     - open / close waypoint cards (hover to peek, click to pin, keyboard)
     - position a card near its waypoint without ever covering it
     - honour prefers-reduced-motion and the 900px breakpoint

   It only reads markup and writes style/attributes, so the component still
   works with JavaScript off: the waypoints are real <button>s and the
   Accessible Index below carries the same destinations as plain links.
   ========================================================================== */

(function () {
  "use strict";

  var MAP_MODE_MIN = 900;      /* px — below this the layout is a list      */
  var PARALLAX_MAX = 26;       /* px — travel of the furthest-moving layer  */
  var HOVER_CLOSE_DELAY = 180; /* ms — forgiveness when moving to the card  */
  var GAP = 18;                /* px — clearance between light and card     */
  var EDGE = 8;                /* px — clearance from the field edge        */

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mapMode = window.matchMedia("(min-width: " + MAP_MODE_MIN + "px)");

  function clamp(value, min, max) {
    if (max < min) return min;
    return Math.min(Math.max(value, min), max);
  }

  function init(root) {
    var scene     = root.querySelector("[data-sp-scene]");
    var field     = root.querySelector("[data-sp-field]");
    var layers    = Array.prototype.slice.call(root.querySelectorAll("[data-sp-depth]"));
    var waypoints = Array.prototype.slice.call(root.querySelectorAll("[data-sp-waypoint]"));
    if (!field || !waypoints.length) return;

    var openId = null;
    var pinned = false;       /* true once opened by click or keyboard */
    var closeTimer = null;
    var rafId = null;
    var target = { x: 0, y: 0 };
    var current = { x: 0, y: 0 };

    /* ---- Cards ------------------------------------------------------- */

    function cardFor(button) {
      var id = button.getAttribute("aria-controls");
      if (!id) return null;
      return root.querySelector("#" + (window.CSS && CSS.escape ? CSS.escape(id) : id));
    }

    /* Put the card above the light, else below it, else beside it.
       The three-way fallback is what stops a tall card from landing on
       top of the very button that opened it. */
    function placeCard(button, card) {
      if (!mapMode.matches || !card) return;   /* phone: CSS bottom sheet */

      var fieldBox = field.getBoundingClientRect();
      var hostBox = root.getBoundingClientRect();
      var btnBox = button.getBoundingClientRect();

      var cx = btnBox.left - fieldBox.left + btnBox.width / 2;
      var cy = btnBox.top - fieldBox.top;
      var cardW = card.offsetWidth;
      var cardH = card.offsetHeight;

      /* Horizontal travel is limited to the content column so cards stay
         in the measure. Vertical travel is limited by the whole section,
         not the waypoint field, because the field is only the middle band
         of the hero: without this a tall card has nowhere to go on a short
         laptop screen and gets clipped. Both bounds are in field
         coordinates, so minTop is usually negative. */
      var minTop = (hostBox.top - fieldBox.top) + EDGE;
      var maxTop = (hostBox.bottom - fieldBox.top) - cardH - EDGE;
      var maxLeft = fieldBox.width - cardW - EDGE;

      var left = clamp(cx - cardW / 2, EDGE, maxLeft);
      var top;

      var above = cy - cardH - GAP;
      var below = cy + btnBox.height + GAP;

      if (above >= minTop) {
        top = above;
      } else if (below <= maxTop) {
        top = below;
      } else {
        /* Neither: sit beside the light, vertically centred on it, on
           whichever side has more room. */
        top = cy + btnBox.height / 2 - cardH / 2;
        left = cx < fieldBox.width / 2
          ? cx + btnBox.width / 2 + GAP
          : cx - btnBox.width / 2 - GAP - cardW;
        left = clamp(left, EDGE, maxLeft);
      }

      card.style.left = Math.round(left) + "px";
      card.style.top = Math.round(clamp(top, minTop, maxTop)) + "px";
    }

    function close(id) {
      var button = root.querySelector('[data-sp-waypoint="' + id + '"]');
      if (!button) return;
      var card = cardFor(button);
      button.setAttribute("aria-expanded", "false");
      if (card) card.setAttribute("data-sp-open", "false");
      if (openId === id) { openId = null; pinned = false; }
    }

    function closeAll() {
      waypoints.forEach(function (b) {
        close(b.getAttribute("data-sp-waypoint"));
      });
    }

    function open(button, pin, moveFocus) {
      var id = button.getAttribute("data-sp-waypoint");
      var card = cardFor(button);
      if (!card) return;

      if (openId && openId !== id) close(openId);

      /* Lay it out so it can be measured, without a visible flash. */
      card.style.visibility = "hidden";
      card.setAttribute("data-sp-open", "true");
      placeCard(button, card);
      card.style.visibility = "";

      button.setAttribute("aria-expanded", "true");
      openId = id;
      if (pin) pinned = true;

      if (moveFocus) {
        var first = card.querySelector("a, button");
        if (first) first.focus();
      }
    }

    function cancelClose() {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    }

    function scheduleClose(id) {
      cancelClose();
      closeTimer = setTimeout(function () {
        if (!pinned) close(id);
      }, HOVER_CLOSE_DELAY);
    }

    /* ---- Wiring ------------------------------------------------------ */

    waypoints.forEach(function (button) {
      var id = button.getAttribute("data-sp-waypoint");
      var card = cardFor(button);

      /* Hover peeks. Click pins, so the card survives the mouse leaving.
         Clicking an already-pinned card closes it. */
      button.addEventListener("click", function (event) {
        event.preventDefault();
        if (openId === id && pinned) {
          close(id);
        } else {
          open(button, true, false);
        }
      });

      /* Mouse only. Touch fires click, so no phone user gets stuck in a
         hover state that will not dismiss. */
      button.addEventListener("pointerenter", function (event) {
        if (event.pointerType !== "mouse" || !mapMode.matches) return;
        cancelClose();
        open(button, false, false);
      });

      button.addEventListener("pointerleave", function (event) {
        if (event.pointerType !== "mouse" || !mapMode.matches) return;
        scheduleClose(id);
      });

      if (card) {
        card.addEventListener("pointerenter", cancelClose);
        card.addEventListener("pointerleave", function (event) {
          if (event.pointerType !== "mouse" || !mapMode.matches) return;
          scheduleClose(id);
        });

        var closeBtn = card.querySelector("[data-sp-close]");
        if (closeBtn) {
          closeBtn.addEventListener("click", function () {
            close(id);
            button.focus();
          });
        }
      }
    });

    /* Escape closes and returns focus. Click outside closes. */
    root.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !openId) return;
      var button = root.querySelector('[data-sp-waypoint="' + openId + '"]');
      close(openId);
      if (button) button.focus();
    });

    document.addEventListener("click", function (event) {
      if (!openId) return;
      if (!root.contains(event.target)) closeAll();
    });

    /* Opening by keyboard should pin, so the card does not vanish. */
    root.addEventListener("focusin", function (event) {
      var button = event.target.closest && event.target.closest("[data-sp-waypoint]");
      if (!button) return;
      cancelClose();
    });

    /* ---- Parallax ---------------------------------------------------- */

    function step() {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;

      layers.forEach(function (layer) {
        var depth = parseFloat(layer.getAttribute("data-sp-depth")) || 0;
        var x = (current.x * PARALLAX_MAX * depth).toFixed(2);
        var y = (current.y * PARALLAX_MAX * depth * 0.45).toFixed(2);
        layer.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      });

      if (Math.abs(target.x - current.x) > 0.001 ||
          Math.abs(target.y - current.y) > 0.001) {
        rafId = requestAnimationFrame(step);
      } else {
        rafId = null;
      }
    }

    function onPointerMove(event) {
      if (event.pointerType !== "mouse") return;
      var box = root.getBoundingClientRect();
      target.x = ((event.clientX - box.left) / box.width - 0.5) * -2;
      target.y = ((event.clientY - box.top) / box.height - 0.5) * -2;
      if (!rafId) rafId = requestAnimationFrame(step);
    }

    function resetParallax() {
      target.x = 0;
      target.y = 0;
      if (!rafId) rafId = requestAnimationFrame(step);
    }

    function clearLayers() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      current.x = 0; current.y = 0; target.x = 0; target.y = 0;
      layers.forEach(function (layer) { layer.style.transform = ""; });
    }

    function syncParallax() {
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", resetParallax);
      if (!reduceMotion.matches && mapMode.matches) {
        root.addEventListener("pointermove", onPointerMove, { passive: true });
        root.addEventListener("pointerleave", resetParallax);
      } else {
        clearLayers();
      }
    }

    /* ---- Re-sync on change ------------------------------------------- */

    function onBreakpoint() {
      closeAll();
      syncParallax();
    }

    addChangeListener(reduceMotion, onBreakpoint);
    addChangeListener(mapMode, onBreakpoint);

    window.addEventListener("resize", debounce(function () {
      if (!openId) return;
      var button = root.querySelector('[data-sp-waypoint="' + openId + '"]');
      if (button) placeCard(button, cardFor(button));
    }, 120));

    syncParallax();
    if (scene) scene.setAttribute("aria-hidden", "true");
  }

  /* ---- Small helpers ------------------------------------------------- */

  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }

  /* Safari before 14 only has addListener. */
  function addChangeListener(mql, handler) {
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
    } else if (typeof mql.addListener === "function") {
      mql.addListener(handler);
    }
  }

  function boot() {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-sp-terrain]"), init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
