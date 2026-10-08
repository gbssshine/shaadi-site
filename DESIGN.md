# Shaadi Parrot site — design brief

## Subject, audience, job

- **Subject:** Shaadi Parrot, an Android dating app for India built around shaadi and Vedic astrology. Mithu, a red parrot in a golden turban, reads your fate.
- **Audience:** Indian 20–32 year olds on budget Android phones and mobile data, and friends who arrive via a shared test link.
- **Main page job:** make someone feel "this is different from swiping" in ten seconds, then send them to Google Play.
- **Test pages job:** let someone finish a fun test in two minutes without installing anything and without anything on screen that says "dating".

## Direction and metaphor

**"The parrot astrologer's table, in a pink-sky ad."**

Every Indian knows the street parrot astrologer (kili josiyam, tota jyotish): a caged parrot hops out and pulls a fortune card from a row of envelopes. Daily Fates is that ritual made digital. Mithu picks three profiles each day, and you open one.

The look is pinned by the owner's banner and YouTube ad:
- a rose-to-peach sky with soft clouds, glossy hearts and small sparkles;
- chunky rounded two-tone headlines ("Find your" in plum, "destiny" in pink-red);
- tilted polaroid cards, an "It's a match!" pill and a "98% Match" meter.

The site keeps that language and adds one ritual of its own: a row of fortune cards you can open.

## Palette

The names come from the wedding world, and the values were sampled from the banner.

| Token | Hex | Role |
|---|---|---|
| `--sky` | `#F26B7F` | top of the hero sky, active states |
| `--dawn` | `#FDBFA3` | bottom of the sky, warm section tints |
| `--plum` | `#41213E` | all text and headlines ("Find Your" colour in the banner) |
| `--sindoor` | `#E0404F` | primary buttons, the second half of two-tone headlines, meters |
| `--haldi` | `#F4B63F` | turban gold: card backs, stars, small highlights. `--haldi-ink` `#9A6412` for gold text on light backgrounds |
| `--milk` | `#FFF6F1` | page background below the hero, card faces |
| `--blush` | `#FFE3DA` | quiet section bands, borders (`--line` `#F3D6CC`) |

The night band (Moon section) uses `--plum` as background with `--haldi` stars. No blue anywhere in the interface. Birds and characters keep their natural colours (the peacock is allowed to be a peacock).

## Type

- **Display: Baloo 2 (600/800).** Made by Ek Type in Mumbai. It is rounded and chunky like the banner, and it is the same face as the brand plate in the reels. Used for H1/H2, card titles, big numbers and the "Parrot Tests" wordmark. Never for paragraphs.
- **Text: Plus Jakarta Sans (400/600/700).** The app's text face: body, buttons, labels, FAQ.
- **Scale (mobile → desktop):** H1 3.1rem → 5.6rem, line-height 0.92, weight 800, letter-spacing -0.01em. H2 2.2rem → 3.4rem, 800. Card title 1.35rem, 700. Body 1rem/1.6. Small print 0.82rem.
- **Two-tone rule:** a headline may split into plum and sindoor exactly once, like the banner ("Find your / destiny", "Stop swiping. / Start feeling."). This is used for the H1 and the final call to action only. Other headlines stay one colour.

## First screen

```
mobile (375)                         desktop (1280+)
┌──────────────────────────┐        ┌──────────────────────────────────────────────────┐
│ [logo] Shaadi Parrot [Get]│        │ [logo] Shaadi Parrot    Tests  Astrology  [Get app]│
│                          │        │                                                  │
│ Find your                │        │  Find your          ♥   ┌────┐                    │
│ destiny                  │        │  destiny          (MITHU) │ 🙂 │┌────┐             │
│ Stop swiping.            │        │  Stop swiping.    holding │    ││ 🙂 │             │
│ Start feeling.           │        │  Start feeling.   heart   └────┘│    │             │
│ One line on Daily Fates  │        │  One line                 ♥────└────┘             │
│ [Get it on Google Play]  │        │  [Google Play] Android·18+  [98% Match ▓▓▓▓▓▓▓░]  │
│ Free · Android · 18+     │        │  ~~~~~~~~~~~~~~~ clouds ~~~~~~~~~~~~~~~~~~~~~~~~ │
│   ┌──┐  (MITHU)  ┌──┐    │        └──────────────────────────────────────────────────┘
│   │🙂│   heart   │🙂│    │
│ ~~~~~~ clouds ~~~~~~~~~~ │
└──────────────────────────┘
```

On page load:
- the two polaroids swing in from their tilt;
- the heart between them pulses once;
- the meter fills to 98%.

It runs once, never loops, and is skipped under reduced motion.

## Page order and why

