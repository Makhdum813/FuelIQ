/**
 * utils/shareLink.js
 * ---------------------------------------------------------------------------
 * Encodes the calculator's core inputs into URL query parameters so a result
 * can be shared as a link that reproduces the same numbers when opened, and
 * decodes them back out on load. Also builds a pre-filled WhatsApp share URL
 * (wa.me deep link — no API, no backend, just a formatted URL).
 *
 * Exposed as window.E20.shareLink
 */
(function (global) {
  "use strict";

  const PARAM_MAP = {
    originalMileage: "mileage",
    mileageDropPct: "drop",
    petrolPrice: "price",
    amountPurchased: "amount",
    monthlyKm: "monthlyKm",
  };

  // Build a shareable URL for the current origin+path, carrying the given
  // inputs as query parameters. Only includes finite, meaningful values.
  function buildShareURL(inputs) {
    const url = new URL(global.location.href.split("?")[0].split("#")[0]);
    Object.keys(PARAM_MAP).forEach(function (key) {
      const value = inputs[key];
      if (isFinite(value)) {
        url.searchParams.set(PARAM_MAP[key], String(value));
      }
    });
    return url.toString();
  }

  // Read query parameters back out into the same input shape buildShareURL
  // consumes. Returns null for any parameter that's missing or non-numeric,
  // so the caller can apply only the values that were actually present.
  function parseShareURL(href) {
    let url;
    try {
      url = new URL(href);
    } catch (err) {
      return null;
    }
    const result = {};
    let foundAny = false;
    Object.keys(PARAM_MAP).forEach(function (key) {
      const raw = url.searchParams.get(PARAM_MAP[key]);
      const num = raw === null ? NaN : parseFloat(raw);
      result[key] = isFinite(num) ? num : null;
      if (isFinite(num)) foundAny = true;
    });
    return foundAny ? result : null;
  }

  // Build a wa.me deep link with pre-filled share text. No WhatsApp API
  // access required — this is just a formatted URL WhatsApp itself handles.
  function buildWhatsAppURL(shareURL, summaryText) {
    const text = (summaryText ? summaryText + "\n\n" : "") + shareURL;
    return "https://wa.me/?text=" + encodeURIComponent(text);
  }

  global.E20 = global.E20 || {};
  global.E20.shareLink = { buildShareURL: buildShareURL, parseShareURL: parseShareURL, buildWhatsAppURL: buildWhatsAppURL, PARAM_MAP: PARAM_MAP };
})(window);
