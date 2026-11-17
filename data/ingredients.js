/* PREPSHIFT INGREDIENT & RECIPE DATA
 * Reference defaults drawn from common industry figures. Costs vary by
 * market and season: edit them to match your own invoices.
 */

const RAW_INGREDIENTS = {
  // unit cost per indicated unit; yield_pct = useable juice/product per raw weight
  lime_whole:       { name: "Limes (Persian, whole)",      unit: "lb",    cost: 1.80, yield_pct: 0.32, notes: "Yield assumes warm, hand-rolled, hand-juiced." },
  lemon_whole:      { name: "Lemons (Eureka, whole)",      unit: "lb",    cost: 1.65, yield_pct: 0.38, notes: "Eurekas outyield Meyer by ~20%." },
  pineapple_whole:  { name: "Pineapple (whole, ripe)",     unit: "ea",    cost: 4.50, yield_pct: 0.48, notes: "Yield is juice from peeled, cored fruit." },
  ginger_root:      { name: "Ginger root (fresh)",         unit: "lb",    cost: 3.20, yield_pct: 0.45, notes: "Yield via Champion masticating juicer." },
  white_sugar:      { name: "Sugar (white, granulated)",   unit: "lb",    cost: 0.78, yield_pct: 1.00 },
  demerara_sugar:   { name: "Sugar (demerara)",            unit: "lb",    cost: 1.40, yield_pct: 1.00 },
  filtered_water:   { name: "Filtered water",              unit: "L",     cost: 0.05, yield_pct: 1.00 },
  citric_acid:      { name: "Citric acid (food grade)",    unit: "oz",    cost: 0.45, yield_pct: 1.00 },
  malic_acid:       { name: "Malic acid (food grade)",     unit: "oz",    cost: 0.60, yield_pct: 1.00 },
  honey_clover:     { name: "Honey (clover, raw)",         unit: "lb",    cost: 5.20, yield_pct: 1.00, notes: "Wildflower or orange blossom works; avoid heavy buckwheat unless specified." },
};

/* Density references (g per fl oz) — used for cost-per-oz where we have weight cost */
const DENSITY = {
  juice:        29.6,   // ~1.00 g/mL, 29.57 mL/fl oz
  simple_1to1:  35.5,   // ~1.20 g/mL
  simple_2to1:  39.5,   // ~1.33 g/mL
  super_juice:  30.5,
};

/* Core recipe definitions
 * Each recipe yields a finished product. Ingredients listed by weight (g)
 * or volume (mL) of FINISHED input. Cost calc handles raw→finished conversion.
 */
