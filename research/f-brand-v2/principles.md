# Mealdrop brand principles

Rules an agent needs to reproduce Mealdrop's *feel* on Base UI. Values live in [tokens.json](./tokens.json) — this file only says things values can't. Source of truth: the Mealdrop codebase (`main`); citations are `file:line` in `yannbf/mealdrop`.

## The feel

A quiet, friendly interface. Grey carries almost everything; two pale accents mark the good moments; all the personality lives in the brand mark, the loading states, and the copy. Nothing shouts — not even the primary button.

## Principles

1. **Grey does the work; color marks moments.** ~80% of the UI is the neutral ramp — every surface, every text, even the primary CTA. Green appears at ≤5 sites in the whole app, always meaning "good news or progress" (new-restaurant tag, promo banners, checkout progress). If a screen has more than one green moment, one of them is wrong.

2. **The accents are surfaces, not ink.** Green (~1.1:1 vs white) and blue are backgrounds that carry dark text (~12:1) — they physically cannot draw a line. Never use them as text, border, ring, or icon color. The two exceptions are deliberate and blue-only: the focus ring and review-star text, both using blue's *dark* ends.

3. **The brand color belongs to the mascot, not the interface.** Mealdrop's true identity color — the logo/spinner teal — never appears in UI chrome. Personality is concentrated where the product talks *about itself*: the animated logo, the bespoke spinner ("Looking for some food..."), Lottie illustrations on error/empty states, casual sentence-case copy. Components stay plain so those moments can be charming.

4. **Buttons are body text with a background.** Buttons set in the body face (Hind), regular weight — never the heading face, never bold, never uppercase. A CTA earns attention through its fill, not its typography.

5. **Dark mode re-decides roles; it doesn't invert.** The primary button changes *personality* between themes: neutral ink in light, branded green in dark — and green simultaneously leaves the highlight surfaces. Any generator that tone-maps light→dark will get this wrong. Both semantic layers are defined in full, independently (Mealdrop's own dark theme spreads light and forgets overrides — see gotchas).

6. **Elevation means floating, never important.** Shadows appear only on things that hover above the page: modals/sidebars (`shadow.overlay`) and the food-card hover lift. Resting cards are flat — separated by background shifts (`surface.card` on `surface.page`), not shadows.

7. **Hierarchy is size, not color.** All four heading levels are the same ink; h1/h2 add tight tracking (-2px). Emphasis within text is weight (`medium`), a size step down for chrome text — never a color change, except `text.error`.

8. **Sentence case, enforced by CSS.** Nothing is ever uppercased or title-cased. Labels are written lowercase in source and CSS capitalizes the first letter (`::first-letter`); badges use `text-transform: capitalize`. Writers write sentences; the stylesheet does the rest.

9. **One focus ring, everywhere.** The two-layer blue ring (1px ring + 4px halo) is the single focus treatment, shared verbatim by button, input, and select. It is also blue's main job in the interface. Don't invent per-component focus styles.

10. **Chrome is tight, content is airy.** Controls pad snugly (~13–16px); card and modal interiors pad `space.sm` (24px) or more — a decision area gets breathing room, a control doesn't. The app's real rhythm is 8/16/24px.

11. **Radius follows floatiness, not size.** A 4-rung ladder: controls 4px → content cards 8px → sheets/modals 16px → pills 32px / fully round. Nothing sits between rungs. Card images take the card's radius on their touching corners only (8/8/0/0 over 0/0/8/8) — image and panel are complementary halves of one shape.

12. **Motion is brief, functional, and ease-in.** Interactions run 150–300ms; the whole app cross-fades 250ms on theme switch (a feature, keep it). Long/ambient motion is a marketing-surface indulgence (the 60s homepage pan); character animation (staggered logo shine) belongs to the brand mark only.

## Gotchas — where the codebase will lie to you

- **The theme's font token is dead.** `theme.fonts.family = 'NunitoSans'` has zero consumers; the real faces (Montserrat/Hind) are hardcoded per component. Trust the render, not the token.
- **The brand teal is invisible to the theme.** It exists only as literals in `Logo.tsx` / `Spinner.tsx`. Anyone extracting "the palette" from `theme.ts` misses the brand color entirely.
- **The dark theme has inheritance bugs, not decisions.** `darkTheme` spreads light and overrides ~35 of ~47 keys. `secondaryText` (≈2.3:1) and `error` (≈2.3:1) land on dark surfaces by accident. v2 fixes both (see Departures) — don't copy the bug.
- **Five theme tokens are dead** (`accentText`, `buttonSecondary`, `buttonSecondaryHover`, `bannerText`, `sidebarHeader`) — there is no secondary button variant in the app, whatever the theme implies. `bannerText`'s own comment points at the wrong component.
- **Some components bypass theming entirely**: `IconButton` (carousel arrows stay light-mode pills in dark), the global CSS reset (`* { color: #2c2c2c }`), the cart-quantity chip (black/white on purpose — the one intentional bypass, kept as `chip.contrast.*`).
- **The type scale has one off-step**: everything is ×1.25 from 1.125rem body, except `sm` (1rem) — deliberate small-body size, don't "fix" it.
- **The spacing theme lies by omission**: the theme's 20px step is used 4×; raw `1.5rem`/24px appears 12+ times. The de-facto rhythm is 8/16/24 — v2 tokenizes that.

## Departures from the raw code

Everything else above is Mealdrop verbatim. These five are deliberate changes, made for consistency/accessibility — flag any objection:

| # | Departure | Why |
|---|---|---|
| 1 | Spacing `em` → `rem`; 20px step folded into a 24px step | em made computed space depend on local font-size; 24px is what components actually use |
| 2 | `text.secondary` and `text.error` get real dark values (`neutral.400`, `red.300`) | both inherit light values in Mealdrop's dark theme at ≈2.3:1 — an accident, not a choice |
| 3 | Brand teal promoted into the palette (constrained by rule 3) | it's the identity color; leaving it hardcoded in two components is how it got lost |
| 4 | Dead tokens dropped (radius 24/40, `shadow.inner`, breakpoint 400, unused ramp steps) | zero consumers; a cleaner scale is the brief |
| 5 | Card hover unified as opacity-dim; lift (`shadow.lift`) reserved for the food-card pattern | Mealdrop's three card components use three different hover treatments; 2-of-3 use dim |
