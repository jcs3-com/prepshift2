/* CARBONATION & DISPENSE CALCULATOR
 *
 * Methodology converges on Morgenthaler (Clyde Common bottling practice),
 * Dave Arnold (Liquid Intelligence Ch. 11), Camper English (Alcademics).
 *
 * Two modes:
 *   1. BOTTLED COCKTAIL: scale a single-drink spec for force-carbed bottling.
 *      Outputs: water added for dilution, target ABV, target sugar/extract,
 *      bottle count at chosen volume, CO2 charge per bottle.
 *
 *   2. DRAFT COCKTAIL: scale for keg-and-tap dispense via Cornelius or
 *      sixth-barrel keg, with line pressure and CO2 volumes calculated.
 *
 * The physics:
 *   - CO2 solubility in liquid is governed by Henry's Law.
 *   - Practical bar target: 2.5-3.5 volumes CO2 (champagne is ~5.5).
 *   - To dissolve 2.5 volumes at 32°F, you need ~12 PSI;
 *     at 40°F, ~14 PSI; at 50°F, ~18 PSI.
 *   - The colder the liquid, the better CO2 dissolves.
 *   - The lower the ABV and sugar, the better CO2 dissolves.
 *
 * The math (simplified from Henry's Law tables for beer/cocktails):
 *   PSI_needed = (Vol_CO2 - dissolved_at_atmospheric) * temp_factor
 *
 * For typical bar conditions, we use a lookup approximation from
 * the published charts in The Brewing Industry Guild and Arnold's data.
 */

const CARB_TEMP_PSI_TABLE = {
  // {tempF: {volumes: PSI}}
  32: { 2.0: 4,  2.5: 8,  3.0: 12, 3.5: 16, 4.0: 20 },
  36: { 2.0: 6,  2.5: 10, 3.0: 15, 3.5: 19, 4.0: 24 },
  40: { 2.0: 8,  2.5: 13, 3.0: 18, 3.5: 23, 4.0: 28 },
  44: { 2.0: 10, 2.5: 16, 3.0: 21, 3.5: 27, 4.0: 32 },
  48: { 2.0: 13, 2.5: 19, 3.0: 25, 3.5: 31, 4.0: 37 }
};

const CARB_PROFILES = {
  highball:   { label: "Highball (G&T style)", volumes: 3.0, abv_target: 8,  dilution_pct: 50, description: "Light, refreshing, very effervescent. Gin-tonic, Paloma, Aperol Spritz on tap." },
  spritz:     { label: "Spritz / Aperitivo",   volumes: 3.2, abv_target: 11, dilution_pct: 40, description: "Aperitivo cocktails. Negroni Sbagliato, Americano on tap." },
  bottled_classic: { label: "Bottled classic",  volumes: 2.5, abv_target: 18, dilution_pct: 30, description: "Bottled stirred drinks. Manhattan, Negroni, Old Fashioned in 200mL bottles." },
  bottled_sour:   { label: "Bottled sour",      volumes: 2.8, abv_target: 14, dilution_pct: 35, description: "Bottled citrus drinks. Difficult — flavor degrades on lime; lemon holds better." },
  champagne:  { label: "Champagne-style",       volumes: 3.5, abv_target: 12, dilution_pct: 40, description: "French 75 on draft, Cosmo Spritz. Very fizzy, low ABV target." }
};

