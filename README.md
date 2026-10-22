# shaneparreco.com

A static site. Semantic HTML, modern CSS, vanilla JavaScript, inline SVG.
No frameworks, no npm, no node_modules. The only tool is a Python script
that stitches components into pages.

Live on GitHub Pages at the apex domain.

---

## Quick start

```bash
python3 tools/build.py        # regenerate every page
python3 -m http.server 8000   # then open http://localhost:8000
```

Use a server, not `file://`. Links and assets are root-relative
(`/assets/...`), which is what makes the same files work at the domain root
without rewriting paths per directory.

**Always run the build before committing.** GitHub Pages serves the HTML in
this repo as-is; it does not run `build.py`. Editing a component without
rebuilding changes nothing on the live site.

---

## The six paths

The spine of the site. Named, numbered and ordered the same way everywhere:
the landscape, the menu, the index, the footer.

| # | Name | URL | Template | Card image |
|---|---|---|---|---|
| 01 | Work | `/work/` | `templates/work.html` | `wp-desk.jpg` |
| 02 | Fly | `/fly/` | `templates/fly.html` | `wp-launch.jpg` |
| 03 | Play | `/play/` | `templates/play.html` | `wp-studio.jpg` |
| 04 | Drive | `/drive/` | `templates/drive.html` | `wp-rig.svg` *(placeholder)* |
| 05 | Build | `/build/` | `templates/build.html` | `wp-shop.svg` *(placeholder)* |
| 06 | Journal | `/journal/` | `templates/journal.html` | `wp-notebook.jpg` |

The image filenames still carry the paths' original names (desk, launch,
studio, rig, shop, notebook). Renaming them is churn with no payoff, so they
were left alone. The mapping above is the reference.

**Desktop waypoint positions are keyed by name, not by order.** Each light's
coordinates live in `terrain.css` against `[data-sp-waypoint="work"]` and so
on. Reordering the markup changes the mobile list, the menu, the index and
the footer, and leaves the desktop constellation exactly where it is.

---

## Structure

```
.
├── index.html                  generated — do not hand-edit
├── 404.html                    GitHub Pages serves this automatically
├── sitemap.xml                 generated on every build
├── robots.txt                  generated on every build
├── CNAME                       custom domain
├── README.md                   this file
│
├── templates/                  one file per page, with @var and @include
│   ├── home.html               → /
│   ├── work.html               → /work/
│   ├── fly.html                → /fly/
│   ├── play.html               → /play/
│   ├── drive.html              → /drive/
│   ├── build.html              → /build/
│   ├── journal.html            → /journal/      the writing archive
│   ├── optimism.html           → /optimism/
│   ├── 404.html                → /404.html
│   ├── home-legacy.html        → /home/         redirect to /
│   └── posts/                  → one folder per post, original slugs (8)
│
├── components/                 ← THE SOURCE OF TRUTH
│   ├── head.html               meta, OG, icons, fonts, CSS, nav.js, GA4
│   ├── page-open.html          doctype through <main>
│   ├── page-close.html         </main> through </html>
│   ├── header.html             1. Header and the full-screen menu
│   ├── terrain.html            2. Interactive Terrain
│   ├── index-nav.html          3. Explore Index
│   ├── notebook-preview.html   4. From the Journal
│   ├── footer.html             5. Connect
│   ├── intro.html              short first-person block on the homepage
│   └── hero-ridge.html         small ridge motif for interior page heroes
│
├── assets/
│   ├── css/
│   │   ├── global.css          design tokens + base. First, always.
│   │   ├── terrain.css         the landscape, waypoints, cards, scrim
│   │   ├── sections.css        header, menu, index, preview, footer
│   │   └── page.css            interior pages and articles
│   ├── js/
│   │   ├── nav.js              the header menu. Every page, via head.html.
│   │   └── terrain.js          the landscape and cards. Home page only,
│   │                           loaded at the foot of templates/home.html.
│   └── img/                    waypoint and post images, favicons, OG image
│
└── tools/
    ├── build.py                the build
    ├── _posts.py               post list helper
    └── fetch-media.sh          one-off WordPress media pull, kept as a backstop
```

---

## How the build works

A template declares variables and pulls in shared markup:

```html
<!-- @var out: fly/index.html -->
<!-- @var path: /fly/ -->
<!-- @var title: Fly - Shane Parreco -->
<!-- @var description: Paragliding since 2009... -->
<!-- @include components/page-open.html -->
```

