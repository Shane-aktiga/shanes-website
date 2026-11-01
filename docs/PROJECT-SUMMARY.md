# shaneparreco.com: project summary

Read this first in a new session. It is the current state of the site, how we
work on it, and what is left. For the history of how it got here, see
`WORK-LOG.md`. For build mechanics and the design system, see the root
`README.md`.

Last updated 31 October 2026, after PR #15. Everything described here is on
`main` and live.

---

## What this is

Shane Parreco's personal site, live at https://shaneparreco.com. A static site
on GitHub Pages from the repo `Shane-aktiga/shanes-website`. Semantic HTML,
modern CSS, vanilla JavaScript, inline SVG. No frameworks and no npm. One
Python script, `tools/build.py`, stitches components into pages.

The homepage is an interactive night landscape. Each light on it is a path,
and clicking a light opens a card with a button to that path's page. Below the
landscape sits a short intro, a plain-link index of the same destinations, and
recent journal notes.

## The rule that matters most

**Run `python3 tools/build.py` before every commit.** GitHub Pages serves the
committed HTML and does not run the build. Edit `templates/` or
`components/`, never the generated `index.html` files. Edit a component without
rebuilding and nothing changes on the live site.

## The seven paths

Named, numbered and ordered the same way everywhere: the landscape, the menu,
the index and the footer.

| # | Label | URL | Template | Card and hero image |
|---|---|---|---|---|
| 01 | Work | `/work/` | `templates/work.html` | `work-card.jpg` |
| 02 | Fly | `/fly/` | `templates/fly.html` | `fly-card.jpg` |
| 03 | Play | `/play/` | `templates/play.html` | `play-card.jpg` |
| 04 | Drive | `/drive/` | `templates/drive.html` | `drive-card.jpg` |
| 05 | Build | `/build/` | `templates/build.html` | `build-card.jpg` |
| 06 | Grow | `/optimism/` | `templates/optimism.html` | `grow-card.jpg` |
| 07 | Journal | `/journal/` | `templates/journal.html` | `wp-notebook.jpg` |

- **Grow keeps the URL `/optimism/`.** Only the label changed. This was a
  deliberate choice; do not rename the URL.
- **Journal is always last**, including on mobile.
- Desktop light positions are keyed by name in `terrain.css`
  (`[data-sp-waypoint="work"]` and so on), so reordering markup changes the
  mobile list, menu, index and footer but never the desktop constellation.
- Every card image is 960 by 540. The same image appears on the landscape card,
  in the homepage index, and in the hero of that path's own page, so a visitor
  recognizes where they landed.

## Where things live

```
templates/        one file per page (home, 7 paths, 404, posts/ with 8 posts)
components/       shared markup: head, header, terrain, intro, index-nav,
                  notebook-preview, footer, page-open, page-close, hero-ridge
assets/css/       global (tokens, first), terrain, sections, page
assets/js/        nav.js (every page), terrain.js (home only)
assets/img/       card art, page photos, logos; posts/ holds post images
tools/build.py    the build; also writes sitemap.xml and robots.txt
docs/             these two files
```

## How we work together

- **Branch, build, verify, open a PR.** Shane reviews and merges in the GitHub
  app. Work goes on a named branch cut from current `main`.
- **Open PRs through the REST API.** `gh pr create` fails because GraphQL is
  blocked from the session. Use
  `gh api repos/Shane-aktiga/shanes-website/pulls --method POST --input file.json`.
- **Confirm the PR is actually open before saying it is.** A merged PR does not
  reopen when you push to its branch, and twice that left commits orphaned.
  Check `.state` and `.merged` first, and open a fresh PR if needed.
- **The proxy blocks** branch deletion, the Pages API, WebKit downloads and
  direct fetches of the live site from the shell. Shane deletes stale branches
  himself.
- **Keep instructions to Shane concrete and one step at a time.** He merges
  PRs in the GitHub app and does not want to hand-place files. Prefer handing
  him a finished PR over a list of files and where each one goes.
- **Style.** US spelling ("favorite"). Avoid em dashes in anything he will read
  or publish. Short conversational voice on the site itself.
