/* ==========================================================================
   Sims Crane & Equipment — main.js
   Header nav (mobile drawer + submenus), FAQ accordion, sticky header state,
   careers role/location pickers
   ========================================================================== */
(function () {
  'use strict';

  var MOBILE_QUERY = '(max-width: 1360px)';  // must match the nav breakpoint in main.css

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

  /* ---------------- Careers: role location pickers ----------------
     Each role row carries a location <select> and an Apply button that
     starts with no href, so it is unclickable and skipped by the tab
     order until a location is chosen. Picking one sets the application
     URL; clearing the choice puts the button back to its inert state. */
  var roleCards = document.querySelectorAll('[data-role-card]');

  Array.prototype.forEach.call(roleCards, function (card) {
    var select = card.querySelector('[data-loc-select]');
    var apply = card.querySelector('[data-apply]');
    if (!select || !apply) return;

    select.setAttribute('data-empty', '');

    select.addEventListener('change', function () {
      if (select.value) {
        apply.href = select.value;
        apply.removeAttribute('aria-disabled');
        select.removeAttribute('data-empty');
      } else {
        apply.removeAttribute('href');
        apply.setAttribute('aria-disabled', 'true');
        select.setAttribute('data-empty', '');
      }
    });
  });
  /* ---------------- Locations map ----------------
     Leaflet raster map of the 16 branches, styled dark in main.css.
     Providers are tried in order and fail over automatically, so a blocked
     or key-gated provider never leaves a black rectangle. */
  var mapEl = document.getElementById('simsMap');

  if (mapEl && window.L) {

    /* Both providers below need NO API key.
         1. Esri Dark Gray Canvas - base plus a separate label layer. Its tile
            path is {z}/{y}/{x}, not the usual {z}/{x}/{y}.
         2. OpenStreetMap standard, inverted to dark by CSS. Last resort: OSM's
            tile policy discourages embedding and can return "Access blocked".

       Already tried and rejected: openstreetmap.org as primary (blocked),
       basemaps.cartocdn.com (now requires an API key).
       For real traffic, MapTiler / Stadia / Mapbox drop straight into this
       list with a key in the URL. */
    var PROVIDERS = [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
        maxZoom: 16,
        invert: false
      },
      {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        invert: true
      }
    ];

    // id, city, address, phone, lat, lng, isHQ
    var SITES = [
      ['tampa', 'Tampa', '1219 US-301, Tampa, FL 33619', '(813) 626-8102', 27.9584, -82.3552, 1],
      ['atlanta', 'Atlanta', '1350 Collier Road, Atlanta, GA 30318', '(404) 410-5574', 33.8110, -84.4321, 0],
      ['broward', 'Broward', '1800 SW 42nd Way, Deerfield Beach, FL 33442', '(954) 379-8103', 26.2914, -80.1595, 0],
      ['ft-myers', 'Ft. Myers', '1901 Benchmark Ave., Fort Myers, FL 33905', '(239) 369-1000', 26.6425, -81.8204, 0],
      ['jacksonville', 'Jacksonville', '12849 Philips Hwy, Jacksonville, FL 32256', '(904) 448-9275', 30.1391, -81.5131, 0],
      ['lake-city', 'Lake City', '4176 S US Highway 441, Lake City, FL 32025', '(904) 601-0692', 30.1170, -82.6320, 0],
      ['miami', 'Miami', '10653 W Okeechobee Rd, Hialeah Gardens, FL 33018', '(305) 885-4009', 25.8880, -80.3600, 0],
      ['mulberry', 'Mulberry', '4645 FL-60, Mulberry, FL 33860', '(863) 425-8857', 27.9278, -82.0366, 0],
      ['ocala', 'Ocala', '1604 NW 38th Ave, Ocala, FL 34482', '(352) 867-5438', 29.2031, -82.1859, 0],
      ['orlando', 'Orlando', '596 Thorpe Road, Orlando, FL 32824', '(407) 851-2930', 28.4278, -81.3868, 0],
      ['panama-city', 'Panama City', '6933 Bayou George Dr., Panama City, FL 32404', '(855) 650-7467', 30.2560, -85.5330, 0],
      ['pinellas', 'Pinellas', '6675 114th Ave, Largo, FL 33773', '(726) 405-1178', 27.8760, -82.7303, 0],
      ['space-coast', 'Space Coast', '6855 Tico Road, Titusville, FL 32780', '(321) 289-3099', 28.5137, -80.7911, 0],
      ['tallahassee', 'Tallahassee', '4897 Capital Circle NW, Tallahassee, FL 32303', '(850) 273-7069', 30.5204, -84.3645, 0],
      ['vero-beach', 'Vero Beach', '936 Old Dixie Hwy, Vero Beach, FL 32960', '(772) 569-6161', 27.6188, -80.3916, 0],
      ['west-palm-beach', 'West Palm Beach', '363 Tall Pines Rd, West Palm Beach, FL 33413', '(561) 328-2010', 26.6825, -80.1498, 0]
    ];

    var map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true, zoomSnap: 0, zoomDelta: 0.5 });
    var hint = document.getElementById('simsMapHint');
    var baseLayer = null;
    var labelLayer = null;

    function useProvider(i) {
      var pr = PROVIDERS[i];
      if (!pr) { if (hint) hint.hidden = false; return; }

      if (baseLayer) map.removeLayer(baseLayer);
      if (labelLayer) { map.removeLayer(labelLayer); labelLayer = null; }

      var loaded = 0, failed = 0, movedOn = false;
      mapEl.classList.toggle('is-inverted', !!pr.invert);

      baseLayer = L.tileLayer(pr.url, {
        attribution: pr.attribution,
        maxZoom: pr.maxZoom
      }).addTo(map);

      if (pr.labels) {
        labelLayer = L.tileLayer(pr.labels, { maxZoom: pr.maxZoom }).addTo(map);
      }

      baseLayer.on('tileload', function () {
        loaded++;
        if (hint) hint.hidden = true;
      });

      baseLayer.on('tileerror', function () {
        failed++;
        // only abandon a provider that has served nothing at all
        if (movedOn || loaded > 0 || failed <= 5) return;
        movedOn = true;
        useProvider(i + 1);
      });
    }

    useProvider(0);

    var marks = {};

    SITES.forEach(function (s) {
      var id = s[0], city = s[1], addr = s[2], tel = s[3], lat = s[4], lng = s[5], hq = s[6];
      var size = hq ? 20 : 14;

      var marker = L.marker([lat, lng], {
        title: city,
        icon: L.divIcon({
          className: '',
          html: '<div class="pin' + (hq ? ' pin--hq' : '') + '"></div>',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        })
      }).addTo(map);

      marker.bindPopup(
        '<b>' + city + (hq ? ' \u2014 Headquarters' : '') + '</b>' +
        '<span>' + addr + '</span>' +
        '<a href="tel:' + tel.replace(/\D/g, '') + '">' + tel + '</a>' +
        '<a class="locs__popuplink" href="https://simscrane.com/' + id + '/">View location details</a>'
      );

      marks[id] = marker;
    });

    var BOUNDS = L.latLngBounds(SITES.map(function (s) { return [s[4], s[5]]; }));
    // The southernmost branch is Miami, so a pin-only fit clips the bottom of
    // the state. Stretch the frame down to the Keys to keep the whole Florida
    // peninsula in view.
    BOUNDS.extend([24.45, -81.80]);
    var FIT = { padding: [28, 36], animate: false };
    map.fitBounds(BOUNDS, FIT);

    // once a city has been chosen, stop re-framing the map on resize
    var locked = false;

    var buttons = document.querySelectorAll('[data-loc]');

    function setActive(id) {
      Array.prototype.forEach.call(buttons, function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-loc') === id);
      });
    }

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-loc');
        var marker = marks[id];
        if (!marker) return;
        locked = true;
        setActive(id);
        map.flyTo(marker.getLatLng(), 9, { duration: .7 });
        marker.openPopup();
      });
    });

    map.on('popupopen', function (e) {
      Object.keys(marks).forEach(function (id) {
        if (marks[id] === e.popup._source) setActive(id);
      });
    });
    map.on('popupclose', function () { setActive(null); });

    // the map is laid out before it is measured, so re-fit once it settles
    var refit = function () {
      map.invalidateSize(false);
      if (!locked) map.fitBounds(BOUNDS, FIT);
    };
    window.addEventListener('load', refit);
    window.setTimeout(refit, 150);
    if (window.ResizeObserver) new ResizeObserver(refit).observe(mapEl);
  }

  /* ---------- Stat band count-up ----------
     Each [data-count-to] span animates from data-count-from (default 0) to its
     target the first time the band scrolls into view. The literal final number
     stays in the markup so it still reads correctly with JS off. */
  var counters = document.querySelectorAll('[data-count-to]');
  if (counters.length) {
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canAnimate = !reduceMotion && typeof window.requestAnimationFrame === 'function';

    var readFrom = function (el) {
      var from = parseFloat(el.getAttribute('data-count-from'));
      return isNaN(from) ? 0 : from;
    };

    var runCount = function (el) {
      if (el.getAttribute('data-counted')) return;
      el.setAttribute('data-counted', '1');

      var to = parseFloat(el.getAttribute('data-count-to'));
      if (isNaN(to)) return;
      if (!canAnimate) { el.textContent = String(to); return; }

      var from = readFrom(el);
      var duration = 1500;
      var started = 0;

      var step = function (now) {
        if (!started) started = now;
        var t = Math.min((now - started) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(from + (to - from) * eased));
        if (t < 1) window.requestAnimationFrame(step);
        else el.textContent = String(to);
      };
      window.requestAnimationFrame(step);
    };

    if (canAnimate) {
      // Seed the start value so the band never flashes its final numbers first.
      Array.prototype.forEach.call(counters, function (el) {
        el.textContent = String(readFrom(el));
      });
    }

    if (canAnimate && 'IntersectionObserver' in window) {
      var statObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCount(entry.target);
          statObserver.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      Array.prototype.forEach.call(counters, function (el) { statObserver.observe(el); });
    } else {
      Array.prototype.forEach.call(counters, function (el) { runCount(el); });
    }
  }

}());