Includes expand first, recursively. Then `{{variables}}` are replaced
everywhere, including inside the included markup. That is how one
`components/head.html` gives every page its own title, description, canonical
URL and Open Graph tags.

`out` decides where the page is written. Missing folders are created.
Defaults such as `site_url` and `ga4_id` live at the top of `tools/build.py`.

If you forget a variable the build prints a warning and leaves it empty
rather than shipping `{{title}}` to production.

`sitemap.xml` and `robots.txt` are regenerated on every build. `/home/` is
deliberately left out of the sitemap, since it is a `noindex` redirect.

### Adding a page

1. Copy the closest existing template.
2. Change `out`, `path`, `title`, `description`.
3. `python3 tools/build.py`

### Adding a blog post

1. Copy any file in `templates/posts/`.
2. Set the slug in `out` and `path`, set `og_type: article`.
3. Add a row to the archive in `templates/journal.html` and, if it should
   appear on the homepage, to `components/notebook-preview.html`.
4. Build.

When there are enough posts for that to feel repetitive, move the post list
into a data file and have `build.py` generate the archive and the homepage
preview from it. The structure is already shaped for that.

### Renaming or reordering a path

Six places need to agree: `components/terrain.html` (waypoint, card, keys),
`components/header.html` (menu), `components/index-nav.html`,
`components/footer.html`, the template's own `@var` block, and the
`[data-sp-waypoint="..."]` position rules in `assets/css/terrain.css`.
Then rebuild and delete the old output folder.

---

## Navigation

One burger menu at every screen size, not just on phones. The panel carries
all six paths plus Home, Optimism, the writing archive and the contact
address, so every page can reach every other page without a back button.

The header is `position: fixed` and gains a solid background after 80px of
scroll, so navigation stays reachable from the bottom of a long post.

`nav.js` handles it: `aria-expanded` on a real `<button>`, Escape to close,
focus returned to the toggle, and `inert` on every other body child while the
panel is open. If the script never runs the panel is still ordinary markup
with ordinary links in it.

---

## The waypoint cards

Click a light, get a card. On desktop the card is absolutely positioned near
its waypoint, with a three-way fallback (above, else below, else beside) so a
tall card never lands on top of the button that opened it, and a clamp that
keeps it clear of the fixed header.

Below 900px it becomes a bottom sheet, and three things in that path look
removable but are not.

**1. The open sheet is moved out to `<body>`.**
iOS Safari treats `overflow: hidden` on an ancestor as grounds to contain and
clip a `position: fixed` descendant rather than letting it anchor to the
viewport. `.sp-terrain` carries `overflow: hidden` for the ridge artwork, so
on an iPhone the card was never really fixed: it scrolled with the section
and the sections below it painted over the top. Chromium follows the spec
here, so this does not reproduce on a desktop browser at phone width. If you
put the card back inside the section, the bug comes back on iOS only.

**2. The page behind is scroll-locked by pinning the body.**
`overflow: hidden` alone is not reliable on iOS. `terrain.js` records the
scroll offset, sets `position: fixed` on the body with a matching negative
`top`, and restores both on close.

**3. The scrim is a real element, not a shadow on the card.**
It has to absorb the tap that dismisses the sheet, and a shadow cannot take a
tap.

### Two CSS traps worth knowing

Both are commented in place. Both cost an hour to find.

- **`.sp-terrain__field` is `z-index: 3`, not 2.** It is a flex item, and
  z-index applies to flex items even when `position` is `static`. At 2 it
  tied with `.sp-terrain__foot` and lost on document order, which sealed the
  card's own `z-index: 5` inside a losing stacking context and let the footer
  strip read through the card.
- **The card button selector is `a.sp-terrain__card-link`, with the `a`.**
  `global.css` carries `.sp-page a { color: inherit }` at specificity 0,1,1,
  which beats a bare class and leaves pale body text on a bright fill.

---

## Analytics

Google Analytics 4, measurement ID `G-JKXQ06D3LQ`, lives in
`components/head.html` and therefore appears exactly once on every page.
No Tag Manager. To change the ID, edit `ga4_id` in `tools/build.py` and
rebuild. The `/home/` redirect page is deliberately excluded, since it exists
only to bounce.

---

## History: the WordPress site

The old site has been replaced. This repo is what is live.

