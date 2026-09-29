# Shaadi Parrot website

A static site for the Shaadi Parrot Android dating app. It has no server, no framework and no build step to view it: open `index.html` by double-clicking it. You need to be online for the Google fonts and the YouTube thumbnail.

## Pages

| File | What it is |
|---|---|
| `index.html` | Home: banner-style hero, the Daily Fates card demo, how it works, features, tests, tonight's Moon, safety, Parrot+, Ek Tarfa, FAQ |
| `how-it-works.html` | A day with Mithu, inside a fate reading, profile, likes/crowns/boosts, explore |
| `tests.html` | Test hub: the two web tests and the full list of the app's 90 tests |
| `astrology.html` | Live Moon nakshatra, all 27 nakshatras, horoscope explainer, the Astrology Library |
| `parrot-plus.html` | Free vs Parrot+, crowns and boosts, billing |
| `safety.html` | Safety centre, tips, community guidelines (`#guidelines`), reporting |
| `about.html` | Why a parrot, values, cast, the YouTube video, company |
| `help.html` | FAQ and contact |
| `privacy.html`, `terms.html`, `delete-account.html` | Legal pages (from the app's texts). Google Play needs `delete-account.html` |
| `tests/love-bird.html` | "Which love bird are you?" (Parrot Tests sub-brand, no dating wording) |
| `tests/love-bird/<bird>.html` | One static page per result, so a shared link previews that bird |
| `tests/<test_id>.html` | All 90 of the app's tests, one page each. 18 are listed on the site; the rest open from a link shared in the app (`?r=vh\|h\|m\|l\|vl\|u` shows the friend's result) |
| `tests/texting-style.html` | Redirects to `communication_texting_style.html` |
| `app-ads.txt` | AdMob verification. It must stay in the site root |

## Editing

The root `*.html` pages (except the tests) are **generated**:

- Edit `src/layout.html` (header and footer) or `src/pages/*.html` (page content).
- Then run `python tools/build_pages.py`.

| Script | Purpose |
|---|---|
| `tools/build_pages.py` | layout + pages → root HTML. It adds `loading="lazy"` to every image below the header |
| `tools/export-tests/` | A C# console that links the app's test sources and writes `tools/tests-data.json` (all 90 tests + result texts). Run `dotnet run -c Release` inside it |
| `tools/build_all_tests.py` | The 90 test pages, their OG images, the open-tests grid and the catalog (open vs "In the app") |
| `tools/gen_catalog.py` | The Astrology Library list (`src/partials/astro-library.html`) |
| `tools/gen_astro_data.py` | Pop-up data from the app's library articles: 27 nakshatras and 15 sections |
| `tools/animate.py` | Kling loops → transparent WebM (mascots) or small MP4 (scenes) plus posters |
| `tools/measure.py` | Section heights on phone and desktop (keep every block within one screen) |
| `tools/love_bird.py` | The love bird test content and a balance check (`python tools/love_bird.py` prints how often each bird wins) |
| `tools/build_tests.py` | Quiz data JS, share images (`assets/share/`) and per-result pages, all from `love_bird.py` |
| `tools/process_art.py` | Generated art (white background) → cut-out WebP in `assets/img/` |
| `tools/build_assets.py` | Copies and compresses the app's own stickers (tests, astrology, nakshatras, 3D cast) |
| `tools/shoot.py` | Desktop and phone screenshots into `screenshots/` for review |

## Hosting

- **www.shaadiparrot.com is served by Vercel from this repo's `main` branch.** The bare domain redirects to www. Pushing to `main` publishes the site: don't push anything that isn't ready.
- `app-ads.txt` (AdMob) and `.well-known/assetlinks.json` (Android App Links, with the Play app-signing SHA-256 of `com.shaadiparrot.app`) must stay at the root. `.nojekyll` only matters if the site ever moves to GitHub Pages.
- For App Links to actually open the app, the Android app also needs an `intent-filter` with `android:autoVerify="true"` for `https://www.shaadiparrot.com` in its manifest.
- OG tags and share links use `https://www.shaadiparrot.com` (`SITE` in `tools/build_tests.py`, `og:` tags in `src/layout.html`).
- Every Google Play link carries an install referrer (`utm_source=website|parrot_tests`, `utm_medium=<page>`), so Play Console shows which page an install came from.
- The ad video (`assets/video/still-swiping.mp4`, about 1 MB) plays muted only while it is on screen, and never on Save-Data or reduced motion.

## Tests funnel

- The web result shows the label, where you sit on the scale, the summary, one strength and one real-life line.
- The rest of the app's result (behaviours, blind spots, more real-life moments, tips) appears as a locked card with "Unlock it free in the app".
- After that come "Compare with a friend on WhatsApp" and the "Three fates are waiting" card, both linking to Google Play.
- The app's test result screen has a "Share with a friend" button (`Views/TestResultPage.xaml`) that sends `https://www.shaadiparrot.com/tests/<id>.html?r=<code>`.

## Type

Baloo 2 (the banner's rounded face) is used only for brand moments: the hero title, the slogan, the wordmark, finale headlines and the Parrot Tests wordmark. All other headings use Plus Jakarta Sans 800.
