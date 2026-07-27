# Clashes — Mealdrop rules vs Base UI Storybook patterns

Places where a Mealdrop rule could not map 1:1 onto a Base UI demo pattern. Each got the
closest neutral-first interpretation; nothing here is a silently invented brand decision.
Format: component | clash | what was chosen.

## Global (apply across many modules — recorded once)

- all controls | Mealdrop defines no pressed/active state (only hover) | pressed = hover (`action.subtleHover` / `action.primaryHover`)
- all controls | no disabled token exists | disabled text/border → `text.hint` + `border.subtle`; filled-disabled → `surface.sunken` + `text.hint`
- dialog, drawer, alert-dialog | backdrop scrims need alpha; no scrim token | raw `rgb(0 0 0 / N%)` values kept

## Recurring gap: no status surfaces/inks (success, danger, warning, info)

- meter | Low/High value-tier fills have no success/danger surface tokens | Low → `surface.highlight`, High → `text.error` reused as fill
- alert-dialog | destructive button would sit on `action.primary` fill — green in dark mode, wrong register for a destructive action | `text.error` kept as ink only; contrast risk flagged
- menu | `.DangerItem` highlighted state was solid red bg + white text; no error-surface token | red kept ink-only (`text.error`), highlight bg → `action.subtleHover`
- toast | success/info/warning inks (green/blue/orange) have no Mealdrop equivalents | all status inks → `text.primary`
- input, field | `[data-valid]` green validation border/badge is banned ink (rule 2) | valid state → neutral `text.primary`

## Demo-specific

- drawer | `.IndentBackground` intentionally flips black↔light-grey between modes; no token expresses that | `surface.inverse` in both modes (flip dropped)
- drawer | `.SwipeAreaStrip` used a 60%-alpha tint | solid `action.subtleHover`
- dialog | scrollbar track's translucent wash needs alpha | track kept raw; thumb tokenized (`border.subtle`)
- scroll-area | track/corner scrims need alpha (opaque `border.subtle` would merge track and thumb); ViewportFade mask uses alpha-only keywords | raw rgb/mask literals kept
- autocomplete-real-world | "nova" skin is a fixed dark identity with no token | `surface.inverse` + `text.onInverse`; no longer visually distinct in dark mode
- select-real-world | ThemeCard light/system previews need an always-light surface token that doesn't exist | theme-reactive `surface.page`; light and system previews now render identically
- collapsible | `.Trigger` is a disclosure control, but the baseline-button rule makes it a primary-CTA fill | applied as specified; flagged — likely wants ghost treatment
- direction-provider | `[data-odd]` dashed-border variant: `border: none` would erase the demo's point | kept as outlined secondary (dashed `border.subtle`)
- shared/MiniPlayground | Prism syntax highlighting used 8 hues — all banned ink | collapsed to `text.primary` / `text.secondary` / `text.hint`
- shared/InTheWild | orange flagged-badge + blue located-badge inks; 85–90%-alpha floating surfaces | badges → `text.primary`; surfaces flattened to opaque `surface.overlay`; ViewerToggleButton pressed → `action.primary`
- shared/ComponentBrowser | blue hover border accent | → `text.primary` ink; hover shadow → `shadow.lift`
- tooltip, preview-card | Mealdrop has no tooltip pattern; `shadow.overlay` is comically heavy at that size | small floaters use `shadow.lift` instead
- popover | stylelint flags the pre-existing `composes: Button` (CSS Modules syntax) | pre-existing issue, unrelated to the theme — left as-is

## Recommend new tokens?

The recurring cluster above is one gap: Mealdrop has no status system beyond `text.error`.
If the themed DS should express component states Mealdrop never had, tokens.json wants:

- status surfaces + inks for success, danger, warning, info (surface + on-surface pairs, light and dark)
- an always-light surface (theme-preview cards, artwork wells) — the mirror of the existing always-dark `surface.inverse`
- optionally: a scrim token (alpha black for backdrops) and a pressed step one rung past hover

Left for Yann to decide — inventing them here would violate the extraction's ground rules.
