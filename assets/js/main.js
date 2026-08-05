/* ==========================================================================
   Sims Crane & Equipment — main.js
   Header nav (mobile drawer + submenus), FAQ accordion, sticky header state
   ========================================================================== */
(function () {
  'use strict';

  var MOBILE_QUERY = '(max-width: 980px)';

  /* ---------------- Mobile nav drawer ---------------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('primaryNav');
  var scrim = document.getElementById('navScrim');

  function isMobile() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    if (scrim) scrim.hidden = true;
  }

  function openNav() {
    if (!nav || !toggle) return;
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
    if (scrim) scrim.hidden = false;
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') {
        closeNav();
      } else {
        openNav();
      }
    });
  }

  if (scrim) {
    scrim.addEventListener('click', closeNav);
  }

  var navClose = document.getElementById('navClose');
  if (navClose) {
    navClose.addEventListener('click', closeNav);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* ---------------- Submenu toggles (mobile) ---------------- */
  var subToggles = document.querySelectorAll('.dropdown-toggle');

  Array.prototype.forEach.call(subToggles, function (btn) {
    btn.addEventListener('click', function () {
      var parent = btn.closest('.has-dropdown');
      if (!parent) return;
      var panel = parent.querySelector('.dropdown');
      if (!panel) return;

      var open = btn.getAttribute('aria-expanded') === 'true';

      Array.prototype.forEach.call(subToggles, function (other) {
        if (other === btn) return;
        var otherParent = other.closest('.has-dropdown');
        var otherPanel = otherParent && otherParent.querySelector('.dropdown');
        other.setAttribute('aria-expanded', 'false');
        if (otherParent) otherParent.classList.remove('is-open');
        if (otherPanel) otherPanel.classList.remove('is-open');
      });

      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      parent.classList.toggle('is-open', !open);
      panel.classList.toggle('is-open', !open);
    });
  });

  /* Close the drawer when a real link inside it is followed */
  if (nav) {
    nav.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      if (isMobile()) closeNav();
    });
  }

  /* Reset nav state when resizing back to desktop */
  var resizeTimer;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      if (!isMobile()) {
        closeNav();
        Array.prototype.forEach.call(subToggles, function (btn) {
          var parent = btn.closest('.has-dropdown');
          var panel = parent && parent.querySelector('.dropdown');
          btn.setAttribute('aria-expanded', 'false');
          if (parent) parent.classList.remove('is-open');
          if (panel) panel.classList.remove('is-open');
        });
      }
    }, 150);
  });

  /* ---------------- Sticky header shadow ---------------- */
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.pageYOffset > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- FAQ accordion ---------------- */
  var triggers = document.querySelectorAll('.accordion__trigger');

  Array.prototype.forEach.call(triggers, function (trigger) {
    trigger.addEventListener('click', function () {
      var panelId = trigger.getAttribute('aria-controls');
      var panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) return;

      var expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      panel.hidden = expanded;
    });
  });
}());
