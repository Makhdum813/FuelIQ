/*!
 * FuelIQ — E20 Fuel Economics Analytics
 * https://fueliq-app.netlify.app/
 *
 * Copyright (c) 2026 Makhdumhusain Kodkeri
 * Released under the MIT License. You may reuse and modify this code,
 * provided this copyright notice and the licence text are retained.
 * https://github.com/Makhdum813
 */
// Service worker for the E20 Mileage & Cost Impact Calculator.
// Caches the app shell (HTML, manifest, icons) so the calculator itself
// works offline. Requests to other origins (e.g. the Wikipedia vehicle-image
// lookup) are always sent to the network and never cached here, since that
// feature is explicitly online-only.

const CACHE_NAME = 'e20-calculator-v15';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './assets/logo.png',
  './app.js',
  './utils/format.js',
  './utils/shareLink.js',
  './utils/csvExport.js',
  './storage/storage.js',
  './modules/vehicleProfiles.js',
  './modules/calculationHistory.js',
  './modules/fuelLog.js',
  './modules/calcEngine.js',
  './modules/tripCalculator.js',
  './modules/budgetPlanner.js',
  './modules/ownershipDashboard.js',
  './modules/insightsEngine.js',
  './modules/fuelBlend.js',
  './modules/co2Estimator.js',
  './modules/vehicleCompare.js',
  './modules/advancedMode.js',
  './modules/navigation.js',
  './modules/dataManagement.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
];

// On install, pre-cache the app shell and activate immediately.
self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){ return cache.addAll(APP_SHELL); })
      .then(function(){ return self.skipWaiting(); })
  );
});

// On activate, remove any old versioned caches and take control right away.
self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

// Cache-first for same-origin app-shell files; network-only passthrough
// for everything else (cross-origin API calls like Wikipedia).
self.addEventListener('fetch', function(event){
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if(!isSameOrigin){
    // Let cross-origin requests (Wikipedia image/summary lookups) go straight
    // to the network — they're explicitly an online-only feature.
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;
      return fetch(event.request).then(function(response){
        // Opportunistically cache newly-seen same-origin assets.
        if(response && response.status === 200){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, clone); });
        }
        return response;
      }).catch(function(){
        // If offline and not cached, fall back to the cached index for navigations.
        if(event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
