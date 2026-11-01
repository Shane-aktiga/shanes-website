# shaneparreco.com: work log

A running record of what changed, why, and what went wrong along the way.
Newest work goes at the bottom. For the current state of the site, read
`PROJECT-SUMMARY.md`. Add a new dated section here for each batch of work.

Every entry below is a merged pull request on `Shane-aktiga/shanes-website`.

---

## Before this log

The site was migrated off WordPress into this repo and put live on GitHub
Pages at the apex domain. Shane uploaded the files himself, the DNS settings
were verified and the HTTPS certificate was generated. This log starts from the
first round of design fixes after that. The README's "History" section covers
the migration itself.

---

## 22 October 2026: structure, naming, and the mobile sheet

Eight PRs in one day. The work moved from navigation to naming to a hard
iPhone bug.

**PR #1: Burger nav on every page, inviting hero copy, legible cards**
- One burger menu at every screen size, replacing a header that wrapped badly
  on phones. The panel reaches every page so nobody gets stranded.
- Hero heading now opens "Welcome! Feel free to have a look around." "Say
  Hello" became "Reach out". The eyebrow became "Six paths. All led to now.
  Pick one and explore." The hint became "Pick a path to learn more".
- Mobile card overlay made opaque. The "Go there" text link became a full-width
  button with a 3rem minimum height, because it was far too small to tap.
