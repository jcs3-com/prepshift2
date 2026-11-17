/* ACID-ADJUSTED CITRUS SUBSTITUTION CALCULATOR
 *
 * Methodology: Dave Arnold (Booker & Dax / Liquid Intelligence).
 * Premise: fresh citrus juice is roughly 6% acid by weight (lime ~6%, lemon ~5%).
 * You can substitute by combining water + powdered acid to the same acid concentration.
 *
 * For lime: ~⅔ citric, ⅓ malic
 * For lemon: 100% citric
 * For grapefruit: ~½ citric, ½ malic (less acidic overall, ~3.5%)
 *
 * Critically, this does NOT replicate flavor. It replicates acidity only.
 * Best used as: emergency substitute, no-juice cordials, or paired with peel
 * tinctures / oils for full flavor replication.
 */

const CITRUS_ACID_PROFILES = {
  lime: {
    name: "Lime juice",
    acid_pct: 0.060,            // 6% acid by weight
    blend: { citric: 0.667, malic: 0.333 },
    note: "Lime balances citric and malic. Replicates acidity bite but not the lime oil character — pair with lime peel tincture for full effect."
  },
  lemon: {
    name: "Lemon juice",
    acid_pct: 0.050,            // 5% acid by weight
    blend: { citric: 1.0, malic: 0.0 },
    note: "Lemons are almost purely citric. The simplest substitution to mimic."
  },
  grapefruit: {
    name: "Grapefruit juice",
    acid_pct: 0.035,            // 3.5% acid by weight
    blend: { citric: 0.5, malic: 0.5 },
    note: "Grapefruit has roughly half the acid of lemon and a distinctive bitter component from naringin that this calc cannot replicate."
  },
  orange: {
    name: "Orange juice",
    acid_pct: 0.012,            // 1.2% acid by weight
    blend: { citric: 0.6, malic: 0.4 },
    note: "Orange is barely acidic — most of its character is sugar. This substitution is rarely useful; you'd be better off finding fresh juice."
  }
};

function renderAcidSubCalc(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  let citrusKey = "lime";
  let targetOz = 4.0; // ounces of juice to mimic

  function compute() {
    const profile = CITRUS_ACID_PROFILES[citrusKey];
    const targetGrams = targetOz * 29.5735; // assume juice density ~1.0 g/mL
    const totalAcidGrams = targetGrams * profile.acid_pct;
    const citricGrams = totalAcidGrams * profile.blend.citric;
    const malicGrams  = totalAcidGrams * profile.blend.malic;
    const waterGrams  = targetGrams - totalAcidGrams; // water + acid = juice mass
    return { profile, targetGrams, totalAcidGrams, citricGrams, malicGrams, waterGrams };
  }

  function render() {
    const r = compute();

    mount.innerHTML = `
      <div class="calc-wrap">
        <div class="calc-inputs">
          <h4>Substitution target</h4>
          <div class="calc-input-row">
            <label class="calc-label">Citrus to mimic</label>
            <select id="as-citrus">
              ${Object.keys(CITRUS_ACID_PROFILES).map(k =>
                `<option value="${k}" ${k === citrusKey ? 'selected' : ''}>${CITRUS_ACID_PROFILES[k].name}</option>`
              ).join('')}
            </select>
          </div>
          <div class="calc-input-row">
            <label class="calc-label">Volume to replace (fl oz)</label>
            <input type="number" id="as-oz" value="${targetOz}" step="0.25" min="0.25">
          </div>

          <h4 style="margin-top:1.8rem">Build sheet</h4>
          <ul class="ingredients">
            <li><span class="ingredient-name">Filtered water</span><span class="ingredient-qty">${r.waterGrams.toFixed(1)} g</span></li>
            <li><span class="ingredient-name">Citric acid (food grade)</span><span class="ingredient-qty">${r.citricGrams.toFixed(2)} g</span></li>
            ${r.malicGrams > 0 ? `<li><span class="ingredient-name">Malic acid (food grade)</span><span class="ingredient-qty">${r.malicGrams.toFixed(2)} g</span></li>` : ''}
          </ul>

          <p class="small" style="margin-top:1.2rem">
            Combine water and acid, stir until fully dissolved. Use as a 1:1 volume substitute for ${r.profile.name.toLowerCase()} in any recipe.
          </p>
        </div>

        <div class="calc-output">
          <h3>Substitution Analysis</h3>

          <div class="result-line">
            <span class="result-label">Mimics</span>
            <span class="result-value">${targetOz} fl oz</span>
          </div>
          <div class="result-line">
            <span class="result-label">Total acid load</span>
            <span class="result-value">${r.totalAcidGrams.toFixed(2)} g</span>
          </div>
          <div class="result-line">
            <span class="result-label">Effective acidity</span>
            <span class="result-value">${(r.profile.acid_pct * 100).toFixed(1)}%</span>
          </div>
          <div class="result-line">
            <span class="result-label">Cost estimate</span>
            <span class="result-value accent">$${((r.citricGrams * 0.016) + (r.malicGrams * 0.021)).toFixed(3)}</span>
          </div>

          <div class="cost-summary">
            <div class="result-line" style="border-bottom:none">
              <span class="result-label">vs. fresh ${citrusKey} juice</span>
              <span class="result-value">~10–20× cheaper</span>
            </div>
          </div>

          <p class="small" style="margin-top:1.5rem; color: rgba(255,255,255,0.55)">
            ${r.profile.note}
          </p>
        </div>
      </div>
    `;

    document.getElementById('as-citrus').addEventListener('change', e => {
      citrusKey = e.target.value;
      render();
    });
    document.getElementById('as-oz').addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      if (!isNaN(v) && v > 0) {
        targetOz = v;
        render();
      }
    });
  }

  render();
}
