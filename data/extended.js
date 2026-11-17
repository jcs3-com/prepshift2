/* PREPSHIFT EXTENDED DATA
 * Super juice, batched cocktail templates, equipment.
 * Batch and carbonation methodology references public Morgenthaler and Arnold work,
 * with reference defaults.
 */

/* ---------- SUPER JUICE ----------
 * Prepshift's lime and lemon super juice, per 10 liter batch.
 * Quantities scale in a straight line with the batch size. The fresh juice
 * of the peeled fruit goes in as well; it is not listed here because it has
 * no fixed quantity. Technique credit: Nickle Morris.
 */
const SUPER_JUICE_SPEC = {
  lime: {
    name: "Lime Super Juice",
    fruit: "lime",
    batch_l: 10,
    fruit_count: 100,
    ingredients: [
      { name: "Water",         qty: 10,    unit: "L" },
      { name: "Lime peel",     qty: 300,   unit: "g" },
      { name: "Citric acid",   qty: 480,   unit: "g" },
      { name: "Malic acid",    qty: 240,   unit: "g" },
      { name: "Tartaric acid", qty: 3.33,  unit: "g" },
      { name: "Sugar",         qty: 600,   unit: "g" },
      { name: "Kosher salt",   qty: 11.11, unit: "g" }
    ]
  },
  lemon: {
    name: "Lemon Super Juice",
    fruit: "lemon",
    batch_l: 10,
    fruit_count: 50,
    ingredients: [
      { name: "Water",         qty: 10,   unit: "L" },
      { name: "Lemon peel",    qty: 600,  unit: "g" },
      { name: "Citric acid",   qty: 540,  unit: "g" },
      { name: "Malic acid",    qty: 60,   unit: "g" },
      { name: "Tartaric acid", qty: 3.33, unit: "g" },
      { name: "Sugar",         qty: 300,  unit: "g" },
      { name: "Kosher salt",   qty: 7.78, unit: "g" }
    ]
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