All eight posts keep their original slugs, so existing links still work. They
were migrated from the WordPress XML export with real body text, captions and
links; Gutenberg block comments and `wp-*` classes are stripped, and the
Vimeo block on `/costa-rica-video/` is now a responsive `<iframe>`. An eighth
post, `/well-its-been-a-minute/`, was added from a draft.

`/home/` was a workaround on the old site that pointed at an about page.
It is kept alive as a canonical link plus `noindex, follow` plus a meta
refresh to `/`, which is the standard static equivalent of a 301. GitHub
Pages cannot issue a real 301, and a domain registrar cannot do this job
either; registrars forward whole domains, not individual paths.

The six path URLs were renamed after launch (`/making/` to `/build/` and so
on). Those old paths now 404, deliberately: the pages were days old and had
nothing pointing at them.

All post images were recovered from the WordPress media export, rotated where
EXIF needed it, resized and recompressed. Nothing links back to the old site.
`tools/fetch-media.sh` is kept as a backstop and does not need running again.

### Do not reuse the `iu-*` images

The old media library contains photographs of Alan Watts, Bren&eacute;
Brown, Joe Hudson and John Wineland, plus several stock landscapes, all
named `iu-*`. They appear to have been saved from image search and are other
people's copyrighted work. None of them are used on this site, and
`/optimism/` deliberately links to each person instead. Keep it that way.

---

## Design system

Everything comes from the tokens at the top of `assets/css/global.css`.
Components never hard-code a hex value.

- **Colour.** Night through ridge blues to a dawn horizon, plus two light
  colours: warm `--sp-c-lamp` marks where things get made, cool
  `--sp-c-beacon` marks where he goes. Keep that rule. A visitor reads it
  before they read a label. The card buttons inherit the same two colours.
- **Type.** Sora for everything visible, IBM Plex Mono for every small
  letterspaced label. Nothing in between.
- **The climb.** The page lightens as you descend, from near-black at the
  landscape to a warm grey at the footer. Done with static section
  backgrounds, so it costs nothing.

Every class is namespaced `sp-`.

---

## Accessibility

- Waypoints are real `<button>`s with `aria-expanded` and `aria-controls`.
  Tab reaches them, Enter and Space open them, Escape closes and restores
  focus.
- Hidden cards and the closed menu use `visibility: hidden`, so they leave
  the accessibility tree instead of being read out as invisible text.
- The card buttons read as the destination alone ("Build") because the names
  are verbs and "Go to Fly" reads badly. An `aria-label` carries the full
  phrase, so a screen reader still announces "Go to Build".
- The landscape SVG is `aria-hidden`. It carries no information.
- **The site works with JavaScript off.** The Explore Index below the
  landscape is the same six destinations as ordinary links, and every page is
  plain HTML.
- `prefers-reduced-motion` switches off parallax, the cloud drift, the
  waypoint pulse and the card transition. Everything stays usable.
- One focus style, defined once, visible against the dark background.

---

## Performance

- No images above the fold. The landscape is inline SVG.
- Two scripts, both deferred, no jQuery and no animation library. Only
  `nav.js` (3 KB) is on every page. `terrain.js` (16 KB) is loaded by the
  home template alone, because that is the only page with a landscape on it,
  so every interior page and every post carries 3 KB of JavaScript in total.
- Parallax runs on a single `requestAnimationFrame` loop that stops itself
  when the pointer stops. The sticky header uses an `IntersectionObserver`.
  No scroll listeners anywhere.

---

## Still to do

- **Add a `.nojekyll` file at the repo root.** Without it GitHub Pages runs
  everything through Jekyll, which silently skips any file or folder starting
  with an underscore. Nothing here starts with one today, so the site builds
  correctly, but it is one `touch .nojekyll` away from never being a problem.
- **Real photographs for Drive and Build.** Both still use abstract SVG
  placeholders, because there is no sim rig photo and no carpentry photo in
  the media library. To fill either: drop a 16:9 image into `assets/img/` as
  `wp-rig.jpg` or `wp-shop.jpg`, then change the one `src` and the `alt` in
  `components/terrain.html`. Both lines are marked with an HTML comment.
- **Self-host the fonts.** Two families from Google Fonts are two extra
  connections and a flash of unstyled text. Download the woff2 files into
  `assets/fonts/`, swap the `<link>` in `components/head.html` for
  `@font-face` rules, and the site has no third-party requests except
  analytics.
- `/drive/` is deliberately thin. Worth filling in when you feel like it.
- `/optimism/` mentions therapeutic support in passing, carried over from the
  old site. Worth a read-through to check it still says what you want.
