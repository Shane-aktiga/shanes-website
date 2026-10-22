/* ==========================================================================
   terrain.js — Component 2: Interactive Terrain
   --------------------------------------------------------------------------
   Vanilla, dependency-free, no build step. Load with `defer`.
   Supports more than one .sp-terrain on a page.

   Responsibilities, and nothing else:
     - pointer parallax on the ridge layers
     - open / close waypoint cards (click or keyboard only, never hover)
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
  var GAP = 18;                /* px — clearance between light and card     */
  var EDGE = 8;                /* px — clearance from the field edge        */

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mapMode = window.matchMedia("(min-width: " + MAP_MODE_MIN + "px)");

  function clamp(value, min, max) {
    if (max < min) return min;
    return Math.min(Math.max(value, min), max);
  }

  /* ----------------------------------------------------------------------
     The mobile bottom sheet.

     iOS Safari treats `overflow: hidden` on an ancestor as grounds to
     contain and clip a position:fixed descendant instead of letting it
     anchor to the viewport. .sp-terrain carries overflow:hidden for the
     ridge artwork, so on an iPhone the open card was never actually
     fixed: it moved with the section, and the sections below it painted
     straight over the top. Chromium follows the spec here, which is why
     this only ever showed up on a real phone.

     So do not fight it with z-index. While a card is a sheet it is moved
     out to <body>, where no ancestor can clip or contain it, and put back
     when it closes. The page behind is scroll-locked and covered by a
     real scrim element, which also gives the tap-to-dismiss a target.
     ---------------------------------------------------------------------- */

  var SHEET_EXIT = 340;   /* ms — a shade longer than --sp-dur (320ms) */

  var sheet = (function () {
    var scrim = null, card = null, home = null, dismiss = null;
    var scrollY = 0, restoreTimer = null;

    function ensureScrim() {
      if (scrim) return scrim;
      scrim = document.createElement("div");
      scrim.className = "sp-scrim";
      scrim.setAttribute("data-sp-scrim", "");
      scrim.addEventListener("click", function () { if (dismiss) dismiss(); });
      document.body.appendChild(scrim);
      return scrim;
    }

    /* Locking with overflow:hidden alone is unreliable on iOS. Pinning the
       body and offsetting it by the scroll position is what actually holds,
       so remember the offset and put it back on release. */
    function lock() {
      scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      var b = document.body;
      b.style.position = "fixed";
      b.style.top = -scrollY + "px";
      b.style.left = "0";
      b.style.right = "0";
      b.style.width = "100%";
    }

    function unlock() {
      var b = document.body;
      b.style.position = "";
      b.style.top = "";
      b.style.left = "";
      b.style.right = "";
      b.style.width = "";
      window.scrollTo(0, scrollY);
    }

    function putBack() {
      if (restoreTimer) { clearTimeout(restoreTimer); restoreTimer = null; }
      if (card && home && home.parent) home.parent.insertBefore(card, home.next);
      card = null;
      home = null;
    }

    return {
      holds: function (el) { return card === el; },
      open: function (el, onDismiss) {
        if (card === el) return;
        if (card) putBack();
        home = { parent: el.parentNode, next: el.nextSibling };
        card = el;
        dismiss = onDismiss;
        ensureScrim().setAttribute("data-sp-scrim-open", "");
        document.body.appendChild(el);
        lock();
      },
      /* Release the page at once so it is usable again, but leave the card
         in <body> until its exit transition has finished, or it jumps back
         into the section mid-animation. */
      close: function () {
        if (!card) return;
        dismiss = null;
        if (scrim) scrim.removeAttribute("data-sp-scrim-open");
        unlock();
        var leaving = card;
        if (restoreTimer) clearTimeout(restoreTimer);
        restoreTimer = setTimeout(function () {
          if (card === leaving && leaving.getAttribute("data-sp-open") !== "true") putBack();
        }, SHEET_EXIT);
      }
    };
  })();

  function init(root) {
    var scene     = root.querySelector("[data-sp-scene]");
    var field     = root.querySelector("[data-sp-field]");
    var layers    = Array.prototype.slice.call(root.querySelectorAll("[data-sp-depth]"));
    var waypoints = Array.prototype.slice.call(root.querySelectorAll("[data-sp-waypoint]"));
    if (!field || !waypoints.length) return;

    var openId = null;
    var rafId = null;
    var target = { x: 0, y: 0 };
    var current = { x: 0, y: 0 };

    /* ---- Cards ------------------------------------------------------- */

    /* document, not root: an open sheet has been moved out to <body> and
       is no longer a descendant of this terrain section. */
    function cardFor(button) {
      var id = button.getAttribute("aria-controls");
      if (!id) return null;
      return document.getElementById(id);
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

      /* The header is fixed, so it owns the top strip of the viewport no
         matter where the section has scrolled to. Keep the card clear of it,
         or a card opened from a high waypoint slides under the brand and the
         menu button and swallows the only navigation on the page. */
      var header = document.querySelector("[data-sp-header]");
      if (header) {
        minTop = Math.max(minTop, header.offsetHeight + EDGE - fieldBox.top);
      }
      if (maxTop < minTop) maxTop = minTop;

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
      if (card) {
        card.setAttribute("data-sp-open", "false");
        if (sheet.holds(card)) sheet.close();
      }
      if (openId === id) openId = null;
    }

    function closeAll() {
      waypoints.forEach(function (b) {
        close(b.getAttribute("data-sp-waypoint"));
      });
    }

    function open(button, moveFocus) {
      var id = button.getAttribute("data-sp-waypoint");
      var card = cardFor(button);
      if (!card) return;

      if (openId && openId !== id) close(openId);

      if (!mapMode.matches) {
        /* Sheet mode. Move it to <body> first, then let a frame pass so the
           slide-in actually animates from its new home. */
        sheet.open(card, function () { close(id); });
        requestAnimationFrame(function () {
          if (openId === id) card.setAttribute("data-sp-open", "true");
        });
      } else {
        /* Lay it out so it can be measured, without a visible flash. */
        card.style.visibility = "hidden";
        card.setAttribute("data-sp-open", "true");
        placeCard(button, card);
        card.style.visibility = "";
      }

      button.setAttribute("aria-expanded", "true");
      openId = id;

      if (moveFocus) {
        var first = card.querySelector("a, button");
        if (first) first.focus();
      }
    }

    /* ---- Wiring ------------------------------------------------------ */

    waypoints.forEach(function (button) {
      var id = button.getAttribute("data-sp-waypoint");
      var card = cardFor(button);

      /* Click opens, click again closes. Nothing opens on hover.

         A panel that opens on hover cannot be reached by touch at all, it
         fires by accident whenever the pointer crosses a light on its way
         somewhere else, and it has no keyboard equivalent, so the same
         gesture has to be reimplemented for focus and then kept in sync.
         The hover reaction is left to CSS, which can animate the light
         without committing the reader to anything. */
      button.addEventListener("click", function (event) {
        event.preventDefault();
        if (openId === id) close(id);
        else open(button, false);
      });

      if (card) {
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
      /* getElementById, not root.querySelector: in sheet mode the open card
         has been moved out to <body>, so looking for it inside this section
         finds nothing. When that happened the guard below never matched, and
         a tap on the card's own button counted as a tap on the backdrop:
         preventDefault, then close, and no navigation. */
      var card = document.getElementById("sp-card-" + openId);
      if (card && card.contains(event.target)) return;
      if (event.target.closest && event.target.closest("[data-sp-waypoint]")) return;

      /* On a phone the card is a bottom sheet sitting over a dimmed page, so
         a tap outside it should dismiss it and do nothing else. Capture
         phase and preventDefault, or the same tap also activates whatever
         link happens to be under the dimming and navigates away, which is
         not what anyone meant by tapping the greyed-out part of a page. */
      if (!mapMode.matches) {
        event.preventDefault();
        event.stopPropagation();
      }
      closeAll();
    }, true);

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
