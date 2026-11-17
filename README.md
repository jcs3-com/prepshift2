# prepshift.com

Static site, served by GitHub Pages from `main`. The domain is set by `CNAME`.

## Editing

The pages are generated. Change the source, rebuild, commit:

    python3 _src/build.py

- `_src/build.py` holds the header, footer, the contact address (`EMAIL`) and the copy for Home, Juice, Kitchen, Waste, Manual, Data, Contact and Legal.
- `_src/manual/*.html` holds the body of each recipe, calculator and reference page.
- `css/site.css` is the whole design. `js/` holds the calculators, search, the reference tables and the intake forms. `data/*.js` holds the reference values the calculators and tables read.

## Forms

The intake forms store nothing. `js/intake.js` writes an email in the visitor's own mail app, addressed to `EMAIL`, and shows the same message on the page to copy if no mail app opens.
