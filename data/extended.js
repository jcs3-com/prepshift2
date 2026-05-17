/* PREPSHIFT EXTENDED DATA
 * Super juice, batched cocktail templates, equipment, stories.
 * Methodology references public Kevin Kos / Nickle Morris / Morgenthaler work,
 * adapted with Prepshift placeholder defaults. Real production specs pending.
 */

/* ---------- SUPER JUICE METHODOLOGY ----------
 * Super Juice (orig. Nickle Morris, popularized by Kevin Kos):
 *   - 50g peel of fruit (e.g., lime or lemon)
 *   - 16g acid blend (citric + malic for lime; citric only for lemon)
 *   - 16g distilled/filtered water (to dissolve acid + extract peel oils)
 *   - Then add fresh juice of the same fruit to total ~1000g
 * Yield is ~3–4× fresh juice from the same fruit weight.
 * Shelf life: ~2 weeks refrigerated (vs. ~24 hr fresh).
 */
const SUPER_JUICE_SPEC = {
  lime: {
    name: "Lime Super Juice",
    fruit_used: "Lime (Persian)",
    peel_pct: 0.05,          // 5% by mass of finished product
    acid_pct: 0.066,         // 6.6% acid blend
    water_pct: 0.016,        // 1.6% water (dissolves the acid)
    acid_blend: { citric: 0.667, malic: 0.333 }, // ⅔ citric + ⅓ malic for lime
    juice_pct_remainder: true,   // fresh juice fills to 100%
    ph_target: 2.2,
    notes: "Lime's flavor is split between juice acid and peel oil. Super juice captures both. Yields ~3.3× fresh juice volume from same fruit count."
  },
  lemon: {
    name: "Lemon Super Juice",
    fruit_used: "Lemon (Eureka)",
    peel_pct: 0.05,
    acid_pct: 0.066,
    water_pct: 0.016,
    acid_blend: { citric: 1.0, malic: 0.0 }, // lemons are already citric-dominant
    juice_pct_remainder: true,
    ph_target: 2.4,
    notes: "Single-acid blend (citric only) — lemon doesn't need the malic component lime requires. Yields ~3× fresh juice from same fruit count."
  },
  grapefruit: {
    name: "Grapefruit Super Juice",
    fruit_used: "Grapefruit (Ruby)",
    peel_pct: 0.06,
    acid_pct: 0.05,
    water_pct: 0.014,
    acid_blend: { citric: 0.5, malic: 0.5 },
    juice_pct_remainder: true,
    ph_target: 2.8,
    notes: "Grapefruit super juice is the tool that makes Palomas, Hemingway Daiquiris, and Brown Derbies sing without 3-day-old fresh grapefruit going to waste."
  }
};

/* ---------- BATCHED COCKTAIL TEMPLATES ----------
 * Each cocktail is defined by single-serving spec.
 * The scaler accepts target batch size + bottle/format and computes:
 *   - exact ingredient volumes
 *   - water dilution (to mimic 20% shake/stir dilution)
 *   - final ABV
 *   - final yield
 */
