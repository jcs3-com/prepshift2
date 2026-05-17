/* BATCHED COCKTAIL SCALER
 * Single-serving spec → batch of N drinks with:
 *   - exact ingredient volumes
 *   - water dilution (to mimic shake/stir)
 *   - final ABV
 *   - cost (where ingredients have a recipe_ref)
 *
 * ABV math: ABV_final = Σ(vol_i × abv_i) / total_volume_after_dilution
 */

function renderBatchScaler(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  let cocktailKey = "daiquiri";
  let drinkCount = 20;
  let unitOut = "ml"; // ml | floz

  function compute() {
    const c = COCKTAILS[cocktailKey];
    const singleVol = c.ingredients.reduce((a, b) => a + b.oz, 0);
    const dilution = singleVol * (c.dilution_pct / 100);
    const finalSingle = singleVol + dilution;

    // Weighted average ABV before dilution
    const alcoholOz = c.ingredients.reduce((a, b) => a + b.oz * (b.abv / 100), 0);
    const finalAbv = (alcoholOz / finalSingle) * 100;

    // Scale
    const batch = c.ingredients.map(i => ({
      ...i,
      oz_total: i.oz * drinkCount,
      ml_total: i.oz * drinkCount * 29.5735
    }));
    const waterOz = dilution * drinkCount;
    const totalOz = finalSingle * drinkCount;

    // Cost estimate (only where recipe_ref exists; treats commercial spirits as
    // unknown until you tell us your bottle cost). We compute the *house*
    // ingredient cost; spirit cost is left as a user fill-in.
    let houseIngredientCost = 0;
    for (const i of c.ingredients) {
      if (i.recipe_ref && RECIPES[i.recipe_ref]) {
        const cpo = costPerOz(RECIPES[i.recipe_ref]);
        houseIngredientCost += cpo * i.oz * drinkCount;
      }
    }

    return { c, single: c.ingredients, batch, waterOz, totalOz, finalSingle, finalAbv, dilution, houseIngredientCost };
  }

  function fmtVolOz(oz) {
    if (unitOut === "ml") return (oz * 29.5735).toFixed(0) + " mL";
    return oz.toFixed(2) + " fl oz";
  }

  function fmtMoneyLocal(n) {
    if (n < 0.01) return "$" + n.toFixed(4);
    if (n < 1)    return "$" + n.toFixed(3);
    return "$" + n.toFixed(2);
  }

  function bottleFit(totalOz) {
    // What bottle fits this?
    const totalMl = totalOz * 29.5735;
    const fits = [];
    if (totalMl <= 750) fits.push("750 mL bottle");
    if (totalMl <= 1000) fits.push("1 L bottle");
    if (totalMl <= 1500) fits.push("1.5 L magnum");
    if (totalMl <= 3000) fits.push("3 L double magnum / Cambro 1qt");
    if (totalMl <= 5000) fits.push("5 L jug / Cambro 1gal");
    if (totalMl <= 18900) fits.push("5-gal Cambro");
    return fits.length ? fits[0] : "Larger than 5 gal";
  }

  function render() {
    const r = compute();

    const ingHtml = r.batch.map(i => `
      <li>
        <span class="ingredient-name">${i.name}${i.abv > 0 ? ` <span class="small">(${i.abv}% ABV)</span>` : ''}</span>
        <span class="ingredient-qty">${fmtVolOz(i.oz_total)}</span>
      </li>
    `).join('');

    const singleSpecHtml = r.single.map(i => `
      <li>
        <span class="ingredient-name">${i.name}</span>
        <span class="ingredient-qty">${i.oz} oz</span>
      </li>
    `).join('');

    mount.innerHTML = `
      <div class="calc-wrap">
        <div class="calc-inputs">
          <h4>Cocktail & Batch Size</h4>
          <div class="calc-input-row">
            <label class="calc-label">Cocktail</label>
            <select id="bs-cocktail">
              ${Object.keys(COCKTAILS).map(k =>
                `<option value="${k}" ${k === cocktailKey ? 'selected' : ''}>${COCKTAILS[k].name}</option>`
              ).join('')}
            </select>
          </div>
          <div class="calc-input-row">
            <label class="calc-label">Number of drinks</label>
            <input type="number" id="bs-count" value="${drinkCount}" step="1" min="1">
            <div class="unit-toggle" id="bs-units">
              <button data-unit="ml"   class="${unitOut === 'ml' ? 'active' : ''}">mL</button>
              <button data-unit="floz" class="${unitOut === 'floz' ? 'active' : ''}">fl oz</button>
            </div>
          </div>

          <h4 style="margin-top:1.8rem">Single-serving spec</h4>
          <ul class="ingredients">${singleSpecHtml}</ul>
          <p class="small" style="margin-top:0.6rem">
            <strong>${r.c.method}</strong> · ${r.c.glassware} · ${r.c.dilution_pct}% dilution target
          </p>

          <h4 style="margin-top:1.8rem">Batch build (in order)</h4>
          <ul class="ingredients">${ingHtml}
            <li>
              <span class="ingredient-name">Filtered water <span class="small">(added to mimic shake/stir dilution)</span></span>
              <span class="ingredient-qty">${fmtVolOz(r.waterOz)}</span>
            </li>
          </ul>
        </div>

        <div class="calc-output">
          <h3>Batch Analysis</h3>

          <div class="result-line">
            <span class="result-label">Total batch volume</span>
            <span class="result-value">${fmtVolOz(r.totalOz)}</span>
          </div>
          <div class="result-line">
            <span class="result-label">Final ABV</span>
            <span class="result-value">${r.finalAbv.toFixed(1)}%</span>
          </div>
          <div class="result-line">
            <span class="result-label">Per-drink volume</span>
            <span class="result-value">${fmtVolOz(r.finalSingle)}</span>
          </div>
          <div class="result-line">
            <span class="result-label">Container fit</span>
            <span class="result-value" style="font-size:1.0rem">${bottleFit(r.totalOz)}</span>
          </div>

          <div class="cost-summary">
            <div class="result-line" style="border-bottom:none">
              <span class="result-label">House ingredient cost<br><span style="font-size:0.7rem; color:rgba(244,237,224,0.4)">excl. spirits — fill in your bottle cost separately</span></span>
              <span class="result-value accent">${fmtMoneyLocal(r.houseIngredientCost)}</span>
            </div>
          </div>

          <p class="small" style="margin-top:1.5rem; color: rgba(244,237,224,0.55)">
            Batch in this order: combine all spirits and modifiers first, then citrus and house ingredients, then water last. Chill to 28°F before service. Store carbonated batches at 36°F under 30 PSI if you're force-carbing.
          </p>
        </div>
      </div>
    `;

    document.getElementById('bs-cocktail').addEventListener('change', e => {
      cocktailKey = e.target.value;
      render();
    });
    document.getElementById('bs-count').addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      if (!isNaN(v) && v > 0) {
        drinkCount = v;
        render();
      }
    });
    document.querySelectorAll('#bs-units button').forEach(btn => {
      btn.addEventListener('click', () => {
        unitOut = btn.dataset.unit;
        render();
      });
    });
  }

  render();
}
