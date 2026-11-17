/* Prepshift reference tables.
 * Renders the data the calculators run on (data/ingredients.js and
 * data/extended.js) as filterable tables with CSV download.
 * Needs calc.js for the cost maths.
 */
(function () {
  var ML_PER_OZ = 29.5735;

  function money(n) { return '$' + n.toFixed(n < 1 ? 3 : 2); }
  function pct(n) { return Math.round(n * 100) + '%'; }
  function hold(hours) { return hours >= 48 ? Math.round(hours / 24) + ' days' : hours + ' hours'; }

  var TABLES = [
    {
      id: 'ingredients',
      title: 'Ingredients',
      columns: [
        { label: 'Ingredient' },
        { label: 'Unit' },
        { label: 'Reference cost', num: true },
        { label: 'Usable yield', num: true },
        { label: 'Note' }
      ],
      rows: function () {
        return Object.keys(RAW_INGREDIENTS).map(function (key) {
          var i = RAW_INGREDIENTS[key];
          return [i.name, i.unit, '$' + i.cost.toFixed(2), pct(i.yield_pct), i.notes || ''];
        });
      }
    },
    {
      id: 'preparations',
      title: 'Preparations',
      columns: [
        { label: 'Preparation' },
        { label: 'Base batch', num: true },
        { label: 'Prep time', num: true },
        { label: 'Hold, chilled', num: true },
        { label: 'Cost per liter', num: true },
        { label: 'Cost per fl oz', num: true }
      ],
      rows: function () {
        return Object.keys(RECIPES).map(function (key) {
          var r = RECIPES[key];
          var cost = baseRecipeCost(r);
          return [
            r.name,
            r.yield_ml + ' mL',
            r.prep_min + ' min',
            hold(r.shelf_hr),
            money(cost / r.yield_ml * 1000),
            money(cost / (r.yield_ml / ML_PER_OZ))
          ];
        });
      }
    },
    {
      id: 'superjuice',
      title: 'Super juice build ratios',
      columns: [
        { label: 'Juice' },
        { label: 'Peel', num: true },
        { label: 'Acid', num: true },
        { label: 'Citric : malic', num: true },
        { label: 'Water', num: true },
        { label: 'Target pH', num: true }
      ],
      rows: function () {
        return Object.keys(SUPER_JUICE_SPEC).map(function (key) {
          var s = SUPER_JUICE_SPEC[key];
          var one = function (n) { return (n * 100).toFixed(1) + '%'; };
          return [
            s.name,
            one(s.peel_pct),
            one(s.acid_pct),
            Math.round(s.acid_blend.citric * 100) + ' : ' + Math.round(s.acid_blend.malic * 100),
            one(s.water_pct),
            String(s.ph_target)
          ];
        });
      }
    }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function csv(table, rows) {
    var cell = function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; };
    var out = [table.columns.map(function (c) { return cell(c.label); }).join(',')];
    rows.forEach(function (r) { out.push(r.map(cell).join(',')); });
    return out.join('\r\n');
  }

  function download(name, text) {
    var blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  var mount = document.getElementById('data-tables');
  var filter = document.getElementById('data-filter');
  var status = document.getElementById('data-status');
  if (!mount) return;

  var built = TABLES.map(function (t) { return { table: t, rows: t.rows() }; });

  function render() {
    var q = (filter && filter.value || '').trim().toLowerCase();
    var shown = 0;
    mount.innerHTML = built.map(function (b) {
      var rows = !q ? b.rows : b.rows.filter(function (r) {
        return r.join(' ').toLowerCase().indexOf(q) !== -1;
      });
      shown += rows.length;
      if (!rows.length) return '';
      return '<section class="data-table" aria-labelledby="t-' + b.table.id + '">' +
        '<div class="section-head"><h2 id="t-' + b.table.id + '">' + esc(b.table.title) + '</h2>' +
        '<span class="rule-end"><button type="button" class="btn-ghost btn" data-csv="' + b.table.id + '">Download CSV</button></span></div>' +
        '<div class="table-scroll"><table class="data"><thead><tr>' +
        b.table.columns.map(function (c) { return '<th' + (c.num ? ' class="num"' : '') + ' scope="col">' + esc(c.label) + '</th>'; }).join('') +
        '</tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr>' + r.map(function (v, i) {
            return '<td' + (b.table.columns[i].num ? ' class="num"' : '') + '>' + esc(v) + '</td>';
          }).join('') + '</tr>';
        }).join('') +
        '</tbody></table></div></section>';
    }).join('');
    if (status) {
      status.textContent = q
        ? (shown ? shown + (shown === 1 ? ' row matches' : ' rows match') + ' "' + filter.value.trim() + '".'
                 : 'Nothing matches "' + filter.value.trim() + '". Try a shorter word.')
        : '';
    }
  }

  mount.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-csv]');
    if (!btn) return;
    var b = built.filter(function (x) { return x.table.id === btn.getAttribute('data-csv'); })[0];
    if (b) download('prepshift-' + b.table.id + '.csv', csv(b.table, b.rows));
  });
  if (filter) filter.addEventListener('input', render);
  render();
})();