- **Do not invent** URLs, experiences, equipment specs or product features. If
  a fact is not in what Shane supplied, leave a labelled placeholder.

## Hard rules and known traps

1. **Never use the `iu-*` images.** They are other people's copyrighted work
   (Alan Watts, Brene Brown, Joe Hudson, John Wineland, stock landscapes).
   `/optimism/` links to each person instead. See README.
2. **Cards open on click only, never on hover.** Desktop hover gives an
   animated reaction but does not open anything. Hover styles live inside
   `@media (hover: hover)` so touch devices cannot latch into them.
3. **The mobile card is a bottom sheet moved out to `<body>`.** iOS Safari
   contains and clips `position: fixed` inside an `overflow: hidden` ancestor.
   Chromium does not, so this bug does not reproduce on desktop. Do not move
   the card back into the section. Look up the open card with
   `document.getElementById`, not `root.querySelector`, because it is no
   longer inside `root`. That mistake once broke all seven card buttons.
4. **`.sp-terrain__field` is `z-index: 3`, not 2.** At 2 it ties with the foot
   strip in a flex layout and loses on document order.
5. **Specificity trap in `global.css`.** `.sp-page a { color: inherit }` and
   `.sp-page img { max-width: 100% }` both sit at 0,1,1 and beat a bare class.
   Anything that must win carries its element: `a.sp-button`,
   `a.sp-terrain__card-link`, `img.sp-index__media`. A second instance:
   `.sp-prose img` adds a 1px border to every article image, so a transparent
   logo needs `border: 0` stated by name.
6. **`height: auto` on `.sp-page img` is load-bearing.** Our images carry
   `width` and `height` attributes. Without it, `max-width` shrinks the width
   and leaves the height, stretching the picture.
7. **Stale caches are handled by the build.** `build.py` appends
   `?v=<content hash>` to every `/assets/` CSS, JS and image reference in
   generated HTML. Do not hand-write `?v=` in a template. Do not reference
   assets from JavaScript without knowing they will not be stamped.
8. **The moon is an element outside the SVG.** It sits in `terrain.html` after
   the `</svg>`, positioned from the top with `z-index: 1`. Inside the SVG it
   cannot be lifted above later shapes, and the SVG's bottom-anchored scaling
   makes anything inside it drift with viewport height.
9. **Verify images by looking at them.** Hashed filenames carry no meaning, and
   two photographs once shipped transposed. Build a contact sheet and check.

## Content model

- **Homepage intro** is verbatim from Shane. Do not reword it.
- **Heading wording:** "Recent notes from my journal" (home) and "From my
  journal" (Fly). It is "my journal", not "the journal".
- **Journal block thumbnails.** Wherever a post is linked in a recent or
  onward block, it shows a 16:9 image. Mapping, applied everywhere:

  | Post | Image |
  |---|---|
  | `/well-its-been-a-minute/` | `grow-card.jpg` |
  | `/aktiga-the-future-of-vr/` | `posts/aktiga-wordmark.png` (logo mark) |
  | `/costa-rica-video/` | `wp-notebook.jpg` |
  | `/wnc-paragliding-is-born/` | `posts/wnc-paragliding-mark.png` (logo mark) |
  | `/al-bowers-and-an-epic-aviation-trip-nerd-alert/` | `posts/Al-and-Shane.jpeg` |
  | `/skygear-hub-has-launched/` | `skygear-hub.svg` (logo mark) |

  Photographs use `.sp-journal__media` or `.sp-onward__media` and are cropped
  to fill. Logo marks add the `--mark` modifier, which contains the image
  instead of cropping it. The Aktiga and WNC marks are transparent keyed copies
  of the originals, which still live in `assets/img/posts/` for the post
  bodies. Thumbnails use `alt=""` on purpose, since the title beside each
  already names the destination.
- **The two posts not in any block** (`flying-training-and-travel`,
  `social-media-sucks`) have no thumbnail because nothing displays one.
