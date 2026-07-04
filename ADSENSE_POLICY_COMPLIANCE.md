# AdSense policy compliance (Excavationpro)

Publisher: `ca-pub-0646320966060599`  
Primary review URL: [eternalhaven.html](https://deepseekoracle.github.io/Excavationpro/eternalhaven.html)

## What we fixed (2026-07-04)

1. **Removed ads from non-content / dev pages** — exploit demos (`grokbanish.html`, other `grok*.html`), `test.html`, `underconstruction.html`, admin/poker stubs, duplicate hub `LYGO-Network/ETERNALHAVEN.html`, pages with placeholder ad slots (`LYGOOS.html`).
2. **Noindex on denylisted URLs** — so crawlers focus on the main hub and real content.
3. **Single monetized landing page** — display ad units only on `eternalhaven.html`, labeled “Advertisement”, max two units, **no** `adsbygoogle.js` in `<head>` until the user accepts cookies.
4. **Verification meta** — `google-adsense-account` meta remains on substantive public HTML only (no global ad script on every page).
5. **Canonical URL** — hub canonical points at the GitHub Pages URL used in AdSense site setup.

## Re-apply after bulk HTML edits

From `lygo-protocol-stack`:

```bash
python tools/apply_excavationpro_adsense_policy.py
```

## Request review in AdSense

1. Fix is pushed to `DeepSeekOracle/Excavationpro` on GitHub.
2. Wait ~30–60 minutes for GitHub Pages cache.
3. AdSense → **Policy center** → fix listed issues → **Request review**.
4. In the note, state: ads removed from test/under-construction/exploit pages; only eternalhaven shows ads after cookie consent; privacy policy at `#privacy`.

## Do not

- Re-run `inject_excavationpro_adsense.py` (puts ad script on all pages).
- Add AdSense to `grok*.html`, `*test*`, or “under construction” pages.
- Load `adsbygoogle.js` in `<head>` before consent on the hub.