const COCKTAILS = {
  daiquiri: {
    name: "Daiquiri",
    style: "Sour",
    glassware: "Coupe",
    method: "Shake, double strain",
    dilution_pct: 32,
    ingredients: [
      { name: "White rum",         oz: 2.0, abv: 40 },
      { name: "Fresh lime juice",  oz: 0.75, abv: 0,  recipe_ref: "fresh_lime" },
      { name: "Simple syrup (1:1)", oz: 0.5, abv: 0,  recipe_ref: "simple_syrup" }
    ]
  },
  margarita: {
    name: "Margarita",
    style: "Sour",
    glassware: "Rocks, salt rim",
    method: "Shake, strain",
    dilution_pct: 28,
    ingredients: [
      { name: "Blanco tequila",      oz: 2.0,  abv: 40 },
      { name: "Cointreau / triple sec", oz: 0.75, abv: 40 },
      { name: "Fresh lime juice",    oz: 0.75, abv: 0, recipe_ref: "fresh_lime" }
    ]
  },
  whiskey_sour: {
    name: "Whiskey Sour",
    style: "Sour",
    glassware: "Rocks or coupe",
    method: "Shake (dry then wet if egg), strain",
    dilution_pct: 32,
    ingredients: [
      { name: "Bourbon",             oz: 2.0,  abv: 45 },
      { name: "Fresh lemon juice",   oz: 0.75, abv: 0, recipe_ref: "fresh_lemon" },
      { name: "Simple syrup (1:1)",  oz: 0.5,  abv: 0, recipe_ref: "simple_syrup" }
    ]
  },
  jungle_bird: {
    name: "Jungle Bird",
    style: "Tropical",
    glassware: "Rocks",
    method: "Shake, strain over fresh ice",
    dilution_pct: 30,
    ingredients: [
      { name: "Blackstrap rum",      oz: 1.5,  abv: 40 },
      { name: "Campari",             oz: 0.75, abv: 24 },
      { name: "Fresh pineapple juice", oz: 1.5, abv: 0, recipe_ref: "fresh_pineapple" },
      { name: "Fresh lime juice",    oz: 0.5,  abv: 0, recipe_ref: "fresh_lime" },
      { name: "Demerara syrup (2:1)", oz: 0.5, abv: 0, recipe_ref: "demerara_syrup" }
    ]
  },
  penicillin: {
    name: "Penicillin",
    style: "Sour",
    glassware: "Rocks",
    method: "Shake, strain, Islay float",
    dilution_pct: 32,
    ingredients: [
      { name: "Blended scotch",      oz: 2.0,  abv: 43 },
      { name: "Fresh lemon juice",   oz: 0.75, abv: 0, recipe_ref: "fresh_lemon" },
      { name: "Honey-ginger syrup",  oz: 0.75, abv: 0, recipe_ref: "honey_ginger_syrup" },
      { name: "Islay scotch (float)", oz: 0.25, abv: 46 }
    ]
  },
  negroni: {
    name: "Negroni",
    style: "Stirred / Bitter",
    glassware: "Rocks",
    method: "Stir, strain over large cube",
    dilution_pct: 28,
    ingredients: [
      { name: "Gin (London Dry)",    oz: 1.0,  abv: 44 },
      { name: "Campari",             oz: 1.0,  abv: 24 },
      { name: "Sweet vermouth",      oz: 1.0,  abv: 16 }
    ]
  },
  manhattan: {
    name: "Manhattan",
    style: "Stirred",
    glassware: "Coupe",
    method: "Stir, strain",
    dilution_pct: 25,
    ingredients: [
      { name: "Rye whiskey",         oz: 2.0,  abv: 50 },
      { name: "Sweet vermouth",      oz: 1.0,  abv: 16 },
      { name: "Angostura bitters",   oz: 0.06, abv: 44 } // 2 dashes ≈ 0.06 oz
    ]
  },
  old_fashioned: {
    name: "Old Fashioned",
    style: "Stirred / Spirit-forward",
    glassware: "Rocks",
    method: "Build, stir, large cube",
    dilution_pct: 30,
    ingredients: [
      { name: "Bourbon or rye",      oz: 2.0,  abv: 45 },
      { name: "Demerara syrup (2:1)", oz: 0.25, abv: 0, recipe_ref: "demerara_syrup" },
      { name: "Angostura bitters",   oz: 0.06, abv: 44 },
      { name: "Orange bitters",      oz: 0.03, abv: 44 }
    ]
  }
};

/* ---------- EQUIPMENT LIST ----------
 * Organized by station / function. Sourcing is illustrative; live links
 * will go on the equipment page when this is replaced with affiliate-tracked
 * sources or vetted vendor partnerships.
 */
