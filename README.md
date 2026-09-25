# visualsbymarvin

Personal portfolio of **Marvin Gehlen — Junior Marketing Designer**, made to be
sent along with job applications: the first screen tells a recruiter who, what
and where, the work follows in big plates, and the CV is one click away
everywhere.

Minimal, black & white with one signal colour, big stretched type. Built with [Astro 5](https://astro.build), [Tailwind CSS 4](https://tailwindcss.com), [GSAP](https://gsap.com) (motion) and [Lenis](https://lenis.darkroom.engineering) (smooth scroll). Fully static — deploys anywhere for free.

---

## Quickstart

```bash
npm install     # once
npm run dev     # local dev server → http://localhost:4321
npm run build   # production build into dist/
npm run preview # preview the production build
```

---

## Where to edit what

| I want to change… | File |
| --- | --- |
| **My projects / case studies** | `src/content/projects/<project>/index.md` |
| Name, **email**, socials, status | `src/data/site.ts` |
| **Experience & education** (home Profile + About) | `src/data/experience.ts` |
| Degree, **focus** and **tools** lists | `src/data/profile.ts` |
| Hero ("Visuals that work.", intro line, facts row) | `src/pages/index.astro` |
| About page bio texts + quick facts | `src/pages/about.astro` |
| **My photo** | `src/assets/image_pill_me.png` (just replace the file) |
| **Your CV** (every "Download CV" button) | drop a PDF at `src/assets/cv.pdf` |
| **Sidequests** (Duolingo streak, side projects) | `src/data/sidequests.ts` |
| Duolingo streak widget | `src/components/DuoStreak.astro` |
| Top bar (name, nav, toggles) | `src/components/Masthead.astro` |
| Footer closing line ("Thanks for your time.") | `src/components/Footer.astro` |
| **Colours & font** (light mode) | `src/styles/global.css` (the `@theme` block at the top) |
| **The accent colour** (orange) | `src/styles/global.css` → `--color-accent` — one value |
| **Dark mode colours** | `src/styles/global.css` (the `:root[data-theme='dark']` block right below `@theme`) |
| Imprint (Impressum) | `src/pages/imprint.astro` |
| Privacy policy (Datenschutzerklärung) | `src/pages/privacy.astro` |
| Animations | `src/scripts/app.js` |
| Share image (link previews) | `public/og.jpg` |
| Domain for SEO tags | `astro.config.mjs` → `site` |

Files with editable content have a `✏️ EDIT HERE` comment at the top.

---

## Adding / editing a project

Each project is **one folder** in `src/content/projects/`:

```
src/content/projects/
└── conjure/
    ├── index.md    ← all text + settings
    ├── cover.jpg   ← card + page cover image
    ├── 01.jpg      ← images used inside the page
    └── 02.jpg
```

**To add a project:** copy an existing folder, rename it (the folder name becomes the URL, e.g. `myproject` → `/work/myproject/`), drop your images in, and edit `index.md`:

```md
---
title: 'Conjure'
categories: ['Mobile App', 'Case Study']   # shown as "Mobile App | Case Study"
description: 'One or two sentences. Used on the card and as the page intro.'
year: '2025'
role: 'UX & UI Design'
tools: ['Figma', 'Illustrator']
cover: './cover.jpg'
coverAlt: 'Short image description'
order: 1            # lower number = shown first
# externalUrl: 'https://…'   # optional: adds a "Live" link
# featured: false            # hide from the landing grid
# draft: true                # hide the project completely
---

A short intro sentence or two.

![Describe the image](./01.jpg)

## Optional small heading

Only write text for the really important stuff — the images do the talking.

![Another image](./02.jpg)
```

That's the whole system: **images with a few short sentences in between.** Every image you reference gets optimized automatically (WebP, responsive sizes).

**Cover images:** use a **16:9** ratio — **1920 × 1080 px** is ideal. On the home page the cover runs the full width of the page inside printer's crop marks, with only a tiny (~4%) trim at the edges for the scroll drift, so keep important text a little away from the very border. Inside-the-page images (the `![](...)` ones) can be any size — they show at full width, uncropped, and open full size on click.

A title typed as `Something - Else` is shown with a proper dash (`Something – Else`).

**Epoch** and **Bionova** are still the template's demo projects — replace them with your own work or set `draft: true` to hide them.

---

## Your photos

- `src/assets/image_pill_me.png` — the portrait. On the home page it sits **inside the headline** as a pill (cropped to 2.4 : 1 around the middle, so keep yourself centred); on the About page it runs full width in its own pill shape. Replace it with any wide image (~1400×450).
- `public/og.jpg` — the preview image shown when you share your link (1200×630). It's a render of the hero; swap it if you change the headline.

---

## Before you go live — checklist

- [ ] Replace the 2 remaining demo projects (Epoch, Bionova) with real work
- [ ] Drop your CV at `src/assets/cv.pdf` — **every Download CV button stays hidden until you do**, so no broken link ever reaches a recruiter (the build prints a warning to remind you)
- [ ] Check `src/data/site.ts` — `role` and `description` (browser tab + search results) still say *Creative Designer* while the hero and About say *Marketing Designer*
- [ ] Check email + social links in `src/data/site.ts`
- [ ] Optional: add a phone number to `src/pages/imprint.astro` (e-mail alone satisfies § 5 DDG, so this is not required)
- [ ] Have the Impressum + Datenschutzerklärung checked by a lawyer before going live — especially whether the `c/o Online-Impressum` address counts as a *ladungsfähige Anschrift* for your setup
- [ ] Put your Duolingo streak in `src/data/sidequests.ts` — **while it is `0` the card stays hidden**, so nothing invented ever goes live
- [ ] Set your real domain in `astro.config.mjs`
- [ ] Optional: swap `public/og.jpg` for a designed share image

---

## Animations — how they work

All motion lives in `src/scripts/app.js` and is driven by small `data-` attributes you can put on any element:

| Attribute / class | Effect |
| --- | --- |
| `data-enter` | fades up as part of the page-load choreography |
| `data-rule` | a hairline (`<hr class="hr">`) that draws itself in on page load |
| `.gate-mi` | a masked word/line that rises as part of the page load |
| `data-reveal` | fades up when scrolled into view |
| `data-mask` + `.mask > .mi` spans | masked line reveal on scroll (text slides out of a clipped box) |
| `data-cover` | big image clip-reveal on page load (`data-cover="pill"` opens from the middle like the hero pill) |
| `data-card` | project plate: rule draws, title rises, cover wipes up, crop marks snap in, then a gentle drift + hover zoom |
| `.crop` | printer's crop marks around whatever it wraps |
| `data-zoom` | images inside open full size in the lightbox |
| `data-count-to` | a number counts up when it scrolls into view |
| `data-time` | live clock (German time) |

The top bar slides away while you scroll down and comes back as soon as you
scroll up.

Smooth scrolling and all animations automatically switch off for users with `prefers-reduced-motion`, and the site is fully readable with JavaScript disabled.

The **Smooth / Instant toggle** in the top bar (desktop only — touch scrolling is always native) lets any visitor turn the eased (Lenis) scrolling off in favour of native instant scrolling; the choice is remembered in their browser (`localStorage`). Default is smooth, or instant when the OS requests reduced motion.

The **Light / Dark toggle** sits next to it. The theme is applied before the page paints (so there is never a flash of the wrong theme) and is remembered in `localStorage`. Visitors who haven't chosen follow their operating system setting.

Both palettes are plain CSS variables, so the whole site — including Tailwind classes like `text-ink/75` — adapts automatically. When adding new markup, use the semantic tokens instead of fixed colors:

| Token | Use for |
| --- | --- |
| `paper` / `ink` | page background / main text + lines (they swap in dark mode) |
| `soft` | muted secondary text |
| `sunk` | image placeholders while they load |
| `accent` | the signal colour: full stops, CV button, footer, hovers — as a fill or for big type only (3.3 : 1 on white, too light for small text) |
| `on-accent` | text placed **on** the accent (stays dark in both modes) |

The type is **Archivo** (self-hosted, no request to Google) with both of its
variable axes: weight for the heavy headlines and *width* (`font-stretch`) for
their stretched look. `.display` is the headline voice, `.label` the small
stretched caps.

---

## Deploying (free)

The site is 100% static. Easiest options:

- **Vercel / Netlify:** import the GitHub repo → framework "Astro" is auto-detected → deploy. Every push deploys automatically.
- **Cloudflare Pages:** same flow; build command `npm run build`, output `dist`.

Then connect your domain in the host's dashboard and update `site` in `astro.config.mjs`.

---

## Sidequests & the Duolingo streak

The section lives in `src/data/sidequests.ts`; the widget itself is
`src/components/DuoStreak.astro`.

### The streak number

**Live (recommended).** Set `DUOLINGO_USERNAME` to your Duolingo profile
name — on Vercel under **Settings → Environment Variables**, and locally in a
`.env` file (copy `.env.example`; `.env` is gitignored).

The name is read *only while the site builds*. It is deliberately not
prefixed with `PUBLIC_`, so Astro keeps it server-side: **your username never
reaches the browser, the built HTML, or this public repo** — only the streak
number does. The card links to `duolingo.com`, not to `/profile/<name>`, for
the same reason.

Because it resolves at build time there is no CORS problem and visitors pay
nothing for it. The number refreshes whenever the site rebuilds; pushing a
commit does that, and a [Vercel Deploy Hook](https://vercel.com/docs/deploy-hooks)
called once a day from a cron job keeps it current on its own.

**Manual.** Leave `DUOLINGO_USERNAME` unset and put your number in
`duolingo.streak` instead. This is also the fallback whenever Duolingo does
not answer — offline, rate limited, profile private, response shape changed.
Every one of those paths returns `null` and drops back to the manual number,
so a bad response can never break the build.

While the resolved streak is `0` the widget is left out of the page entirely,
so a placeholder number can never ship by accident.

### Duo the mascot

Drop an image at **`src/assets/duo.png`** (`.webp`, `.svg` and `.jpg` also
work) and Duo appears standing on the green button. That is the only step —
nothing to import or configure.

It is resolved with `import.meta.glob`, which returns nothing when the file
is absent, so a missing mascot renders the widget without him rather than
breaking the build.
