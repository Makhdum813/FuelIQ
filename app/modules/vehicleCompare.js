/**
 * modules/vehicleCompare.js
 * ---------------------------------------------------------------------------
 * Runs the shared calcEngine against two vehicles' mileage figures under the
 * same shared assumptions (mileage-drop %, petrol price, monthly distance),
 * so their results are directly comparable. Pure orchestration — no DOM,
 * no storage; app.js supplies the two vehicle records and renders the output.
 *
 * Exposed as window.E20.vehicleCompare
 */
(function (global) {
  "use strict";

  const calcEngine = global.E20.calcEngine;

  // vehicleA / vehicleB: { name, mileage } (mileage may be null if never set)
  // shared: { mileageDropPct, petrolPrice, amountPurchased, monthlyKm }
  function compare(vehicleA, vehicleB, shared) {
    function resultFor(vehicle) {
      const mileage = vehicle && isFinite(vehicle.mileage) && vehicle.mileage > 0 ? vehicle.mileage : 0;
      return calcEngine.calculate({
        originalMileage: mileage,
        mileageDropPct: shared.mileageDropPct,
        petrolPrice: shared.petrolPrice,
        amountPurchased: shared.amountPurchased,
        monthlyKm: shared.monthlyKm,
      });
    }

    const resultA = resultFor(vehicleA);
    const resultB = resultFor(vehicleB);

    return {
      a: { name: vehicleA ? vehicleA.name : "Vehicle A", result: resultA },
      b: { name: vehicleB ? vehicleB.name : "Vehicle B", result: resultB },
      // Positive means B's post-E20 monthly fuel cost is higher than A's.
      monthlyCostDeltaBvsA: resultB.monthlyFuelCostAfter - resultA.monthlyFuelCostAfter,
    };
  }

  global.E20 = global.E20 || {};
  global.E20.vehicleCompare = { compare: compare };
})(window);
