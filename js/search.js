/* PREPSHIFT SEARCH INDEX
 *
 * Client-side search across recipes, calculators, glossary terms, cocktails,
 * equipment, and static pages. Loads with the search overlay; indexes ~150
 * documents totaling ~30 KB. Fully in-memory; no network calls.
 *
 * Search uses simple term-frequency scoring with prefix matching and
 * boosted title hits. Good enough for a 150-doc corpus; we'll upgrade
 * to a real fuzzy index if the corpus grows past 1000.
 */

const SEARCH_INDEX = (function() {
  const docs = [];

  // 1. Recipes
  const recipeUrlMap = {
    'fresh_lime': '/pages/recipe-lime.html',
    'fresh_lemon': '/pages/recipe-lemon.html',
    'fresh_pineapple': '/pages/recipe-pineapple.html',
    'fresh_ginger': '/pages/recipe-ginger.html',
    'simple_syrup': '/pages/recipe-simple.html',
    'demerara_syrup': '/pages/recipe-demerara.html',
    'honey_ginger_syrup': '/pages/recipe-honey-ginger.html'
  };
  for (const [id, r] of Object.entries(typeof RECIPES !== 'undefined' ? RECIPES : {})) {
    docs.push({
      type: 'recipe',
      title: r.name,
      subtitle: r.kicker,
      url: recipeUrlMap[id] || `/pages/recipe-${id}.html`,
      body: `${r.italic || ''} ${r.standfirst || ''} ${r.notes || ''} ${(r.pairs_with || []).join(' ')}`,
      tags: ['recipe', 'prep', r.id.includes('syrup') ? 'syrup' : '', (r.id.includes('lime') || r.id.includes('lemon') || r.id.includes('grapefruit')) ? 'citrus' : '']
    });
  }

  // 2. Cocktails
  for (const [id, c] of Object.entries(typeof COCKTAILS !== 'undefined' ? COCKTAILS : {})) {
    const ingNames = c.ingredients.map(i => i.name).join(', ');
    docs.push({
      type: 'cocktail',
      title: c.name,
      subtitle: `${c.style} · ${c.glassware}`,
      url: '/pages/batch-scaler.html',
      body: `${ingNames} ${c.method}`,
      tags: ['cocktail', c.style.toLowerCase()]
    });
  }

  // 3. Calculators / Tools
  const tools = [
    { title: 'Cost & Yield Calculators', subtitle: 'Core seven recipes — per-oz, per-liter, per-pour', url: '/pages/calculators.html', body: 'cost yield scale batch ounce liter pour fresh juice simple syrup', tags: ['calculator', 'tool'] },
    { title: 'Super Juice', subtitle: 'Lime and lemon formulas, scaled to any batch', url: '/pages/super-juice.html', body: 'super juice superjuice lime lemon peel citric malic tartaric acid sugar salt formula batch scale liters', tags: ['calculator', 'tool', 'citrus'] },
    { title: 'Batched Cocktail Scaler', subtitle: 'Single drink to bottle, keg, or jug with dilution and ABV', url: '/pages/batch-scaler.html', body: 'batch scaler dilution ABV bottle keg gallon final alcohol cocktail single serving', tags: ['calculator', 'tool', 'batch'] },
    { title: 'Acid Substitution Calculator', subtitle: 'Replace fresh citrus with water and food-grade acid', url: '/pages/acid-sub.html', body: 'acid substitution citric malic water lime lemon grapefruit arnold liquid intelligence', tags: ['calculator', 'tool', 'acid'] },
    { title: 'Menu Costing Engine', subtitle: 'Full menu cost analysis with pour-cost solver', url: '/pages/menu-costing.html', body: 'menu costing pour cost margin price spirit bottle invoice wholesale 18 20 22 percent target', tags: ['calculator', 'tool', 'cost', 'menu'] },
    { title: 'Carbonation & Dispense Calculator', subtitle: 'Bottled and draft cocktails — PSI, volumes, dilution', url: '/pages/draft.html', body: 'carbonation co2 psi pressure volumes bottle draft tap keg cornelius dispense', tags: ['calculator', 'tool', 'carbonation', 'draft'] }
  ];
  for (const t of tools) {
    docs.push({ type: 'tool', ...t });
  }

  // 4. Static pages / sections
  const pages = [
    { title: 'Prepshift Juice', subtitle: 'Fresh pressed juice and super juice', url: '/juice/', body: 'juice fresh pressed super juice superjuice wholesale bars restaurants caterers order buy inquiry' },
    { title: 'Improve', subtitle: 'Process consulting for bars and kitchens', url: '/improve/', body: 'improve process consulting food waste reduction purchasing prep yield holding kitchen bar' },
    { title: 'Data', subtitle: 'Reference tables: yields, costs and shelf life', url: '/data/', body: 'data database tables reference yield cost shelf life csv download dataset' },
    { title: 'Contact', subtitle: 'Write to Prepshift', url: '/contact/', body: 'contact email inquiry intake' },
    { title: 'Draft & Bottled Cocktails', subtitle: 'Bottled, tapped and pre-made', url: '/pages/draft.html', body: 'morgenthaler clyde common bottle keg draft tap carbonation force PSI volumes co2 negroni americano' },
    { title: 'Equipment List', subtitle: 'Measurement, juicing, storage, advanced', url: '/pages/equipment.html', body: 'equipment scale champion juicer chinois cornelius keg refractometer ph meter mexican elbow' },
    { title: 'Glossary', subtitle: 'The trade vocabulary, defined as we use it', url: '/pages/glossary.html', body: 'glossary index vocabulary terms acid abv brix bitters cordial dilution oleo saccharum' },
    { title: 'Legal', subtitle: 'Alcohol, food safety, credit, privacy', url: '/pages/legal.html', body: 'legal alcohol food safety intellectual property privacy data' }
  ];
  for (const p of pages) {
    docs.push({ type: 'page', ...p });
  }

  // 5. Equipment items
  if (typeof EQUIPMENT !== 'undefined') {
    for (const cat of Object.values(EQUIPMENT)) {
      for (const item of cat.items) {
        docs.push({
          type: 'equipment',
          title: item.name,
          subtitle: `${cat.title} · ${item.brand_ref} · $${item.price}`,
          url: '/pages/equipment.html',
          body: `${item.note} ${item.priority}`,
          tags: ['equipment', cat.title.toLowerCase()]
        });
      }
    }
  }

  // 6. Glossary terms — manually extracted key set
  const glossary = [
    { term: 'ABV', def: 'Alcohol by Volume — percentage of ethanol in a finished beverage' },
    { term: 'Acid-adjustment', def: 'Adding food-grade acid to engineer perceived sourness' },
    { term: 'Batching', def: 'Pre-combining a cocktail in volume for later service' },
    { term: 'Bitters', def: 'Concentrated tincture of bittering agents in high-proof alcohol' },
    { term: 'Brix', def: 'Scale measuring dissolved sugar — 1° Brix = 1g sucrose per 100g solution' },
    { term: 'Bromelain', def: 'Proteolytic enzyme in fresh pineapple — denatured above 158°F' },
    { term: 'Carbonation', def: 'Dissolved CO₂ in liquid, measured in volumes' },
    { term: 'Centrifuge', def: 'High-G device that separates suspended particles from liquid' },
    { term: 'Citric acid', def: 'Dominant acid in lemons and limes — ~5-6% of fresh juice by weight' },
    { term: 'Clarification', def: 'Removing suspended particles to produce transparent liquid' },
    { term: 'Demerara', def: 'Large-crystal, lightly-molasses-coated sugar from raw cane' },
    { term: 'Dilution', def: 'Water added to a cocktail via ice melt or deliberate addition' },
    { term: 'Double-strain', def: 'Pouring a shaken drink through both cocktail and fine-mesh strainers' },
    { term: 'Dry-shake', def: 'Shaking without ice — for emulsifying egg-white drinks' },
    { term: 'Eau de vie', def: 'Clear, unaged fruit brandy distilled from a single fruit' },
    { term: 'Fat-wash', def: 'Transferring fat flavor into a spirit, then freezing the fat out' },
    { term: 'FIFO', def: 'First In, First Out — bar prep discipline' },
    { term: 'Force-carbonation', def: 'Dissolving CO₂ into liquid by applying pressurized gas' },
    { term: 'Henry\'s Law', def: 'Physical principle governing gas dissolution — partial pressure proportional' },
    { term: 'Infusion', def: 'Transfer of flavor compounds from solid substrate into solvent' },
    { term: 'Jigger', def: 'Two-sided measuring cup for cocktail volumes' },
    { term: 'Malic acid', def: 'Apple acid — ~⅓ of lime\'s total acid load' },
    { term: 'Muddle', def: 'Pressing fresh herb, fruit, or sugar against vessel to release juice or oils' },
    { term: 'Oleo-saccharum', def: 'Sugar-extracted citrus peel oil — defining ingredient of historic punch' },
    { term: 'Orgeat', def: 'Almond-based syrup with orange flower water — tiki essential' },
    { term: 'Pasteurization', def: 'Heat-treating juice to kill bacteria — 60°C for 10 min standard' },
    { term: 'Pour cost', def: 'Ratio of ingredient cost to menu price — target 18-22%' },
    { term: 'Proof', def: 'US alcohol measurement — 2× ABV' },
    { term: 'Refractometer', def: 'Optical device measuring dissolved sugar (Brix)' },
    { term: 'Rotary evaporator', def: 'Vacuum distillation glassware — bar uses since ~2010' },
    { term: 'Shrub', def: 'Vinegar-based fruit syrup of colonial American origin' },
    { term: 'Super juice', def: 'Citrus prep with 3× yield and 14× shelf life of fresh' },
    { term: 'Tincture', def: 'Concentrated extract of herb/spice in high-proof alcohol' },
    { term: 'Vermouth', def: 'Fortified, aromatized wine — refrigerate after opening' },
    { term: 'Volumes', def: 'Unit of carbonation — ratio of dissolved CO₂ to liquid at atm pressure' },
    { term: 'Zest', def: 'Colored outer layer of citrus peel — contains aromatic oils' }
  ];
  for (const g of glossary) {
    docs.push({
      type: 'glossary',
      title: g.term,
      subtitle: g.def,
      url: '/pages/glossary.html',
      body: `${g.term} ${g.def}`,
      tags: ['glossary', 'term']
    });
  }

  return docs;
})();


