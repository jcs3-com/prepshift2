#!/usr/bin/env python3
"""Builds the Prepshift site into the repo root.

    python3 _src/build.py

Everything in the repo root except css/, js/, data/, CNAME and this _src/
folder is generated: edit here, rebuild, commit. GitHub Pages skips folders
that start with an underscore, so _src/ is never published.

The header, footer and contact address live in this one file. Manual pages
(recipes, calculators, reference) keep their body content in _src/manual/.
"""
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "_src"

SITE = "https://prepshift.com"
EMAIL = "james@prepshift.com"   # every intake form and mailto link uses this
PLACE = "Washington, DC"
YEAR = 2026

NAV = [
    ("Juice", "/juice/"),
    ("Kitchen", "/kitchen/"),
    ("Waste", "/waste/"),
    ("Manual", "/manual/"),
    ("Contact", "/contact/"),
]

RECIPES = [
    ("fresh_lime", "recipe-lime", "Fresh Lime Juice"),
    ("fresh_lemon", "recipe-lemon", "Fresh Lemon Juice"),
    ("fresh_pineapple", "recipe-pineapple", "Fresh Pineapple Juice"),
    ("fresh_ginger", "recipe-ginger", "Fresh Ginger Juice"),
    ("simple_syrup", "recipe-simple", "Simple Syrup"),
    ("demerara_syrup", "recipe-demerara", "Demerara Syrup"),
    ("honey_ginger_syrup", "recipe-honey-ginger", "Honey-Ginger Syrup"),
]

CALCULATORS = [
    ("calculators", "Cost and yield, core recipes"),
    ("super-juice", "Super juice build sheet"),
    ("batch-scaler", "Batched cocktail scaler"),
    ("acid-sub", "Acid substitution"),
    ("menu-costing", "Menu costing"),
    ("draft", "Carbonation and draft"),
]

MARK = (
    '<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5">'
    '<circle cx="24" cy="24" r="22"/><circle cx="24" cy="24" r="17.5"/>'
    '<path d="M24 6.5v35M6.5 24h35M11.6 11.6l24.8 24.8M36.4 11.6 11.6 36.4"/></svg>'
)

FONTS = (
    "https://fonts.googleapis.com/css2?"
    "family=IBM+Plex+Mono:wght@400;500&"
    "family=IBM+Plex+Sans+Condensed:wght@400;500;600&"
    "family=Spectral:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap"
)


def esc(text):
    return html.escape(text, quote=True)


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


# ---------------------------------------------------------------- chrome

def header(current):
    def item(label, href):
        here = ' aria-current="page"' if href == current else ""
        return f'<li><a href="{href}"{here}>{label}</a></li>'
    items = "".join(item(label, href) for label, href in NAV)
    return f"""<a class="skip" href="#main">Skip to content</a>
<div class="wrap">
  <header class="site-header">
    <a class="wordmark" href="/">Prepshift</a>
    <nav class="site-nav" aria-label="Main">
      <ul>
        {items}
        <li><button type="button" class="search-btn" data-search-open>Search</button></li>
      </ul>
    </nav>
  </header>
"""


def footer():
    left = "".join(f'<li><a href="{href}">{label}</a></li>' for label, href in NAV if label != "Manual")
    return f"""
  <footer class="site-footer">
    <div class="footer-lists">
      <div>
        <h2>Prepshift</h2>
        <ul>
          {left}
          <li><a href="mailto:{EMAIL}">{EMAIL}</a></li>
        </ul>
      </div>
      <div>
        <h2>Manual</h2>
        <ul>
          <li><a href="/manual/#recipes">Recipes</a></li>
          <li><a href="/manual/#calculators">Calculators</a></li>
          <li><a href="/pages/equipment.html">Equipment</a></li>
          <li><a href="/pages/glossary.html">Glossary</a></li>
          <li><a href="/data/">Data</a></li>
        </ul>
      </div>
    </div>
    <p class="sign-off">{MARK}<span>&copy; {YEAR} Prepshift. {PLACE}. <a href="/pages/legal.html">Legal</a></span></p>
  </footer>
</div>
"""


