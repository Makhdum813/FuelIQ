/**
 * modules/budgetPlanner.js
 * ---------------------------------------------------------------------------
 * Answers "how far can I actually travel on ₹X of fuel, before vs after
 * E20?" — the inverse framing of the main calculator's distance-lost figure,
 * anchored to a budget the user actually has in mind. Pure function.
 *
 * Exposed as window.E20.budgetPlanner
 */
(function (global) {
  "use strict";

  // params: { budget, mileageBefore, mileageAfter, petrolPrice }
  function calculateBudget(params) {
    const budget = isFinite(params.budget) && params.budget > 0 ? params.budget : 0;
    const mileageBefore = isFinite(params.mileageBefore) && params.mileageBefore > 0 ? params.mileageBefore : 1;
    const mileageAfter = isFinite(params.mileageAfter) && params.mileageAfter > 0 ? params.mileageAfter : 1;
    const petrolPrice = isFinite(params.petrolPrice) && params.petrolPrice > 0 ? params.petrolPrice : 1;

    const litresAffordable = budget / petrolPrice;
    const distanceBefore = litresAffordable * mileageBefore;
    const distanceAfter = litresAffordable * mileageAfter;

    return {
      litresAffordable: litresAffordable,
      distanceBefore: distanceBefore,
      distanceAfter: distanceAfter,
      distanceLost: distanceBefore - distanceAfter,
    };
  }

  global.E20 = global.E20 || {};
  global.E20.budgetPlanner = { calculateBudget: calculateBudget };
})(window);
