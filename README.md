# shaneparreco.com

A static site. Semantic HTML, modern CSS, vanilla JavaScript, inline SVG.
No frameworks, no npm, no node_modules. The only tool is a 120-line Python
script that stitches components into pages.

Built to be dropped straight into a GitHub repo and served by GitHub Pages.

---

## Quick start

```bash
python3 tools/build.py        # regenerate every page
python3 -m http.server 8000   # then open http://localhost:8000
```

Use a server, not `file://`. Links and assets are root-relative (`/assets/...`),
which is what makes the same files work at the domain root without rewriting
paths per directory.

---

## Deploying

See **[DEPLOY.md](DEPLOY.md)** for the full run-through.

Step 0 of that document is the one that cannot be undone: run
`bash tools/fetch-media.sh` to pull your images out of the old site *before*
DNS moves away from WordPress.

---

## Structure

```
.
├── index.html                  generated — do not hand-edit
├── 404.html                    GitHub Pages serves this automatically
├── sitemap.xml                 generated on every build
├── robots.txt                  generated on every build
├── CNAME                       custom domain
├── .nojekyll                   skip Jekyll processing
│
├── templates/                  one file per page, with @var and @include
│   ├── home.html               → /
│   ├── making.html             → /making/        The Shop
│   ├── flying.html             → /flying/        The Launch
│   ├── building.html           → /building/      The Desk
│   ├── music.html              → /music/         The Studio   (old URL kept)
│   ├── racing.html             → /racing/        The Rig
│   ├── optimism.html           → /optimism/      (old URL kept)
│   ├── notebook.html           → /notebook/      blog archive
│   ├── 404.html                → /404.html
│   ├── home-legacy.html        → /home/          redirect to /
│   └── posts/                  → one folder per post, original slugs (8)
│
├── components/                 ← THE SOURCE OF TRUTH
│   ├── head.html               meta, OG, icons, fonts, CSS, GA4
│   ├── page-open.html          doctype through <main>
│   ├── page-close.html         </main> through </html>
│   ├── header.html             1. Header
│   ├── intro.html              short first-person block on the homepage
│   ├── terrain.html            2. Interactive Terrain
│   ├── index-nav.html          3. Explore Index
│   ├── notebook-preview.html   4. From the Notebook
│   ├── footer.html             5. Connect
│   └── hero-ridge.html         small ridge motif for interior page heroes
│
├── assets/
│   ├── css/
│   │   ├── global.css          design tokens + base. First, always.
│   │   ├── terrain.css         the landscape and waypoints
│   │   ├── sections.css        header, index, notebook preview, footer
│   │   └── page.css            interior pages and articles
│   ├── js/terrain.js           the only script on the site
│   └── img/                    waypoint placeholders, favicons, OG image
│
└── tools/build.py
```

---

## How the build works

A template declares variables and pulls in shared markup:

```html
<!-- @var out: flying/index.html -->
<!-- @var path: /flying/ -->
<!-- @var title: The Launch - Shane Parreco -->
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

### Adding a page

1. Copy the closest existing template.
2. Change `out`, `path`, `title`, `description`.
3. `python3 tools/build.py`

### Adding a blog post

1. Copy any file in `templates/posts/`.
2. Set the slug in `out` and `path`, set `og_type: article`.
3. Add a row to the archive in `templates/notebook.html` and, if it should
   appear on the homepage, to `components/notebook-preview.html`.
4. Build.

When there are enough posts for that to feel repetitive, move the post list
into a data file and have `build.py` generate the archive and the homepage
preview from it. The structure is already shaped for that.

---

## Analytics

Google Analytics 4, measurement ID `G-JKXQ06D3LQ`, lives in
`components/head.html` and therefore appears exactly once on every page.
It is not duplicated anywhere and there is no Tag Manager. To change the ID,
edit `ga4_id` in `tools/build.py` and rebuild. The `/home/` redirect page is
deliberately excluded, since it exists only to bounce.

---

## The old WordPress site

Nothing on the live site has been touched. This repo is a replacement that is
ready when you are.

**URLs preserved exactly**, so no existing link breaks:

| Old URL | Now |
|---|---|
| `/music/` | same |
| `/optimism/` | same |
| `/home/` | redirects to `/` |
| all seven post slugs | same |

GitHub Pages cannot issue a 301, so `/home/` uses the standard static
equivalent: a canonical link, `noindex, follow`, and a meta refresh. A domain
registrar cannot do this job; registrars forward whole domains, not
individual paths. There is no about page any more: the homepage does that
work, and `/home/` points at it.

### Post bodies: done

All seven original posts were migrated from the WordPress XML export, with
real body text, captions and links. Gutenberg block comments and `wp-*`
classes are stripped. The Vimeo block on `/costa-rica-video/` is now a
responsive `<iframe>`.

An eighth post, `/well-its-been-a-minute/`, was added from your draft.

### Images: done, with two gaps

All seven post images were recovered from the WordPress media export,
rotated where EXIF needed it, resized to the dimensions the markup expects
and recompressed. Nothing links back to shaneparreco.com any more.

Four of the six waypoint cards now use real photographs:

| Card | Image |
|---|---|
| The Launch | paramotor against a low sun over the ocean |
| The Desk | an Aktiga 3D web scene on a starfield |
| The Studio | Shane on upright bass, black and white |
| The Notebook | beach and cloud bank, Playa Linda |

**The Shop and The Rig are still abstract placeholders.** There is no
carpentry photograph and no sim rig photograph in the media library. To fill
either one: drop a 16:9 image into `assets/img/` as `wp-shop.jpg` or
`wp-rig.jpg`, then change the one `src` and the `alt` in
`components/terrain.html`. Both lines are marked with an HTML comment.

`tools/fetch-media.sh` is kept in the repo as a backstop in case anything
else turns out to be missing while the old site is still up.

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
  before they read a label.
- **Type.** Sora for everything visible, IBM Plex Mono for every small
  letterspaced label. Nothing in between.
- **The climb.** The page lightens as you descend, from near-black at the
  landscape to a warm grey at the footer. Carried over from the Ascent
  direction, done with static section backgrounds, so it costs nothing.

Every class is namespaced `sp-`.

---

## Accessibility

- Waypoints are real `<button>`s with `aria-expanded` and `aria-controls`.
  Tab reaches them, Enter and Space open them, Escape closes and restores
  focus.
- Hidden cards use `visibility: hidden`, so they leave the accessibility tree
  instead of being read out as invisible text.
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
- One script, 9 KB, deferred. No jQuery, no animation library.
- Parallax runs on a single `requestAnimationFrame` loop that stops itself
  when the pointer stops. No scroll listeners anywhere.
- **Self-host the fonts before launch.** Two families from Google Fonts are
  two extra connections and a flash of unstyled text. Download the woff2
  files into `assets/fonts/`, swap the `<link>` in `components/head.html` for
  `@font-face` rules, and the site has no third-party requests except
  analytics.

---

## Still to do

- Run `tools/fetch-media.sh` to replace the post image stand-ins.
- Real photographs for the six waypoint cards.
- `/racing/` is deliberately thin. I did not want to invent your setup.
- `/optimism/` mentions therapeutic support in passing, carried over from the
  old site. Worth a read-through to check it still says what you want.