const EQUIPMENT = {
  measurement: {
    title: "Measurement",
    blurb: "The foundation. If you cannot measure it, you cannot reproduce it. If you cannot reproduce it, you cannot cost it.",
    items: [
      { name: "Digital scale, 0.1g precision, 3kg capacity", brand_ref: "American Weigh LB-3000", price: 35, priority: "Essential", note: "Non-negotiable. Single most under-bought piece of bar equipment in America." },
      { name: "Digital scale, 0.01g precision, 200g capacity", brand_ref: "Various jewelry scales", price: 18, priority: "Essential", note: "For acids, ascorbic, fine measurement of stabilizers." },
      { name: "Refractometer, 0–32 Brix, ATC", brand_ref: "Generic ATC unit", price: 30, priority: "High", note: "Measures sugar concentration in syrups. The day you start using one is the day your syrups stop drifting." },
      { name: "pH meter, calibrated, 0.01 precision", brand_ref: "Apera PH60", price: 90, priority: "High", note: "Critical for super juice, cordials, anything where shelf life is engineered." },
      { name: "OXO 1-cup angled measuring cup", brand_ref: "OXO Good Grips", price: 9, priority: "Useful", note: "For volume measurement when speed matters more than accuracy." }
    ]
  },
  juicing: {
    title: "Juicing & extraction",
    blurb: "The right tool depends on the fruit. Citrus is one job; roots and tropicals are another. Pick for the volume you'll actually run, not the fantasy volume.",
    items: [
      { name: "Mexican elbow press (hand)", brand_ref: "OXO Steel Citrus Squeezer or Tablecraft 84", price: 25, priority: "Essential", note: "For volumes up to ~1 gal/day. Cut citrus across the equator, press cut-side DOWN." },
      { name: "Lever press, commercial", brand_ref: "Hamilton Beach 932 or Zumex Versatile", price: 220, priority: "High", note: "For 1–5 gal/day. The Hamilton 932 is the workhorse; Zumex is the upgrade." },
      { name: "Champion masticating juicer", brand_ref: "Champion Classic 4000", price: 320, priority: "High", note: "For ginger, hard vegetables, and high-yield extraction. Lower oxidation than centrifugal." },
      { name: "Breville centrifugal juicer", brand_ref: "Breville Juice Fountain Cold", price: 200, priority: "Useful", note: "Pineapple foam is a feature here. Less ideal for ginger or leafy material." },
      { name: "Fine-mesh chinois, 6-inch", brand_ref: "Winco CCB-7R", price: 25, priority: "Essential", note: "Double-strain everything. Replaces every fine strainer in your bar." }
    ]
  },
  storage: {
    title: "Storage & sanitation",
    blurb: "Prep is only as good as how it's labeled, dated, and chilled. Skip this category and the rest of the kit is decorative.",
    items: [
      { name: "Deli quarts (32 oz, BPA-free PP)", brand_ref: "Restaurantware or Cambro RFSCW", price: 0.5, priority: "Essential", note: "Per container. Buy a case. Replace lids quarterly." },
      { name: "Cambro 6-qt food storage box, clear", brand_ref: "Cambro 6SFSCW", price: 12, priority: "High", note: "For larger-batch syrups and super juice." },
      { name: "Label printer (thermal)", brand_ref: "Brother QL-820NWB", price: 180, priority: "High", note: "Date/time stamps belong on every container. Handwritten labels fail at scale." },
      { name: "Quat-sani test strips", brand_ref: "LaMotte 4250", price: 12, priority: "Essential", note: "200 ppm sani solution between batches. Verify the strength." },
      { name: "Funnel set, stainless, 3-piece", brand_ref: "OXO Good Grips", price: 18, priority: "Useful", note: "For decanting into squeeze bottles." }
    ]
  },
  optional: {
    title: "Optional & advanced",
    blurb: "Earn these. Buy them when your program has outgrown what's above, not before. Most bars buy this category first and the essentials last; reverse that.",
    items: [
      { name: "Rotary evaporator (rotovap)", brand_ref: "Across International R-2 or Buchi R-100", price: 4500, priority: "Advanced", note: "For clarified distillates, hydrosols, and aromatic separations. Powerful and frequently misused." },
      { name: "Sous-vide circulator", brand_ref: "Anova Pro 3.0", price: 200, priority: "Useful", note: "For pasteurization of pineapple juice, low-temp infusions, fat-washes." },
      { name: "ISI whipped cream charger", brand_ref: "ISI Gourmet Whip 1.0L", price: 110, priority: "Useful", note: "For nitrogen-cavitation infusions (45 seconds in, 30 minutes out) and instant foamers." },
      { name: "Vacuum chamber sealer", brand_ref: "Avid Armor USVX or VacMaster VP215", price: 350, priority: "Useful", note: "For compression of fruit, vacuum infusions, oxygen-free storage." },
      { name: "Centrifuge", brand_ref: "Spinzall by Modernist Pantry", price: 800, priority: "Advanced", note: "For clarified juices without the agar/gelatin filtration step. Niche but transformative when needed." }
    ]
  }
};

/* ---------- STORIES (placeholder scaffold) ---------- */
const STORIES = [
  {
    slug: "pressing-against-the-grain",
    title: "Pressing Against the Grain",
    dek: "On why every bar in 2008 was using bottled juice and why every serious one in 2026 is not.",
    date: "Forthcoming",
    section: "Origin",
    excerpt: "There is a particular kind of denial that grips a bar program when it tells itself the lime juice is fine. It is not fine. It was never fine. This is the story of how I stopped pretending..."
  },
  {
    slug: "the-spec-sheet",
    title: "The Spec Sheet",
    dek: "How Prepshift's costing model worked, and why most bar programs are running blind.",
    date: "Forthcoming",
    section: "Method",
    excerpt: "When I first sat down with a head bartender to walk through pour-cost on a single drink at his menu price, he discovered that one of his bestsellers was actively losing him money. He had no idea..."
  },
  {
    slug: "on-the-route",
    title: "On the Route",
    dek: "What it actually looks like to deliver bar prep at scale to twenty restaurants in one morning.",
    date: "Forthcoming",
    section: "Operations",
    excerpt: "By 6 AM the truck was loaded. By 11 it was empty. In between, two dozen bartenders received exactly what they needed for the next four days of service, costed, dated, and ready..."
  }
];
