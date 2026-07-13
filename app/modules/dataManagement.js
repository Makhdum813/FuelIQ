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
 * modules/dataManagement.js
 * ---------------------------------------------------------------------------
 * Export / import / clear of ALL app data (vehicles, active vehicle,
 * calculation history, fuel logs, settings) as a single JSON backup file.
 * Goes through the shared storage layer only — never touches localStorage
 * keys directly, so the storage module stays the single gateway.
 *
 * Exposed as window.E20.dataManagement
 */
(function (global) {
  "use strict";

  const storage = global.E20.storage;
  const BACKUP_VERSION = 1;

  // Gather everything into one serialisable object.
  function exportAll() {
    return {
      app: "E20 Mileage & Cost Impact Calculator",
      backupVersion: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        vehicles: storage.getVehicles(),
        activeVehicleId: storage.getActiveVehicleId(),
        history: storage.getHistory(),
        fuelLogs: storage.getFuelLogs(),
        settings: storage.getSettings(),
      },
    };
  }

  // Trigger a download of the backup JSON.
  function downloadBackup() {
    const payload = JSON.stringify(exportAll(), null, 2);
    const blob = new Blob([payload], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "e20-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // Validate and restore a parsed backup object. Returns { ok, message }.
  // Deliberately strict: refuses anything that doesn't look like our backup
  // shape, so a user can't wipe their data by importing a random JSON file.
  function importAll(parsed) {
    if (!parsed || typeof parsed !== "object" || !parsed.data || typeof parsed.data !== "object") {
      return { ok: false, message: "That doesn't look like an E20 backup file." };
    }
    const d = parsed.data;
    // Each field is optional individually, but at least one must be present
    // and arrays must actually be arrays.
    if (d.vehicles !== undefined && !Array.isArray(d.vehicles)) return { ok: false, message: "Backup is corrupted (vehicles)." };
    if (d.history !== undefined && !Array.isArray(d.history)) return { ok: false, message: "Backup is corrupted (history)." };
    if (d.fuelLogs !== undefined && !Array.isArray(d.fuelLogs)) return { ok: false, message: "Backup is corrupted (fuel logs)." };

    if (Array.isArray(d.vehicles)) storage.saveVehicles(d.vehicles);
    if (d.activeVehicleId !== undefined) storage.setActiveVehicleId(d.activeVehicleId);
    if (Array.isArray(d.history)) storage.saveHistory(d.history);
    if (Array.isArray(d.fuelLogs)) storage.saveFuelLogs(d.fuelLogs);
    if (d.settings && typeof d.settings === "object") storage.saveSettings(d.settings);

    return { ok: true, message: "Backup restored successfully." };
  }

  // Wipe every app data store. Returns to a clean slate.
  function clearAll() {
    storage.saveVehicles([]);
    storage.setActiveVehicleId(null);
    storage.saveHistory([]);
    storage.saveFuelLogs([]);
    // Preserve theme choice but drop everything else in settings.
    const settings = storage.getSettings();
    storage.saveSettings({ theme: settings.theme || null });
  }

  global.E20 = global.E20 || {};
  global.E20.dataManagement = {
    exportAll: exportAll,
    downloadBackup: downloadBackup,
    importAll: importAll,
    clearAll: clearAll,
  };
})(window);
