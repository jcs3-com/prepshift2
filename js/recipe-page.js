/* Recipe page populator — reads recipe id from data-recipe attribute on body or URL */

(function() {
  const params = new URLSearchParams(window.location.search);
  let recipeId = params.get('id') || document.body.dataset.recipe;

  // Fallback: infer from filename (order matters — match more specific first)
  if (!recipeId) {
    const path = window.location.pathname;
    if (path.includes('recipe-lime'))      recipeId = 'fresh_lime';
    else if (path.includes('recipe-lemon')) recipeId = 'fresh_lemon';
    else if (path.includes('recipe-pineapple')) recipeId = 'fresh_pineapple';
    else if (path.includes('recipe-honey-ginger')) recipeId = 'honey_ginger_syrup';
    else if (path.includes('recipe-ginger')) recipeId = 'fresh_ginger';
    else if (path.includes('recipe-demerara')) recipeId = 'demerara_syrup';
    else if (path.includes('recipe-simple')) recipeId = 'simple_syrup';
  }

  const recipe = RECIPES[recipeId];
  if (!recipe) {
    document.querySelector('main').innerHTML = '<h1>Recipe not found</h1><p>Return to the <a href="/manual/">manual</a>.</p>';
    return;
  }

  document.getElementById('page-title').textContent = `${recipe.name} | Prepshift`;
  document.getElementById('rh-title').textContent = recipe.name;
  document.getElementById('rh-standfirst').textContent = recipe.standfirst;

  // Meta strip
  const meta = document.getElementById('meta-strip');
  const metaItems = [
    { dt: 'Yield', dd: `${recipe.yield_ml} mL (${(recipe.yield_ml / 29.5735).toFixed(0)} fl oz)` },
    { dt: 'Prep time', dd: `${recipe.prep_min} min` },
    { dt: 'Shelf life', dd: recipe.shelf_hr >= 48 ? `${Math.round(recipe.shelf_hr / 24)} days` : `${recipe.shelf_hr} hours` },
    { dt: 'Storage', dd: '38°F, sealed' },
    { dt: 'Difficulty', dd: recipe.id === 'simple_syrup' ? 'Trivial' : (recipe.id === 'fresh_ginger' ? 'Moderate' : 'Easy') }
  ];
  meta.innerHTML = metaItems.map(i => `<div><dt>${i.dt}</dt><dd>${i.dd}</dd></div>`).join('');

  // Mount calculator
  renderCalculator(recipeId, 'calc-mount');

  // Method
  document.getElementById('method-list').innerHTML = recipe.method.map(m =>
    `<li><strong>${m.title}.</strong> ${m.body}</li>`
  ).join('');

  // Notes
  document.getElementById('recipe-notes').textContent = recipe.notes;

  // Pairs with
  document.getElementById('pairs-strip').textContent = recipe.pairs_with.join(', ');
})();
