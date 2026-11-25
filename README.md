# QuadStick Profile Studio — website

A static, one-page marketing site. Plain HTML, CSS and a small script: no build step,
no libraries, no CDN, no trackers. Fonts are bundled in `assets/fonts/`.

```
index.html      the page
styles.css      all styles (palette shared with web/src/styles/tokens.css in the app)
main.js         reveals, scroll layers, the PlayStation/Xbox switch, the pretend tester, the motion switch
assets/         fonts, photos, screenshots, videos (copied from the app repo)
favicon.png, apple-touch-icon.png, .nojekyll
```

## Preview

```
cd /Volumes/ExternalHD/code/quadstickwebsite
python3 -m http.server 8765
open http://127.0.0.1:8765/
```

All paths are relative, so the same files work at a domain root or under a
GitHub Pages project path (`https://crypto69.github.io/quadstickprofiles/`).

## Still to fill in

| What | Where |
|---|---|
| The domain: canonical link, absolute `og:image` and `og:url` | `<!-- DOMAIN: … -->` comment in the `<head>` of `index.html` |
| Mac App Store badge, once the listing is live | `<!-- STORE BADGE: Mac App Store … -->` in the "Get it" section |
| Microsoft Store badge, once the listing is live | `<!-- STORE BADGE: Microsoft Store … -->` in the same section |

Use the official badge artwork from Apple and Microsoft, saved into `assets/img/`.

## Accessibility rules the page keeps

- Motion is optional. `prefers-reduced-motion` starts it off, and the **Motion** switch in
  the header (and the button in "Built to be used with one pointer") turns it off or on and
  remembers the choice. With motion off nothing is pinned or moves with the scroll, and
  every word is visible straight away. Without JavaScript, everything is visible too.
- Nothing needs hover, dragging or holding. Every control is at least 44 px; links inside
  sentences get a 44 px hit area.
- Full keyboard use: a skip link first, a visible focus ring (lighter blue on the dark
  sections).
- Text is 17 px or larger, and every text colour passes WCAG 2.1 AA on its background.

## Where the content came from

README.md, CHANGELOG.md, docs/app-spec.md, docs/hardware.md, PRIVACY.md and
store-assets/listing/ in the app repo. The tester demo and the hero labels use the
Fortnite starter profile's first mode (`fixtures/ddfortnite.csv`); the PlayStation/Xbox
pairs come from `core/qsprofile/catalog.py`.
