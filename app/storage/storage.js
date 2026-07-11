/**
 * storage/storage.js
 * ---------------------------------------------------------------------------
 * Single gateway to localStorage for the whole app. Nothing else in the
 * codebase should call localStorage directly — every read/write for vehicle
 * profiles, calculation history, fuel logs, and settings goes through here.
 *
 * Why centralise this:
 *  - one place to version/migrate the schema if it changes later
 *  - one place to guard against corrupted/partial JSON, quota errors, and
 *    private-browsing modes where localStorage can throw
 *  - callers get plain JS arrays/objects back, never raw strings
 *
 * Exposed as window.E20.storage (no build step, no ES modules — see app.js
 * header for why plain scripts were chosen over import/export).
 */
(function (global) {
  "use strict";

  const SCHEMA_VERSION = 1;

  const KEYS = {
    schemaVersion: "e20:schemaVersion",
    vehicles: "e20:vehicles",
    activeVehicleId: "e20:activeVehicleId",
    history: "e20:history",
    fuelLogs: "e20:fuelLogs",
    settings: "e20:settings",
  };

  // Safe JSON read: returns fallback on missing key, corrupted JSON, or a
  // localStorage access error (e.g. private browsing / disabled storage).
  function readJSON(key, fallback) {
    try {
      const raw = global.localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (err) {
      console.warn("[storage] read failed for", key, err);
      return fallback;
    }
  }

  // Safe JSON write: swallows quota/availability errors rather than crashing
  // the calculator — persistence is a nice-to-have, not a hard dependency.
  function writeJSON(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn("[storage] write failed for", key, err);
      return false;
    }
  }

  // Runs once at load: ensures the schema version key exists and gives us a
  // hook for future migrations (e.g. if the vehicle-profile shape changes).
  function ensureSchema() {
    const current = readJSON(KEYS.schemaVersion, null);
    if (current === null) {
      writeJSON(KEYS.schemaVersion, SCHEMA_VERSION);
      return;
    }
    if (current < SCHEMA_VERSION) {
      // Placeholder for real migrations as the schema evolves. Nothing to
      // migrate yet at v1, so just stamp the new version.
      writeJSON(KEYS.schemaVersion, SCHEMA_VERSION);
    }
  }

  function generateId(prefix) {
    return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  const storage = {
    KEYS,
    generateId,

    // ---- Vehicles ----
    getVehicles() {
      return readJSON(KEYS.vehicles, []);
    },
    saveVehicles(list) {
      return writeJSON(KEYS.vehicles, list);
    },
    getActiveVehicleId() {
      return readJSON(KEYS.activeVehicleId, null);
    },
    setActiveVehicleId(id) {
      return writeJSON(KEYS.activeVehicleId, id);
    },

    // ---- Calculation history ----
    getHistory() {
      return readJSON(KEYS.history, []);
    },
    saveHistory(list) {
      return writeJSON(KEYS.history, list);
    },

    // ---- Fuel logs ----
    getFuelLogs() {
      return readJSON(KEYS.fuelLogs, []);
    },
    saveFuelLogs(list) {
      return writeJSON(KEYS.fuelLogs, list);
    },

    // ---- Settings ----
    getSettings() {
      return readJSON(KEYS.settings, { theme: null });
    },
    saveSettings(settings) {
      return writeJSON(KEYS.settings, settings);
    },

    // ---- Diagnostics ----
    isAvailable() {
      try {
        const testKey = "__e20_storage_test__";
        global.localStorage.setItem(testKey, "1");
        global.localStorage.removeItem(testKey);
        return true;
      } catch (err) {
        return false;
      }
    },
  };

  ensureSchema();

  global.E20 = global.E20 || {};
  global.E20.storage = storage;
})(window);
