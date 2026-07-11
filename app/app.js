(function(){
  "use strict";

  const { fmtINR, fmtNum, fmtRelativeTime, fmtDateShort, escapeHTML } = window.E20.format;
  const vehiclesApi = window.E20.vehicles;
  const historyApi = window.E20.history;
  const fuelLogApi = window.E20.fuelLog;
  const storageApi = window.E20.storage;
  const tripApi = window.E20.tripCalculator;
  const budgetApi = window.E20.budgetPlanner;
  const ownershipApi = window.E20.ownership;
  const insightsApi = window.E20.insights;
  const calcEngineApi = window.E20.calcEngine;
  const blendApi = window.E20.fuelBlend;
  const co2Api = window.E20.co2Estimator;
  const compareApi = window.E20.vehicleCompare;
  const shareApi = window.E20.shareLink;
  const csvApi = window.E20.csvExport;
  const advancedModeApi = window.E20.advancedMode;
  const navigationApi = window.E20.navigation;
  const dataManagementApi = window.E20.dataManagement;

  /* ============ Element references ============ */
  const el = {
    origMileage: document.getElementById('origMileage'),
    mileageDrop: document.getElementById('mileageDrop'),
    mileageDropSlider: document.getElementById('mileageDropSlider'),
    petrolPrice: document.getElementById('petrolPrice'),
    amountPurchased: document.getElementById('amountPurchased'),
    monthlyKm: document.getElementById('monthlyKm'),
    headlineStats: document.getElementById('headlineStats'),
    breakdownStats: document.getElementById('breakdownStats'),
    lostCostStats: document.getElementById('lostCostStats'),
    monthlyStats: document.getElementById('monthlyStats'),
    compTableBody: document.getElementById('compTableBody'),
    formulaList: document.getElementById('formulaList'),
    toast: document.getElementById('toast'),
    vehicleType: document.getElementById('vehicleType'),
    vehicleCompany: document.getElementById('vehicleCompany'),
    vehicleModel: document.getElementById('vehicleModel'),
    vehicleFuelType: document.getElementById('vehicleFuelType'),
    fetchImageBtn: document.getElementById('fetchImageBtn'),
    vehiclePreview: document.getElementById('vehiclePreview'),
    vpIcon: document.getElementById('vpIcon'),
    vpCaption: document.getElementById('vpCaption'),
    vpMeta: document.getElementById('vpMeta'),
    vpTitle: document.getElementById('vpTitle'),
    vpExtract: document.getElementById('vpExtract'),
    // Vehicle profiles
    profileSelect: document.getElementById('profileSelect'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    deleteProfileBtn: document.getElementById('deleteProfileBtn'),
    // Calculation history
    historySearch: document.getElementById('historySearch'),
    historySearchClear: document.getElementById('historySearchClear'),
    saveHistoryBtn: document.getElementById('saveHistoryBtn'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    historyList: document.getElementById('historyList'),
    // Fuel log
    fuelLogVehicleHint: document.getElementById('fuelLogVehicleHint'),
    fuelDate: document.getElementById('fuelDate'),
    fuelOdometer: document.getElementById('fuelOdometer'),
    fuelAmount: document.getElementById('fuelAmount'),
    fuelPricePerLitre: document.getElementById('fuelPricePerLitre'),
    fuelLitres: document.getElementById('fuelLitres'),
    fuelLitresAutoTag: document.getElementById('fuelLitresAutoTag'),
    addFuelLogBtn: document.getElementById('addFuelLogBtn'),
    avgMileageValue: document.getElementById('avgMileageValue'),
    useFuelMileageBtn: document.getElementById('useFuelMileageBtn'),
    fuelLogBody: document.getElementById('fuelLogBody'),
    fuelLogForm: document.getElementById('fuelLogForm'),
    // Trip cost calculator
    tripDistance: document.getElementById('tripDistance'),
    tripType: document.getElementById('tripType'),
    tripResults: document.getElementById('tripResults'),
    // Budget planner
    budgetAmount: document.getElementById('budgetAmount'),
    budgetResults: document.getElementById('budgetResults'),
    // Ownership dashboard
    monthsOnE20: document.getElementById('monthsOnE20'),
    ownershipStats: document.getElementById('ownershipStats'),
    // Smart insights
    insightsList: document.getElementById('insightsList'),
    // Fuel blend comparison
    blendTableBody: document.getElementById('blendTableBody'),
    // CO2 estimator
    co2Stats: document.getElementById('co2Stats'),
    // Two-vehicle compare
    compareVehicleA: document.getElementById('compareVehicleA'),
    compareVehicleB: document.getElementById('compareVehicleB'),
    compareResults: document.getElementById('compareResults'),
    // Share
    copyLinkBtn: document.getElementById('copyLinkBtn'),
    whatsappShareBtn: document.getElementById('whatsappShareBtn'),
    // Print / PDF report
    printReport: document.getElementById('printReport'),
    // CSV export
    csvExportBtn: document.getElementById('csvExportBtn'),
    // Advanced Mode
    advancedModeToggle: document.getElementById('advancedModeToggle'),
    advancedModeBody: document.getElementById('advancedModeBody'),
    advancedModifiers: document.getElementById('advancedModifiers'),
    advancedSummary: document.getElementById('advancedSummary'),
    // Dashboard
    dashboardStats: document.getElementById('dashboardStats'),
    dashboardInsightsList: document.getElementById('dashboardInsightsList'),
    dashboardRecentActivity: document.getElementById('dashboardRecentActivity'),
    // Settings / data management
    exportAllDataBtn: document.getElementById('exportAllDataBtn'),
    importAllDataBtn: document.getElementById('importAllDataBtn'),
    importDataFile: document.getElementById('importDataFile'),
    clearAllDataBtn: document.getElementById('clearAllDataBtn'),
    dataManagementStatus: document.getElementById('dataManagementStatus'),
    // Mobile theme toggle
    themeToggleMobile: document.getElementById('themeToggleMobile'),
  };

  const inputs = [el.origMileage, el.mileageDrop, el.petrolPrice, el.amountPurchased, el.monthlyKm];


  /* ============ Validation ============ */

  // Validate all inputs; toggles error styling/messages. Returns true if all valid.
  function validateInputs(){
    let allValid = true;
    const rules = {
      origMileage: v => v > 0,
      mileageDrop: v => v >= 0 && v <= 100,
      petrolPrice: v => v > 0,
      amountPurchased: v => v > 0,
      monthlyKm: v => v >= 0
    };
    Object.keys(rules).forEach(key=>{
      const inputEl = el[key];
      const errEl = document.getElementById('err-' + key);
      const val = parseFloat(inputEl.value);
      const valid = !isNaN(val) && rules[key](val);
      if(!valid){
        inputEl.classList.add('invalid');
        if(errEl) errEl.classList.add('show');
        allValid = false;
      } else {
        inputEl.classList.remove('invalid');
        if(errEl) errEl.classList.remove('show');
      }
    });
    return allValid;
  }

  /* ============ Core calculation engine ============ */

  // Runs every formula from the spec and returns a results object.
  // Advanced Mode state: lives here (not in calcEngine) because it's a
  // pre-processing step on top of the user's raw "Original Mileage" input —
  // the shared calcEngine formulas never need to know Advanced Mode exists.
  let advancedModeEnabled = false;
  let advancedModeSelections = advancedModeApi.defaultSelections();

  function calculate(){
    const rawMileage = parseFloat(el.origMileage.value) || 0;
    const effectiveMileage = advancedModeEnabled
      ? advancedModeApi.computeAdjustedMileage(rawMileage, advancedModeSelections)
      : rawMileage;
    return calcEngineApi.calculate({
      originalMileage: effectiveMileage,
      mileageDropPct: parseFloat(el.mileageDrop.value) || 0,
      petrolPrice: parseFloat(el.petrolPrice.value) || 0,
      amountPurchased: parseFloat(el.amountPurchased.value) || 0,
      monthlyKm: parseFloat(el.monthlyKm.value) || 0,
    });
  }

  /* ============ Animated counters ============ */

  const counterState = new WeakMap();

  // Animate a number from its current displayed value to a target value.
  function animateValue(node, targetText, isCurrency, decimals){
    const prevRaw = counterState.get(node);
    const targetVal = parseFloat(targetText.toString().replace(/[^0-9.-]/g,'')) || 0;
    const startVal = prevRaw === undefined ? targetVal : prevRaw;
    counterState.set(node, targetVal);

    // Auto-detect currency formatting from the target string itself (₹
    // present) rather than relying solely on an explicit flag from the
    // caller. Every stat card across this app already bakes ₹ into its
    // pre-formatted `raw` string via fmtINR() upstream — that's the one
    // real source of truth, and checking it here fixes every currency
    // stat card at once instead of requiring every call site to also pass
    // {currency:true} (which none of them were doing).
    const useCurrencyFormat = isCurrency || /₹/.test(targetText);

    const duration = 500;
    const startTime = performance.now();

    function frame(now){
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = startVal + (targetVal - startVal) * eased;
      node.textContent = useCurrencyFormat ? fmtINR(current) : fmtNum(current, decimals);
      if(t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ============ Stat card rendering ============ */

  // Build a single stat card DOM element.
  function buildStatCard(label, value, opts){
    opts = opts || {};
    const div = document.createElement('div');
    div.className = 'stat' + (opts.tone ? ' ' + opts.tone : '');
    const valClass = 'stat-value ' + (opts.tone || '');
    div.innerHTML =
      '<div class="s-label">' + (opts.icon ? '<span>' + opts.icon + '</span>' : '') + label + '</div>' +
      '<div class="s-value ' + (opts.tone || '') + '" data-target="' + value + '"></div>' +
      (opts.sub ? '<div class="s-sub">' + opts.sub + '</div>' : '');
    return div;
  }

  // Render a group of stat cards into a container, with animated numbers.
  function renderStats(container, cards){
    container.innerHTML = '';
    cards.forEach(c=>{
      const node = buildStatCard(c.label, c.raw, {tone:c.tone, sub:c.sub, icon:c.icon});
      container.appendChild(node);
      const valNode = node.querySelector('.s-value');
      if(c.isText){
        // Non-numeric value (e.g. a vehicle name) — set directly, no count-up.
        valNode.textContent = c.raw;
      } else {
        animateValue(valNode, c.raw, c.currency, c.decimals);
      }
    });
  }

  /* ============ Comparison table ============ */

  function renderTable(r){
    const rows = [
      { label:'Mileage', before: fmtNum(r.originalMileage) + ' km/L', after: fmtNum(r.newMileage) + ' km/L', diff: fmtNum(r.newMileage - r.originalMileage) + ' km/L', neg: r.newMileage < r.originalMileage },
      { label:'Cost per km', before: fmtINR(r.costPerKmBefore), after: fmtINR(r.costPerKmAfter), diff: fmtINR(r.costPerKmAfter - r.costPerKmBefore), neg: r.costPerKmAfter > r.costPerKmBefore },
      { label:'Distance for ' + fmtINR(r.amountPurchased), before: fmtNum(r.distanceBefore) + ' km', after: fmtNum(r.distanceAfter) + ' km', diff: fmtNum(r.distanceAfter - r.distanceBefore) + ' km', neg: r.distanceAfter < r.distanceBefore },
      { label:'Fuel required (ref. distance)', before: fmtNum(r.fuelForRefDistanceOrig) + ' L', after: fmtNum(r.fuelForRefDistanceNew) + ' L', diff: fmtNum(r.fuelForRefDistanceNew - r.fuelForRefDistanceOrig) + ' L', neg: r.fuelForRefDistanceNew > r.fuelForRefDistanceOrig },
      { label:'Money lost (ref. distance)', before: fmtINR(r.costForRefDistanceOrig), after: fmtINR(r.costForRefDistanceNew), diff: fmtINR(r.extraCostRefDistance), neg: r.extraCostRefDistance > 0 },
      { label:'Extra cost (lost distance)', before: fmtINR(r.costOfLostDistance), after: fmtINR(r.costToTravelLostAtNewMileage), diff: fmtINR(r.extraCostForLostDistance), neg: r.extraCostForLostDistance > 0 },
      { label:'Distance lost', before: '0.00 km', after: fmtNum(r.distanceLost) + ' km', diff: fmtNum(r.distanceLost) + ' km', neg: r.distanceLost > 0 },
    ];
    el.compTableBody.innerHTML = rows.map(row=>{
      const cls = row.neg ? 'diff-neg' : 'diff-pos';
      return '<tr><td>' + row.label + '</td><td>' + row.before + '</td><td>' + row.after + '</td><td class="' + cls + '">' + row.diff + '</td></tr>';
    }).join('');
  }

  /* ============ Formulas panel ============ */

  const FORMULAS = [
    { name:'New Mileage', expr:'Original Mileage × (1 − Mileage Drop%)' },
    { name:'Fuel Required (Reference Distance)', expr:'Distance ÷ New Mileage' },
    { name:'Fuel Purchased', expr:'Amount Spent ÷ Petrol Price' },
    { name:'Distance Before E20', expr:'Fuel Purchased × Original Mileage' },
    { name:'Distance After E20', expr:'Fuel Purchased × New Mileage' },
    { name:'Distance Lost', expr:'Distance Before − Distance After' },
    { name:'Cost of Lost Distance', expr:'(Distance Lost ÷ Original Mileage) × Petrol Price' },
    { name:'Extra Cost for Lost Distance', expr:'(Distance Lost ÷ New Mileage) × Petrol Price − Cost of Lost Distance' },
    { name:'Cost per KM', expr:'Petrol Price ÷ Mileage' },
    { name:'Monthly Fuel Cost', expr:'Cost per KM × Monthly Distance' },
    { name:'Extra Yearly Cost', expr:'Extra Monthly Cost × 12' },
  ];

  function renderFormulas(){
    el.formulaList.innerHTML = FORMULAS.map(f=>
      '<div class="formula-item"><div class="f-name">' + f.name + '</div><div class="f-expr">' + f.expr + '</div></div>'
    ).join('');
  }

  /* ============ Canvas charts ============ */

  // Get CSS variable value for use in canvas drawing.
  function cssVar(name){
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }

  // Draw a horizontal two-bar comparison chart with animation.
  function drawHBarChart(canvas, labelA, valA, labelB, valB, unit){
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.parentElement.clientWidth;
    const cssHeight = 120;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const maxVal = Math.max(valA, valB, 1) * 1.15;
    const barH = 34;
    const gap = 26;
    const leftPad = 8;
    const rightPad = 90;
    const chartW = cssWidth - leftPad - rightPad;
    const textColor = cssVar('--text-0');
    const subColor = cssVar('--text-2');
    const colorA = cssVar('--amber');
    const colorB = cssVar('--teal');

    let start = null;
    const duration = 700;
    function frame(ts){
      if(!start) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      ctx.clearRect(0,0,cssWidth,cssHeight);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = subColor;
      ctx.fillText(labelA, leftPad, 20);
      const wA = chartW * (valA / maxVal) * eased;
      ctx.fillStyle = colorA;
      roundRect(ctx, leftPad, 26, Math.max(wA,2), barH, 7);
      ctx.fill();
      ctx.fillStyle = textColor;
      ctx.font = 'bold 13px monospace';
      ctx.fillText(fmtNum(valA * eased,1) + ' ' + unit, leftPad + wA + 10, 26 + barH/2 + 4);

      const y2 = 26 + barH + gap;
      ctx.font = '11px sans-serif';
      ctx.fillStyle = subColor;
      ctx.fillText(labelB, leftPad, y2 - 6);
      const wB = chartW * (valB / maxVal) * eased;
      ctx.fillStyle = colorB;
      roundRect(ctx, leftPad, y2, Math.max(wB,2), barH, 7);
      ctx.fill();
      ctx.fillStyle = textColor;
      ctx.font = 'bold 13px monospace';
      ctx.fillText(fmtNum(valB * eased,1) + ' ' + unit, leftPad + wB + 10, y2 + barH/2 + 4);

      if(t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Rounded rectangle helper for canvas bars.
  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Draw the circular gauge showing mileage loss percentage.
  function drawGauge(canvas, pct){
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.parentElement.clientWidth;
    const cssHeight = 160;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const cx = cssWidth / 2;
    const cy = 92;
    const radius = 66;
    const startAngle = Math.PI * 0.75;
    const fullSweep = Math.PI * 1.5;
    const trackColor = cssVar('--glass-brd-hi');
    const textColor = cssVar('--text-0');
    const subColor = cssVar('--text-2');

    let gaugeColor = cssVar('--teal');
    if(pct > 5) gaugeColor = cssVar('--warn');
    if(pct > 12) gaugeColor = cssVar('--red');

    const clampedPct = Math.max(0, Math.min(30, pct));
    const targetFrac = clampedPct / 30;

    let start = null;
    const duration = 900;
    function frame(ts){
      if(!start) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const frac = targetFrac * eased;

      ctx.clearRect(0,0,cssWidth,cssHeight);

      // track
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, startAngle + fullSweep);
      ctx.strokeStyle = trackColor;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.stroke();

      // value arc
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, startAngle + fullSweep * frac);
      ctx.strokeStyle = gaugeColor;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.stroke();

      // center text
      ctx.fillStyle = textColor;
      ctx.font = 'bold 26px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(fmtNum(pct * eased / (targetFrac === 0 ? 1 : 1), 1).replace('NaN','0.0') + '%', cx, cy + 6);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = subColor;
      ctx.fillText('mileage lost', cx, cy + 26);

      if(t >= 1 && insightsApi){
        const cls = insightsApi.classifyDrop(pct);
        ctx.font = '600 11px sans-serif';
        ctx.fillStyle = gaugeColor;
        ctx.fillText(cls.label.toUpperCase(), cx, cy + 44);
      }
      ctx.textAlign = 'left';

      if(t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function renderCharts(r){
    drawHBarChart(document.getElementById('chartMileage'), 'Before', r.originalMileage, 'After', r.newMileage, 'km/L');
    drawHBarChart(document.getElementById('chartDistance'), 'Before', r.distanceBefore, 'After', r.distanceAfter, 'km');
    drawHBarChart(document.getElementById('chartMonthly'), 'Before', r.monthlyFuelCostBefore, 'After', r.monthlyFuelCostAfter, '₹');
    drawGauge(document.getElementById('chartGauge'), r.mileageDropPct);
  }

  /* ============ Master render ============ */

  function render(){
    const valid = validateInputs();
    const r = calculate();

    renderStats(el.headlineStats, [
      { label:'New Mileage', raw: fmtNum(r.newMileage) + ' km/L', tone:'negative', sub:'Down from ' + fmtNum(r.originalMileage) + ' km/L', icon:'⛽' },
      { label:'Distance Lost', raw: fmtNum(r.distanceLost) + ' km', tone:'negative', sub:'For ' + fmtINR(r.amountPurchased) + ' of fuel', icon:'📉' },
      { label:'Extra Cost (Lost Distance)', raw: fmtINR(r.extraCostForLostDistance), tone:'warn', sub:'To cover the same ground', icon:'💸' },
      { label:'Extra Yearly Cost', raw: fmtINR(r.extraYearlyCost), tone: r.extraYearlyCost > 0 ? 'negative' : 'positive', sub:'At ' + fmtNum(r.monthlyKm,0) + ' km/month', icon:'📅' },
    ]);

    renderStats(el.breakdownStats, [
      { label:'Fuel Purchased', raw: fmtNum(r.fuelPurchased) + ' L', sub:'for ' + fmtINR(r.amountPurchased), icon:'🛢️' },
      { label:'Distance Before E20', raw: fmtNum(r.distanceBefore) + ' km', tone:'positive', icon:'🛣️' },
      { label:'Distance After E20', raw: fmtNum(r.distanceAfter) + ' km', tone:'negative', icon:'🛣️' },
      { label:'Cost per KM (Before → After)', raw: fmtINR(r.costPerKmAfter), sub:'was ' + fmtINR(r.costPerKmBefore), tone:'warn', icon:'📍' },
    ]);

    renderStats(el.lostCostStats, [
      { label:'Cost of Lost Distance', raw: fmtINR(r.costOfLostDistance), sub: fmtNum(r.distanceLost) + ' km at original mileage', tone:'warn', icon:'🧾' },
      { label:'Cost to Actually Travel It', raw: fmtINR(r.costToTravelLostAtNewMileage), sub:'at the new, lower mileage', tone:'negative', icon:'🧾' },
      { label:'Extra Cost', raw: fmtINR(r.extraCostForLostDistance), sub:'the true sting of E20', tone:'negative', icon:'⚠️' },
    ]);

    renderStats(el.monthlyStats, [
      { label:'Monthly Cost Before', raw: fmtINR(r.monthlyFuelCostBefore), icon:'🗓️' },
      { label:'Monthly Cost After', raw: fmtINR(r.monthlyFuelCostAfter), tone:'negative', icon:'🗓️' },
      { label:'Extra Monthly Cost', raw: fmtINR(r.extraMonthlyCost), tone: r.extraMonthlyCost > 0 ? 'negative' : 'positive', icon:'➕' },
      { label:'Extra Yearly Cost', raw: fmtINR(r.extraYearlyCost), tone: r.extraYearlyCost > 0 ? 'negative' : 'positive', icon:'📆' },
    ]);

    renderTable(r);
    renderCharts(r);
    renderTripCalculator(r);
    renderBudgetPlanner(r);
    renderOwnershipDashboard(r);
    renderInsights(r);
    renderFuelBlendComparison(r);
    renderCO2Estimate(r);
    renderVehicleCompare(r);
    renderDashboard(r);

    return r;
  }

  /* ============ Dashboard ============ */

  // The Dashboard tab is a summary view: a few headline KPI cards, the same
  // Smart Insights, and a recent-activity feed drawn from calculation
  // history. It reuses renderStats / renderInsightsInto rather than
  // reimplementing any of them.
  function renderDashboard(r){
    if(!el.dashboardStats) return;
    const activeVehicle = vehiclesApi.getActive();
    renderStats(el.dashboardStats, [
      { label:'Active Vehicle', raw: activeVehicle ? activeVehicle.name : 'None selected', sub: activeVehicle ? (activeVehicle.company + ' ' + activeVehicle.model) : 'Save one in Vehicle Profiles', icon:'🚘', isText:true },
      { label:'New Mileage (E20)', raw: fmtNum(r.newMileage) + ' km/L', sub:'was ' + fmtNum(r.originalMileage) + ' km/L', tone:'negative', icon:'⛽' },
      { label:'Extra Monthly Cost', raw: fmtINR(r.extraMonthlyCost), tone: r.extraMonthlyCost > 0 ? 'negative' : 'positive', icon:'💸' },
      { label:'Extra Yearly Cost', raw: fmtINR(r.extraYearlyCost), tone: r.extraYearlyCost > 0 ? 'negative' : 'positive', icon:'📅' },
    ]);
    renderInsightsInto(el.dashboardInsightsList, r);
    renderRecentActivity();
  }

  // Recent-activity feed: the five most recent saved calculations, read-only
  // summaries (clicking through to restore lives in the History tab).
  function renderRecentActivity(){
    if(!el.dashboardRecentActivity) return;
    const entries = historyApi.listSorted().slice(0, 5);
    if(entries.length === 0){
      el.dashboardRecentActivity.innerHTML = '<div class="empty-state">No saved calculations yet. Run a calculation and save it to see recent activity here.</div>';
      return;
    }
    el.dashboardRecentActivity.innerHTML = entries.map(function(entry){
      const out = entry.outputs;
      const vehicleBadge = entry.vehicleName ? '<span class="hist-badge">' + escapeHTML(entry.vehicleName) + '</span>' : '';
      return '' +
        '<div class="history-item" style="cursor:default;">' +
          '<div class="hist-main">' +
            '<div class="hist-top">' + vehicleBadge + '<span class="hist-time">' + fmtRelativeTime(entry.timestamp) + '</span></div>' +
            '<div class="hist-stats">' +
              '<span>' + fmtNum(out.newMileage) + ' km/L</span>' +
              '<span class="hist-dot">·</span>' +
              '<span class="hist-neg">' + fmtINR(out.extraYearlyCost) + '/yr extra</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  /* ============ Trip cost calculator ============ */

  // Recompute and render the trip cost card from the main calculation result
  // `r` (for current mileage/petrol price) plus this card's own distance/type
  // inputs. Runs on every main render() so it always reflects the latest
  // mileage and price, not just its own input changes.
  function renderTripCalculator(r){
    const distance = parseFloat(el.tripDistance.value);
    if(!isFinite(distance) || distance <= 0){
      el.tripResults.innerHTML = '<div class="empty-state">Enter a trip distance to see the fuel cost.</div>';
      return;
    }
    const isRoundTrip = el.tripType.value === 'roundtrip';
    const trip = tripApi.calculateTrip({
      distanceKm: distance,
      isRoundTrip: isRoundTrip,
      mileageBefore: r.originalMileage,
      mileageAfter: r.newMileage,
      petrolPrice: r.petrolPrice,
    });
    renderStats(el.tripResults, [
      { label:'Total Distance', raw: fmtNum(trip.totalDistance) + ' km', sub: isRoundTrip ? 'round trip' : 'one-way', icon:'🛣️' },
      { label:'Fuel Needed', raw: fmtNum(trip.fuelAfter) + ' L', sub:'at your current (E20) mileage', icon:'⛽' },
      { label:'Trip Cost', raw: fmtINR(trip.costAfter), sub:'was ' + fmtINR(trip.costBefore) + ' before E20', tone:'warn', icon:'💰' },
      { label:'Extra vs Pre-E20', raw: fmtINR(trip.extraCost), tone: trip.extraCost > 0 ? 'negative' : 'positive', icon:'📈' },
    ]);
  }

  el.tripDistance.addEventListener('input', function(){ renderTripCalculator(calculate()); });
  el.tripType.addEventListener('change', function(){ renderTripCalculator(calculate()); });

  /* ============ Fuel budget planner ============ */

  function renderBudgetPlanner(r){
    const budget = parseFloat(el.budgetAmount.value);
    if(!isFinite(budget) || budget <= 0){
      el.budgetResults.innerHTML = '<div class="empty-state">Enter a budget to see how far it takes you.</div>';
      return;
    }
    const result = budgetApi.calculateBudget({
      budget: budget,
      mileageBefore: r.originalMileage,
      mileageAfter: r.newMileage,
      petrolPrice: r.petrolPrice,
    });
    renderStats(el.budgetResults, [
      { label:'Litres Affordable', raw: fmtNum(result.litresAffordable) + ' L', sub:'for ' + fmtINR(budget), icon:'🛢️' },
      { label:'Distance Before E20', raw: fmtNum(result.distanceBefore) + ' km', tone:'positive', icon:'🛣️' },
      { label:'Distance After E20', raw: fmtNum(result.distanceAfter) + ' km', tone:'negative', icon:'🛣️' },
      { label:'Distance You Lose', raw: fmtNum(result.distanceLost) + ' km', tone:'warn', sub:'for the same budget', icon:'📉' },
    ]);
  }

  el.budgetAmount.addEventListener('input', function(){ renderBudgetPlanner(calculate()); });

  /* ============ Ownership impact dashboard ============ */

  function renderOwnershipDashboard(r){
    const months = parseFloat(el.monthsOnE20.value);
    const safeMonths = isFinite(months) && months >= 0 ? months : 0;
    const result = ownershipApi.calculateOwnership({
      monthsOnE20: safeMonths,
      extraMonthlyCost: r.extraMonthlyCost,
      extraYearlyCost: r.extraYearlyCost,
    });
    renderStats(el.ownershipStats, [
      { label:'Spent So Far on E20', raw: fmtINR(result.totalSoFar), sub: fmtNum(safeMonths,0) + ' months at current pattern', tone: result.totalSoFar > 0 ? 'negative' : 'positive', icon:'🧮' },
      { label:'Projected — 1 Year', raw: fmtINR(result.projection1yr), tone:'warn', icon:'📅' },
      { label:'Projected — 3 Years', raw: fmtINR(result.projection3yr), tone:'warn', icon:'📅' },
      { label:'Projected — 5 Years', raw: fmtINR(result.projection5yr), tone:'negative', icon:'📅' },
    ]);
  }

  el.monthsOnE20.addEventListener('input', function(){ renderOwnershipDashboard(calculate()); });

  /* ============ Smart insights (rule-based) ============ */

  // Renders 2-5 short observations generated from this calculation's own
  // numbers. Text is inserted via textContent (not innerHTML) even though
  // the engine's own copy is trusted, because it may include a user-entered
  // vehicle name — this keeps that path safe with zero extra ceremony.
  // Build the insight rows into a given container. Shared by the Calculator
  // tab's Smart Insights panel and the Dashboard's version, so the two never
  // diverge. Uses textContent for the insight text since it may contain a
  // user-entered vehicle name.
  function renderInsightsInto(container, r){
    const activeVehicle = vehiclesApi.getActive();
    const avgFuelLogMileage = activeVehicle ? fuelLogApi.averageMileage(activeVehicle.id) : null;
    const items = insightsApi.generate({
      mileageDropPct: r.mileageDropPct,
      extraYearlyCost: r.extraYearlyCost,
      extraMonthlyCost: r.extraMonthlyCost,
      petrolPrice: r.petrolPrice,
      monthlyKm: r.monthlyKm,
      originalMileage: r.originalMileage,
      fuelLogAverageMileage: avgFuelLogMileage,
      vehicleName: activeVehicle ? activeVehicle.name : null,
    });
    container.innerHTML = '';
    items.forEach(function(item){
      const row = document.createElement('div');
      row.className = 'insight-item';
      const iconSpan = document.createElement('span');
      iconSpan.className = 'insight-icon';
      iconSpan.textContent = item.icon;
      const textSpan = document.createElement('span');
      textSpan.className = 'insight-text';
      textSpan.textContent = item.text;
      row.appendChild(iconSpan);
      row.appendChild(textSpan);
      container.appendChild(row);
    });
  }

  function renderInsights(r){
    renderInsightsInto(el.insightsList, r);
  }

  /* ============ Fuel blend comparison (E0/E10/E20/E85) ============ */

  // Renders the blend comparison table. Uses r.originalMileage as the E10
  // reference point (this app's "before E20" figure), per fuelBlend.js's
  // documented convention — deliberately a separate model from the main
  // calculator's empirical mileage-drop %, so the table caption says so.
  function renderFuelBlendComparison(r){
    const blends = blendApi.compareBlends({
      referenceMileage: r.originalMileage,
      referenceEthanolPct: 10,
      petrolPrice: r.petrolPrice,
    });
    el.blendTableBody.innerHTML = blends.map(function(b){
      const badges =
        (b.isReference ? ' <span class="hist-badge">Your baseline</span>' : '') +
        (b.availableInIndia ? '' : ' <span class="hist-badge" style="background:rgba(255,176,32,0.12); color:var(--warn); border-color:rgba(255,176,32,0.3);">Not sold in India</span>');
      return '<tr>' +
        '<td>' + b.label + badges + '</td>' +
        '<td>' + fmtNum(b.mileage) + ' km/L</td>' +
        '<td>' + fmtINR(b.costPerKm) + '</td>' +
      '</tr>';
    }).join('');
  }

  /* ============ CO2 emissions estimator ============ */

  function renderCO2Estimate(r){
    const co2 = co2Api.estimate({
      originalMileage: r.originalMileage,
      newMileage: r.newMileage,
      monthlyKm: r.monthlyKm,
      beforeEthanolPct: 10,
      afterEthanolPct: 20,
    });
    renderStats(el.co2Stats, [
      { label:'Monthly CO₂ (E10)', raw: fmtNum(co2.co2MonthlyBefore,1) + ' kg', icon:'🌱' },
      { label:'Monthly CO₂ (E20)', raw: fmtNum(co2.co2MonthlyAfter,1) + ' kg', tone: co2.co2MonthlyAfter < co2.co2MonthlyBefore ? 'positive' : 'negative', icon:'🌍' },
      { label:'Yearly CO₂ Change', raw: (co2.co2YearlyDelta >= 0 ? '+' : '') + fmtNum(co2.co2YearlyDelta,0) + ' kg', tone: co2.co2YearlyDelta > 0 ? 'negative' : 'positive', icon:'📉' },
    ]);
  }

  /* ============ Two-vehicle comparison ============ */

  // Populate both compare dropdowns from saved vehicle profiles.
  function populateCompareDropdowns(){
    const list = vehiclesApi.list();
    const options = '<option value="">Select a saved vehicle…</option>' +
      list.map(function(v){ return '<option value="' + v.id + '">' + escapeHTML(v.name) + '</option>'; }).join('');
    const prevA = el.compareVehicleA.value;
    const prevB = el.compareVehicleB.value;
    el.compareVehicleA.innerHTML = options;
    el.compareVehicleB.innerHTML = options;
    if(list.some(function(v){ return v.id === prevA; })) el.compareVehicleA.value = prevA;
    if(list.some(function(v){ return v.id === prevB; })) el.compareVehicleB.value = prevB;
  }

  function renderVehicleCompare(r){
    const vehicleA = vehiclesApi.getById(el.compareVehicleA.value);
    const vehicleB = vehiclesApi.getById(el.compareVehicleB.value);
    if(!vehicleA || !vehicleB){
      el.compareResults.innerHTML = '<div class="empty-state">Pick two saved vehicles above to compare them side by side.</div>';
      return;
    }
    const shared = {
      mileageDropPct: r.mileageDropPct,
      petrolPrice: r.petrolPrice,
      amountPurchased: r.amountPurchased,
      monthlyKm: r.monthlyKm,
    };
    const cmp = compareApi.compare(vehicleA, vehicleB, shared);
    const rows = [
      { label:'Mileage (after E20)', a: fmtNum(cmp.a.result.newMileage) + ' km/L', b: fmtNum(cmp.b.result.newMileage) + ' km/L' },
      { label:'Cost per km', a: fmtINR(cmp.a.result.costPerKmAfter), b: fmtINR(cmp.b.result.costPerKmAfter) },
      { label:'Monthly Fuel Cost', a: fmtINR(cmp.a.result.monthlyFuelCostAfter), b: fmtINR(cmp.b.result.monthlyFuelCostAfter) },
      { label:'Extra Yearly Cost (E20)', a: fmtINR(cmp.a.result.extraYearlyCost), b: fmtINR(cmp.b.result.extraYearlyCost) },
    ];
    const winner = cmp.monthlyCostDeltaBvsA === 0 ? null : (cmp.monthlyCostDeltaBvsA < 0 ? cmp.b.name : cmp.a.name);
    el.compareResults.innerHTML =
      '<div class="table-scroll"><table class="ref-table">' +
        '<thead><tr><th>Metric</th><th>' + escapeHTML(cmp.a.name) + '</th><th>' + escapeHTML(cmp.b.name) + '</th></tr></thead>' +
        '<tbody>' + rows.map(function(row){
          return '<tr><td>' + row.label + '</td><td>' + row.a + '</td><td>' + row.b + '</td></tr>';
        }).join('') + '</tbody>' +
      '</table></div>' +
      (winner ? '<div class="disclaimer-box" style="margin-top:14px;">💡 At these numbers, <strong>' + escapeHTML(winner) + '</strong> costs less per month to run under E20 by ' +
        fmtINR(Math.abs(cmp.monthlyCostDeltaBvsA)) + '.</div>' : '');
  }

  el.compareVehicleA.addEventListener('change', function(){ renderVehicleCompare(calculate()); });
  el.compareVehicleB.addEventListener('change', function(){ renderVehicleCompare(calculate()); });

  /* ============ Share ============ */

  el.copyLinkBtn.addEventListener('click', function(){
    const r = calculate();
    const url = shareApi.buildShareURL(r);
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(function(){ showToast('Shareable link copied'); })
        .catch(function(){ fallbackCopy(url); });
    } else {
      fallbackCopy(url);
    }
  });

  el.whatsappShareBtn.addEventListener('click', function(){
    const r = calculate();
    const url = shareApi.buildShareURL(r);
    const summary = 'E20 is costing me roughly ' + fmtINR(r.extraYearlyCost) + ' extra a year. Check your own numbers:';
    window.open(shareApi.buildWhatsAppURL(url, summary), '_blank', 'noopener,noreferrer');
  });

  // If the page was opened via a shared link, apply whatever inputs were
  // encoded in the URL before the first render.
  function applySharedLinkIfPresent(){
    const parsed = shareApi.parseShareURL(window.location.href);
    if(!parsed) return;
    if(parsed.originalMileage !== null) el.origMileage.value = parsed.originalMileage;
    if(parsed.mileageDropPct !== null){
      el.mileageDrop.value = parsed.mileageDropPct;
      el.mileageDropSlider.value = Math.min(10, parsed.mileageDropPct);
    }
    if(parsed.petrolPrice !== null) el.petrolPrice.value = parsed.petrolPrice;
    if(parsed.amountPurchased !== null) el.amountPurchased.value = parsed.amountPurchased;
    if(parsed.monthlyKm !== null) el.monthlyKm.value = parsed.monthlyKm;
  }

  /* ============ Advanced Mode (driving-condition modifiers) ============ */

  // Build one <select> per modifier group from advancedMode.js's own data —
  // deliberately not hand-written per-group HTML, so adding/removing a
  // modifier group later only ever means editing advancedMode.js.
  function renderAdvancedModifierControls(){
    const groups = advancedModeApi.MODIFIER_GROUPS;
    el.advancedModifiers.innerHTML = Object.keys(groups).map(function(key){
      const group = groups[key];
      const options = group.options.map(function(opt){
        const selected = advancedModeSelections[key] === opt.id ? ' selected' : '';
        const sign = opt.pct > 0 ? '+' : '';
        return '<option value="' + opt.id + '"' + selected + '>' + opt.label + ' (' + sign + opt.pct + '%)</option>';
      }).join('');
      return '' +
        '<div class="field">' +
          '<label>' + group.label + '</label>' +
          '<div class="input-row no-prefix">' +
            '<select class="styled-select advanced-modifier-select" data-group="' + key + '">' + options + '</select>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  // Show the net effect of the current modifier selections: combined %,
  // and what it does to the entered Original Mileage. Purely informational —
  // calculate() re-derives this itself rather than reading it back out.
  function renderAdvancedSummary(){
    const baseMileage = parseFloat(el.origMileage.value) || 0;
    const multiplier = advancedModeApi.netMultiplier(advancedModeSelections);
    const netPct = (multiplier - 1) * 100;
    const adjusted = advancedModeApi.computeAdjustedMileage(baseMileage, advancedModeSelections);
    const sign = netPct >= 0 ? '+' : '';
    const tone = netPct > 0 ? 'positive' : (netPct < 0 ? 'negative' : '');
    el.advancedSummary.innerHTML =
      '<div class="stat' + (tone ? ' ' + tone : '') + '">' +
        '<div class="s-label">🧮 Net Modifier Effect</div>' +
        '<div class="s-value' + (tone ? ' ' + tone : '') + '">' + sign + fmtNum(netPct,1) + '%</div>' +
        '<div class="s-sub">Adjusted mileage: ' + fmtNum(adjusted) + ' km/L (base ' + fmtNum(baseMileage) + ' km/L)</div>' +
      '</div>';
  }

  function persistAdvancedModeSettings(){
    const settings = storageApi.getSettings();
    storageApi.saveSettings(Object.assign({}, settings, {
      advancedModeEnabled: advancedModeEnabled,
      advancedModeSelections: advancedModeSelections,
    }));
  }

  el.advancedModeToggle.addEventListener('change', function(){
    advancedModeEnabled = el.advancedModeToggle.checked;
    el.advancedModeBody.style.maxHeight = advancedModeEnabled ? el.advancedModeBody.scrollHeight + 'px' : '0';
    persistAdvancedModeSettings();
    render();
  });

  el.advancedModifiers.addEventListener('change', function(e){
    const select = e.target.closest('.advanced-modifier-select');
    if(!select) return;
    advancedModeSelections[select.getAttribute('data-group')] = select.value;
    renderAdvancedSummary();
    persistAdvancedModeSettings();
    if(advancedModeEnabled) render();
  });

  el.origMileage.addEventListener('input', renderAdvancedSummary);

  /* ============ Settings: data backup / restore / clear ============ */

  function setDataStatus(msg, isError){
    if(!el.dataManagementStatus) return;
    el.dataManagementStatus.textContent = msg;
    el.dataManagementStatus.style.color = isError ? 'var(--red)' : 'var(--teal)';
  }

  if(el.exportAllDataBtn){
    el.exportAllDataBtn.addEventListener('click', function(){
      dataManagementApi.downloadBackup();
      setDataStatus('Backup file downloaded.', false);
    });
  }

  if(el.importAllDataBtn){
    el.importAllDataBtn.addEventListener('click', function(){ el.importDataFile.click(); });
  }

  if(el.importDataFile){
    el.importDataFile.addEventListener('change', function(){
      const file = el.importDataFile.files && el.importDataFile.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = function(){
        let parsed;
        try{ parsed = JSON.parse(reader.result); }
        catch(err){ setDataStatus('Could not read that file — it is not valid JSON.', true); return; }
        const confirmed = window.confirm('Importing will replace your current vehicles, history, and fuel logs with the backup contents. Continue?');
        if(!confirmed){ el.importDataFile.value = ''; return; }
        const result = dataManagementApi.importAll(parsed);
        setDataStatus(result.message, !result.ok);
        if(result.ok){
          // Refresh everything that reads from storage.
          advancedModeSelections = advancedModeApi.defaultSelections();
          const restored = storageApi.getSettings();
          if(restored.advancedModeSelections){
            advancedModeSelections = Object.assign(advancedModeApi.defaultSelections(), restored.advancedModeSelections);
          }
          advancedModeEnabled = !!restored.advancedModeEnabled;
          el.advancedModeToggle.checked = advancedModeEnabled;
          renderAdvancedModifierControls();
          renderProfileSelect();
          const activeVehicle = vehiclesApi.getActive();
          if(activeVehicle){ el.profileSelect.value = activeVehicle.id; applyProfileToForm(activeVehicle); }
          renderHistoryList();
          renderFuelLog();
          render();
          showToast('Data restored');
        }
        el.importDataFile.value = '';
      };
      reader.readAsText(file);
    });
  }

  if(el.clearAllDataBtn){
    el.clearAllDataBtn.addEventListener('click', function(){
      const confirmed = window.confirm('This permanently deletes ALL your vehicles, calculation history, and fuel logs from this browser. Your theme choice is kept. This cannot be undone. Continue?');
      if(!confirmed) return;
      dataManagementApi.clearAll();
      advancedModeSelections = advancedModeApi.defaultSelections();
      advancedModeEnabled = false;
      el.advancedModeToggle.checked = false;
      renderAdvancedModifierControls();
      vehiclesApi.setActive(null);
      el.profileSelect.value = '';
      renderProfileSelect();
      renderHistoryList();
      renderFuelLog();
      render();
      setDataStatus('All app data cleared.', false);
      showToast('All data cleared');
    });
  }

  /* ============ Copy / Print / PDF ============ */

  function buildResultsText(r){
    return [
      'E20 Petrol Mileage & Cost Impact Report',
      '----------------------------------------',
      'Original Mileage: ' + fmtNum(r.originalMileage) + ' km/L',
      'Mileage Drop: ' + fmtNum(r.mileageDropPct) + '%',
      'New Mileage: ' + fmtNum(r.newMileage) + ' km/L',
      'Petrol Price: ' + fmtINR(r.petrolPrice) + '/L',
      '',
      'Fuel Purchased (' + fmtINR(r.amountPurchased) + '): ' + fmtNum(r.fuelPurchased) + ' L',
      'Distance Before E20: ' + fmtNum(r.distanceBefore) + ' km',
      'Distance After E20: ' + fmtNum(r.distanceAfter) + ' km',
      'Distance Lost: ' + fmtNum(r.distanceLost) + ' km',
      '',
      'Cost of Lost Distance: ' + fmtINR(r.costOfLostDistance),
      'Extra Cost for Lost Distance: ' + fmtINR(r.extraCostForLostDistance),
      '',
      'Cost per KM Before: ' + fmtINR(r.costPerKmBefore),
      'Cost per KM After: ' + fmtINR(r.costPerKmAfter),
      '',
      'Monthly Distance: ' + fmtNum(r.monthlyKm,0) + ' km',
      'Monthly Cost Before: ' + fmtINR(r.monthlyFuelCostBefore),
      'Monthly Cost After: ' + fmtINR(r.monthlyFuelCostAfter),
      'Extra Monthly Cost: ' + fmtINR(r.extraMonthlyCost),
      'Extra Yearly Cost: ' + fmtINR(r.extraYearlyCost),
    ].join('\n');
  }

  function showToast(msg){
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    setTimeout(()=> el.toast.classList.remove('show'), 2200);
  }

  document.getElementById('copyBtn').addEventListener('click', function(){
    const r = calculate();
    const text = buildResultsText(r);
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(()=> showToast('Results copied to clipboard'))
        .catch(()=> fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  });

  function fallbackCopy(text){
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try{ document.execCommand('copy'); showToast('Results copied to clipboard'); }
    catch(e){ showToast('Copy failed — please copy manually'); }
    document.body.removeChild(ta);
  }

  /* ============ Print / PDF report builder ============ */

  // Fixed, print-safe palette — deliberately NOT read from CSS variables,
  // since the report must look correct on white paper regardless of whether
  // the on-screen app is currently in dark or light mode.
  const REPORT_COLORS = {
    text: '#1a2230',
    subtext: '#6b7684',
    amber: '#c9820f',
    teal: '#0f9c8c',
    red: '#c23a3a',
    track: '#e4e8ee',
  };

  // Draw a static (single-pass, non-animated) two-bar comparison chart at a
  // fixed high resolution suitable for print, and return it as a PNG data
  // URL. Separate from the on-screen drawHBarChart on purpose: that one is
  // an animated rAF loop tied to live theme colors, this one is a single
  // synchronous pass with fixed print-safe colors — different enough
  // concerns that sharing one implementation would complicate both.
  function renderStaticBarChartImage(labelA, valA, labelB, valB, unit){
    const canvas = document.createElement('canvas');
    const width = 640, height = 220, scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const maxVal = Math.max(valA, valB, 1) * 1.15;
    const barH = 46, gap = 34, leftPad = 8, rightPad = 170;
    const chartW = width - leftPad - rightPad;

    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = REPORT_COLORS.subtext;
    ctx.fillText(labelA, leftPad, 26);
    const wA = chartW * (valA / maxVal);
    ctx.fillStyle = REPORT_COLORS.amber;
    roundRect(ctx, leftPad, 34, Math.max(wA,2), barH, 8);
    ctx.fill();
    ctx.fillStyle = REPORT_COLORS.text;
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(fmtNum(valA,1) + ' ' + unit, leftPad + wA + 14, 34 + barH/2 + 5);

    const y2 = 34 + barH + gap;
    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = REPORT_COLORS.subtext;
    ctx.fillText(labelB, leftPad, y2 - 8);
    const wB = chartW * (valB / maxVal);
    ctx.fillStyle = REPORT_COLORS.teal;
    roundRect(ctx, leftPad, y2, Math.max(wB,2), barH, 8);
    ctx.fill();
    ctx.fillStyle = REPORT_COLORS.text;
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(fmtNum(valB,1) + ' ' + unit, leftPad + wB + 14, y2 + barH/2 + 5);

    return canvas.toDataURL('image/png');
  }

  // Draw a static circular gauge (mileage-loss %) for print, matching the
  // on-screen gauge's data but in print-safe colors, and return a PNG data URL.
  function renderStaticGaugeImage(pct){
    const canvas = document.createElement('canvas');
    const width = 320, height = 260, scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const cx = width/2, cy = 130, radius = 85;
    const startAngle = Math.PI * 0.75, fullSweep = Math.PI * 1.5;
    const clampedPct = Math.max(0, Math.min(30, pct));
    const frac = clampedPct / 30;

    let color = REPORT_COLORS.teal;
    if(pct > 5) color = REPORT_COLORS.amber;
    if(pct > 12) color = REPORT_COLORS.red;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + fullSweep);
    ctx.strokeStyle = REPORT_COLORS.track;
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + fullSweep * frac);
    ctx.strokeStyle = color;
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = REPORT_COLORS.text;
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(fmtNum(pct,1) + '%', cx, cy + 8);
    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = REPORT_COLORS.subtext;
    ctx.fillText('mileage lost', cx, cy + 30);
    if(insightsApi){
      const cls = insightsApi.classifyDrop(pct);
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(cls.label.toUpperCase(), cx, cy + 52);
    }
    ctx.textAlign = 'left';

    return canvas.toDataURL('image/png');
  }

  // Assemble the full print/PDF report into the hidden #printReport
  // container. Runs synchronously and completely (no animation), so the
  // very next window.print() call always reflects the current numbers.
  // Single source of truth for "what goes in a full report" — used by both
  // the print/PDF builder and the CSV export, so the two can never drift
  // apart or duplicate this assembly logic. Returns plain data only (no
  // HTML, no images) so either consumer can format it however it needs.
  function gatherReportData(r){
    const activeVehicle = vehiclesApi.getActive();
    const now = new Date();
    const generatedAt = now.toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });

    const vehicleLine = activeVehicle
      ? activeVehicle.name + ' — ' + activeVehicle.company + ' ' + activeVehicle.model +
        ' (' + activeVehicle.type + ', ' + (activeVehicle.fuelType || 'Petrol') + ')'
      : 'No saved vehicle profile selected — using manually entered figures.';

    const inputRows = [
      ['Original Mileage', fmtNum(r.originalMileage) + ' km/L'],
      ['Mileage Drop Assumption', fmtNum(r.mileageDropPct,1) + '%'],
      ['Petrol Price', fmtINR(r.petrolPrice) + ' / L'],
      ['Fuel Purchase Amount', fmtINR(r.amountPurchased)],
      ['Monthly Distance', fmtNum(r.monthlyKm,0) + ' km'],
    ];

    const kpis = [
      ['New Mileage (After E20)', fmtNum(r.newMileage) + ' km/L'],
      ['Distance Lost', fmtNum(r.distanceLost) + ' km'],
      ['Extra Monthly Cost', fmtINR(r.extraMonthlyCost)],
      ['Extra Yearly Cost', fmtINR(r.extraYearlyCost)],
      ['Cost per KM (Before → After)', fmtINR(r.costPerKmBefore) + ' → ' + fmtINR(r.costPerKmAfter)],
      ['Extra Cost of Lost Distance', fmtINR(r.extraCostForLostDistance)],
    ];

    const compareRows = [
      ['Mileage', fmtNum(r.originalMileage) + ' km/L', fmtNum(r.newMileage) + ' km/L'],
      ['Cost per km', fmtINR(r.costPerKmBefore), fmtINR(r.costPerKmAfter)],
      ['Distance for ' + fmtINR(r.amountPurchased), fmtNum(r.distanceBefore) + ' km', fmtNum(r.distanceAfter) + ' km'],
      ['Monthly Fuel Cost', fmtINR(r.monthlyFuelCostBefore), fmtINR(r.monthlyFuelCostAfter)],
      ['Distance Lost', '—', fmtNum(r.distanceLost) + ' km'],
    ];

    const monthlyYearlyRows = [
      ['Monthly Fuel Cost Before', fmtINR(r.monthlyFuelCostBefore)],
      ['Monthly Fuel Cost After', fmtINR(r.monthlyFuelCostAfter)],
      ['Extra Monthly Cost', fmtINR(r.extraMonthlyCost)],
      ['Extra Yearly Cost', fmtINR(r.extraYearlyCost)],
    ];

    const avgFuelLogMileage = activeVehicle ? fuelLogApi.averageMileage(activeVehicle.id) : null;
    const insightItems = insightsApi.generate({
      mileageDropPct: r.mileageDropPct, extraYearlyCost: r.extraYearlyCost, extraMonthlyCost: r.extraMonthlyCost,
      petrolPrice: r.petrolPrice, monthlyKm: r.monthlyKm, originalMileage: r.originalMileage,
      fuelLogAverageMileage: avgFuelLogMileage, vehicleName: activeVehicle ? activeVehicle.name : null,
    });

    return {
      activeVehicle, generatedAt, vehicleLine,
      inputRows, kpis, compareRows, monthlyYearlyRows, insightItems,
    };
  }

  function buildPrintReport(r){
    const data = gatherReportData(r);
    const { generatedAt, kpis, compareRows, insightItems } = data;
    const inputRows = data.inputRows;
    // HTML output escapes the vehicle line itself here (gatherReportData
    // returns plain text so CSV export doesn't have to un-escape it).
    const vehicleLine = escapeHTML(data.vehicleLine);

    const mileageChartImg = renderStaticBarChartImage('Before', r.originalMileage, 'After', r.newMileage, 'km/L');
    const distanceChartImg = renderStaticBarChartImage('Before', r.distanceBefore, 'After', r.distanceAfter, 'km');
    const monthlyChartImg = renderStaticBarChartImage('Before', r.monthlyFuelCostBefore, 'After', r.monthlyFuelCostAfter, '₹');
    const gaugeImg = renderStaticGaugeImage(r.mileageDropPct);

    const html = '' +
      '<div class="report-header">' +
        '<div class="report-logo">⛽ <span>E20 Calculator</span></div>' +
        '<div class="report-meta">' +
          '<div class="report-title">E20 Mileage &amp; Cost Impact Report</div>' +
          '<div class="report-sub">Generated ' + generatedAt + '</div>' +
          '<div class="report-sub">' + vehicleLine + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="report-section">' +
        '<h3>Inputs Used</h3>' +
        '<table class="report-table"><tbody>' +
          inputRows.map(function(row){ return '<tr><td>' + row[0] + '</td><td>' + row[1] + '</td></tr>'; }).join('') +
        '</tbody></table>' +
      '</div>' +

      '<div class="report-section">' +
        '<h3>Key Results</h3>' +
        '<div class="report-kpi-grid">' +
          kpis.map(function(k){ return '<div class="report-kpi"><div class="rk-label">' + k[0] + '</div><div class="rk-value">' + k[1] + '</div></div>'; }).join('') +
        '</div>' +
      '</div>' +

      '<div class="report-section report-charts-section">' +
        '<h3>Charts</h3>' +
        '<div class="report-charts-grid">' +
          '<div><img src="' + mileageChartImg + '" alt="Mileage before vs after"><div class="report-chart-caption">Mileage — Before vs After</div></div>' +
          '<div><img src="' + distanceChartImg + '" alt="Distance before vs after"><div class="report-chart-caption">Distance for ' + fmtINR(r.amountPurchased) + '</div></div>' +
          '<div><img src="' + monthlyChartImg + '" alt="Monthly cost before vs after"><div class="report-chart-caption">Monthly Fuel Cost</div></div>' +
          '<div><img src="' + gaugeImg + '" alt="Mileage loss gauge"><div class="report-chart-caption">Mileage Loss Gauge</div></div>' +
        '</div>' +
      '</div>' +

      '<div class="report-section">' +
        '<h3>Before vs After Comparison</h3>' +
        '<table class="report-table"><thead><tr><th>Metric</th><th>Before E20</th><th>After E20</th></tr></thead><tbody>' +
          compareRows.map(function(row){ return '<tr><td>' + row[0] + '</td><td>' + row[1] + '</td><td>' + row[2] + '</td></tr>'; }).join('') +
        '</tbody></table>' +
      '</div>' +

      '<div class="report-section">' +
        '<h3>Smart Insights</h3>' +
        '<ul class="report-insights">' +
          insightItems.map(function(item){ return '<li>' + item.icon + ' ' + escapeHTML(item.text) + '</li>'; }).join('') +
        '</ul>' +
      '</div>' +

      '<div class="report-section report-formulas">' +
        '<h3>Formulas Reference</h3>' +
        FORMULAS.map(function(f){ return '<div class="report-formula"><strong>' + f.name + ':</strong> ' + f.expr + '</div>'; }).join('') +
      '</div>' +

      '<div class="report-footer">' +
        'This report is provided for general information and estimation only. Figures depend entirely on the values entered above. ' +
        'E20 Petrol Mileage Impact Calculator — designed for educational and estimation purposes.' +
      '</div>';

    el.printReport.innerHTML = html;
  }

  document.getElementById('printBtn').addEventListener('click', function(){
    buildPrintReport(calculate());
    window.print();
  });

  document.getElementById('pdfBtn').addEventListener('click', function(){
    buildPrintReport(calculate());
    showToast('Use the print dialog → “Save as PDF”');
    setTimeout(function(){ window.print(); }, 300);
  });

  /* ============ CSV export ============ */

  // Reuses gatherReportData() — the exact same data the PDF report is built
  // from — so the CSV and PDF can never show different numbers for the
  // same calculation.
  el.csvExportBtn.addEventListener('click', function(){
    const r = calculate();
    const data = gatherReportData(r);
    const csv = csvApi.buildResultCSV(data);
    const stamp = new Date().toISOString().slice(0,10);
    const vehiclePart = data.activeVehicle ? '-' + data.activeVehicle.name.replace(/[^a-z0-9]+/gi,'_') : '';
    csvApi.downloadCSV('e20-report' + vehiclePart + '-' + stamp + '.csv', csv);
    showToast('CSV exported');
  });

  document.getElementById('resetBtn').addEventListener('click', function(){
    el.origMileage.value = 40;
    el.mileageDrop.value = 6;
    el.mileageDropSlider.value = 6;
    el.petrolPrice.value = 111.47;
    el.amountPurchased.value = 1000;
    el.monthlyKm.value = 1000;
    el.tripDistance.value = '';
    el.tripType.value = 'oneway';
    el.budgetAmount.value = '';
    el.monthsOnE20.value = 3;
    render();
    showToast('Inputs reset to defaults');
  });

  /* ============ Formula collapsible ============ */

  const formulaToggle = document.getElementById('formulaToggle');
  const formulaBody = document.getElementById('formulaBody');
  formulaToggle.addEventListener('click', function(){
    const isOpen = formulaToggle.classList.toggle('open');
    formulaBody.style.maxHeight = isOpen ? formulaBody.scrollHeight + 'px' : '0';
  });

  /* ============ Theme toggle ============ */

  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');

  // Shared theme-toggle handler so the sidebar toggle (desktop) and the
  // top-bar toggle (mobile) stay in sync and both persist the choice.
  function toggleTheme(){
    const body = document.body;
    const isLight = body.getAttribute('data-theme') === 'light';
    const nextTheme = isLight ? 'dark' : 'light';
    body.setAttribute('data-theme', nextTheme);
    if(themeLabel) themeLabel.textContent = isLight ? 'Dark' : 'Light';
    const settings = storageApi.getSettings();
    storageApi.saveSettings(Object.assign({}, settings, { theme: nextTheme }));
    renderCharts(calculate());
  }

  if(themeToggle) themeToggle.addEventListener('click', toggleTheme);
  if(el.themeToggleMobile) el.themeToggleMobile.addEventListener('click', toggleTheme);

  /* ============ Wire up live updates ============ */

  inputs.forEach(inputEl=>{
    inputEl.addEventListener('input', ()=> render());
  });

  // Keep the mileage-drop slider and number input mirrored in both directions.
  el.mileageDrop.addEventListener('input', function(){
    const v = parseFloat(el.mileageDrop.value);
    if(!isNaN(v) && v >= 0 && v <= 10) el.mileageDropSlider.value = v;
  });
  el.mileageDropSlider.addEventListener('input', function(){
    el.mileageDrop.value = el.mileageDropSlider.value;
    render();
  });

  window.addEventListener('resize', function(){
    renderCharts(calculate());
  });

  /* ============ Vehicle details lookup ============ */

  // Simple inline icon set keyed by vehicle type, used as a placeholder / fallback.
  const TYPE_ICONS = {
    car: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13"/><rect x="2" y="13" width="20" height="6" rx="1.5"/><circle cx="7" cy="19" r="1.7"/><circle cx="17" cy="19" r="1.7"/></svg>',
    motorcycle: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><circle cx="5.5" cy="17.5" r="3.2"/><circle cx="18.5" cy="17.5" r="3.2"/><path d="M5.5 17.5h6l3-7h4M11.5 17.5l3-7-2.5-3H8"/></svg>',
    scooter: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><circle cx="5.5" cy="17.5" r="3"/><circle cx="18.5" cy="17.5" r="3"/><path d="M8.3 17.5h7.7l-1-6h-5a2 2 0 0 1-2-2V7h4"/></svg>',
  };

  // Curated type → company → models map. Not exhaustive, but covers the popular
  // models people in India are likely to look up. "Company (Model)" is used as
  // the Wikipedia search query so results land on the right page.
  const VEHICLE_DB = {
    car: {
      "Maruti Suzuki": ["Swift","Baleno","Dzire","WagonR","Ertiga","Brezza","Alto K10","Celerio","Fronx","Grand Vitara"],
      "Hyundai": ["Creta","Venue","i20","Verna","Exter","Alcazar","Grand i10 Nios"],
      "Tata Motors": ["Nexon","Punch","Altroz","Harrier","Safari","Tiago","Tigor"],
      "Mahindra": ["Scorpio-N","XUV700","Thar","Bolero","XUV300"],
      "Honda": ["City","Amaze","Elevate"],
      "Kia": ["Seltos","Sonet","Carens"],
      "Toyota": ["Innova Crysta","Fortuner","Glanza","Urban Cruiser Hyryder"],
      "Volkswagen": ["Virtus","Taigun"],
      "Skoda": ["Slavia","Kushaq"],
      "Renault": ["Kwid","Triber","Kiger"],
      "Nissan": ["Magnite"],
    },
    motorcycle: {
      "Hero MotoCorp": ["Splendor Plus","HF Deluxe","Passion Pro","Glamour","Xtreme 160R"],
      "Bajaj": ["Pulsar 150","Pulsar NS200","Platina","Avenger Street 160","Dominar 400"],
      "TVS": ["Apache RTR 160","Raider 125","Sport"],
      "Royal Enfield": ["Classic 350","Bullet 350","Hunter 350","Himalayan","Meteor 350"],
      "Yamaha": ["FZ-S","MT-15","R15 V4"],
      "Honda": ["Shine","Unicorn","Hornet 2.0","CB350"],
      "Suzuki": ["Gixxer","Gixxer SF"],
      "KTM": ["Duke 200","Duke 390"],
    },
    scooter: {
      "Honda": ["Activa 6G","Activa 125","Dio"],
      "TVS": ["Jupiter","Ntorq 125","iQube"],
      "Suzuki": ["Access 125","Burgman Street"],
      "Hero MotoCorp": ["Pleasure Plus","Destini 125","Maestro Edge"],
      "Bajaj": ["Chetak"],
      "Yamaha": ["Fascino 125","RayZR 125"],
      "Ather": ["450X","450S"],
      "Ola Electric": ["S1 Pro","S1 Air"],
    },
  };

  // Fill the Company dropdown with the manufacturers available for the selected type.
  function populateCompanies(){
    const type = el.vehicleType.value;
    const companies = Object.keys(VEHICLE_DB[type] || {});
    el.vehicleCompany.innerHTML = '<option value="">Select company…</option>' +
      companies.map(c => '<option value="' + c + '">' + c + '</option>').join('');
    el.vehicleCompany.disabled = false;
    resetModelDropdown('Select company first…');
    renderVehicleFallback('Pick a company, then a model, to see a reference image here.');
  }

  // Reset the Model dropdown to a disabled placeholder state.
  function resetModelDropdown(placeholder){
    el.vehicleModel.innerHTML = '<option value="">' + placeholder + '</option>';
    el.vehicleModel.disabled = true;
  }

  // Fill the Model dropdown with models for the selected type + company.
  function populateModels(){
    const type = el.vehicleType.value;
    const company = el.vehicleCompany.value;
    const models = (VEHICLE_DB[type] && VEHICLE_DB[type][company]) || [];
    if(!company || models.length === 0){
      resetModelDropdown('Select company first…');
      return;
    }
    el.vehicleModel.innerHTML = '<option value="">Select model…</option>' +
      models.map(m => '<option value="' + m + '">' + m + '</option>').join('');
    el.vehicleModel.disabled = false;
  }

  // Show the default placeholder icon for whichever vehicle type is currently selected.
  function showTypeIcon(){
    const type = el.vehicleType.value || 'car';
    el.vpIcon.innerHTML = TYPE_ICONS[type] || TYPE_ICONS.car;
  }

  // Reset the preview panel back to an icon + caption message (used for empty / error states).
  function renderVehicleFallback(message){
    el.vehiclePreview.innerHTML = '';
    const iconWrap = document.createElement('div');
    iconWrap.className = 'vp-icon';
    iconWrap.id = 'vpIcon';
    iconWrap.innerHTML = TYPE_ICONS[el.vehicleType.value] || TYPE_ICONS.car;
    const caption = document.createElement('div');
    caption.className = 'vp-caption';
    caption.id = 'vpCaption';
    caption.textContent = message;
    el.vehiclePreview.appendChild(iconWrap);
    el.vehiclePreview.appendChild(caption);
    el.vpIcon = iconWrap;
    el.vpCaption = caption;
    el.vpMeta.style.display = 'none';
  }

  // Show a spinner while the image/details fetch is in flight.
  function renderVehicleLoading(){
    el.vehiclePreview.innerHTML = '<div class="spinner"></div><div class="vp-caption">Fetching vehicle details…</div>';
    el.vpMeta.style.display = 'none';
  }

  // Render a fetched image + short summary once data is available.
  function renderVehicleImage(imgUrl, title, extract){
    el.vehiclePreview.innerHTML = '';
    const img = document.createElement('img');
    img.src = imgUrl;
    img.alt = title || 'Vehicle image';
    img.referrerPolicy = 'no-referrer';
    img.onerror = function(){
      renderVehicleFallback('Image could not be loaded for "' + title + '".');
    };
    el.vehiclePreview.appendChild(img);

    el.vpTitle.textContent = title || '';
    el.vpExtract.textContent = extract ? extract.replace(/\s+/g,' ').trim() : '';
    el.vpMeta.style.display = 'block';
  }

  // Query Wikipedia's public, CORS-enabled API for a page image + short intro matching the vehicle query.
  async function fetchVehicleImage(){
    const company = el.vehicleCompany.value.trim();
    const model = el.vehicleModel.value.trim();
    if(!model){
      showToast('Select a model first');
      return;
    }
    const query = (company + ' ' + model).trim();
    renderVehicleLoading();
    el.fetchImageBtn.disabled = true;

    const endpoint = 'https://en.wikipedia.org/w/api.php'
      + '?action=query&generator=search&gsrsearch=' + encodeURIComponent(query)
      + '&gsrlimit=1&prop=pageimages|extracts&piprop=original&exintro=1&exchars=220'
      + '&format=json&origin=*';

    try{
      const res = await fetch(endpoint);
      if(!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      const pages = data.query && data.query.pages;
      if(pages){
        const page = Object.values(pages)[0];
        const plainExtract = page.extract ? page.extract.replace(/<[^>]+>/g,'') : '';
        if(page.original && page.original.source){
          renderVehicleImage(page.original.source, page.title, plainExtract);
        } else {
          renderVehicleFallback('No image found for "' + query + '".');
        }
      } else {
        renderVehicleFallback('No results found for "' + query + '".');
      }
    } catch(err){
      renderVehicleFallback('Could not reach Wikipedia — this feature needs an internet connection. Everything else in this calculator still works offline.');
    } finally {
      el.fetchImageBtn.disabled = false;
    }
  }

  el.fetchImageBtn.addEventListener('click', fetchVehicleImage);

  el.vehicleType.addEventListener('change', function(){
    showTypeIcon();
    populateCompanies();
  });

  el.vehicleCompany.addEventListener('change', function(){
    populateModels();
    renderVehicleFallback(el.vehicleCompany.value ? 'Now pick a model to load its image.' : 'Pick a company, then a model, to see a reference image here.');
  });

  el.vehicleModel.addEventListener('change', function(){
    if(el.vehicleModel.value) fetchVehicleImage();
  });

  /* ============ Vehicle profiles ============ */

  // Populate the "Saved Vehicle" dropdown from storage, keeping whichever
  // vehicle is currently active selected (if it still exists).
  function renderProfileSelect(){
    const list = vehiclesApi.list();
    const activeId = storageApi.getActiveVehicleId();
    el.profileSelect.innerHTML = '<option value="">+ New vehicle…</option>' +
      list.map(function(v){
        return '<option value="' + v.id + '"' + (v.id === activeId ? ' selected' : '') + '>' + escapeHTML(v.name) + '</option>';
      }).join('');
    el.deleteProfileBtn.style.display = activeId ? 'inline-flex' : 'none';
    renderFuelLogVehicleHint();
    populateCompareDropdowns();
  }

  // Fill the type/company/model/fuel-type/mileage fields from a saved profile,
  // without triggering an image fetch (the user already has a saved image
  // context; re-fetching on every profile switch would be noisy).
  function applyProfileToForm(vehicle){
    el.vehicleType.value = vehicle.type;
    showTypeIcon();
    populateCompanies();
    el.vehicleCompany.value = vehicle.company;
    populateModels();
    el.vehicleModel.value = vehicle.model;
    if(el.vehicleFuelType) el.vehicleFuelType.value = vehicle.fuelType || 'Petrol';
    if(vehicle.mileage !== null && vehicle.mileage !== undefined && isFinite(vehicle.mileage)){
      el.origMileage.value = vehicle.mileage;
    }
    renderVehicleFallback('Loaded from saved vehicle. Hit "Refresh Image" to fetch a reference photo.');
    render();
  }

  el.profileSelect.addEventListener('change', function(){
    const id = el.profileSelect.value;
    if(!id){
      vehiclesApi.setActive(null);
      el.deleteProfileBtn.style.display = 'none';
      renderFuelLogVehicleHint();
      return;
    }
    const vehicle = vehiclesApi.getById(id);
    if(!vehicle) return;
    vehiclesApi.setActive(id);
    applyProfileToForm(vehicle);
    renderFuelLog();
    el.deleteProfileBtn.style.display = 'inline-flex';
  });

  el.saveProfileBtn.addEventListener('click', function(){
    if(!el.vehicleModel.value){
      showToast('Pick a type, company, and model first');
      return;
    }
    const existingId = el.profileSelect.value;
    const existingVehicle = existingId ? vehiclesApi.getById(existingId) : null;
    // Only update in place if the form still describes the same vehicle that
    // was loaded (type/company/model unchanged) — otherwise the user has
    // edited the fields to describe a different vehicle and Save should
    // create a new profile, not silently overwrite the one that was loaded.
    const formMatchesExisting = !!existingVehicle
      && existingVehicle.type === el.vehicleType.value
      && existingVehicle.company === el.vehicleCompany.value
      && existingVehicle.model === el.vehicleModel.value;

    const defaultName = formMatchesExisting ? existingVehicle.name : (el.vehicleCompany.value + ' ' + el.vehicleModel.value).trim();
    const name = window.prompt('Name this vehicle (e.g. "My Swift"):', defaultName);
    if(name === null) return; // user cancelled
    const data = {
      type: el.vehicleType.value,
      company: el.vehicleCompany.value,
      model: el.vehicleModel.value,
      fuelType: el.vehicleFuelType ? el.vehicleFuelType.value : 'Petrol',
      mileage: parseFloat(el.origMileage.value) || null,
      name: name,
    };
    const saved = formMatchesExisting
      ? vehiclesApi.update(existingId, data)
      : vehiclesApi.create(data);
    vehiclesApi.setActive(saved.id);
    renderProfileSelect();
    el.profileSelect.value = saved.id;
    renderFuelLog();
    showToast('Vehicle saved: ' + saved.name);
  });

  el.deleteProfileBtn.addEventListener('click', function(){
    const id = el.profileSelect.value;
    if(!id) return;
    const vehicle = vehiclesApi.getById(id);
    if(!vehicle) return;
    const confirmed = window.confirm('Delete "' + vehicle.name + '"? Its saved fuel-log entries will also be removed. Calculation history stays, just unlinked from this vehicle.');
    if(!confirmed) return;
    vehiclesApi.remove(id);
    historyApi.detachVehicle(id);
    fuelLogApi.removeAllForVehicle(id);
    renderProfileSelect();
    renderHistoryList();
    renderFuelLog();
    showToast('Vehicle deleted');
  });

  /* ============ Calculation history ============ */

  // Render a compact, clickable list of saved calculations. Clicking a row
  // (outside the delete button) restores those inputs into the calculator.
  function renderHistoryList(){
    const query = el.historySearch ? el.historySearch.value : '';
    const entries = historyApi.search(query);
    if(entries.length === 0){
      el.historyList.innerHTML = '<div class="empty-state">' +
        (query ? 'No saved calculations match "' + escapeHTML(query) + '".' : 'No calculations saved yet — hit "Save Current Calculation" above to start building a history.') +
        '</div>';
      return;
    }
    el.historyList.innerHTML = entries.map(function(entry){
      const out = entry.outputs;
      const vehicleBadge = entry.vehicleName ? '<span class="hist-badge">' + escapeHTML(entry.vehicleName) + '</span>' : '';
      return '' +
        '<div class="history-item" data-id="' + entry.id + '" tabindex="0" role="button" aria-label="Restore this saved calculation">' +
          '<div class="hist-main">' +
            '<div class="hist-top">' + vehicleBadge + '<span class="hist-time">' + fmtRelativeTime(entry.timestamp) + '</span></div>' +
            '<div class="hist-stats">' +
              '<span>' + fmtNum(out.newMileage) + ' km/L</span>' +
              '<span class="hist-dot">·</span>' +
              '<span class="hist-neg">' + fmtINR(out.extraYearlyCost) + '/yr extra</span>' +
            '</div>' +
          '</div>' +
          '<button class="icon-btn danger hist-delete" data-id="' + entry.id + '" title="Delete this entry" aria-label="Delete this saved calculation">🗑</button>' +
        '</div>';
    }).join('');
  }

  // Restore a saved history entry's inputs into the calculator and re-render.
  function restoreHistoryEntry(id){
    const entry = historyApi.list().find(function(e){ return e.id === id; });
    if(!entry) return;
    const inp = entry.inputs;
    el.origMileage.value = inp.originalMileage;
    el.mileageDrop.value = inp.mileageDropPct;
    el.mileageDropSlider.value = Math.min(10, inp.mileageDropPct);
    el.petrolPrice.value = inp.petrolPrice;
    el.amountPurchased.value = inp.amountPurchased;
    el.monthlyKm.value = inp.monthlyKm;
    if(entry.vehicleId && vehiclesApi.getById(entry.vehicleId)){
      vehiclesApi.setActive(entry.vehicleId);
      applyProfileToForm(vehiclesApi.getById(entry.vehicleId));
      renderProfileSelect();
    }
    render();
    showToast('Calculation restored');
    document.getElementById('headlineStats').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  el.historyList.addEventListener('click', function(e){
    const delBtn = e.target.closest('.hist-delete');
    if(delBtn){
      e.stopPropagation();
      historyApi.remove(delBtn.getAttribute('data-id'));
      renderHistoryList();
      showToast('History entry deleted');
      return;
    }
    const item = e.target.closest('.history-item');
    if(item) restoreHistoryEntry(item.getAttribute('data-id'));
  });

  el.historyList.addEventListener('keydown', function(e){
    if(e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('.history-item');
    if(item){ e.preventDefault(); restoreHistoryEntry(item.getAttribute('data-id')); }
  });

  el.historySearch.addEventListener('input', function(){
    el.historySearchClear.style.display = el.historySearch.value ? 'flex' : 'none';
    renderHistoryList();
  });

  el.historySearchClear.addEventListener('click', function(){
    el.historySearch.value = '';
    el.historySearchClear.style.display = 'none';
    renderHistoryList();
    el.historySearch.focus();
  });

  el.saveHistoryBtn.addEventListener('click', function(){
    const r = calculate();
    const activeVehicle = vehiclesApi.getActive();
    historyApi.add({
      vehicleId: activeVehicle ? activeVehicle.id : null,
      vehicleName: activeVehicle ? activeVehicle.name : null,
      inputs: {
        originalMileage: r.originalMileage,
        mileageDropPct: r.mileageDropPct,
        petrolPrice: r.petrolPrice,
        amountPurchased: r.amountPurchased,
        monthlyKm: r.monthlyKm,
      },
      outputs: {
        newMileage: r.newMileage,
        extraYearlyCost: r.extraYearlyCost,
        extraMonthlyCost: r.extraMonthlyCost,
        distanceLost: r.distanceLost,
      },
    });
    renderHistoryList();
    showToast('Calculation saved to history');
  });

  el.clearHistoryBtn.addEventListener('click', function(){
    if(historyApi.list().length === 0) return;
    const confirmed = window.confirm('Clear all saved calculation history? This cannot be undone.');
    if(!confirmed) return;
    historyApi.clear();
    renderHistoryList();
    showToast('History cleared');
  });

  /* ============ Fuel log ============ */

  // Show a hint in the fuel-log panel when no vehicle is selected yet, since
  // every fuel-log entry must belong to a saved vehicle.
  function renderFuelLogVehicleHint(){
    const activeVehicle = vehiclesApi.getActive();
    const hasVehicle = !!activeVehicle;
    el.fuelLogForm.classList.toggle('disabled-block', !hasVehicle);
    el.addFuelLogBtn.disabled = !hasVehicle;
    [el.fuelDate, el.fuelOdometer, el.fuelAmount, el.fuelPricePerLitre, el.fuelLitres].forEach(function(input){ input.disabled = !hasVehicle; });
    el.fuelLogVehicleHint.textContent = hasVehicle
      ? 'Logging fill-ups for ' + activeVehicle.name + '.'
      : 'Select or save a vehicle above to start logging fill-ups.';
    // Convenience prefill only — never overwrites a price the user already typed.
    if(hasVehicle && !el.fuelPricePerLitre.value && el.petrolPrice.value){
      el.fuelPricePerLitre.value = el.petrolPrice.value;
    }
  }

  // Render the fill-up table, the derived average mileage stat, and enable/
  // disable the "use this mileage" button for the active vehicle.
  function renderFuelLog(){
    renderFuelLogVehicleHint();
    const activeVehicle = vehiclesApi.getActive();
    if(!activeVehicle){
      el.fuelLogBody.innerHTML = '<tr><td colspan="6" class="empty-state-cell">No vehicle selected.</td></tr>';
      el.avgMileageValue.textContent = '—';
      el.useFuelMileageBtn.disabled = true;
      return;
    }
    const derived = fuelLogApi.withDerivedMileage(activeVehicle.id);
    if(derived.length === 0){
      el.fuelLogBody.innerHTML = '<tr><td colspan="6" class="empty-state-cell">No fill-ups logged yet.</td></tr>';
    } else {
      el.fuelLogBody.innerHTML = derived.slice().reverse().map(function(e){
        return '<tr>' +
          '<td>' + fmtDateShort(e.date) + '</td>' +
          '<td>' + fmtNum(e.odometer,0) + ' km</td>' +
          '<td>' + fmtNum(e.litres,1) + ' L</td>' +
          '<td>' + fmtINR(e.amount) + '</td>' +
          '<td>' + (e.realMileage !== null ? fmtNum(e.realMileage) + ' km/L' : '—') + '</td>' +
          '<td><button class="icon-btn danger fuel-delete" data-id="' + e.id + '" title="Delete this entry" aria-label="Delete this fuel log entry">🗑</button></td>' +
        '</tr>';
      }).join('');
    }
    const avg = fuelLogApi.averageMileage(activeVehicle.id);
    el.avgMileageValue.textContent = avg !== null ? fmtNum(avg) + ' km/L' : '—';
    el.useFuelMileageBtn.disabled = avg === null;
  }

  // Litres is auto-calculated from Amount ÷ Price by default (matching how
  // people actually buy fuel in India — "fill for ₹500", not "give me 8.5L").
  // If the user types directly into Litres, that's an explicit override and
  // is left alone until Amount or Price changes again.
  let fuelLitresManuallyEdited = false;

  function recalcFuelLitres(){
    if(fuelLitresManuallyEdited) return;
    const amount = parseFloat(el.fuelAmount.value);
    const price = parseFloat(el.fuelPricePerLitre.value);
    if(isFinite(amount) && amount > 0 && isFinite(price) && price > 0){
      el.fuelLitres.value = fmtNum(amount / price, 2);
    } else {
      el.fuelLitres.value = '';
    }
    el.fuelLitresAutoTag.textContent = 'auto';
  }

  el.fuelAmount.addEventListener('input', function(){ fuelLitresManuallyEdited = false; recalcFuelLitres(); });
  el.fuelPricePerLitre.addEventListener('input', function(){ fuelLitresManuallyEdited = false; recalcFuelLitres(); });
  el.fuelLitres.addEventListener('input', function(){ fuelLitresManuallyEdited = true; el.fuelLitresAutoTag.textContent = 'manual'; });

  el.addFuelLogBtn.addEventListener('click', function(){
    const activeVehicle = vehiclesApi.getActive();
    if(!activeVehicle){
      showToast('Select or save a vehicle first');
      return;
    }
    const date = el.fuelDate.value;
    const odometer = parseFloat(el.fuelOdometer.value);
    const litres = parseFloat(el.fuelLitres.value);
    const amount = parseFloat(el.fuelAmount.value);
    if(!date || !isFinite(odometer) || odometer < 0 || !isFinite(litres) || litres <= 0 || !isFinite(amount) || amount <= 0){
      showToast('Fill in a valid date, odometer, amount, and price (or litres directly)');
      return;
    }
    const existing = fuelLogApi.listForVehicle(activeVehicle.id);
    const maxOdometer = existing.reduce(function(max,e){ return Math.max(max, e.odometer); }, 0);
    if(existing.length > 0 && odometer <= maxOdometer){
      const proceed = window.confirm('This odometer reading (' + fmtNum(odometer,0) + ' km) isn\'t higher than your last logged reading (' + fmtNum(maxOdometer,0) + ' km). Add it anyway?');
      if(!proceed) return;
    }
    fuelLogApi.add({ vehicleId: activeVehicle.id, date: date, odometer: odometer, litres: litres, amount: amount });
    el.fuelOdometer.value = '';
    el.fuelAmount.value = '';
    el.fuelLitres.value = '';
    fuelLitresManuallyEdited = false;
    el.fuelLitresAutoTag.textContent = 'auto';
    renderFuelLog();
    showToast('Fill-up logged');
  });

  el.fuelLogBody.addEventListener('click', function(e){
    const btn = e.target.closest('.fuel-delete');
    if(!btn) return;
    fuelLogApi.remove(btn.getAttribute('data-id'));
    renderFuelLog();
    showToast('Fill-up entry deleted');
  });

  el.useFuelMileageBtn.addEventListener('click', function(){
    const activeVehicle = vehiclesApi.getActive();
    if(!activeVehicle) return;
    const avg = fuelLogApi.averageMileage(activeVehicle.id);
    if(avg === null) return;
    el.origMileage.value = fmtNum(avg);
    render();
    showToast('Original Mileage updated from your fuel log');
  });

  /* ============ Init ============ */

  // Restore saved theme preference before first paint-affecting render.
  (function initTheme(){
    const settings = storageApi.getSettings();
    if(settings.theme === 'light' || settings.theme === 'dark'){
      document.body.setAttribute('data-theme', settings.theme);
      themeLabel.textContent = settings.theme === 'light' ? 'Light' : 'Dark';
    }
  })();

  // Restore saved Advanced Mode toggle + modifier selections, then build the
  // modifier controls from that restored (or default) state.
  (function initAdvancedMode(){
    const settings = storageApi.getSettings();
    if(settings.advancedModeSelections){
      advancedModeSelections = Object.assign(advancedModeApi.defaultSelections(), settings.advancedModeSelections);
    }
    advancedModeEnabled = !!settings.advancedModeEnabled;
    el.advancedModeToggle.checked = advancedModeEnabled;
    renderAdvancedModifierControls();
    renderAdvancedSummary();
    if(advancedModeEnabled){
      // No transition on first paint — snap open instead of animating in.
      el.advancedModeBody.style.transition = 'none';
      el.advancedModeBody.style.maxHeight = el.advancedModeBody.scrollHeight + 'px';
      requestAnimationFrame(function(){ el.advancedModeBody.style.transition = ''; });
    }
  })();

  // Default the fuel-log date field to today.
  if(el.fuelDate) el.fuelDate.value = new Date().toISOString().slice(0,10);

  // Apply any inputs encoded in a shared link before anything else renders.
  applySharedLinkIfPresent();

  showTypeIcon();
  populateCompanies();
  renderFormulas();
  renderProfileSelect();

  // If a vehicle was already active from a previous session, load it into
  // the form now that the dropdowns exist.
  (function restoreActiveVehicle(){
    const activeVehicle = vehiclesApi.getActive();
    if(activeVehicle){
      el.profileSelect.value = activeVehicle.id;
      applyProfileToForm(activeVehicle);
      el.deleteProfileBtn.style.display = 'inline-flex';
    }
  })();

  renderHistoryList();
  renderFuelLog();
  render();

  // Initialise tab navigation last, once every panel's content is in place.
  navigationApi.init();

  // Keep tab-specific views fresh when their tab becomes visible. The
  // dashboard and history both read from storage that other tabs can change
  // (e.g. saving a calculation, logging fuel), so re-render them on show.
  document.addEventListener('e20:tabchange', function(e){
    const tab = e.detail.tab;
    if(tab === 'dashboard') renderDashboard(calculate());
    if(tab === 'history') renderHistoryList();
    if(tab === 'fuellog') renderFuelLog();
    if(tab === 'compare') renderVehicleCompare(calculate());
    // Charts are laid out with canvas sizing that depends on the container's
    // visible width; if a chart tab was hidden at first paint its canvas may
    // have measured zero width, so redraw on show.
    if(tab === 'calculator') renderCharts(calculate());
  });

})();

// Register the service worker so the calculator works offline once installed.
// Runs outside the main IIFE and fails silently on browsers/contexts (e.g. file://)
// that don't support it, so it never blocks the calculator itself.
if('serviceWorker' in navigator && navigator.serviceWorker){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').catch(function(){ /* offline install not available here */ });
  });
}