def page(path, title, description, body, *, current=None, main_class="", scripts="", body_attrs="", head_extra=""):
    """Write one page. `path` is relative to the repo root."""
    url = SITE + "/" + (path[: -len("index.html")] if path.endswith("index.html") else path)
    main_attr = f' class="{main_class}"' if main_class else ""
    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title id="page-title">{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <link rel="canonical" href="{url}">
  <meta property="og:site_name" content="Prepshift">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:url" content="{url}">
  <meta property="og:type" content="website">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="{FONTS}">
  <link rel="stylesheet" href="/css/site.css">{head_extra}
</head>
<body{body_attrs}>
{header(current)}
  <main id="main"{main_attr}>
{body}
  </main>
{footer()}
  <script src="/data/ingredients.js"></script>
  <script src="/data/extended.js"></script>
{scripts}
  <script src="/js/search.js"></script>
</body>
</html>
"""
    out = ROOT / path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc, encoding="utf-8")
    return url


# ---------------------------------------------------------------- intake forms

def intake(topic, fields, form_id="ask"):
    """An email-composing form. See js/intake.js. Nothing is stored."""
    rows = []
    for f in fields:
        fid = f"{form_id}-{slug(f['name'])}"
        kind = f.get("type", "text")
        opt = "" if f.get("required") or kind == "select" else ' <span class="optional">(optional)</span>'
        req = " required" if f.get("required") else ""
        auto = f' autocomplete="{f["autocomplete"]}"' if f.get("autocomplete") else ""
        ph = f' placeholder="{esc(f["placeholder"])}"' if f.get("placeholder") else ""
        label = f'<label for="{fid}">{esc(f["label"])}{opt}</label>'
        if kind == "select":
            options = "".join(f"<option>{esc(o)}</option>" for o in f["options"])
            control = f'<select id="{fid}" name="{esc(f["name"])}"{req}>{options}</select>'
        elif kind == "textarea":
            control = f'<textarea id="{fid}" name="{esc(f["name"])}" rows="4"{req}{ph}></textarea>'
        else:
            control = f'<input id="{fid}" name="{esc(f["name"])}" type="{kind}"{req}{auto}{ph}>'
        rows.append(f'        <div class="field">{label}{control}</div>')
    return f"""      <form class="intake" id="{form_id}" data-intake data-topic="{esc(topic)}" data-to="{EMAIL}">
{chr(10).join(rows)}
        <div><button type="submit" class="btn btn-solid">Open in my email app</button></div>
        <p class="form-note">This writes an email in your own mail app, addressed to {EMAIL}. Nothing is sent or stored by this site.</p>
        <div class="intake-fallback" data-intake-fallback aria-live="polite" hidden>
          <p>Your email app should be opening with this message. If it doesn't, copy it and send it to <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
          <pre></pre>
          <button type="button" class="btn" data-intake-copy>Copy message</button>
        </div>
      </form>"""


WHO = [
    {"name": "Name", "label": "Your name", "required": True, "autocomplete": "name"},
    {"name": "Business", "label": "Business", "required": True, "autocomplete": "organization"},
    {"name": "Location", "label": "City and state", "autocomplete": "address-level2"},
    {"name": "Phone", "label": "Phone", "type": "tel", "autocomplete": "tel"},
]
NOTES = {"name": "Notes", "label": "Anything else we should know", "type": "textarea"}


def row(label, inner, anchor=None, full=False):
    ident = f' id="{anchor}"' if anchor else ""
    cls = "row-body full" if full else "row-body"
    return f"""    <section class="row"{ident}>
      <h2>{label}</h2>
      <div class="{cls}">
{inner}
      </div>
    </section>"""


# ---------------------------------------------------------------- pages

def rows(*items):
    return '    <div class="rows">\n' + "\n".join(items) + "\n    </div>"


SLICE = """<svg class="slice" viewBox="0 0 200 200" aria-hidden="true">
    <circle cx="100" cy="100" r="98" fill="#dfeb5e"/>
    <circle cx="100" cy="100" r="84" fill="none" stroke="#fff" stroke-width="3"/>
    <path stroke="#fff" stroke-width="3" stroke-linecap="round" d="M100 100 100 20M100 100 156.6 43.4M100 100 180 100M100 100 156.6 156.6M100 100 100 180M100 100 43.4 156.6M100 100 20 100M100 100 43.4 43.4"/>
    <circle cx="100" cy="100" r="7" fill="#fff"/>
  </svg>"""


def build_home():
    statement = (
        '    <h1 class="statement indent">Prepshift is a bar-prep company. Our <a href="/juice/">superjuice</a> '
        "is made for bars and restaurants, produced with a facility partner and built for regional distribution. "
        'We develop small-batch products and <a href="/kitchen/">training</a> with a restaurant partner, keep a '
        'working <a href="/manual/">manual</a> of recipes and calculators, and help kitchens '
        '<a href="/waste/">waste less</a>.</h1>'
    )
    body = "  " + SLICE + "\n" + statement + "\n\n" + rows(
        row("Juice", """        <p>Citrus superjuice for bar programs. It uses the peel as well as the juice, so a case of fruit goes further and holds longer than fresh-squeezed.</p>
        <p class="actions"><a class="btn" href="/juice/#ask">Ask about Prepshift Juice</a> <a href="/pages/super-juice.html">How superjuice works</a></p>"""),
        row("Kitchen", """        <p>Small-batch products and hands-on training sessions, developed with our restaurant partner.</p>
        <p class="actions"><a class="btn" href="/kitchen/#ask">Ask about products or training</a></p>"""),
        row("Waste", """        <p>Process consulting for bars and kitchens that want to throw less away. We look at purchasing, prep, yield and holding, then change what isn&rsquo;t working.</p>
        <p class="actions"><a class="btn" href="/waste/#ask">Ask about a consult</a></p>"""),
        row("Manual", """        <p>Recipes, calculators and reference tables. Free to use.</p>
        <p class="actions"><a class="mark" href="/manual/#recipes">Recipes</a> <a class="mark" href="/manual/#calculators">Calculators</a> <a class="mark" href="/data/">Data</a></p>"""),
    )
    ld = ('\n  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization",'
          '"name":"Prepshift","url":"' + SITE + '/","email":"' + EMAIL + '"}</script>')
    return page(
        "index.html",
        "Prepshift | Superjuice and bar prep",
        "Prepshift is a bar-prep company: citrus superjuice for bars and restaurants, small-batch products and training, food waste consulting, and a free manual of recipes and calculators.",
        body, head_extra=ld, body_attrs=' class="home"')


INTAKE_JS = '  <script src="/js/intake.js"></script>'


def build_juice():
    form = intake("Prepshift Juice", WHO + [
        {"name": "Asking about", "label": "I'm asking about", "type": "select",
         "options": ["Buying for a bar or restaurant", "Distributing Prepshift Juice", "Something else"]},
        {"name": "Weekly citrus juice", "label": "Citrus juice you use in a week", "placeholder": "For example: 20 quarts of lime"},
        NOTES,
    ])
    body = '    <h1 class="statement indent">Prepshift Juice is citrus superjuice for bars and restaurants.</h1>\n\n' + rows(
        row("What it is", """        <p>Superjuice uses the whole fruit. The peel&rsquo;s oils are extracted and blended with the juice, so each case of citrus goes further and the result holds longer than fresh-squeezed.</p>
        <p>It pours one-for-one in place of fresh juice.</p>
        <p><a href="/pages/super-juice.html">The method and the maths are in the manual.</a></p>"""),
        row("How it&rsquo;s made", "        <p>In batches, with our facility partner.</p>"),
        row("Who it&rsquo;s for", "        <p>Bars, restaurants, hotels and venues. Distribution is regional.</p>"),
        row("Formats and pricing", "        <p>On request. Tell us about your program below.</p>"),
        row("Ask us", form),
    )
    return page(
        "juice/index.html",
        "Prepshift Juice | Citrus superjuice for bars and restaurants",
        "Prepshift Juice is citrus superjuice for bars, restaurants, hotels and venues. Ask about wholesale and regional distribution.",
        body, current="/juice/", scripts=INTAKE_JS)


def build_kitchen():
    form = intake("Prepshift Kitchen", [WHO[0], WHO[1], WHO[3],
        {"name": "Asking about", "label": "I'm asking about", "type": "select",
         "options": ["Products", "A training session", "Both"]},
        {"name": "Team size", "label": "Team size"},
        NOTES,
    ])
    body = '    <h1 class="statement indent">Small-batch products and training, with our restaurant partner.</h1>\n\n' + rows(
        row("Products", "        <p>Limited runs of prepared ingredients for bar and kitchen programs. Ask what&rsquo;s available.</p>"),
        row("Training", "        <p>Hands-on sessions for bar and kitchen teams. Ask about dates and formats.</p>"),
        row("Ask us", form),
    )
    return page(
        "kitchen/index.html",
        "Kitchen | Small-batch products and training | Prepshift",
        "Small-batch products and hands-on training sessions from Prepshift and its restaurant partner.",
        body, current="/kitchen/", scripts=INTAKE_JS)


def build_waste():
    form = intake("Food waste consulting", [WHO[0], WHO[1], WHO[3],
        {"name": "Operation", "label": "Type of operation", "type": "select",
         "options": ["Bar", "Restaurant", "Hotel", "Commissary or production kitchen", "Other"]},
        {"name": "Locations", "label": "Number of locations"},
        {"name": "Most wasted", "label": "What gets thrown away most", "type": "textarea"},
        NOTES,
    ])
    body = '    <h1 class="statement indent">Prepshift helps bars and kitchens waste less food.</h1>\n\n' + rows(
        row("What we do", "        <p>Process consulting. We look at how product is bought, prepped, held and used, find where it&rsquo;s being lost, and change the process.</p>"),
        row("Who it&rsquo;s for", "        <p>Bars, restaurants, hotels and commissary kitchens.</p>"),
        row("How it starts", "        <p>With a short conversation about your operation. Tell us a little below.</p>"),
        row("Ask us", form),
    )
    return page(
        "waste/index.html",
        "Food waste reduction consulting | Prepshift",
        "Prepshift consults on food waste reduction for bars, restaurants, hotels and commissary kitchens.",
        body, current="/waste/", scripts=INTAKE_JS)


def build_data():
    form = intake("Data access", [WHO[0],
        {"name": "Business", "label": "Organization", "required": True, "autocomplete": "organization"},
        {"name": "Use", "label": "What you'd use it for", "type": "textarea", "required": True},
    ])
    body = """    <h1 class="statement indent">Reference tables for bar prep: yields, costs and shelf life.</h1>
    <p class="lede indent">These are reference values. Costs are defaults, so set your own in the <a href="/pages/calculators.html">calculators</a>.</p>

    <div class="table-tools">
      <div class="field">
        <label for="data-filter">Filter the tables</label>
        <input id="data-filter" type="search" placeholder="lime, syrup, acid" autocomplete="off">
      </div>
      <p class="form-note" id="data-status" role="status"></p>
    </div>
    <div id="data-tables"></div>

""" + rows(
        row("Production data", "        <p>Prepshift&rsquo;s production dataset is shared on request. Tell us who you are and what you&rsquo;d use it for.</p>"),
        row("Request it", form),
    )
    return page(
        "data/index.html",
        "Data | Bar prep reference tables | Prepshift",
        "Reference tables for bar prep: ingredient yields and costs, preparation hold times and super juice build ratios. Filter them or download CSV.",
        body, main_class="wide",
        scripts='  <script src="/js/calc.js"></script>\n  <script src="/js/data-tables.js"></script>\n' + INTAKE_JS)


def link_list(pairs):
    items = "\n".join(f'          <li><a href="{href}">{label}</a></li>' for label, href in pairs)
    return f'        <ul class="plain-list cols">\n{items}\n        </ul>'


def build_manual():
    body = """    <h1 class="statement indent">A working manual for bar prep: recipes, calculators and reference. Free to use.</h1>
    <p class="actions indent manual-search"><button type="button" class="btn" data-search-open>Search the manual</button></p>

""" + rows(
        row("Recipes", link_list([(n, f"/pages/{f}.html") for _, f, n in RECIPES]), anchor="recipes"),
        row("Calculators", link_list([(n, f"/pages/{f}.html") for f, n in CALCULATORS]), anchor="calculators"),
        row("Reference", link_list([("Equipment", "/pages/equipment.html"), ("Glossary", "/pages/glossary.html"), ("Data tables", "/data/")]), anchor="reference"),
    )
    return page(
        "manual/index.html",
        "Manual | Bar prep recipes and calculators | Prepshift",
        "A free working manual for bar prep: juice and syrup recipes, cost and yield calculators, super juice, batching, menu costing, carbonation, equipment and a glossary.",
        body, current="/manual/")


def build_contact():
    form = intake("Prepshift", [
        {"name": "Topic", "label": "What it's about", "type": "select",
         "options": ["Prepshift Juice", "Kitchen: products and training", "Food waste consulting", "Data access", "Something else"]},
        WHO[0], WHO[1], WHO[3],
        {"name": "Message", "label": "Message", "type": "textarea", "required": True},
    ])
    body = '    <h1 class="statement indent">Write to Prepshift.</h1>\n\n' + rows(
        row("Email", f'        <p><a class="mark" href="mailto:{EMAIL}">{EMAIL}</a></p>'),
        row("Or start here", form),
    )
    return page(
        "contact/index.html",
        "Contact | Prepshift",
        "Write to Prepshift about superjuice, small-batch products and training, food waste consulting or data access.",
        body, current="/contact/", scripts=INTAKE_JS)


def build_legal():
    body = f"""    <header class="recipe-header">
      <h1>Legal</h1>
      <p class="standfirst">The plain-language version.</p>
    </header>

    <div class="section-head"><h2>Alcohol</h2></div>
    <p>The manual covers recipes, methods and tools for preparing alcoholic drinks. It is written for adults of legal drinking age working in licensed settings. Nothing here encourages drinking by anyone under the legal age where they live.</p>
    <p>If you or someone you know is struggling with alcohol, SAMHSA&rsquo;s National Helpline in the United States is 1-800-662-4357. It is free, confidential and open 24 hours.</p>

    <div class="section-head"><h2>Food safety</h2></div>
    <p>The techniques in the manual involve raw fruit, fresh juice, raw egg white in some preparations, food-grade acids and vessels under pressure. Reading this site does not replace food handler training, a working knowledge of HACCP, or your local health department&rsquo;s rules. If you operate commercially, your health department is the authority.</p>

    <div class="section-head"><h2>Calculators and reference values</h2></div>
    <p>The calculators and tables are provided as tools, without warranty. Costs, yields and hold times are reference values and vary by market, season and handling. Check them against your own invoices and your own product.</p>

    <div class="section-head"><h2>Credit and reuse</h2></div>
    <p>Where a recipe or method began with a named author, the credit appears on the relevant page: Nickle Morris and Kevin Kos for super juice, Jeffrey Morgenthaler for bottling and batching, Dave Arnold for dilution and acid adjustment, Sam Ross for honey-ginger syrup. If a credit is missing, that is an oversight. <a href="mailto:{EMAIL}">Tell us</a> and we&rsquo;ll fix it.</p>
    <p>The text, code and design of this site are &copy; {YEAR} Prepshift. You&rsquo;re welcome to use the manual in your own bar or kitchen. Republishing it or building a commercial product from it needs permission.</p>

    <div class="section-head"><h2>Advertising</h2></div>
    <p>There are no ads, affiliate links or paid placements on this site. Equipment and brand names appear only where they help explain a method.</p>

    <div class="section-head"><h2>Privacy</h2></div>
    <p>This site sets no cookies and runs no analytics. The contact forms write an email in your own mail app; what you type is not sent to or stored by this site.</p>
    <p>The site is hosted on GitHub Pages and loads its typefaces from Google Fonts. Both receive ordinary request data, such as your IP address, when a page loads.</p>"""
    return page(
        "pages/legal.html",
        "Legal | Prepshift",
        "Alcohol, food safety, credit, advertising and privacy notices for prepshift.com.",
        body, main_class="manual")


def partial(name):
    text = (SRC / "manual" / f"{name}.html").read_text(encoding="utf-8")
    wide = text.startswith("<!-- wide: yes -->")
    text = text.split("\n", 1)[1]
    main, scripts = text.split("<!-- scripts -->")
    scripts = "\n".join("  " + line if line.startswith("<script") else line for line in scripts.strip("\n").split("\n"))
    return wide, main.rstrip(), scripts


MANUAL_META = {
    "calculators": ("Cost and yield calculators | Prepshift", "Scale any core bar-prep recipe to any batch size and see cost per ounce, per liter and per pour."),
    "super-juice": ("Super juice calculator | Prepshift", "Build sheet and yield calculator for lime, lemon and grapefruit super juice, with method and working notes."),
    "batch-scaler": ("Batched cocktail scaler | Prepshift", "Scale a single-serving cocktail spec to any batch size with dilution, final ABV and container fit."),
    "acid-sub": ("Acid substitution calculator | Prepshift", "Replace fresh citrus with water and food-grade acid, and understand what you trade away."),
    "menu-costing": ("Menu costing engine | Prepshift", "Enter bottle costs once and see every drink costed, priced and margin-analyzed against a target pour cost."),
    "draft": ("Draft and bottled cocktails | Prepshift", "Carbonation and dispense calculator with the theory, protocol and line setup for bottled and draft cocktails."),
    "equipment": ("Equipment list | Prepshift", "The working kit for a bar-prep program, organized by station and ranked by priority."),
    "glossary": ("Glossary | Prepshift", "The bar-prep vocabulary, defined as the manual uses it."),
}


def build_manual_pages():
    urls = []
    for name, (title, desc) in MANUAL_META.items():
        wide, main, scripts = partial(name)
        urls.append(page(f"pages/{name}.html", title, desc, main,
                         main_class="manual wide" if wide else "manual", scripts=scripts))
    _, main, scripts = partial("recipe")
    for rid, fname, rname in RECIPES:
        urls.append(page(f"pages/{fname}.html", f"{rname} | Prepshift",
                         f"{rname}: batch calculator, costs, method and notes from the Prepshift manual.",
                         main, main_class="manual", scripts=scripts, body_attrs=f' data-recipe="{rid}"'))
    return urls


def build_404():
    body = """    <h1 class="statement indent">That page isn&rsquo;t here.</h1>
    <p class="lede indent">Try the <a href="/">home page</a>, the <a href="/manual/">manual</a>, or <a href="/contact/">write to us</a>.</p>"""
    page("404.html", "Page not found | Prepshift", "That page isn't here.", body)


def main():
    home_url = build_home()
    urls = [home_url, build_juice(), build_kitchen(), build_waste(), build_manual(), build_data(), build_contact()]
    urls += build_manual_pages()
    urls.append(build_legal())
    build_404()

    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8")
    (ROOT / "favicon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">'
        '<circle cx="24" cy="24" r="22" fill="#dfeb5e" stroke="#1b2114" stroke-width="2.5"/>'
        '<path d="M24 5v38M5 24h38M10.6 10.6l26.8 26.8M37.4 10.6 10.6 37.4" stroke="#1b2114" stroke-width="2.5"/></svg>\n',
        encoding="utf-8")
    print(f"built {len(urls) + 1} pages")


if __name__ == "__main__":
    main()
