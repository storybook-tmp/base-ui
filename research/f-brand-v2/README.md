# Mealdrop brand extraction — v2

Supersedes [`../f-brand/`](../f-brand/) (rejected 20 Jul 2026: it restated values instead of stating principles). Do not consume v1.

Extracted fresh from the Mealdrop codebase (`yannbf/mealdrop` @ `main`, 20 Jul 2026) — two full-codebase analysis passes (value inventory + design-intent), synthesized by hand.

| File | What it is |
|---|---|
| [`principles.md`](./principles.md) | 12 conceptual rules + the gotchas that will trip up a re-implementer + 5 flagged departures |
| [`tokens.json`](./tokens.json) | Normalized primitive scales (color, type, space, radius, shadow, motion, breakpoints) + role-based semantic layer with light/dark defined in full and traceability to Mealdrop's original theme keys |

## Ground rules for consumers (theme generation / A2)

- Components consume **semantic** tokens only, never primitives — Mealdrop itself never leaks raw palette names into components.
- Define light and dark semantic layers **in full**; never derive one from the other (principles rule 5).
- Apply Mealdrop rules where they fit Base UI; on a genuine clash, **stop and ask Yann** (his standing instruction, 20 Jul).
- Target: a **Mealdrop-flavored Base UI** — the end state is Mealdrop with its basic components swapped for the themed Base UI DS, looking as close to the original as possible.
