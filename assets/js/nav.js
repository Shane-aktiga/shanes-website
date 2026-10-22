/* ==========================================================================
   nav.js — Component 1: header menu
   --------------------------------------------------------------------------
   Two small jobs:
     1. open and close the navigation panel, accessibly
     2. give the header a solid background once the page has scrolled

   Vanilla, no dependencies, safe to load with `defer` on every page.
   If it never runs, the header still renders and the panel is reachable,
   because the panel is ordinary markup with ordinary links in it.
   ========================================================================== */

(function () {
  "use strict";

  function init() {
    var header = document.querySelector("[data-sp-header]");
    var toggle = document.querySelector("[data-sp-menu-toggle]");
    var panel = document.querySelector("[data-sp-menu]");
    if (!header || !toggle || !panel) return;

    var closeBtn = panel.querySelector("[data-sp-menu-close]");
    var lastFocus = null;

    /* Elements to make unreachable while the panel is open. The header is
       excluded so the toggle itself keeps working. */
    function siblings() {
      return Array.prototype.filter.call(
        document.body.children,
        function (el) { return el !== header && el !== panel; });
    }

    function setOpen(open) {
      panel.setAttribute("data-sp-open", open ? "true" : "false");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.documentElement.classList.toggle("sp-locked", open);

      siblings().forEach(function (el) {
        if (open) { el.setAttribute("inert", ""); }
        else { el.removeAttribute("inert"); }
      });

      if (open) {
        lastFocus = document.activeElement;
        var first = panel.querySelector("a, button");
        if (first) first.focus();
      } else if (lastFocus && lastFocus.focus) {
        lastFocus.focus();
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(panel.getAttribute("data-sp-open") !== "true");
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function () { setOpen(false); });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && panel.getAttribute("data-sp-open") === "true") {
        setOpen(false);
      }
    });

    /* Following a link inside the panel should close it, which matters for
       same-page anchors where no navigation happens. */
    panel.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    /* ---- Solid header once scrolled ---------------------------------- */

    var sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:80px;pointer-events:none";
    document.body.insertBefore(sentinel, document.body.firstChild);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        header.toggleAttribute("data-sp-stuck", !entries[0].isIntersecting);
      }).observe(sentinel);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
