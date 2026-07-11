/**
 * modules/co2Estimator.js
 * ---------------------------------------------------------------------------
 * Estimates tailpipe CO2 from monthly/yearly fuel use, before vs after E20.
 *
 * METHODOLOGY (stated plainly because this is a genuinely contested area):
 *  - Standard combustion emission factor for petrol: 2.31 kg CO2 per litre
 *    (EPA / GHG Protocol / IPCC AR6 mobile-combustion convention).
 *  - Ethanol's combustion carbon is conventionally treated as *biogenic* —
 *    the CO2 released was absorbed by the crop that made the ethanol, so
 *    standard national GHG inventories (following IPCC guidance) report it
 *    separately from fossil CO2, often as zero net fossil contribution.
 *  - This module follows that convention: it applies the 2.31 kg/L factor
 *    only to the *non-ethanol* (fossil) share of the blend by volume.
 *  - This is a TAILPIPE, FOSSIL-CARBON-ONLY estimate. It explicitly does
 *    NOT include upstream/well-to-wheel emissions (ethanol production,
 *    land use change, fuel transport) — that is a materially different and
 *    more contested calculation. The UI must say this, not just this file.
 *
 * Exposed as window.E20.co2Estimator
 */
(function (global) {
  "use strict";

  const PETROL_CO2_KG_PER_L = 2.31;

  function fossilEmissionFactor(ethanolPct) {
    const frac = isFinite(ethanolPct) ? ethanolPct / 100 : 0;
    return PETROL_CO2_KG_PER_L * (1 - frac);
  }

  // params: { originalMileage, newMileage, monthlyKm, beforeEthanolPct, afterEthanolPct }
  // beforeEthanolPct/afterEthanolPct default to 10 (E10) and 20 (E20) to match
  // this app's "before/after" framing, but are parameterised so the fuel-blend
  // comparison feature can reuse this for other blends later if needed.
  function estimate(params) {
    const originalMileage = isFinite(params.originalMileage) && params.originalMileage > 0 ? params.originalMileage : 0;
    const newMileage = isFinite(params.newMileage) && params.newMileage > 0 ? params.newMileage : 0;
    const monthlyKm = isFinite(params.monthlyKm) && params.monthlyKm > 0 ? params.monthlyKm : 0;
    const beforeEthanolPct = isFinite(params.beforeEthanolPct) ? params.beforeEthanolPct : 10;
    const afterEthanolPct = isFinite(params.afterEthanolPct) ? params.afterEthanolPct : 20;

    const litresPerMonthBefore = originalMileage > 0 ? monthlyKm / originalMileage : 0;
    const litresPerMonthAfter = newMileage > 0 ? monthlyKm / newMileage : 0;

    const factorBefore = fossilEmissionFactor(beforeEthanolPct);
    const factorAfter = fossilEmissionFactor(afterEthanolPct);

    const co2MonthlyBefore = litresPerMonthBefore * factorBefore;
    const co2MonthlyAfter = litresPerMonthAfter * factorAfter;
    const co2YearlyBefore = co2MonthlyBefore * 12;
    const co2YearlyAfter = co2MonthlyAfter * 12;

    return {
      litresPerMonthBefore, litresPerMonthAfter,
      co2MonthlyBefore, co2MonthlyAfter,
      co2YearlyBefore, co2YearlyAfter,
      co2YearlyDelta: co2YearlyAfter - co2YearlyBefore,
      factorBefore, factorAfter,
    };
  }

  global.E20 = global.E20 || {};
  global.E20.co2Estimator = {
    estimate: estimate,
    fossilEmissionFactor: fossilEmissionFactor,
    PETROL_CO2_KG_PER_L: PETROL_CO2_KG_PER_L,
  };
})(window);