const RECIPES = {
  fresh_lime: {
    id: "fresh_lime",
    name: "Fresh Lime Juice",
    italic: "Citrus aurantifolia, simply pressed.",
    kicker: "Bar Prep · Citrus · No. 01",
    standfirst: "The non-negotiable workhorse of the modern bar. Hand-juiced, double-strained, used within 24 hours of pressing for peak brightness before the slow oxidative slide into bitterness.",
    yield_ml: 1000,
    prep_min: 30,
    shelf_hr: 24,
    shelf_note: "Refrigerated, sealed. Frozen in 4oz portions: 30 days.",
    inputs: [
      { ingredient: "lime_whole", qty_raw_lb: 6.5, note: "≈ 20 limes" }
    ],
    method: [
      { title: "Temper", body: "Bring limes to room temperature. Cold citrus yields up to 18% less juice. Roll each fruit firmly under your palm against the cutting board for 8–10 seconds." },
      { title: "Cut", body: "Halve across the equator, not pole-to-pole. This exposes more juice vesicles to the press." },
      { title: "Press", body: "Mexican elbow / hand press, cut-side DOWN. The inverted technique extracts more juice and less oil. Press once, firmly, then half-rotate the rind and press again." },
      { title: "Strain", body: "Pass through a fine chinois into a sanitized deli quart. Discard solids. Label with date and time of pressing — not just date." },
      { title: "Chill", body: "Down to 38°F within 30 minutes. Use FIFO, and taste at every shift change. If it reads flabby or papery, it is dead. Compost it." }
    ],
    notes: "Lime juice's flavor curve is the steepest of any common bar citrus. It peaks 2–4 hours after pressing, plateaus through hour 12, then degrades visibly by hour 24. Service-grade bars batch twice daily.",
    pairs_with: ["Daiquiri", "Margarita", "Gimlet", "Mojito", "Caipirinha"]
  },

  fresh_lemon: {
    id: "fresh_lemon",
    name: "Fresh Lemon Juice",
    italic: "Citrus limon, the longer-lived sibling.",
    kicker: "Bar Prep · Citrus · No. 02",
    standfirst: "Yields more per pound than lime, holds its character roughly twice as long, and forgives a slightly less aggressive prep cadence. Still: same day is best, period.",
    yield_ml: 1000,
    prep_min: 30,
    shelf_hr: 48,
    shelf_note: "Refrigerated. Lemons hold roughly 2× lime longevity due to higher buffered acid balance.",
    inputs: [
      { ingredient: "lemon_whole", qty_raw_lb: 5.5, note: "≈ 14 lemons" }
    ],
    method: [
      { title: "Temper", body: "Same rule: room temperature, hand-rolled. If you take nothing else from this page, take this." },
      { title: "Cut", body: "Halve across the equator. For larger Eurekas, quarter pole-to-pole only if your press is too small to accept halves." },
      { title: "Press", body: "Hand press or, for volume above 2 gallons, a bar-grade lever press (Zumex or similar). Avoid centrifugal juicers — they aerate and accelerate oxidation." },
      { title: "Strain", body: "Fine chinois. Discard solids. Some bars retain a tablespoon of pulp per liter for body — call that a stylistic decision, not a best practice." },
      { title: "Chill & label", body: "38°F, sealed, time-stamped. Two-day window is the operating ceiling, not the goal." }
    ],
    notes: "Lemon juice supports more drinks per ounce than any other citrus on the modern menu. Whiskey sours, collinses, French 75s, Bee's Knees — your back bar quietly depends on this being right.",
    pairs_with: ["Whiskey Sour", "Tom Collins", "French 75", "Bee's Knees", "Sidecar"]
  },

  fresh_pineapple: {
    id: "fresh_pineapple",
    name: "Fresh Pineapple Juice",
    italic: "Ananas comosus, cold-pressed.",
    kicker: "Bar Prep · Tropical · No. 03",
    standfirst: "Canned pineapple is a different beverage. Fresh pineapple juice is mousse-textured, faintly grassy, foaming when shaken — the secret weapon of the Painkiller and the Jungle Bird.",
    yield_ml: 1000,
    prep_min: 25,
    shelf_hr: 72,
    shelf_note: "Refrigerated. Bromelain activity will degrade dairy and gelatin contact; segregate accordingly.",
    inputs: [
      { ingredient: "pineapple_whole", qty_raw_lb: 4.5, note: "≈ 1 large pineapple, ~3.5 lb after coring" }
    ],
    method: [
      { title: "Select", body: "Bottom-up gold color, sweet base aroma, leaves that resist a gentle tug. Avoid soft spots or fermented notes." },
      { title: "Trim & core", body: "Top, bottom, peel, eyes, core. Reserve cores for syrup or shrub bases — never discard." },
      { title: "Juice", body: "Centrifugal juicer is acceptable here; the bromelain mousse is a feature. Champion masticating extracts ~12% more juice at the cost of less foam." },
      { title: "Settle", body: "Refrigerate 30 minutes covered. The foam will separate. Skim and reserve foam for Painkiller floats; clarify body for stirred applications." },
      { title: "Label", body: "Time-stamp. 72-hour window. Pasteurization (sous-vide 60°C / 140°F for 10 minutes) extends to 7 days but kills the foam — pick one." }
    ],
    notes: "Bromelain — pineapple's signature protease — is what tenderizes meat and what makes the juice unsafe for raw-egg drinks. Heat-treat to denature if combining with egg white.",
    pairs_with: ["Painkiller", "Jungle Bird", "Piña Colada", "Algonquin", "Mai Tai"]
  },

  fresh_ginger: {
    id: "fresh_ginger",
    name: "Fresh Ginger Juice",
    italic: "Zingiber officinale, raw expressed.",
    kicker: "Bar Prep · Root · No. 04",
    standfirst: "Pungent, peppery, with a slow heat that builds. The backbone of every honest Moscow Mule and Dark and Stormy that doesn't depend on industrial ginger beer.",
    yield_ml: 1000,
    prep_min: 40,
    shelf_hr: 96,
    shelf_note: "Refrigerated, sealed. Will stratify; shake before use.",
    inputs: [
      { ingredient: "ginger_root", qty_raw_lb: 2.5, note: "Young ginger yields more and burns less; mature ginger packs more heat." }
    ],
    method: [
      { title: "Wash", body: "Scrub under cold water. Do NOT peel — most of the aromatic oils sit in the skin." },
      { title: "Rough chop", body: "1-inch chunks. Smaller is fine; you're feeding a masticating juicer." },
      { title: "Juice", body: "Champion or Omega masticating juicer at low speed. Centrifugal juicers will work but waste 20%+ of yield." },
      { title: "Decant", body: "The juice will separate into a clear amber liquid and a starch sediment. Decant the clear juice off the starch into a sanitized vessel." },
      { title: "Optional: stabilize", body: "Add 1g ascorbic acid per liter to extend shelf to 7 days without color shift. Note this on the label — it changes the pH." }
    ],
    notes: "Ginger juice is potent. Most cocktail applications call for 0.25–0.5 oz, not 0.75 oz like other juices. Build by taste before you build by ratio.",
    pairs_with: ["Penicillin", "Moscow Mule", "Dark and Stormy", "Gold Rush variants", "Ginger Margarita"]
  },

  simple_syrup: {
    id: "simple_syrup",
    name: "Simple Syrup",
    italic: "Saccharum officinarum, dissolved.",
    kicker: "Bar Prep · Sweeteners · No. 05",
    standfirst: "The most-used and least-respected ingredient behind the stick. Get the ratio right, get the process clean, and a hundred drinks improve by Monday.",
    yield_ml: 1000,
    prep_min: 15,
    shelf_hr: 720, // 30 days
    shelf_note: "Refrigerated, sealed. Rich (2:1) holds longer than standard (1:1). Add 1oz neutral vodka per liter to push to 60 days.",
    inputs: [
      { ingredient: "white_sugar",     qty_raw_lb: 1.10, note: "1:1 by weight; substitute demerara for richer profile" },
      { ingredient: "filtered_water",  qty_raw_lb: 1.10, note: "By weight; ≈ 500 mL" }
    ],
    method: [
      { title: "Combine cold", body: "Equal parts sugar and water BY WEIGHT, not volume. Volume measurement introduces a 10–15% error band that compounds across every cocktail you make." },
      { title: "Dissolve", body: "Whisk vigorously at room temperature for 90 seconds. Sugar dissolves fully in water at any temperature given enough agitation. Boiling is unnecessary and accelerates browning." },
      { title: "Strain (if needed)", body: "Pass through fine mesh if any undissolved crystals remain. They won't, if you measured correctly." },
      { title: "Bottle", body: "Sanitized squeeze bottles or speed pourers. Label with batch date." },
      { title: "Refrigerate", body: "30-day shelf at 38°F. If it smells off or shows haze, dump it. Sugar mold is rare but possible." }
    ],
    notes: "The 1:1 vs 2:1 debate is settled: use 1:1 unless you're working a high-volume station that needs concentration. Rich syrup throws off acid/sweet ratios established in classic recipes.",
    pairs_with: ["Daiquiri", "Whiskey Sour", "Mojito", "Tom Collins", "Caipirinha"]
  },

  demerara_syrup: {
    id: "demerara_syrup",
    name: "Demerara Syrup",
    italic: "Saccharum, with the molasses still attached.",
    kicker: "Bar Prep · Sweeteners · No. 06",
    standfirst: "A 2:1 demerara syrup is the most consequential upgrade you can make to your Old Fashioned program. Molasses-rich, full-bodied, and structured enough to stand against bonded whiskey without disappearing into it.",
    yield_ml: 1000,
    prep_min: 20,
    shelf_hr: 1440, // 60 days (2:1 holds longer)
    shelf_note: "Refrigerated, sealed. The higher sugar ratio in 2:1 is a natural preservative — expect ~60 days reliable.",
    inputs: [
      { ingredient: "demerara_sugar",   qty_raw_lb: 1.65, note: "2:1 by weight — double the sugar of a standard simple" },
      { ingredient: "filtered_water",   qty_raw_lb: 0.825, note: "Half the weight of sugar; ≈ 375 mL" }
    ],
    method: [
      { title: "Combine warm", body: "Demerara, unlike white sugar, benefits from gentle heat. Combine in a saucepan and warm to roughly 150°F (65°C). Do not boil — boiling drives off the molasses character you bought the demerara for." },
      { title: "Stir until dissolved", body: "2:1 sugar:water requires more agitation to dissolve than 1:1. Stir for 3–5 minutes at temperature until completely clear." },
      { title: "Cool and strain", body: "Cool to room temperature. Pass through fine mesh to catch any solids. The finished syrup should be the color of weak coffee." },
      { title: "Bottle and label", body: "Sanitized vessel with date stamp. The viscosity is roughly 1.3 g/mL — noticeably thicker than simple. Adjust your pourer accordingly." },
      { title: "Refrigerate", body: "38°F. Shelf life is comfortably 60 days, but flavor peaks at days 3–30." }
    ],
    notes: "Demerara is not interchangeable with brown sugar or muscovado in this application. Demerara is dry, large-crystal, and lightly molasses-coated; brown sugar is wet, fine, and heavily molasses-coated. Substituting brown sugar produces a flabby, oversweet result that ruins the spec.",
    pairs_with: ["Old Fashioned", "Jungle Bird", "Mai Tai", "Hot Toddy", "Daiquiri (rich)"]
  },

  honey_ginger_syrup: {
    id: "honey_ginger_syrup",
    name: "Honey-Ginger Syrup",
    italic: "Sam Ross's gift to the modern bar.",
    kicker: "Bar Prep · Compound Syrups · No. 07",
    standfirst: "The honey-ginger syrup is what makes a Penicillin a Penicillin. Sam Ross built the drink around it at Milk & Honey in 2005, and twenty years later it remains the single best argument for keeping a compound syrup on your speed rail.",
    yield_ml: 1000,
    prep_min: 35,
    shelf_hr: 504, // 21 days
    shelf_note: "Refrigerated, sealed. Shake before each use — the ginger juice settles.",
    inputs: [
      { ingredient: "honey_clover",     qty_raw_lb: 1.80, note: "3 parts honey by weight" },
      { ingredient: "filtered_water",   qty_raw_lb: 0.60, note: "1 part water by weight" },
      { ingredient: "ginger_root",      qty_raw_lb: 0.50, note: "Juiced — yields ~110g ginger juice" }
    ],
    method: [
      { title: "Make the honey syrup base", body: "Combine honey and water in a saucepan at 3:1 by weight. Warm gently — no higher than 140°F (60°C) — until thinned and uniform. Higher heat destroys delicate honey aromatics; this is non-negotiable for raw honey." },
      { title: "Press fresh ginger juice", body: "Juice the ginger separately (see the Fresh Ginger Juice recipe). Decant off the starch sediment." },
      { title: "Combine and cool", body: "Stir the ginger juice into the cooled honey base. The proportion is roughly 4:1 honey-base to ginger juice by volume, but adjust to taste — younger ginger needs more; mature ginger needs less." },
      { title: "Bottle and stabilize", body: "Pass through fine mesh to remove any ginger fiber. Bottle in a sanitized vessel." },
      { title: "Refrigerate and shake", body: "21-day shelf at 38°F. Shake before each use — separation is normal and reversible." }
    ],
    notes: "The honey-ginger ratio is the single most debated spec in the modern cocktail canon. Ross's original at Milk & Honey was closer to 1:1 honey-base to ginger; Death & Co documented 3:1; many bars now run 4:1. The 'right' answer depends on your ginger's heat level. Taste, adjust, document, and lock the spec for your program.",
    pairs_with: ["Penicillin", "Gold Rush variants", "Bee's Knees variants", "Ginger Sour", "Hot Toddy"]
  }
};
