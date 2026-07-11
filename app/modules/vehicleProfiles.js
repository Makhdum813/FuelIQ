/**
 * modules/vehicleProfiles.js
 * ---------------------------------------------------------------------------
 * CRUD for saved vehicle profiles (type, company, model, mileage, fuel type)
 * plus tracking which profile is currently "active" (selected). Persists via
 * window.E20.storage. Pure data layer — no DOM here; app.js renders it.
 *
 * Exposed as window.E20.vehicles
 */
(function (global) {
  "use strict";

  const storage = global.E20.storage;

  const FUEL_TYPES = ["Petrol", "Petrol (E20)", "CNG", "Diesel"];

  function list() {
    return storage.getVehicles();
  }

  function getById(id) {
    return list().find(function (v) { return v.id === id; }) || null;
  }

  // Create and persist a new vehicle profile. Returns the created record.
  function create(data) {
    const vehicles = list();
    const now = Date.now();
    const record = {
      id: storage.generateId("veh"),
      name: (data.name || "").trim() || (data.company + " " + data.model).trim() || "My Vehicle",
      type: data.type || "car",
      company: (data.company || "").trim(),
      model: (data.model || "").trim(),
      mileage: isFinite(data.mileage) ? Number(data.mileage) : null,
      fuelType: FUEL_TYPES.includes(data.fuelType) ? data.fuelType : "Petrol",
      createdAt: now,
      updatedAt: now,
    };
    vehicles.push(record);
    storage.saveVehicles(vehicles);
    return record;
  }

  // Update an existing profile in place. Returns the updated record, or null
  // if no profile with that id exists.
  function update(id, patch) {
    const vehicles = list();
    const idx = vehicles.findIndex(function (v) { return v.id === id; });
    if (idx === -1) return null;
    vehicles[idx] = Object.assign({}, vehicles[idx], patch, { updatedAt: Date.now() });
    storage.saveVehicles(vehicles);
    return vehicles[idx];
  }

  // Delete a profile. Also clears it as the active vehicle if it was active,
  // and detaches (but does not delete) any fuel-log entries tied to it —
  // history/fuel-log modules handle their own cleanup via onVehicleDeleted.
  function remove(id) {
    const vehicles = list().filter(function (v) { return v.id !== id; });
    storage.saveVehicles(vehicles);
    if (storage.getActiveVehicleId() === id) {
      storage.setActiveVehicleId(vehicles.length ? vehicles[0].id : null);
    }
    return vehicles;
  }

  function getActive() {
    const id = storage.getActiveVehicleId();
    if (!id) return null;
    return getById(id);
  }

  function setActive(id) {
    storage.setActiveVehicleId(id);
  }

  global.E20 = global.E20 || {};
  global.E20.vehicles = {
    FUEL_TYPES: FUEL_TYPES,
    list: list,
    getById: getById,
    create: create,
    update: update,
    remove: remove,
    getActive: getActive,
    setActive: setActive,
  };
})(window);