- Fixed page text drawing over the open card on scroll (first attempt; see
  PR #2 for the real cause).

**PR #2: Rename the six paths, and fix the mobile sheet on iOS**
- The Desk, Launch, Studio, Rig, Shop and Notebook became Work, Fly, Play,
  Drive, Build and Journal, with URLs changed to match. Mobile order set to
  Work, Fly, Play, Drive, Build, Journal.
- **The real iOS bug.** Shane reported page text still drawing on top of the
  card on iPhone Safari. Cause: `.sp-terrain` has `overflow: hidden`, and iOS
  Safari contains and clips `position: fixed` descendants of such an ancestor,
  so the card scrolled with the section instead of anchoring to the screen.
  Chromium follows the spec and does not show it. Fix: move the open card out
  to `<body>`, pin the body to lock scroll, and use a real scrim element. Proved
  against the old code by simulating containment: after a 1500px scroll the
  card's top went from 325 to -1175, versus staying put with the fix.
- Earlier attempts that were wrong and are worth knowing about: a
  `z-index: 2` tie between `.sp-terrain__field` and `.sp-terrain__foot` (fixed
  by making the field 3), and a scrim drawn as a fixed `::before`, which the
  card's transform clipped.

**PR #3: README brought up to date.** Also confirmed `sitemap.xml` and
`robots.txt` were correct.

**PR #4: Cards open on click only, never on hover**
- Shane's concern was desktop hover. Hover no longer opens a card but keeps an
  animated reaction, and hover rules moved inside `@media (hover: hover)` so
  touch devices cannot latch into a hover state.

**PR #5: Optimism becomes a seventh path**
- Optimism promoted from a side page to a full path with its own light and
  card. Copy fixes across Play, Fly and the index. Carpentry changed from 15 to
  20 years. GPS coordinates updated. Extra spacing under the last
  mobile row. "From the notebook" became "recent notes from the journal".

**PR #6: Optimism becomes Grow, Journal moves last, Deming joins the page**
- Label changed to Grow to match the action verbs; **URL kept as
  `/optimism/`** by Shane's choice. Journal moved to last place everywhere.
  W. Edwards Deming added to the page in the same format as the four other
  people. Subtext combines "always a better way" with curiosity. Headline
  reworded toward growth. Shane asked for the plan to be mapped and approved
  before any work began, and it was.

**PR #7: Reorder the people on the Grow page**
- Order: Watts, Brown, Hudson, Wineland, Deming. "The studio side" became "the
  professional side".
- **Deploy hiccup.** After merging, the Pages workflow never ran: zero runs for
  the merge commit during a GitHub Actions degradation. An empty commit pushed
  with permission fixed it. Branch deletion is blocked by the sandbox proxy, so
  stale branches are left for Shane to delete in the GitHub app.

**PR #8: Fix the card buttons on mobile: one stale lookup broke all seven**
- Shane: tapping the Grow button closed the card and went nowhere.
- Cause: the outside-tap handler called `root.querySelector("#sp-card-...")`,
  but an open sheet had been moved to `<body>`, so the lookup returned null and
  every button tap was treated as a backdrop tap. It affected **all seven**
  cards, not just Grow. Fix: `document.getElementById`.
- **Lesson recorded.** My earlier tests had regressed to "open then dismiss",
  which passes whether or not the button works. Replaced with 28 explicit
  assertions (4 behaviors times 7 cards) that check navigation actually
  happens, and proved they fail against the broken code.

---

## 26 October 2026: content and photographs

**PR #9: Content refresh**
- Shane supplied a large brief. Conversational voice across the site, his
  homepage intro verbatim, a rebuilt Drive page (The Track at Asheville, the
  Thursday league, SimOps), products on Work (Agenda Keeper, The Learn Engine,
  WatchList), and refreshed Fly, Play, Build and Grow.
- Constraints from the brief: keep the landscape, seven paths, visual identity,
  layouts, animations, journal and URLs; no WordPress or Elementor; do not
  invent URLs, experiences, equipment specs or product features.
- A second commit added his Fly and Drive copy, more photographs, and linked
  SimOps. Where his copy and mine overlapped, we kept the best of both.

**PR #10: Photographs on the last four cards, plus two transposed images fixed**
- Real photographs on every card and five pages. Removed old images that
  contradicted his notes: a paramotor photo that contradicted his accuracy
  notes, and one whose alt text falsely claimed it was him on upright bass (he took the photo
  of someone else). Removed three abstract SVG placeholders.
- **Transposed images.** `play-card.jpg` was the paraglider sunset and
  `fly-sunset.jpg` was the band. The filenames came from hashes and carried no
  meaning. Caught by building a contact sheet of all 24 processed images.
  Lesson: verify image to filename mapping visually, always.
- **Process error.** I told Shane PR #9 had been updated after he had already
  merged it. A merged PR does not reopen on a new push, so two commits sat
  orphaned and he saw no PR. Opened #10 for them. From here on, confirm PR
  state through the API before reporting it.

**PR #11: Move the moon, and finish the Play index line**
- The moon overlapped "Reach out" in the header. Moved to the upper left under
  his name, and hidden below 900px. Play now reads "...love of playing live
  music".

**PR #12: Lift the moon above the ridges and stop it drifting**
- The moon rendered behind some mountain waves. It was inside the SVG, which
  paints in document order, so no z-index could lift it. It is also scaled with
  `preserveAspectRatio="xMidYMax slice"`, so SVG contents drift vertically with
  viewport height. Fix: the moon became its own element outside the SVG,
  positioned from the top with `z-index: 1`. Measured clear of the header, the
  waypoints and the headline across eight viewports.

---

## 27 October 2026: the card image carries through

**PR #13: Card images in the index list and page heroes**
- Each item in "or just read the index" gained its card image, and each path
  page repeats that image in its hero beside the title, so what a visitor taps
  matches where they land.
- The second row of the index is centered (grid changed to flex with
  `justify-content: center`). Measured across six viewports: every row's left
  margin equals its right.
- Two bugs caught by measuring: `.sp-page img { max-width: 100% }` at
  specificity 0,1,1 clamped the thumbnail bleed and left a gap down the right
  edge; and `grid-row: 1 / -1` collapses to row 1 when no rows are declared
  explicitly, which pinned the hero image beside the kicker instead of centring
  it. Fixed by wrapping the hero text in `.sp-hero__text` so the grid has two
  children.
- Two judgement calls flagged: at 820px the index wraps 3, 3, 1 rather than 4
  and 3, and the hero image stacks under the text below 900px.

**PR #14: Fix the stretched thumbnails, and stop stale caches breaking the page**
- Shane's screenshot showed the index thumbnails as tall stretched smears. The
  code on the site was correct: his browser held the previous `sections.css`
  and rendered new markup against old rules. Reproduced exactly (232x540, ratio
  0.43, versus the intended 280x158 at 1.78) by stripping the rule in a test.
- Two fixes. `height: auto` added to the global image rule, because the
  `width` and `height` attributes otherwise leave the height pinned. And
  `build.py` now appends `?v=<content hash>` to every `/assets/` CSS, JS and
  image reference, so a changed file is a new URL. The hash depends only on the
  file's bytes, so rebuilding with no change produces identical pages.
- An early version of the test passed falsely because the route glob stopped
  matching once the URL gained a query string. Fixed and re-run before trusting
  the result.

---

## 28 October 2026: journal thumbnails and the Fly page

**PR #15: Journal thumbnails sitewide, and the Al Bowers and SkyGear sections**
- Every place a post is linked (the homepage recent block, and the onward block
  at the foot of all seven pages and the 404) now shows a 16:9 image. 21
  thumbnails from one href-to-image map. Headings changed to "my journal".
- The Aktiga and WNC logos arrived with opaque near-black plates baked in and
  rendered as hard black boxes. Keyed the backgrounds to transparency and saved
  new copies; originals stay for the post bodies.
- Fly page: ridge photo removed from the body (it is the hero now, confirmed
  the same shot), "favourite" became "favorite", Al Bowers got his NASA photo
  with the Prandtl-D and a filled button to albionbowers.com, and SkyGear Hub got
  a logo lockup.
- SkyGear Hub logo colorway chosen by measurement against the panel: light
  17.07:1, red 5.64:1, dark 1.00:1 (invisible). Light used.
- Two issues found by looking at the render: the lockup was a postage stamp at
  16rem, and `.sp-prose img` drew a 1px border around the transparent logo.
- The Al Bowers photo Shane first attached did not arrive; the diner photo
  already in the repo stood in until he re-sent the NASA one. Delivered as a
  second commit on the same PR.

---

## 31 October 2026: handoff

No code changes. Wrote `docs/PROJECT-SUMMARY.md` and this log, and corrected
the README where it had gone stale (seven paths, current card images, the
Drive and Build placeholders now filled).

---

## 1 November 2026: the 3D landscape prototype (lab page)

**Lab page: `/lab/mountain/`, a noindex test page. The homepage is untouched.**
- Shane wanted the flat mountain illustration to gain depth. It was
  prototyped first outside the repo, over about eight rounds of feedback, then
  ported here as a standalone page so load time and feel can be judged on the
  real web before anything touches the homepage.
- What it is: a Three.js landscape with a procedural Blue Ridge heightfield,
  faint topo contour lines, a darker night sky with stars and the moon, and
  seven glowing spheres (Work, Fly, Play, Drive, Build, Grow, Journal). Each has
  a ground ring that ripples in time with the sphere's pulse, a thin stem, and a
  camera-facing label that is a real button. Clicking opens the same card as the
  homepage, with a button to the real page. The camera drifts slowly, can be
  turned about 40 degrees, tilted a little and zoomed. A Reset view button
  appears after any manual move. A short "Lighting the paths" screen covers the
  build. Reduced motion is honored.
- **Words come from the page, not the script.** The seven names, notes, card
  titles, copy, images and links are a plain HTML list inside the page
  (`#fallback`), extracted from `components/terrain.html` so the wording is
  identical. The script reads them, then hides the list. Crawlers and
  no-JavaScript visitors get the list as is; so does anyone without WebGL.
- Files: `templates/lab/mountain.html`, `assets/js/mountain.js`,
  `assets/css/mountain.css`, `assets/js/vendor/three.r128.min.js` (self-hosted
  Three.js 0.128, MIT licensed). `noindex` is set on the page and the build
  leaves it out of `sitemap.xml`. `robots.txt` still allows it, on purpose:
  a crawler that is blocked can never read the noindex.
- Add `?perf=1` to the address for a timing readout (response, DOM ready,
  first paint, scene ready, and the size of the three scripts and the style).
- Checked in headless Chrome: seven labels with the right copy, cards open and
  their buttons navigate to the right pages, tap on a phone, keyboard open and
  Escape close, Reset appears after a drag and the hint returns, no horizontal
  overflow at 390, reduced motion, the no-JavaScript list and the no-WebGL
  list. A sweep of 65 window sizes found no overlaps between spheres, rings,
  labels, headline or moon.
- **Open for the homepage decision:** `touch-action: none` on the canvas keeps
  one-finger vertical scrolling from working over the scene. Fine for this
  full-screen page. On the homepage the scene should leave vertical scroll to
  the page and take horizontal drag and pinch. Card images are real files in
  `assets/img/` and are stamped by the build; the script does not hard-code
  any asset URL for that reason.

---

## Working patterns that paid off

- **Measure, do not eyeball.** Bounding boxes, computed styles and row margins
  found every layout bug above that a glance missed or misread.
- **Prove the fix against the broken code.** Reproduce the failure first. A test
  that passes both before and after the fix proves nothing.
- **Look at the render.** The ring around the logo, the postage-stamp sizing and
  the transposed photographs were all invisible in the markup.
- **Check the premise before building.** The stretched thumbnails turned out to
  be a cache, not code. Reading the live state first saved a wrong fix.
- **Confirm a PR is open through the API before saying so.**
