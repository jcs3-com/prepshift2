/* MENU COSTING ENGINE
 *
 * Loads a full cocktail menu, accepts user-entered spirit costs, and
 * outputs per-drink cost, recommended menu price, pour-cost percentage,
 * and margin for each drink. The killer feature: a "solve for target pour
 * cost" mode that suggests prices for the entire menu given an industry-
 * standard 18-22% target pour cost.
 *
 * Spirit costs default to industry-typical bottle prices. User can override.
 */

// Default bottle cost assumptions (wholesale, 750mL unless noted)
const SPIRIT_DEFAULTS = {
  "White rum":         { bottle_cost: 14, bottle_size_ml: 750, note: "Plantation 3 Stars or similar mid-tier" },
  "Blackstrap rum":    { bottle_cost: 22, bottle_size_ml: 750, note: "Cruzan Black Strap" },
  "Blanco tequila":    { bottle_cost: 22, bottle_size_ml: 750, note: "Espolòn Blanco or similar" },
  "Bourbon":           { bottle_cost: 22, bottle_size_ml: 750, note: "Buffalo Trace or similar" },
  "Bourbon or rye":    { bottle_cost: 24, bottle_size_ml: 750, note: "Rittenhouse Rye 100 or similar" },
  "Rye whiskey":       { bottle_cost: 26, bottle_size_ml: 750, note: "Rittenhouse Rye 100" },
  "Blended scotch":    { bottle_cost: 28, bottle_size_ml: 750, note: "Famous Grouse or Monkey Shoulder" },
  "Islay scotch (float)": { bottle_cost: 50, bottle_size_ml: 750, note: "Laphroaig 10 or Ardbeg 10" },
  "Gin (London Dry)":  { bottle_cost: 18, bottle_size_ml: 750, note: "Beefeater or Tanqueray" },
  "Cointreau / triple sec": { bottle_cost: 30, bottle_size_ml: 750, note: "Cointreau" },
  "Campari":           { bottle_cost: 28, bottle_size_ml: 750, note: "Campari 750" },
  "Sweet vermouth":    { bottle_cost: 14, bottle_size_ml: 750, note: "Carpano Antica or Cocchi" },
  "Angostura bitters": { bottle_cost: 18, bottle_size_ml: 200, note: "Angostura Aromatic 200mL" },
  "Orange bitters":    { bottle_cost: 14, bottle_size_ml: 100, note: "Regan's Orange Bitters" }
};

const ML_PER_FL_OZ_MENU = 29.5735;