/* ---------- SEARCH ALGORITHM ----------
 * Tokenize query, score each doc by:
 *   - +10 for exact title match
 *   - +5  for title prefix match
 *   - +3  for any title token contains query token
 *   - +2  for subtitle hit
 *   - +1  for body hit
 *   - +0.5 for tags hit
 * Then sort and return top N.
 */
function searchPrepshift(query, limit = 20) {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();
  const tokens = q.split(/\s+/).filter(t => t.length > 0);


  const results = [];
  for (const doc of SEARCH_INDEX) {
    const titleLower = doc.title.toLowerCase();
    const subtitleLower = (doc.subtitle || '').toLowerCase();
    const bodyLower = (doc.body || '').toLowerCase();
    const tagsLower = (doc.tags || []).join(' ').toLowerCase();

    let score = 0;
    for (const t of tokens) {
      if (titleLower === t) score += 10;
      else if (titleLower.startsWith(t)) score += 5;
      else if (titleLower.includes(t)) score += 3;
      if (subtitleLower.includes(t)) score += 2;
      if (bodyLower.includes(t)) score += 1;
      if (tagsLower.includes(t)) score += 0.5;
    }
    if (score > 0) {
      results.push({ ...doc, score, resolvedUrl: doc.url });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}


/* ---------- SEARCH UI ----------
 * Overlay-style search modal. Opened by:
 *   - clicking the search button in the masthead
 *   - pressing "/" or Cmd-K / Ctrl-K
 * Closed by Escape, clicking the backdrop, or selecting a result.
 */
function initPrepshiftSearch() {
  // The header carries a Search button on every page
  document.querySelectorAll('[data-search-open]').forEach(btn => btn.addEventListener('click', openSearch));

  // Inject the search modal at end of body
  const modal = document.createElement('div');
  modal.id = 'prepshift-search-modal';
  modal.className = 'search-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="search-backdrop"></div>
    <div class="search-panel" role="dialog" aria-label="Search Prepshift">
      <div class="search-input-wrap">
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" style="flex-shrink:0">
          <circle cx="7" cy="7" r="5"/>
          <path d="M11 11l3.5 3.5"/>
        </svg>
        <input type="text" id="search-input" placeholder="Search recipes, calculators, glossary" aria-label="Search the site" autocomplete="off" spellcheck="false">
        <button class="search-close" aria-label="Close search">Close</button>
      </div>
      <div class="search-results" id="search-results">
        <div class="search-empty">
          <p class="search-hint">Try: <button class="search-suggest" data-q="lime">lime</button> <button class="search-suggest" data-q="negroni">negroni</button> <button class="search-suggest" data-q="batch">batch</button> <button class="search-suggest" data-q="carbonation">carbonation</button> <button class="search-suggest" data-q="oleo">oleo-saccharum</button></p>
          <p class="search-hint-small">Press <kbd>Esc</kbd> to close · <kbd>↑↓</kbd> to navigate · <kbd>Enter</kbd> to open</p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const input = document.getElementById('search-input');
  const resultsEl = document.getElementById('search-results');
  const backdrop = modal.querySelector('.search-backdrop');
  const closeBtn = modal.querySelector('.search-close');

  let selectedIndex = -1;
  let currentResults = [];

  function openSearch() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => input.focus(), 50);
    document.body.style.overflow = 'hidden';
  }

  function closeSearch() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    input.value = '';
    selectedIndex = -1;
    renderResults('');
  }

  function typeLabel(type) {
    const map = { recipe: 'Recipe', cocktail: 'Cocktail', tool: 'Tool', page: 'Page', equipment: 'Equipment', glossary: 'Glossary' };
    return map[type] || type;
  }

  function typeColor() { return 'var(--pith)'; }

  function renderResults(query) {
    if (!query || query.length === 0) {
      resultsEl.innerHTML = `
        <div class="search-empty">
          <p class="search-hint">Try: <button class="search-suggest" data-q="lime">lime</button> <button class="search-suggest" data-q="negroni">negroni</button> <button class="search-suggest" data-q="batch">batch</button> <button class="search-suggest" data-q="carbonation">carbonation</button> <button class="search-suggest" data-q="oleo">oleo-saccharum</button></p>
          <p class="search-hint-small">Press <kbd>Esc</kbd> to close · <kbd>↑↓</kbd> to navigate · <kbd>Enter</kbd> to open</p>
        </div>
      `;
      resultsEl.querySelectorAll('.search-suggest').forEach(btn => {
        btn.addEventListener('click', () => {
          input.value = btn.dataset.q;
          input.dispatchEvent(new Event('input'));
        });
      });
      currentResults = [];
      return;
    }
    currentResults = searchPrepshift(query, 20);
    if (currentResults.length === 0) {
      resultsEl.innerHTML = `<div class="search-empty"><p class="search-hint">No matches for "<strong>${query}</strong>". Try a different term.</p></div>`;
      return;
    }
    resultsEl.innerHTML = currentResults.map((r, i) => `
      <a href="${r.resolvedUrl}" class="search-result ${i === selectedIndex ? 'selected' : ''}" data-index="${i}">
        <span class="search-result-type" style="color:${typeColor(r.type)}">${typeLabel(r.type)}</span>
        <div class="search-result-body">
          <div class="search-result-title">${r.title}</div>
          <div class="search-result-subtitle">${r.subtitle || ''}</div>
        </div>
        <span class="search-result-arrow">→</span>
      </a>
    `).join('');
  }

  function selectResult(delta) {
    if (currentResults.length === 0) return;
    selectedIndex = (selectedIndex + delta + currentResults.length) % currentResults.length;
    document.querySelectorAll('.search-result').forEach((el, i) => {
      el.classList.toggle('selected', i === selectedIndex);
      if (i === selectedIndex) el.scrollIntoView({ block: 'nearest' });
    });
  }

  function openSelected() {
    if (selectedIndex >= 0 && currentResults[selectedIndex]) {
      window.location.href = currentResults[selectedIndex].resolvedUrl;
    } else if (currentResults.length > 0) {
      window.location.href = currentResults[0].resolvedUrl;
    }
  }

  // Event wiring
  input.addEventListener('input', e => {
    selectedIndex = -1;
    renderResults(e.target.value.trim());
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); selectResult(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selectResult(-1); }
    else if (e.key === 'Enter')   { e.preventDefault(); openSelected(); }
    else if (e.key === 'Escape')  { e.preventDefault(); closeSearch(); }
  });

  backdrop.addEventListener('click', closeSearch);
  closeBtn.addEventListener('click', closeSearch);

  // Global keyboard shortcuts
  document.addEventListener('keydown', e => {
    // Don't capture if user is already typing in an input
    const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

    if (e.key === '/' && !inInput && !modal.classList.contains('open')) {
      e.preventDefault();
      openSearch();
    } else if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (modal.classList.contains('open')) closeSearch();
      else openSearch();
    } else if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeSearch();
    }
  });

  // Initial render
  renderResults('');
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPrepshiftSearch);
} else {
  initPrepshiftSearch();
}
