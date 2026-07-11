/**
 * modules/advancedMode.js
 * ---------------------------------------------------------------------------
 * Optional, user-adjustable mileage modifiers for driving conditions: type
 * of driving, traffic, AC usage, tyre pressure, driving style, and vehicle
 * load. This does NOT touch calcEngine.js — it's a pre-processing step that
 * adjusts the "Original Mileage" figure before it ever reaches the shared
 * calculation engine, so the E20 formulas themselves stay untouched and
 * single-sourced.
 *
 * HONESTY NOTE (this matters — read before changing the percentages below):
 * unlike the mileage-drop-% reference table elsewhere in this app, these
 * modifier percentages are NOT drawn from a specific cited study. They're
 * reasonable, commonly-cited illustrative ranges for how driving conditions
 * affect fuel economy, meant as adjustable starting points for the user to
 * tune to their own experience — not as sourced facts. The UI must present
 * them that way (editable defaults, not authoritative figures), matching
 * how this project has handled every other estimate.
 *
 * Modifiers combine multiplicatively (each factor scales the running
 * mileage rather than summing percentages), so combined effects can never
 * push mileage to zero or negative, however many negative modifiers stack.
 *
 * Exposed as window.E20.advancedMode
 */
(function (global) {
  "use strict";

  const MODIFIER_GROUPS = {
    drivingType: {
      label: "Driving Type",
      options: [
        { id: "city", label: "City (stop-start)", pct: -12 },
        { id: "mixed", label: "Mixed", pct: 0 },
        { id: "highway", label: "Highway (steady speed)", pct: 10 },
      ],
      defaultId: "mixed",
    },
    traffic: {
      label: "Traffic Level",
      options: [
        { id: "light", label: "Light", pct: 0 },
        { id: "moderate", label: "Moderate", pct: -5 },
        { id: "heavy", label: "Heavy", pct: -10 },
      ],
      defaultId: "light",
    },
    ac: {
      label: "AC Usage",
      options: [
        { id: "off", label: "Off", pct: 0 },
        { id: "occasional", label: "Occasional", pct: -3 },
        { id: "frequent", label: "Frequent / Always On", pct: -7 },
      ],
      defaultId: "off",
    },
    tyrePressure: {
      label: "Tyre Pressure",
      options: [
        { id: "optimal", label: "Optimal (as recommended)", pct: 0 },
        { id: "slightlyLow", label: "Slightly Low", pct: -3 },
        { id: "veryLow", label: "Very Low", pct: -6 },
      ],
      defaultId: "optimal",
    },
    drivingStyle: {
      label: "Driving Style",
      options: [
        { id: "gentle", label: "Gentle / Eco", pct: 5 },
        { id: "normal", label: "Normal", pct: 0 },
        { id: "aggressive", label: "Aggressive (hard accel/braking)", pct: -10 },
      ],
      defaultId: "normal",
    },
    vehicleLoad: {
      label: "Vehicle Load",
      options: [
        { id: "light", label: "Solo / Light", pct: 0 },
        { id: "moderate", label: "Moderate (2–3 people)", pct: -3 },
        { id: "heavy", label: "Heavy (full load / luggage)", pct: -7 },
      ],
      defaultId: "light",
    },
  };

  function defaultSelections() {
    const selections = {};
    Object.keys(MODIFIER_GROUPS).forEach(function (key) {
      selections[key] = MODIFIER_GROUPS[key].defaultId;
    });
    return selections;
  }

  function optionFor(groupKey, optionId) {
    const group = MODIFIER_GROUPS[groupKey];
    if (!group) return null;
    return group.options.find(function (o) { return o.id === optionId; }) || null;
  }

  // Net multiplier from combining every selected modifier, e.g. 0.94 for a
  // net -6% effect. Unknown/missing selections are treated as neutral (0%).
  function netMultiplier(selections) {
    return Object.keys(MODIFIER_GROUPS).reduce(function (mult, key) {
      const opt = optionFor(key, selections[key]);
      const pct = opt ? opt.pct : 0;
      return mult * (1 + pct / 100);
    }, 1);
  }

  // baseMileage: the user's entered "Original Mileage" — treated as the
  // mileage under "typical/neutral" conditions, then adjusted.
  function computeAdjustedMileage(baseMileage, selections) {
    const safeBase = isFinite(baseMileage) && baseMileage > 0 ? baseMileage : 0;
    return safeBase * netMultiplier(selections);
  }

  global.E20 = global.E20 || {};
  global.E20.advancedMode = {
    MODIFIER_GROUPS: MODIFIER_GROUPS,
    defaultSelections: defaultSelections,
    optionFor: optionFor,
    netMultiplier: netMultiplier,
    computeAdjustedMileage: computeAdjustedMileage,
  };
})(window);
