/**
 * modules/fuelLog.js
 * ---------------------------------------------------------------------------
 * Tracks real-world fuel fill-ups per vehicle (date, odometer reading,
 * litres filled, amount paid) and derives actual measured mileage between
 * consecutive fills using the standard full-to-full method:
 *
 *   realMileage (km/L) = (odometer_now - odometer_previous) / litres_now
 *
 * This is deliberately separate from the "Original Mileage" input on the
 * main calculator — a user can log a handful of fill-ups here and pull the
 * measured average back into the calculator, instead of guessing.
 *
 * Pure data + derivation layer. Exposed as window.E20.fuelLog
 */
(function (global) {
  "use strict";

  const storage = global.E20.storage;

  function list() {
    return storage.getFuelLogs();
  }

  function listForVehicle(vehicleId) {
    return list()
      .filter(function (e) { return e.vehicleId === vehicleId; })
      .sort(function (a, b) { return a.odometer - b.odometer; });
  }

  // Add a fill-up entry. Expects { vehicleId, date, odometer, litres, amount }.
  // All numeric fields are coerced/validated by the caller (app.js) before
  // reaching here; this layer just persists and derives.
  function add(entry) {
    const entries = list();
    const record = {
      id: storage.generateId("fuel"),
      vehicleId: entry.vehicleId,
      date: entry.date,
      odometer: Number(entry.odometer),
      litres: Number(entry.litres),
      amount: Number(entry.amount),
      createdAt: Date.now(),
    };
    entries.push(record);
    storage.saveFuelLogs(entries);
    return record;
  }

  function remove(id) {
    const entries = list().filter(function (e) { return e.id !== id; });
    storage.saveFuelLogs(entries);
    return entries;
  }

  function removeAllForVehicle(vehicleId) {
    const entries = list().filter(function (e) { return e.vehicleId !== vehicleId; });
    storage.saveFuelLogs(entries);
  }

  // Returns the vehicle's log entries in odometer order, each annotated with
  // a derived `realMileage` (km/L) and `distance` (km) versus the previous
  // entry. The first entry in the series has no previous odometer to compare
  // against, so realMileage is null for it.
  function withDerivedMileage(vehicleId) {
    const entries = listForVehicle(vehicleId);
    let prevOdometer = null;
    return entries.map(function (e) {
      let realMileage = null;
      let distance = null;
      if (prevOdometer !== null && e.litres > 0) {
        distance = e.odometer - prevOdometer;
        realMileage = distance > 0 ? distance / e.litres : null;
      }
      prevOdometer = e.odometer;
      return Object.assign({}, e, { realMileage: realMileage, distance: distance });
    });
  }

  // Average measured mileage across all derivable fill-ups for a vehicle.
  // Returns null if there isn't at least one complete odometer-to-odometer
  // pair yet (i.e. fewer than 2 entries).
  function averageMileage(vehicleId) {
    const derived = withDerivedMileage(vehicleId).filter(function (e) {
      return e.realMileage !== null && isFinite(e.realMileage) && e.realMileage > 0;
    });
    if (derived.length === 0) return null;
    const sum = derived.reduce(function (acc, e) { return acc + e.realMileage; }, 0);
    return sum / derived.length;
  }

  global.E20 = global.E20 || {};
  global.E20.fuelLog = {
    list: list,
    listForVehicle: listForVehicle,
    add: add,
    remove: remove,
    removeAllForVehicle: removeAllForVehicle,
    withDerivedMileage: withDerivedMileage,
    averageMileage: averageMileage,
  };
})(window);