function renderMenuCostingEngine(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  // Build a working state object of spirit costs (user can edit)
  let spiritCosts = {};
  for (const [name, def] of Object.entries(SPIRIT_DEFAULTS)) {
    spiritCosts[name] = { ...def };
  }
  let targetPourCost = 20; // %
  let cardingFee = 0; // optional service fee not used in pour cost calc

  function getSpiritCostPerOz(ingredientName) {
    const s = spiritCosts[ingredientName];
    if (!s) return null;
    const costPerMl = s.bottle_cost / s.bottle_size_ml;
    return costPerMl * ML_PER_FL_OZ_MENU;
  }

  function computeDrinkCost(cocktailKey) {
    const c = COCKTAILS[cocktailKey];
    let totalCost = 0;
    const breakdown = [];
    for (const i of c.ingredients) {
      let costPerOz = 0;
      let source = "";
      if (i.recipe_ref && RECIPES[i.recipe_ref]) {
        costPerOz = costPerOz_recipe(RECIPES[i.recipe_ref]);
        source = "house";
      } else {
        const spiritCost = getSpiritCostPerOz(i.name);
        if (spiritCost !== null) {
          costPerOz = spiritCost;
          source = "spirit";
        } else {
          source = "unknown";
        }
      }
      const lineItemCost = costPerOz * i.oz;
      totalCost += lineItemCost;
      breakdown.push({
        name: i.name,
        oz: i.oz,
        costPerOz: costPerOz,
        lineCost: lineItemCost,
        source: source
      });
    }
    return { totalCost, breakdown };
  }

  // Use the global costPerOz function from calc.js for recipes
  function costPerOz_recipe(recipe) {
    return costPerOz(recipe); // calc.js exports this
  }

  function recommendPrice(cost, targetPC) {
    return cost / (targetPC / 100);
  }

  function fmtMoney(n) {
    if (Math.abs(n) < 0.01) return "$" + n.toFixed(4);
    if (Math.abs(n) < 1)    return "$" + n.toFixed(3);
    return "$" + n.toFixed(2);
  }

  function renderTable() {
    const cocktails = Object.keys(COCKTAILS);
    let totalCost = 0;
    let totalSuggestedRevenue = 0;
    let menuRows = '';

    for (const k of cocktails) {
      const c = COCKTAILS[k];
      const { totalCost: drinkCost, breakdown } = computeDrinkCost(k);
      const recPrice = recommendPrice(drinkCost, targetPourCost);
      // Round to nearest $1 for menu display
      const menuPrice = Math.round(recPrice);
      const actualPC = (drinkCost / menuPrice) * 100;
      const grossMargin = menuPrice - drinkCost;

      totalCost += drinkCost;
      totalSuggestedRevenue += menuPrice;

      const unknownCount = breakdown.filter(b => b.source === "unknown").length;
      const warning = unknownCount > 0 ? ` <span style="color:var(--ochre)">⚠</span>` : '';

      menuRows += `
        <tr>
          <td><strong>${c.name}</strong>${warning}<br><span class="small" style="font-family:var(--serif-body); font-style:italic">${c.style}</span></td>
          <td class="num">${fmtMoney(drinkCost)}</td>
          <td class="num">$${menuPrice}</td>
          <td class="num">${actualPC.toFixed(1)}%</td>
          <td class="num">${fmtMoney(grossMargin)}</td>
          <td class="num">${(grossMargin / menuPrice * 100).toFixed(0)}%</td>
        </tr>
      `;
    }

    const avgPourCost = (totalCost / totalSuggestedRevenue) * 100;
    const totalMargin = totalSuggestedRevenue - totalCost;

    return { menuRows, totalCost, totalSuggestedRevenue, avgPourCost, totalMargin };
  }

  function renderSpiritEditor() {
    return `
      <div class="section-head" style="margin-top:3rem">
        <span class="section-num">§ Inputs</span>
        <h2>Your spirit costs</h2>
        <span class="rule-end">Wholesale, per bottle</span>
      </div>
      <p class="small">
        Defaults are mid-tier industry wholesale prices. Override with your actual invoice costs.
        Bottle size in mL; cost in dollars. Changes recompute the entire menu instantly.
      </p>
      <table class="data" style="margin-top:1rem">
        <thead>
          <tr>
            <th style="width:40%">Spirit / Modifier</th>
            <th style="width:18%">Bottle cost ($)</th>
            <th style="width:14%">Size (mL)</th>
            <th style="width:14%">$/fl oz</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(spiritCosts).map(([name, s]) => `
            <tr>
              <td><strong>${name}</strong></td>
              <td><input type="number" step="0.50" min="0" value="${s.bottle_cost}" data-spirit="${name}" data-field="bottle_cost" class="spirit-input" style="width:80px; font-family:var(--mono); padding:0.3rem; border:1px solid var(--ink); background:var(--paper)"></td>
              <td><input type="number" step="50" min="50" value="${s.bottle_size_ml}" data-spirit="${name}" data-field="bottle_size_ml" class="spirit-input" style="width:80px; font-family:var(--mono); padding:0.3rem; border:1px solid var(--ink); background:var(--paper)"></td>
              <td class="num">${fmtMoney(getSpiritCostPerOz(name) || 0)}</td>
              <td style="font-family:var(--serif-body); font-size:0.85rem">${s.note}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function render() {
    const { menuRows, totalCost, totalSuggestedRevenue, avgPourCost, totalMargin } = renderTable();
    const cocktailCount = Object.keys(COCKTAILS).length;

    mount.innerHTML = `
      <div class="calc-wrap" style="grid-template-columns: 1fr">
        <div class="calc-inputs" style="border-right:none">
          <h4>Costing Parameters</h4>
          <div class="calc-input-row">
            <label class="calc-label">Target pour cost (%)</label>
            <input type="number" id="mce-pc" value="${targetPourCost}" step="1" min="10" max="40">
            <span class="small" style="margin-left:1rem">Industry standard: 18–22%. Lower = higher prices.</span>
          </div>
        </div>
      </div>

      <div class="section-head" style="margin-top:2rem">
        <span class="section-num">§ Menu</span>
        <h2>Cost & price analysis</h2>
        <span class="rule-end">${cocktailCount} drinks</span>
      </div>

      <table class="data">
        <thead>
          <tr>
            <th>Drink</th>
            <th style="text-align:right">Drink Cost</th>
            <th style="text-align:right">Menu Price</th>
            <th style="text-align:right">Pour Cost</th>
            <th style="text-align:right">Gross Margin</th>
            <th style="text-align:right">Margin %</th>
          </tr>
        </thead>
        <tbody>${menuRows}</tbody>
        <tfoot>
          <tr style="border-top:2px solid var(--ink); font-weight:600; background:var(--paper-dark)">
            <td><strong>MENU TOTALS</strong></td>
            <td class="num">${fmtMoney(totalCost)}</td>
            <td class="num">$${totalSuggestedRevenue}</td>
            <td class="num">${avgPourCost.toFixed(1)}%</td>
            <td class="num">${fmtMoney(totalMargin)}</td>
            <td class="num">${((totalMargin / totalSuggestedRevenue) * 100).toFixed(0)}%</td>
          </tr>
        </tfoot>
      </table>

      <p class="small" style="margin-top:1rem">
        <span style="color:var(--ochre)">⚠</span> indicates a drink contains an ingredient not in the spirit cost editor. Costs for those ingredients are treated as $0 — add them to <code class="mono">SPIRIT_DEFAULTS</code> in <code class="mono">menu-costing.js</code> or override in the editor below.
      </p>

      <div class="filmstrip" style="margin-top:2rem">
        <div class="filmstrip-cell">
          <div class="label">If all 100 drinks/night sold</div>
          <div class="value">$${(totalMargin * 100 / cocktailCount).toFixed(0)}</div>
        </div>
        <div class="filmstrip-cell">
          <div class="label">Annual margin (350 nights)</div>
          <div class="value">$${((totalMargin * 100 / cocktailCount) * 350 / 1000).toFixed(0)}k</div>
        </div>
        <div class="filmstrip-cell">
          <div class="label">vs. 25% pour-cost industry avg</div>
          <div class="value">${avgPourCost < 22 ? '+' : ''}${(22 - avgPourCost).toFixed(1)}%</div>
        </div>
        <div class="filmstrip-cell">
          <div class="label">Costed drinks</div>
          <div class="value">${cocktailCount}/${cocktailCount}</div>
        </div>
      </div>

      ${renderSpiritEditor()}
    `;

    // Re-bind input listeners
    document.getElementById('mce-pc').addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      if (!isNaN(v) && v > 0) {
        targetPourCost = v;
        render();
      }
    });
    document.querySelectorAll('.spirit-input').forEach(input => {
      input.addEventListener('input', e => {
        const spirit = e.target.dataset.spirit;
        const field = e.target.dataset.field;
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val > 0) {
          spiritCosts[spirit][field] = val;
          render();
        }
      });
    });
  }

  render();
}
