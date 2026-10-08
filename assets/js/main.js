/* ==========================================================================
   Sims Crane & Equipment — main.js
   Header nav (mobile drawer + submenus), FAQ accordion, sticky header state,
   careers role/location pickers
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
     Leaflet over OpenStreetMap raster tiles, restyled dark in main.css.
     TILE_URL is the single place to swap in a commercial tile provider. */
  var mapEl = document.getElementById('simsMap');

  if (mapEl && window.L) {
    // CARTO dark basemap. Natively dark, so no CSS filter is applied over it.
    // openstreetmap.org's own tile server is NOT usable here: its usage policy
    // bars embedded/commercial use and it returns "Access blocked".
    // To swap providers, change these three values only:
    //   Esri (no key)  https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}
    //   Stadia/MapTiler/Mapbox - paid tiers, require an API key in the URL
    var TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    var TILE_SUBS = 'abcd';
    var TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

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

    var map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true });
    var tiles = L.tileLayer(TILE_URL, {
      attribution: TILE_ATTR,
      subdomains: TILE_SUBS,
      maxZoom: 20
    }).addTo(map);

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
        '<a href="tel:' + tel.replace(/\D/g, '') + '">' + tel + '</a>'
      );

      marks[id] = marker;
    });

    var bounds = L.latLngBounds(SITES.map(function (s) { return [s[4], s[5]]; })).pad(0.12);
    map.fitBounds(bounds);

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

    // if the tile provider refuses or the network blocks it, say so rather
    // than leaving a black rectangle
    var tileFails = 0;
    var hint = document.getElementById('simsMapHint');
    tiles.on('tileerror', function () {
      tileFails++;
      if (hint && tileFails > 6) hint.hidden = false;
    });
    tiles.on('tileload', function () { if (hint) hint.hidden = true; });

    // the map is laid out before it is measured, so re-fit once it settles
    var refit = function () { map.invalidateSize(false); };
    window.addEventListener('load', refit);
    window.setTimeout(refit, 150);
    if (window.ResizeObserver) new ResizeObserver(refit).observe(mapEl);
  }
}());
