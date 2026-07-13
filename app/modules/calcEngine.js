/*!
 * FuelIQ — E20 Fuel Economics Analytics
 * https://fueliq-app.netlify.app/
 *
 * Copyright (c) 2026 Makhdumhusain Kodkeri
 * Released under the MIT License. You may reuse and modify this code,
 * provided this copyright notice and the licence text are retained.
 * https://github.com/Makhdum813
 */
/**
 * modules/calcEngine.js
 * ---------------------------------------------------------------------------
 * The single source of truth for the E20 mileage/cost formulas. Originally
 * lived inline in app.js as a form-reading function; extracted so the new
 * two-vehicle comparison feature can run the exact same math against a
 * second vehicle's numbers without copy-pasting the formulas (and risking
 * them drifting apart later).
 *
 * Pure function: takes plain numeric inputs, returns a plain results object.
 * No DOM access here — app.js is responsible for reading form fields into
 * this shape and rendering the result back out.
 *
 * Exposed as window.E20.calcEngine
 */
(function (global) {
  "use strict";

  // inputs: { originalMileage, mileageDropPct, petrolPrice, amountPurchased, monthlyKm }
  function calculate(inputs) {
    const originalMileage = isFinite(inputs.originalMileage) ? inputs.originalMileage : 0;
    const mileageDropPct = isFinite(inputs.mileageDropPct) ? inputs.mileageDropPct : 0;
    const petrolPrice = isFinite(inputs.petrolPrice) ? inputs.petrolPrice : 0;
    const amountPurchased = isFinite(inputs.amountPurchased) ? inputs.amountPurchased : 0;
    const monthlyKm = isFinite(inputs.monthlyKm) ? inputs.monthlyKm : 0;

    // 1. New mileage after E20 drop
    const newMileage = originalMileage * (1 - mileageDropPct / 100);

    // 2. Distance assumed equal to original mileage value; fuel needed at new mileage to cover it
    const referenceDistance = originalMileage;
    const fuelForRefDistanceNew = newMileage > 0 ? referenceDistance / newMileage : 0;
    const costForRefDistanceNew = fuelForRefDistanceNew * petrolPrice;
    const fuelForRefDistanceOrig = originalMileage > 0 ? referenceDistance / originalMileage : 0;
    const costForRefDistanceOrig = fuelForRefDistanceOrig * petrolPrice;
    const extraCostRefDistance = costForRefDistanceNew - costForRefDistanceOrig;

    // 3. Fuel purchased with the given rupee amount
    const fuelPurchased = petrolPrice > 0 ? amountPurchased / petrolPrice : 0;

    // 4 & 5. Distance covered before/after E20 with that fuel
    const distanceBefore = fuelPurchased * originalMileage;
    const distanceAfter = fuelPurchased * newMileage;

    // 6. Distance lost
    const distanceLost = distanceBefore - distanceAfter;

    // 7. Cost of lost distance (at original mileage/efficiency)
    const fuelNeededForLost = originalMileage > 0 ? distanceLost / originalMileage : 0;
    const costOfLostDistance = fuelNeededForLost * petrolPrice;

    // 8. Extra cost to actually travel that lost distance using new (worse) mileage
    const fuelNeededForLostAtNewMileage = newMileage > 0 ? distanceLost / newMileage : 0;
    const costToTravelLostAtNewMileage = fuelNeededForLostAtNewMileage * petrolPrice;
    const extraCostForLostDistance = costToTravelLostAtNewMileage - costOfLostDistance;

    // 9. Cost per km before/after
    const costPerKmBefore = originalMileage > 0 ? petrolPrice / originalMileage : 0;
    const costPerKmAfter = newMileage > 0 ? petrolPrice / newMileage : 0;

    // 10. Monthly & yearly impact
    const monthlyFuelCostBefore = costPerKmBefore * monthlyKm;
    const monthlyFuelCostAfter = costPerKmAfter * monthlyKm;
    const extraMonthlyCost = monthlyFuelCostAfter - monthlyFuelCostBefore;
    const extraYearlyCost = extraMonthlyCost * 12;

    return {
      originalMileage, mileageDropPct, petrolPrice, amountPurchased, monthlyKm,
      newMileage, referenceDistance, fuelForRefDistanceNew, costForRefDistanceNew,
      fuelForRefDistanceOrig, costForRefDistanceOrig, extraCostRefDistance,
      fuelPurchased, distanceBefore, distanceAfter, distanceLost,
      fuelNeededForLost, costOfLostDistance,
      fuelNeededForLostAtNewMileage, costToTravelLostAtNewMileage, extraCostForLostDistance,
      costPerKmBefore, costPerKmAfter,
      monthlyFuelCostBefore, monthlyFuelCostAfter, extraMonthlyCost, extraYearlyCost,
    };
  }

  global.E20 = global.E20 || {};
  global.E20.calcEngine = { calculate: calculate };
})(window);