- **Fly page** carries the Al Bowers section (NASA photo, a filled button to
  albionbowers.com, the NASA paper as a secondary link) and the SkyGear Hub
  logo lockup (light colorway, 17.07:1 contrast on the panel; the dark
  version is invisible at 1.00:1).
- **External links used on the site:** agendakeeper.com, thelearnengine.com,
  watch-list.app, thetrackavl.com, simops.pro, albionbowers.com,
  wncparagliding.com, skygearhub.com.

## How to verify a change

The checks we ran on every PR. The scripts were session scratch files and are
not in the repo, so rebuild them from this description (Playwright and Chromium
are preinstalled; use `python3 -m http.server 8899` from the repo root).

1. **Every page, desktop 1440 and mobile 390:** no horizontal overflow
   (`scrollWidth - clientWidth` is 0), no console errors. Pages: `/`, `/work/`,
   `/fly/`, `/play/`, `/drive/`, `/build/`, `/optimism/`, `/journal/`,
   `/404.html`.
2. **No broken images.** Scroll the whole page first so lazy images actually
   load, wait a couple of seconds, then check `complete` and `naturalWidth`.
   Skipping the scroll reports false failures on every lazy image.
3. **The seven card buttons**, four behaviors each, 28 assertions in all:
   desktop click navigates, mobile click navigates, mobile backdrop tap
   dismisses, mobile close button dismisses. A test that only opens and
   dismisses passes even when the button is broken, so assert on navigation.
4. **Measure layout instead of eyeballing it.** Bounding boxes, computed
   styles, row margins. Where text overlap matters, measure a `Range` rather
   than the element box, which over-reports.
5. **Prove a fix against the broken code.** Reproduce the failure first (for
   the iOS bug, simulate containment with `transform: translateZ(0)` on the
   section), then show the fix changes the number.
6. **Fonts:** Google Fonts is blocked in the sandbox. Screenshots need the font
   files injected as base64 `@font-face`, or text renders in a fallback.

## Open items

1. **Two labelled photo placeholders.** `templates/drive.html` wants a
   Thursday league race screenshot. `templates/play.html` wants a track or
   live clip. Both are dashed slots with a caption saying so; drop a file in
   and replace the slot with an `<img>`.
2. **Hero images are lazy but above the fold.** The `.sp-hero__media` images
   added in PR #13 carry `loading="lazy"`, which can delay first paint on every
   interior page. Removing the attribute from those seven would be correct. The
   README line "no images above the fold" is no longer true on interior pages.
3. **Add `.nojekyll` at the repo root.** Offered, not yet requested. Without
   it GitHub Pages runs Jekyll, which would skip any file or folder starting
   with an underscore. Nothing does today.
4. **Archive page has no thumbnails.** `/journal/` is still a dense
   date / title / tag list. A small thumbnail per row would fit without
   redesigning it. Offered, not yet requested.
5. **Self-host the two Google Fonts** (Sora and IBM Plex Mono) to drop two
   third-party connections.
6. **Delete the stale branches on GitHub.** `header-nav-and-card-fixes`,
   `asset-cache-busting`, `index-and-hero-images` and
   `journal-images-and-fly-page` are all merged and can go. The sandbox cannot
   delete them. Shane does this in the GitHub app.
7. **Unused assets, kept on purpose:** `fly-ridge.jpg` (the same shot as the
   Fly hero, no longer referenced) and `skygear-hub-red.svg` (an alternate
   colorway). Delete them whenever, with no effect on the site.
8. **The `/journal/` count line** reads "Eight posts" by hand. It will go stale
   when a post is added.
9. **`sitemap.xml` `lastmod` is the build date for every URL.** Each build
   stamps all 16 pages with today's date even if only one changed, which
   overstates freshness to search engines. Before committing a build that
   did not really change every page, `git checkout -- sitemap.xml`. A proper
   fix would take the date from each template's last git change.

## Starting a new session

1. `cd` to the repo, `git checkout main && git pull`.
2. Read this file, then skim `WORK-LOG.md` for the last few entries.
3. `python3 tools/build.py` and `python3 -m http.server 8899` to see it.
4. Cut a branch for the new work. Build, verify, open a PR, confirm it is open.
