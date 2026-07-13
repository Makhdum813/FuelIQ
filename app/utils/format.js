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
 * utils/format.js
 * ---------------------------------------------------------------------------
 * Shared formatting helpers (Indian Rupee formatting, decimal rounding,
 * relative-time labels). Kept dependency-free and side-effect-free so any
 * module can use it without ordering concerns beyond "load this file first".
 *
 * Exposed as window.E20.format
 */
(function (global) {
  "use strict";

  // Format a number as Indian Rupees with 2 decimal places and Indian digit
  // grouping (e.g. 12,34,567.89).
  function fmtINR(value) {
    if (!isFinite(value)) value = 0;
    const isNeg = value < 0;
    value = Math.abs(value);
    const parts = value.toFixed(2).split(".");
    let intPart = parts[0];
    let lastThree = intPart.substring(intPart.length - 3);
    let other = intPart.substring(0, intPart.length - 3);
    if (other !== "") lastThree = "," + lastThree;
    const formattedInt = other.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    return (isNeg ? "-\u20B9" : "\u20B9") + formattedInt + "." + parts[1];
  }

  // Format a plain number to N decimal places, guarding against NaN/Infinity.
  function fmtNum(value, decimals) {
    decimals = decimals === undefined ? 2 : decimals;
    if (!isFinite(value)) value = 0;
    return value.toFixed(decimals);
  }

  // Human-friendly relative time for history/fuel-log timestamps, e.g.
  // "just now", "5m ago", "3h ago", "2d ago", or a plain date beyond that.
  function fmtRelativeTime(timestamp) {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 10) return "just now";
    if (diffSec < 60) return diffSec + "s ago";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return diffMin + "m ago";
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return diffHr + "h ago";
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return diffDay + "d ago";
    const d = new Date(timestamp);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  // Format a plain date input value (yyyy-mm-dd) into a short display label.
  function fmtDateShort(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  // Clamp a number between min and max, guarding against NaN by falling back.
  function clamp(value, min, max, fallback) {
    const v = isFinite(value) ? value : fallback;
    return Math.min(max, Math.max(min, v));
  }

  // Escape a string for safe insertion into innerHTML (used for user-entered
  // vehicle names / notes so history and profile lists can't be broken by
  // stray HTML characters).
  function escapeHTML(str) {
    if (str === undefined || str === null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  global.E20 = global.E20 || {};
  global.E20.format = { fmtINR, fmtNum, fmtRelativeTime, fmtDateShort, clamp, escapeHTML };
})(window);
