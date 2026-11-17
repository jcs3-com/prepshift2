/* PREPSHIFT CALCULATOR ENGINE */

// Conversion constants
const ML_PER_FL_OZ = 29.5735;
const G_PER_OZ_WT = 28.3495;
const G_PER_LB = 453.592;
const ML_PER_L = 1000;

function lbToG(lb) { return lb * G_PER_LB; }
function gToLb(g)  { return g / G_PER_LB; }
function mlToFlOz(ml) { return ml / ML_PER_FL_OZ; }
function flOzToMl(oz) { return oz * ML_PER_FL_OZ; }

/* Compute total raw cost for a recipe at its base yield_ml */
function baseRecipeCost(recipe) {
  let total = 0;
  for (const input of recipe.inputs) {
    const ing = RAW_INGREDIENTS[input.ingredient];
    if (!ing) continue;
    // qty_raw_lb is the spec; cost is per ing.unit
    let costPerLb;
    if (ing.unit === "lb") {
      costPerLb = ing.cost;
    } else if (ing.unit === "ea") {
      // assume "each" weighs ~1 unit; for pineapple we provided weight on the input
      // so treat ea cost as cost-per-pound-equivalent of stated qty
      costPerLb = ing.cost / 4.5; // assumption: 1 pineapple ≈ 4.5 lb
    } else if (ing.unit === "L") {
      // water by lb: 1 L ≈ 1 kg ≈ 2.2 lb
      costPerLb = ing.cost / 2.2;
    } else if (ing.unit === "oz") {
      costPerLb = ing.cost * 16;
    } else {
      costPerLb = ing.cost;
    }
    total += (input.qty_raw_lb || 0) * costPerLb;
  }
  return total;
}

/* Scale recipe to a target yield in mL */
function scaleRecipe(recipe, targetMl) {
  const factor = targetMl / recipe.yield_ml;
  const inputs = recipe.inputs.map(i => ({
    ...i,
    qty_raw_lb: i.qty_raw_lb * factor,
    qty_raw_g:  lbToG(i.qty_raw_lb * factor)
  }));
  const cost = baseRecipeCost(recipe) * factor;
  return { factor, inputs, cost, yield_ml: targetMl };
}

/* Cost per ounce of finished product */
function costPerOz(recipe) {
  const totalCost = baseRecipeCost(recipe);
  const totalOz = mlToFlOz(recipe.yield_ml);
  return totalCost / totalOz;
}

/* Format helpers */
function fmtMoney(n) {
  if (n < 0.01) return "$" + n.toFixed(4);
  if (n < 1)    return "$" + n.toFixed(3);
  return "$" + n.toFixed(2);
}
function fmtNum(n, decimals = 1) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtVol(ml) {
  if (ml >= 1000) return fmtNum(ml/1000, 2) + " L";
  return fmtNum(ml, 0) + " mL";
}
function fmtWeight(g) {
  if (g >= 1000) return fmtNum(g/1000, 2) + " kg";
  if (g >= 454)  return fmtNum(g/G_PER_LB, 2) + " lb";
  return fmtNum(g, 0) + " g";
}

