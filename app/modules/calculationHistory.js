/**
 * modules/calculationHistory.js
 * ---------------------------------------------------------------------------
 * Stores a snapshot of each calculation the user chooses to save: the raw
 * inputs, the key computed outputs, which vehicle (if any) it was tied to,
 * and a timestamp. Supports search and delete. Pure data layer.
 *
 * A history entry is intentionally a flat, self-contained snapshot (not a
 * live re-computation) so it stays accurate even if formulas change later.
 *
 * Exposed as window.E20.history
 */
(function (global) {
  "use strict";

  const storage = global.E20.storage;
  const MAX_ENTRIES = 200; // keep history bounded so localStorage never bloats

  function list() {
    return storage.getHistory();
  }

  // Newest-first.
  function listSorted() {
    return list().slice().sort(function (a, b) { return b.timestamp - a.timestamp; });
  }

  function add(entry) {
    const entries = list();
    const record = {
      id: storage.generateId("hist"),
      timestamp: Date.now(),
      vehicleId: entry.vehicleId || null,
      vehicleName: entry.vehicleName || null,
      inputs: entry.inputs,
      outputs: entry.outputs,
      note: entry.note || "",
    };
    entries.unshift(record);
    if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
    storage.saveHistory(entries);
    return record;
  }

  function remove(id) {
    const entries = list().filter(function (e) { return e.id !== id; });
    storage.saveHistory(entries);
    return entries;
  }

  function clear() {
    storage.saveHistory([]);
  }

  // Case-insensitive search across vehicle name and note.
  function search(query) {
    const q = (query || "").trim().toLowerCase();
    const sorted = listSorted();
    if (!q) return sorted;
    return sorted.filter(function (e) {
      const haystack = ((e.vehicleName || "") + " " + (e.note || "")).toLowerCase();
      return haystack.indexOf(q) !== -1;
    });
  }

  // Called by app.js when a vehicle profile is deleted, so history entries
  // don't silently point at a vehicle that no longer exists.
  function detachVehicle(vehicleId) {
    const entries = list().map(function (e) {
      if (e.vehicleId === vehicleId) {
        return Object.assign({}, e, { vehicleId: null });
      }
      return e;
    });
    storage.saveHistory(entries);
  }

  global.E20 = global.E20 || {};
  global.E20.history = {
    list: list,
    listSorted: listSorted,
    add: add,
    remove: remove,
    clear: clear,
    search: search,
    detachVehicle: detachVehicle,
    MAX_ENTRIES: MAX_ENTRIES,
  };
})(window);
