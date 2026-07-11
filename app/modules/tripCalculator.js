/**
 * modules/tripCalculator.js
 * ---------------------------------------------------------------------------
 * One-way / round-trip fuel cost estimator. Pure function — takes a plain
 * params object, returns a plain results object. No DOM, no storage.
 *
 * Exposed as window.E20.tripCalculator
 */
(function (global) {
  "use strict";

  // params: { distanceKm, isRoundTrip, mileageBefore, mileageAfter, petrolPrice }
  // All distances/mileages must be positive; caller (app.js) is responsible
  // for validating raw input before calling this, but we still guard against
  // divide-by-zero and non-finite values defensively.
  function calculateTrip(params) {
    const distanceKm = isFinite(params.distanceKm) && params.distanceKm > 0 ? params.distanceKm : 0;
    const totalDistance = params.isRoundTrip ? distanceKm * 2 : distanceKm;
    const mileageBefore = isFinite(params.mileageBefore) && params.mileageBefore > 0 ? params.mileageBefore : 1;
    const mileageAfter = isFinite(params.mileageAfter) && params.mileageAfter > 0 ? params.mileageAfter : 1;
    const petrolPrice = isFinite(params.petrolPrice) && params.petrolPrice > 0 ? params.petrolPrice : 0;

    const fuelBefore = totalDistance / mileageBefore;
    const fuelAfter = totalDistance / mileageAfter;
    const costBefore = fuelBefore * petrolPrice;
    const costAfter = fuelAfter * petrolPrice;

    return {
      oneWayDistance: distanceKm,
      totalDistance: totalDistance,
      fuelBefore: fuelBefore,
      fuelAfter: fuelAfter,
      costBefore: costBefore,
      costAfter: costAfter,
      extraCost: costAfter - costBefore,
    };
  }

  global.E20 = global.E20 || {};
  global.E20.tripCalculator = { calculateTrip: calculateTrip };
})(window);