/* Render a recipe's calculator UI */
function renderCalculator(recipeId, mountId) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return;
  const mount = document.getElementById(mountId);
  if (!mount) return;

  let currentYield = recipe.yield_ml;
  let unit = "ml"; // ml | floz | l

  function unitToMl(val, fromUnit) {
    if (fromUnit === "ml") return val;
    if (fromUnit === "l")  return val * 1000;
    if (fromUnit === "floz") return val * ML_PER_FL_OZ;
    return val;
  }
  function mlToUnit(ml, toUnit) {
    if (toUnit === "ml") return ml;
    if (toUnit === "l")  return ml / 1000;
    if (toUnit === "floz") return ml / ML_PER_FL_OZ;
    return ml;
  }

  function render() {
    const scaled = scaleRecipe(recipe, currentYield);
    const costPerOzVal = costPerOz(recipe);
    const costPerLiter = (baseRecipeCost(recipe) / recipe.yield_ml) * 1000;

    const inputsHtml = scaled.inputs.map(i => {
      const ing = RAW_INGREDIENTS[i.ingredient];
      return `<li>
        <span class="ingredient-name">${ing.name}${i.note ? ` <span class="small">— ${i.note}</span>` : ''}</span>
        <span class="ingredient-qty">${fmtWeight(i.qty_raw_g)}</span>
      </li>`;
    }).join('');

    const displayVal = mlToUnit(currentYield, unit);
    const stepVal = unit === "floz" ? "0.5" : (unit === "l" ? "0.1" : "10");

    mount.innerHTML = `
      <div class="calc-wrap">
        <div class="calc-inputs">
          <h4>Batch Size</h4>
          <div class="calc-input-row">
            <label class="calc-label">Target Yield</label>
            <input type="number" id="${mountId}-yield" value="${unit === "ml" ? Math.round(displayVal) : Number(displayVal.toFixed(2))}" step="${stepVal}" min="1">
            <div class="unit-toggle" id="${mountId}-units">
              <button data-unit="ml"   class="${unit === 'ml' ? 'active' : ''}">mL</button>
              <button data-unit="floz" class="${unit === 'floz' ? 'active' : ''}">fl oz</button>
              <button data-unit="l"    class="${unit === 'l' ? 'active' : ''}">L</button>
            </div>
          </div>

          <h4 style="margin-top:1.8rem">Raw Ingredients Required</h4>
          <ul class="ingredients">${inputsHtml}</ul>

          <p class="small" style="margin-top:1.2rem">Yields ${fmtVol(currentYield)} finished ${recipe.name.toLowerCase()}.</p>
        </div>

        <div class="calc-output">
          <h3>Cost Breakdown</h3>

          <div class="result-line">
            <span class="result-label">Batch cost</span>
            <span class="result-value">${fmtMoney(scaled.cost)}</span>
          </div>
          <div class="result-line">
            <span class="result-label">Per fl oz</span>
            <span class="result-value">${fmtMoney(costPerOzVal)}</span>
          </div>
          <div class="result-line">
            <span class="result-label">Per liter</span>
            <span class="result-value">${fmtMoney(costPerLiter)}</span>
          </div>
          <div class="result-line">
            <span class="result-label">Yield</span>
            <span class="result-value accent">${fmtVol(currentYield)}</span>
          </div>

          <div class="cost-summary">
            <div class="result-line" style="border-bottom:none">
              <span class="result-label">In a cocktail @ 0.75 oz pour</span>
              <span class="result-value">${fmtMoney(costPerOzVal * 0.75)}</span>
            </div>
          </div>

          <p class="small" style="margin-top:1.5rem; color: rgba(255,255,255,0.55)">
            Costs are based on ${recipe.inputs.length === 1 ? "single-ingredient" : "blended"} input prices and assume the documented yield. Real-world variance: ±15%. Adjust your menu costing accordingly.
          </p>
        </div>
      </div>
    `;

    document.getElementById(`${mountId}-yield`).addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      if (!isNaN(v) && v > 0) {
        currentYield = unitToMl(v, unit);
        // re-render without remounting the input (to preserve cursor)
        // for simplicity here, just do partial update:
        updateOutputs();
      }
    });
    document.querySelectorAll(`#${mountId}-units button`).forEach(btn => {
      btn.addEventListener('click', () => {
        unit = btn.dataset.unit;
        render();
      });
    });
  }

  function updateOutputs() {
    const scaled = scaleRecipe(recipe, currentYield);
    const costPerOzVal = costPerOz(recipe);
    const out = mount.querySelector('.calc-output');
    if (!out) { render(); return; }
    // Rebuild the right column quickly:
    const lines = out.querySelectorAll('.result-value');
    if (lines.length >= 4) {
      lines[0].textContent = fmtMoney(scaled.cost);
      lines[1].textContent = fmtMoney(costPerOzVal);
      lines[2].textContent = fmtMoney((baseRecipeCost(recipe) / recipe.yield_ml) * 1000);
      lines[3].textContent = fmtVol(currentYield);
      if (lines[4]) lines[4].textContent = fmtMoney(costPerOzVal * 0.75);
    }
    // Update ingredient list quantities:
    const ingredients = mount.querySelectorAll('.ingredients .ingredient-qty');
    scaled.inputs.forEach((i, idx) => {
      if (ingredients[idx]) ingredients[idx].textContent = fmtWeight(i.qty_raw_g);
    });
    // Update yield note:
    const note = mount.querySelector('.calc-inputs .small');
    if (note) note.textContent = `Yields ${fmtVol(currentYield)} finished ${recipe.name.toLowerCase()}.`;
  }

  render();
}
