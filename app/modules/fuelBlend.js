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
 * modules/fuelBlend.js
 * ---------------------------------------------------------------------------
 * Compares mileage and cost-per-km across ethanol blends (E0/E10/E20/E85)
 * using a simplified energy-density scaling model:
 *
 *   energyDensity(blend%) = (1 - blend%/100) * petrolMJPerL + (blend%/100) * ethanolMJPerL
 *   mileage(blend%) = mileageAtReferenceBlend * energyDensity(blend%) / energyDensity(referenceBlend%)
 *
 * Reference constants (verified against IEA Advanced Motor Fuels and US DOE
 * fuel-property data): petrol ≈ 32 MJ/L, ethanol ≈ 21 MJ/L.
 *
 * IMPORTANT METHODOLOGY NOTE: this is a *different* model from the main
 * calculator's E10→E20 "Mileage Drop %" figure. The main calculator uses an
 * empirically-sourced drop percentage (NITI Aayog / ARAI real-world testing),
 * because real mileage change isn't purely proportional to energy content —
 * engine calibration, octane response, and ECU tuning all matter too. This
 * module's energy-density model is a physics-based approximation used only
 * to *rank* blends relative to each other; it will not exactly match the
 * empirical figure above, and the UI must say so rather than presenting two
 * silently-conflicting numbers.
 *
 * Exposed as window.E20.fuelBlend
 */
(function (global) {
  "use strict";

  const PETROL_MJ_PER_L = 32;
  const ETHANOL_MJ_PER_L = 21;

  const BLENDS = [
    { key: "E0", ethanolPct: 0, label: "E0 (Pure Petrol)", availableInIndia: true },
    { key: "E10", ethanolPct: 10, label: "E10", availableInIndia: true },
    { key: "E20", ethanolPct: 20, label: "E20 (Current)", availableInIndia: true },
    { key: "E85", ethanolPct: 85, label: "E85 (Flex-Fuel)", availableInIndia: false },
  ];

  function energyDensity(ethanolPct) {
    const frac = ethanolPct / 100;
    return (1 - frac) * PETROL_MJ_PER_L + frac * ETHANOL_MJ_PER_L;
  }

  // params: { referenceMileage, referenceEthanolPct, petrolPrice }
  // referenceMileage/referenceEthanolPct describe the blend the user's
  // "Original Mileage" figure was actually measured on — E10, in this app's
  // convention, since that's what "before E20" means throughout.
  function compareBlends(params) {
    const referenceMileage = isFinite(params.referenceMileage) && params.referenceMileage > 0 ? params.referenceMileage : 0;
    const referenceEthanolPct = isFinite(params.referenceEthanolPct) ? params.referenceEthanolPct : 10;
    const petrolPrice = isFinite(params.petrolPrice) && params.petrolPrice > 0 ? params.petrolPrice : 0;
    const referenceDensity = energyDensity(referenceEthanolPct);

    return BLENDS.map(function (blend) {
      const mileage = referenceDensity > 0
        ? referenceMileage * (energyDensity(blend.ethanolPct) / referenceDensity)
        : 0;
      const costPerKm = mileage > 0 ? petrolPrice / mileage : 0;
      return {
        key: blend.key,
        label: blend.label,
        ethanolPct: blend.ethanolPct,
        availableInIndia: blend.availableInIndia,
        mileage: mileage,
        costPerKm: costPerKm,
        isReference: blend.ethanolPct === referenceEthanolPct,
      };
    });
  }

  global.E20 = global.E20 || {};
  global.E20.fuelBlend = {
    BLENDS: BLENDS,
    energyDensity: energyDensity,
    compareBlends: compareBlends,
    PETROL_MJ_PER_L: PETROL_MJ_PER_L,
    ETHANOL_MJ_PER_L: ETHANOL_MJ_PER_L,
  };
})(window);
