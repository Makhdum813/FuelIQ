/**
 * utils/csvExport.js
 * ---------------------------------------------------------------------------
 * Builds a structured, multi-section CSV from the same report data the
 * print/PDF builder uses (app.js's gatherReportData()) — this module does
 * NOT recompute any figures itself, it only formats data it's handed.
 *
 * CSV doesn't have a native concept of "sections", so this uses the common,
 * spreadsheet-friendly convention of a bold-ish "=== HEADING ===" row
 * followed by its own little header/value table, with a blank line between
 * sections. Opens cleanly in Excel, Google Sheets, and Numbers.
 *
 * Exposed as window.E20.csvExport
 */
(function (global) {
  "use strict";

  // Escape a single CSV field: wrap in quotes (doubling internal quotes)
  // whenever the value contains a comma, quote, or newline — the standard
  // RFC 4180 rule. Leaves simple values unquoted for readability.
  function csvEscape(value) {
    const str = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function row() {
    return Array.prototype.map.call(arguments, csvEscape).join(",");
  }

  // data: the object returned by app.js's gatherReportData(r) — plain label/
  // value pairs, no HTML, no formatting decisions left for this function to
  // make (that all happened once, upstream, in the shared report-data step).
  function buildResultCSV(data) {
    const lines = [];

    lines.push(row("E20 Mileage & Cost Impact Report"));
    lines.push(row("Generated", data.generatedAt));
    lines.push(row("Vehicle", data.vehicleLine));
    lines.push("");

    lines.push(row("INPUTS USED"));
    lines.push(row("Field", "Value"));
    data.inputRows.forEach(function (r) { lines.push(row(r[0], r[1])); });
    lines.push("");

    lines.push(row("VEHICLE DETAILS"));
    lines.push(row("Field", "Value"));
    if (data.activeVehicle) {
      const v = data.activeVehicle;
      lines.push(row("Name", v.name));
      lines.push(row("Type", v.type));
      lines.push(row("Company", v.company));
      lines.push(row("Model", v.model));
      lines.push(row("Fuel Type", v.fuelType || "Petrol"));
    } else {
      lines.push(row("Note", "No saved vehicle profile was selected for this export."));
    }
    lines.push("");

    lines.push(row("CALCULATED RESULTS"));
    lines.push(row("Field", "Value"));
    data.kpis.forEach(function (r) { lines.push(row(r[0], r[1])); });
    lines.push("");

    lines.push(row("BEFORE VS AFTER COMPARISON"));
    lines.push(row("Metric", "Before E20", "After E20"));
    data.compareRows.forEach(function (r) { lines.push(row(r[0], r[1], r[2])); });
    lines.push("");

    lines.push(row("MONTHLY & YEARLY ANALYSIS"));
    lines.push(row("Field", "Value"));
    data.monthlyYearlyRows.forEach(function (r) { lines.push(row(r[0], r[1])); });
    lines.push("");

    lines.push(row("AI INSIGHTS"));
    lines.push(row("#", "Insight"));
    data.insightItems.forEach(function (item, i) { lines.push(row(i + 1, item.icon + " " + item.text)); });

    return lines.join("\r\n");
  }

  // Trigger a browser download of the given text content. A UTF-8 BOM is
  // prepended so Excel renders ₹ and other non-ASCII characters correctly
  // instead of mangling them (a well-known Excel CSV quirk).
  function downloadCSV(filename, csvContent) {
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoke on a delay so the download has time to actually start in every browser.
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  global.E20 = global.E20 || {};
  global.E20.csvExport = { csvEscape: csvEscape, buildResultCSV: buildResultCSV, downloadCSV: downloadCSV };
})(window);