function renderCarbonationCalc(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  let mode = "bottled"; // bottled | draft
  let cocktailKey = "negroni";
  let profileKey = "bottled_classic";
  let servings = 12;
  let bottleSize = 200; // mL
  let kegSize = 5; // gallons (5 for sixth-barrel; 2.5 for slim quarter; 0.625 for Cornelius)
  let dispenseTempF = 36;

  function lookupPSI(tempF, vols) {
    // Round temp to nearest 4
    const tempKeys = Object.keys(CARB_TEMP_PSI_TABLE).map(Number).sort((a,b) => a-b);
    const tempLookup = tempKeys.reduce((p, c) => Math.abs(c - tempF) < Math.abs(p - tempF) ? c : p);
    const volKeys = Object.keys(CARB_TEMP_PSI_TABLE[tempLookup]).map(Number).sort((a,b) => a-b);
    const volLookup = volKeys.reduce((p, c) => Math.abs(c - vols) < Math.abs(p - vols) ? c : p);
    return CARB_TEMP_PSI_TABLE[tempLookup][volLookup];
  }

  function computeBottled() {
    const c = COCKTAILS[cocktailKey];
    const profile = CARB_PROFILES[profileKey];
    const singleVol = c.ingredients.reduce((a, b) => a + b.oz, 0);
    const dilution = singleVol * (profile.dilution_pct / 100);
    const finalSingle = singleVol + dilution;

    // ABV after dilution
    const alcoholOz = c.ingredients.reduce((a, b) => a + b.oz * (b.abv / 100), 0);
    const finalAbvBeforeCarb = (alcoholOz / finalSingle) * 100;

    // Scale to N bottles
    const bottleSizeOz = bottleSize / 29.5735;
    const totalOzNeeded = bottleSizeOz * servings;
    const scaleFactor = totalOzNeeded / finalSingle;

    const ingredientsScaled = c.ingredients.map(i => ({
      ...i,
      oz_total: i.oz * scaleFactor,
      ml_total: i.oz * scaleFactor * 29.5735
    }));
    const waterOzTotal = dilution * scaleFactor;
    const waterMlTotal = waterOzTotal * 29.5735;

    // Carbonation pressure for the bottling pressure
    const psi = lookupPSI(dispenseTempF, profile.volumes);

    return {
      c, profile,
      finalSingle, finalAbvBeforeCarb,
      bottleSizeOz, totalOzNeeded,
      ingredientsScaled, waterOzTotal, waterMlTotal,
      psi, scaleFactor,
      totalMl: totalOzNeeded * 29.5735
    };
  }

  function computeDraft() {
    const c = COCKTAILS[cocktailKey];
    const profile = CARB_PROFILES[profileKey];
    const singleVol = c.ingredients.reduce((a, b) => a + b.oz, 0);
    const dilution = singleVol * (profile.dilution_pct / 100);
    const finalSingle = singleVol + dilution;

    const alcoholOz = c.ingredients.reduce((a, b) => a + b.oz * (b.abv / 100), 0);
    const finalAbv = (alcoholOz / finalSingle) * 100;

    // Keg in gallons → fluid oz
    const kegSizeOz = kegSize * 128;
    const drinksPerKeg = Math.floor(kegSizeOz / finalSingle);
    const scaleFactor = kegSizeOz / finalSingle;

    const ingredientsScaled = c.ingredients.map(i => ({
      ...i,
      oz_total: i.oz * scaleFactor,
      ml_total: i.oz * scaleFactor * 29.5735,
      L_total: i.oz * scaleFactor * 29.5735 / 1000
    }));
    const waterOzTotal = dilution * scaleFactor;
    const waterLTotal = waterOzTotal * 29.5735 / 1000;

    const psi = lookupPSI(dispenseTempF, profile.volumes);

    return {
      c, profile,
      finalSingle, finalAbv,
      kegSizeOz, drinksPerKeg,
      ingredientsScaled, waterOzTotal, waterLTotal,
      psi,
      totalL: kegSizeOz * 29.5735 / 1000
    };
  }

  function fmtVol(oz) {
    const ml = oz * 29.5735;
    if (ml >= 1000) return (ml / 1000).toFixed(2) + " L";
    return ml.toFixed(0) + " mL";
  }

  function render() {
    const data = mode === "bottled" ? computeBottled() : computeDraft();

    const ingHtml = data.ingredientsScaled.map(i => `
      <li>
        <span class="ingredient-name">${i.name}${i.abv > 0 ? ` <span class="small">(${i.abv}% ABV)</span>` : ''}</span>
        <span class="ingredient-qty">${fmtVol(i.oz_total)}</span>
      </li>
    `).join('');

    const modeOutputs = mode === "bottled" ? `
      <div class="result-line">
        <span class="result-label">Bottles produced</span>
        <span class="result-value">${servings}</span>
      </div>
      <div class="result-line">
        <span class="result-label">Per-bottle ABV</span>
        <span class="result-value">${data.finalAbvBeforeCarb.toFixed(1)}%</span>
      </div>
      <div class="result-line">
        <span class="result-label">Total liquid</span>
        <span class="result-value">${(data.totalMl / 1000).toFixed(2)} L</span>
      </div>
      <div class="result-line">
        <span class="result-label">Carbonation pressure</span>
        <span class="result-value accent">${data.psi} PSI @ ${dispenseTempF}°F</span>
      </div>
      <div class="result-line">
        <span class="result-label">CO₂ target</span>
        <span class="result-value">${data.profile.volumes} vol</span>
      </div>
    ` : `
      <div class="result-line">
        <span class="result-label">Drinks per keg</span>
        <span class="result-value">${data.drinksPerKeg}</span>
      </div>
      <div class="result-line">
        <span class="result-label">Final ABV</span>
        <span class="result-value">${data.finalAbv.toFixed(1)}%</span>
      </div>
      <div class="result-line">
        <span class="result-label">Total liquid</span>
        <span class="result-value">${data.totalL.toFixed(2)} L</span>
      </div>
      <div class="result-line">
        <span class="result-label">Line pressure</span>
        <span class="result-value accent">${data.psi} PSI @ ${dispenseTempF}°F</span>
      </div>
      <div class="result-line">
        <span class="result-label">CO₂ target</span>
        <span class="result-value">${data.profile.volumes} vol</span>
      </div>
    `;

    mount.innerHTML = `
      <div class="calc-wrap">
        <div class="calc-inputs">
          <h4>Mode</h4>
          <div class="calc-input-row">
            <div class="unit-toggle" id="carb-mode">
              <button data-mode="bottled" class="${mode === 'bottled' ? 'active' : ''}">Bottled</button>
              <button data-mode="draft"   class="${mode === 'draft' ? 'active' : ''}">Draft / Tap</button>
            </div>
          </div>

          <h4 style="margin-top:1.5rem">Recipe</h4>
          <div class="calc-input-row">
            <label class="calc-label">Cocktail base</label>
            <select id="carb-cocktail">
              ${Object.keys(COCKTAILS).map(k =>
                `<option value="${k}" ${k === cocktailKey ? 'selected' : ''}>${COCKTAILS[k].name}</option>`
              ).join('')}
            </select>
          </div>

          <div class="calc-input-row">
            <label class="calc-label">Carbonation profile</label>
            <select id="carb-profile">
              ${Object.keys(CARB_PROFILES).map(k =>
                `<option value="${k}" ${k === profileKey ? 'selected' : ''}>${CARB_PROFILES[k].label} — ${CARB_PROFILES[k].volumes} vol CO₂</option>`
              ).join('')}
            </select>
            <p class="small" style="margin-top:0.4rem">${CARB_PROFILES[profileKey].description}</p>
          </div>

          ${mode === "bottled" ? `
            <div class="calc-input-row">
              <label class="calc-label">Number of bottles</label>
              <input type="number" id="carb-servings" value="${servings}" step="1" min="1">
            </div>
            <div class="calc-input-row">
              <label class="calc-label">Bottle size (mL)</label>
              <select id="carb-bottle">
                <option value="187"  ${bottleSize === 187 ? 'selected' : ''}>187 mL (split)</option>
                <option value="200"  ${bottleSize === 200 ? 'selected' : ''}>200 mL (single)</option>
                <option value="250"  ${bottleSize === 250 ? 'selected' : ''}>250 mL (slim can)</option>
                <option value="375"  ${bottleSize === 375 ? 'selected' : ''}>375 mL (half)</option>
                <option value="500"  ${bottleSize === 500 ? 'selected' : ''}>500 mL (sharing)</option>
                <option value="750"  ${bottleSize === 750 ? 'selected' : ''}>750 mL (full)</option>
              </select>
            </div>
          ` : `
            <div class="calc-input-row">
              <label class="calc-label">Keg size</label>
              <select id="carb-keg">
                <option value="0.625" ${kegSize === 0.625 ? 'selected' : ''}>Cornelius 2.5 gal (0.625 ft³)</option>
                <option value="2.5"   ${kegSize === 2.5 ? 'selected' : ''}>Slim quarter 2.5 gal</option>
                <option value="5"     ${kegSize === 5 ? 'selected' : ''}>Sixth-barrel 5 gal</option>
                <option value="7.75"  ${kegSize === 7.75 ? 'selected' : ''}>Quarter barrel 7.75 gal</option>
                <option value="15.5"  ${kegSize === 15.5 ? 'selected' : ''}>Half barrel 15.5 gal</option>
              </select>
            </div>
          `}

          <div class="calc-input-row">
            <label class="calc-label">Dispense / storage temperature (°F)</label>
            <input type="number" id="carb-temp" value="${dispenseTempF}" step="2" min="28" max="55">
            <p class="small" style="margin-top:0.4rem">CO₂ solubility doubles between 50°F and 32°F. Colder = lower PSI needed.</p>
          </div>

          <h4 style="margin-top:1.5rem">Build sheet</h4>
          <ul class="ingredients">${ingHtml}
            <li>
              <span class="ingredient-name">Filtered water <span class="small">(dilution)</span></span>
              <span class="ingredient-qty">${fmtVol(data.waterOzTotal)}</span>
            </li>
          </ul>
        </div>

        <div class="calc-output">
          <h3>Carbonation Spec</h3>
          ${modeOutputs}

          <div class="cost-summary">
            <div class="result-line" style="border-bottom:none">
              <span class="result-label">Methodology</span>
              <span class="result-value" style="font-size:1.0rem">${mode === "bottled" ? "Force-carb at bottling" : "Tap-line equilibrium"}</span>
            </div>
          </div>

          <p class="small" style="margin-top:1.5rem; color: rgba(255,255,255,0.55)">
            ${mode === "bottled"
              ? "Bottle from a counter-pressure filler. The bottle's headspace must be flushed with CO₂ before filling, or the carbonation will dissipate within seconds. Cap immediately. Store at the dispense temp."
              : "Set CO₂ regulator to the indicated PSI. Allow 24–48 hours at temperature for full equilibration before pouring. Line length matters — shorter lines need higher restriction to balance the pressure."
            }
          </p>
        </div>
      </div>
    `;

    document.querySelectorAll('#carb-mode button').forEach(btn => {
      btn.addEventListener('click', () => { mode = btn.dataset.mode; render(); });
    });
    document.getElementById('carb-cocktail').addEventListener('change', e => { cocktailKey = e.target.value; render(); });
    document.getElementById('carb-profile').addEventListener('change', e => { profileKey = e.target.value; render(); });
    const tempInput = document.getElementById('carb-temp');
    if (tempInput) tempInput.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      if (!isNaN(v) && v >= 28 && v <= 55) { dispenseTempF = v; render(); }
    });
    if (mode === "bottled") {
      document.getElementById('carb-servings').addEventListener('input', e => {
        const v = parseInt(e.target.value);
        if (!isNaN(v) && v > 0) { servings = v; render(); }
      });
      document.getElementById('carb-bottle').addEventListener('change', e => {
        bottleSize = parseInt(e.target.value); render();
      });
    } else {
      document.getElementById('carb-keg').addEventListener('change', e => {
        kegSize = parseFloat(e.target.value); render();
      });
    }
  }

  render();
}
