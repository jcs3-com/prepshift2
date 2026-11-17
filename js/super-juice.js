/* SUPER JUICE CALCULATOR
 * Methodology: Nickle Morris / popularized by Kevin Kos.
 * Given target finished mass (g) and fruit type:
 *   peel mass    = mass × peel_pct
 *   acid mass    = mass × acid_pct  (split per acid_blend ratio)
 *   water mass   = mass × water_pct
 *   fresh juice  = mass − (peel + acid + water)
 * Peel mass implies fruit count via fruit_peel_pct_of_whole.
 */

const FRUIT_PEEL_PCT = {
  lime:       0.085,   // ~8.5% of whole lime weight is peel
  lemon:      0.095,
  grapefruit: 0.110
};

const FRUIT_AVG_WEIGHT_LB = {
  lime: 0.18,    // ~85g each
  lemon: 0.27,   // ~125g each
  grapefruit: 0.85
};

function renderSuperJuiceCalc(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  let fruitKey = "lime";
  let targetMass = 1000; // grams

  function compute() {
    const spec = SUPER_JUICE_SPEC[fruitKey];
    const peel  = targetMass * spec.peel_pct;
    const acid  = targetMass * spec.acid_pct;
    const water = targetMass * spec.water_pct;
    const juice = targetMass - (peel + acid + water);

    const citric = acid * spec.acid_blend.citric;
    const malic  = acid * spec.acid_blend.malic;

    // Imply fruit count from peel mass:
    // whole fruit weight = peel / peel_fraction_of_whole
    const peelFrac = FRUIT_PEEL_PCT[fruitKey];
    const totalFruitWeight_g = peel / peelFrac;
    const avgFruitWeight_g = FRUIT_AVG_WEIGHT_LB[fruitKey] * 453.592;
    const fruitCount = Math.ceil(totalFruitWeight_g / avgFruitWeight_g);

    // Yield multiplier vs fresh juice from same fruit count:
    // fresh juice from N fruit = N × avg_weight × yield_pct (~32% lime, 38% lemon)
    const freshYieldPct = fruitKey === "lime" ? 0.32 : fruitKey === "lemon" ? 0.38 : 0.40;
    const freshJuiceFromSameFruit = totalFruitWeight_g * freshYieldPct;
    const multiplier = targetMass / freshJuiceFromSameFruit;

    return { peel, acid, water, juice, citric, malic, fruitCount, totalFruitWeight_g, multiplier, spec };
  }

  function render() {
    const r = compute();
    const fmtG = n => n.toFixed(1) + " g";

    mount.innerHTML = `
      <div class="calc-wrap">
        <div class="calc-inputs">
          <h4>Fruit & Yield</h4>
          <div class="calc-input-row">
            <label class="calc-label">Fruit</label>
            <select id="sj-fruit">
              <option value="lime"       ${fruitKey === 'lime' ? 'selected' : ''}>Lime</option>
              <option value="lemon"      ${fruitKey === 'lemon' ? 'selected' : ''}>Lemon</option>
              <option value="grapefruit" ${fruitKey === 'grapefruit' ? 'selected' : ''}>Grapefruit</option>
            </select>
          </div>
          <div class="calc-input-row">
            <label class="calc-label">Target finished mass (g)</label>
            <input type="number" id="sj-mass" value="${targetMass}" step="50" min="100">
          </div>

          <h4 style="margin-top:1.8rem">Build sheet</h4>
          <ul class="ingredients">
            <li><span class="ingredient-name">Peel of ${fruitKey}, freshly removed</span><span class="ingredient-qty">${fmtG(r.peel)}</span></li>
            <li><span class="ingredient-name">Citric acid (food grade)</span><span class="ingredient-qty">${fmtG(r.citric)}</span></li>
            ${r.malic > 0 ? `<li><span class="ingredient-name">Malic acid (food grade)</span><span class="ingredient-qty">${fmtG(r.malic)}</span></li>` : ''}
            <li><span class="ingredient-name">Distilled / filtered water</span><span class="ingredient-qty">${fmtG(r.water)}</span></li>
            <li><span class="ingredient-name">Fresh ${fruitKey} juice (added last)</span><span class="ingredient-qty">${fmtG(r.juice)}</span></li>
          </ul>

          <p class="small" style="margin-top:1.2rem">
            Implies approximately <strong>${r.fruitCount} ${fruitKey}s</strong> (${(r.totalFruitWeight_g/453.592).toFixed(2)} lb total) to produce both the peel and the fresh juice components.
          </p>
        </div>

        <div class="calc-output">
          <h3>Yield Analysis</h3>

          <div class="result-line">
            <span class="result-label">Finished volume</span>
            <span class="result-value">${(targetMass / 1.04).toFixed(0)} mL</span>
          </div>
          <div class="result-line">
            <span class="result-label">Fruit required</span>
            <span class="result-value">${r.fruitCount} ${fruitKey}s</span>
          </div>
          <div class="result-line">
            <span class="result-label">Shelf life</span>
            <span class="result-value">~14 days</span>
          </div>
          <div class="result-line">
            <span class="result-label">Target pH</span>
            <span class="result-value">${r.spec.ph_target}</span>
          </div>

          <div class="cost-summary">
            <div class="result-line" style="border-bottom:none">
              <span class="result-label">Yield vs. fresh juice<br><span style="font-size:0.7rem; color:rgba(255,255,255,0.4)">same fruit count</span></span>
              <span class="result-value accent">${r.multiplier.toFixed(1)}×</span>
            </div>
          </div>

          <p class="small" style="margin-top:1.5rem; color: rgba(255,255,255,0.55)">
            ${r.spec.notes}
          </p>
        </div>
      </div>
    `;

    document.getElementById('sj-fruit').addEventListener('change', e => {
      fruitKey = e.target.value;
      render();
    });
    document.getElementById('sj-mass').addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      if (!isNaN(v) && v > 0) {
        targetMass = v;
        render();
      }
    });
  }

  render();
}
