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
 * modules/ownershipDashboard.js
 * ---------------------------------------------------------------------------
 * Projects the E20 mileage penalty forward across time: how much has it
 * likely cost so far, and what would 1/3/5 years look like at the same
 * driving pattern. Deliberately simple, linear arithmetic — no attempt to
 * model fuel-price inflation or changing driving habits, since that would
 * imply a precision this tool doesn't have. The UI copy says as much.
 *
 * Exposed as window.E20.ownership
 */
(function (global) {
  "use strict";

  // params: { monthsOnE20, extraMonthlyCost, extraYearlyCost }
  function calculateOwnership(params) {
    const monthsOnE20 = isFinite(params.monthsOnE20) && params.monthsOnE20 >= 0 ? params.monthsOnE20 : 0;
    const extraMonthlyCost = isFinite(params.extraMonthlyCost) ? params.extraMonthlyCost : 0;
    const extraYearlyCost = isFinite(params.extraYearlyCost) ? params.extraYearlyCost : 0;

    return {
      totalSoFar: extraMonthlyCost * monthsOnE20,
      projection1yr: extraYearlyCost * 1,
      projection3yr: extraYearlyCost * 3,
      projection5yr: extraYearlyCost * 5,
    };
  }

  global.E20 = global.E20 || {};
  global.E20.ownership = { calculateOwnership: calculateOwnership };
})(window);
