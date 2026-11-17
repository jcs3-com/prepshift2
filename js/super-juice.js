/* SUPER JUICE FORMULAS
 * Prepshift's lime and lemon super juice, published per 10 liter batch in
 * data/extended.js (SUPER_JUICE_SPEC). Every quantity scales in a straight
 * line with the batch size, so the scaler multiplies and nothing else.
 */

function superJuiceQty(amount, unit) {
  if (unit === 'L') {
    return amount.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' L';
  }
  // grams: whole numbers once they are big enough to weigh that way
  var digits = amount >= 100 ? 0 : 1;
  return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: digits }) + ' g';
}

function superJuiceRows(spec, batchLiters) {
  var factor = batchLiters / spec.batch_l;
  var rows = spec.ingredients.map(function (i) {
    return { name: i.name, qty: superJuiceQty(i.qty * factor, i.unit) };
  });
  rows.push({ name: 'Fresh ' + spec.fruit + ' juice', qty: 'from the peeled fruit', text: true });
  return rows;
}

function superJuiceFruit(spec, batchLiters) {
  var n = spec.fruit_count * batchLiters / spec.batch_l;
  var rounded = n >= 20 ? Math.round(n / 5) * 5 : Math.max(1, Math.round(n));
  return 'About ' + rounded + ' ' + spec.fruit + (rounded === 1 ? '' : 's');
}

function renderSuperJuiceCalc(mountId) {
  var mount = document.getElementById(mountId);
  if (!mount) return;

  var batch = 10; // liters of water

  function lists() {
    return Object.keys(SUPER_JUICE_SPEC).map(function (key) {
      var spec = SUPER_JUICE_SPEC[key];
      var items = superJuiceRows(spec, batch).map(function (r) {
        return '<li><span class="ingredient-name">' + r.name + '</span><span class="ingredient-qty' + (r.text ? ' in-words' : '') + '">' + r.qty + '</span></li>';
      }).join('');
      return '<div><h3>' + spec.name + '</h3><ul class="ingredients">' + items + '</ul>' +
        '<p class="small sj-fruit">' + superJuiceFruit(spec, batch) + ' for the peel.</p></div>';
    }).join('');
  }

  mount.innerHTML =
    '<div class="sj-batch calc-input-row">' +
      '<label class="calc-label" for="sj-batch">Batch size, in liters of water</label>' +
      '<input type="number" id="sj-batch" value="' + batch + '" min="1" step="1" inputmode="decimal">' +
    '</div>' +
    '<div class="two-col" id="sj-lists">' + lists() + '</div>';

  document.getElementById('sj-batch').addEventListener('input', function (e) {
    var v = parseFloat(e.target.value);
    if (!isNaN(v) && v > 0) {
      batch = v;
      document.getElementById('sj-lists').innerHTML = lists();
    }
  });
}
