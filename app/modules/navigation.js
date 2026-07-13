/**
 * modules/navigation.js
 * ---------------------------------------------------------------------------
 * Client-side tab navigation for the app shell. Class-based show/hide only —
 * every panel and its IDs stay in the DOM at all times, so all existing
 * feature code (charts, history, fuel log, etc.) keeps working exactly as
 * before; it simply renders into a panel that may be hidden until selected.
 *
 * Also drives the mobile drawer (hamburger + backdrop) and remembers the
 * last-open tab in localStorage via the shared storage layer.
 *
 * Fires a 'e20:tabchange' CustomEvent on document whenever the active tab
 * changes, so other modules (e.g. the dashboard) can refresh lazily when
 * shown rather than doing work while hidden.
 *
 * Exposed as window.E20.navigation
 */
(function (global) {
  "use strict";

  const storage = global.E20.storage;
  const DEFAULT_TAB = "dashboard";

  let currentTab = null;

  function els() {
    return {
      navButtons: Array.prototype.slice.call(document.querySelectorAll(".nav-item")),
      panels: Array.prototype.slice.call(document.querySelectorAll(".tab-panel")),
      sidebar: document.getElementById("appSidebar"),
      backdrop: document.getElementById("sidebarBackdrop"),
      hamburger: document.getElementById("hamburgerBtn"),
    };
  }

  function isMobile() {
    return window.matchMedia("(max-width: 860px)").matches;
  }

  function closeDrawer() {
    const { sidebar, backdrop, hamburger } = els();
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("open");
    if (hamburger) {
      hamburger.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
    }
  }

  function openDrawer() {
    const { sidebar, backdrop, hamburger } = els();
    if (sidebar) sidebar.classList.add("open");
    if (backdrop) backdrop.classList.add("open");
    if (hamburger) {
      hamburger.classList.add("open");
      hamburger.setAttribute("aria-expanded", "true");
    }
  }

  // Switch to a tab by id. No-ops (except closing the drawer) if already there.
  function goTo(tabId) {
    const { navButtons, panels } = els();
    const target = panels.find(function (p) { return p.getAttribute("data-tab") === tabId; });
    if (!target) return;

    panels.forEach(function (p) { p.classList.toggle("active", p === target); });
    navButtons.forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-tab") === tabId); });

    currentTab = tabId;

    // Persist last tab so a reload returns the user where they were.
    const settings = storage.getSettings();
    storage.saveSettings(Object.assign({}, settings, { lastTab: tabId }));

    // Scroll the content area back to top on tab change (each tab is its own
    // "page"); on mobile also close the drawer.
    if (isMobile()) closeDrawer();
    window.scrollTo({ top: 0, behavior: "auto" });

    document.dispatchEvent(new CustomEvent("e20:tabchange", { detail: { tab: tabId } }));
  }

  function getCurrent() {
    return currentTab;
  }

  function init() {
    const { navButtons, backdrop, hamburger } = els();

    navButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        goTo(btn.getAttribute("data-tab"));
      });
    });

    // Any element with data-goto-tab (e.g. dashboard quick actions) navigates.
    document.addEventListener("click", function (e) {
      const trigger = e.target.closest("[data-goto-tab]");
      if (trigger) goTo(trigger.getAttribute("data-goto-tab"));
    });

    if (hamburger) {
      hamburger.addEventListener("click", function () {
        const isOpen = document.getElementById("appSidebar").classList.contains("open");
        if (isOpen) closeDrawer(); else openDrawer();
      });
    }
    if (backdrop) backdrop.addEventListener("click", closeDrawer);

    // Close the drawer if the viewport grows back to desktop width.
    window.addEventListener("resize", function () {
      if (!isMobile()) closeDrawer();
    });

    // Always open on the Dashboard. It's the summary screen, so it gives every
    // session a consistent, glanceable starting point rather than dropping the
    // user back into whatever form they happened to leave open last time.
    goTo(DEFAULT_TAB);
  }

  global.E20 = global.E20 || {};
  global.E20.navigation = { init: init, goTo: goTo, getCurrent: getCurrent, DEFAULT_TAB: DEFAULT_TAB };
})(window);