1. **Hero:** the banner, brought to life.
2. **A day with Mithu:** how the app works. The steps are ordered by time of day because that is true to the product: the horoscope push at 7:30 AM IST, today's three fates, "Why you match" while swiping, and Parrot AI once you match.
3. **Tests:** 90 tests in 9 categories (sticker grid), plus the featured web test "Which love bird are you?" that runs without the app.
4. **Tonight's Moon (night band):** a live widget that calculates today's Moon nakshatra (sidereal, Lahiri) and shows its sticker, plus chips for the Astrology Library topics.
5. **Watch:** the 18-second ad in a phone frame (opens on YouTube; embeds do not play from file://), with the Ek Tarfa cast and the Instagram link.
6. **Safety:** five concrete facts, no vague promises.
7. **FAQ:** free vs Parrot+, crowns, boosts, astrology, safety, deleting the account.
8. **Final call to action:** the sky again and Mithu waving.
9. **Footer:** Privacy, Terms, Delete account, Safety, Grievance Officer, contact.

```
A day with Mithu (mobile)             Tests (desktop)
┌──────────────────────────┐          ┌──────────────────────────────────────────┐
│ 7:30 AM  ── horoscope    │          │ 90 tests about you and love              │
│   [a_nakshatras] Moon in │          │ ┌───────────────────────┐ ┌──┬──┬──┐     │
│   Rohini today…          │          │ │ WHICH LOVE BIRD       │ │t_│t_│t_│     │
│ Morning  ── three fates  │          │ │ ARE YOU?  12 birds    │ ├──┼──┼──┤     │
│   [▢][▢][▢] tap one      │          │ │ (birds peeking)       │ │t_│t_│t_│     │
│ Swiping  ── why you match│          │ │ [Take the test · 2 min]│ ├──┼──┼──┤     │
│ Matched  ── Parrot AI    │          │ └───────────────────────┘ │t_│t_│t_│     │
│   chat bubbles           │          │ Texting style · web test  └──┴──┴──┘     │
└──────────────────────────┘          └──────────────────────────────────────────┘
```

## One memorable thing

**Three fortune cards (Daily Fates).** Inside "A day with Mithu", three gold-backed cards lie in a row like the parrot astrologer's envelopes, with the line "Mithu picked three. You open one."
- Tapping a card flips it and shows an illustrated profile with its fate reading: an overall score, three short bars and Mithu's one-line verdict.
- The other two cards then say "Opens tomorrow" and "Opens in 2 days". That is the real rule of the feature, one fate a day.

Everything else stays quiet: no fade-up on every section, no parallax.

## Voice

Warm, a little cheeky, Indian-English and not filmy. Short sentences. It talks like a friend who knows astrology, not like a marketer. Mithu gets the jokes, and the product copy stays specific (numbers, times, real feature names).

Rules:
- Never claim face or ID verification; say "photo checks".
- Guna Milan is real now: the app's Daily Fates shows Ashtakoota (36 gunas, 8 kootas, doshas) for every fate, and the site's Kundli match uses the same tables (`assets/js/astro-core.js`, checked by `tools/check_astro.py`). Don't promise more than that (no full kundli reports).

## Test pages ("Parrot Tests")

- Sub-brand "Parrot Tests" with Mithu holding a pencil. "by Shaadi Parrot" appears only in small print at the bottom.
- No word "dating" anywhere on test pages, and no sender name or profile.
- Same sky and type, but lighter: blush background, one question per screen, big tap targets.
- The result card has the bird art, three traits, best match and red flag.
- Sharing:
  - a WhatsApp share with the text "Found this test on insta 🦜 I'm a Swan, what are you?";
  - a pre-rendered share image to save (canvas export is blocked under file://);
  - each result has its own static page with its own OG image (it works once the site is hosted).
- The Google Play link sits at the very bottom: "See who matches your type".

## Check against the template

- *Would any dating landing page get the same design?* The generic version has a phone mockup, three feature cards with icons, testimonials and a pink gradient. What I changed:
  - The feature cards became "A day with Mithu", ordered by real times from the product.
  - The mockup became the fortune-card ritual, taken from kili josiyam.
  - Testimonials are dropped: there are none, and I won't invent them.
- *Numbered 01/02/03?* No. The day timeline is labelled with clock times because order and time are real product facts.
- *Gradient accent as decoration?* The sky gradient is the brand, set by the banner, so it stays in the hero and the final call to action only. The middle of the page is milk and blush, so the pink stays special.
- *Fonts:* Baloo 2 is not the usual choice. It is picked because the reels already use it and because it comes from an Indian foundry.

## Update after owner feedback (same day)

The owner asked for three things:
- the site should look like the banner above all;
- it must be obvious that this is a dating app;
- it should be a multi-page site with the usual dating-app content, plus a tests section, while staying beautiful, with a twist, and enticing.

What changed:
- **Art is in the banner's soft 2D style, not the app's thick-outline stickers.** New art was made with Kling (gpt-image2, the banner as the only reference) on white backgrounds, then cut out locally (`tools/cutout.py`):
  - the hero sky;
  - Mithu in 10 poses;
  - 4 portraits;
  - 12 birds;
  - a rooftop couple scene.

  Hearts in the painted skies were removed (`*_clean.png`), because the HTML draws its own hearts where they don't collide with text. The app's small stickers stay only as icons (test categories, astrology sections, nakshatras).
- **The hero says "The Indian dating app with a parrot astrologer"** above the H1. The lead starts with "Meet Indian singles who want something real".
- **Pages** (the usual dating-app set): Home, How it works, Tests, Astrology, Parrot+, Safety, About, Help, Privacy, Terms, Delete account. There is a shared header and footer (`src/layout.html`), and a mobile menu sheet and bottom dock.
- **The signature stays:** the three fortune cards now come right after the hero on Home, and again inside "A day with Mithu".
- **Real app facts** added from the code:
  - the fate reading sections and "Accept this fate / Skip for now";
  - the intent options;
  - the Daily Parrot Wheel;
  - Parrot+ is monthly and opens every astrology section;
  - crowns and boosts come in packs of three.

## Round 2 (owner feedback, 2026-09-29)

- **Typography:** the owner called the headings "дешевые надписи". Baloo stays only where the banner uses it; every other heading is now Plus Jakarta Sans 800 with tight tracking. Punny inner-page titles were replaced by plain ones ("Parrot+", "Safety centre").
- **Layout:**
  - On phones every block fits one screen: card groups became swipe rails, the test catalog became collapsible categories, long sections were split, and the footer and tables were compacted. `tools/measure.py` checks this.
  - On desktop there are no more short-left-column splits; headings sit on top with the cards in a grid below.
- **Everything that looks tappable is tappable:**
  - nakshatras and library sections open sheets with content from the app's articles;
  - locked tests open an "in the app" sheet;
  - "Accept this fate" goes to Play.
- **Tests:** all 90 exist on the web, 18 are open, and a result funnels into the app.
- **Living images:** Kling v2.5 loops (same first and last frame) of Mithu with the heart, Mithu waving, and the rooftop couple. The mascots are keyed per frame into VP9-alpha WebM; Safari keeps the stills.
- **App icon:** the site logo is the real app icon (`Resources/AppIcon/appicon.png`).

## Round 3 (owner feedback, 2026-09-29, evening)

- **Every block is one full screen, filled.** The hero and every section have `min-height: 100svh` with centred content (legal pages excepted). Art and type scale with the screen, and the base font grows on big monitors (`html { font-size: clamp(16px, 8px + .55vw, 19.5px) }`). On phones, groups of two or three cards stack instead of swiping, because a lone card in a rail looked empty. Rails remain only where stacking would overflow the screen.
- **Tests hub** is now one clear browser: filter chips (Free here · All · 9 categories) over a single grid of cards. Free tests say "Start · 2 min"; the others say "In the app" and open a sheet.
- **Test pages:**
  - an "All tests" exit link;
  - on desktop, a side panel with "what you'll learn / why it matters" from the app's own test texts;
  - number keys answer questions.
- **Instagram button** uses Instagram's own gradient and glyph ("Follow @shaadiparrot on Instagram"), and the YouTube button is red with the play glyph.
- **The Ek Tarfa cast** stands side by side and never overlaps.
- **About:** the video and the cast merged into one block; the thin "company" block was dropped (the footer carries it).

## Free tools (Oct 2026)

Three shareable tools, built to be passed around WhatsApp: **Kundli match** (`kundli-match.html`), **Love luck today** (`love-today.html`) and **Find your rashi** (`moon-sign.html`).

- **Where people find them:** the first item in the desktop nav ("Kundli match", with a heart), the first three chips in the phone's quick row and the menu, a "Check your kundli match · FREE" pill under the Play badge on the home hero, an "Ask Mithu right now" block right after the home hero, and blocks on Astrology and Tests.
- **The tool sits in the hero** on its sky, so the form is the first thing on the phone. One big button per step. Results open below with the share block first.
- **Sharing:** "Share on WhatsApp" sends a 1080x1350 picture drawn in the browser (names, score, Mithu) with the text and a link through the phone's share sheet; without file sharing it opens WhatsApp with the text. The link goes to a static page per result (`match/<score>.html`, `moon-sign/<nakshatra>.html`) whose preview image shows that result.
- **Truth:** the maths is the app's (Daily Fates) and the reels' (love luck); `tools/check_astro.py` checks both. No invented numbers. Bands: under 18 "Opposites attract?", 18+ good, 25+ very good, above 32 rare, with the usual-minimum line.
- **No app dock** on the tool pages: it covered the share buttons. Each page has its own app card.
