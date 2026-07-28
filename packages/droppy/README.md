# @droppy/theme

Droppy theme for Base UI — a stylesheet plus a class-name lookup object. No component
wrappers: bind the class at every site of use, in feature code.

```bash
npm install "@droppy/theme@https://pkg.pr.new/storybook-tmp/base-ui/@droppy/theme@<sha>"
```

```tsx
// app entry, once:
import '@droppy/theme/styles.css';
```

```tsx
// anywhere in feature code:
import { Select } from '@base-ui/react/select';
import theme from '@droppy/theme';

<Select className={theme.Select} ... />
```

Dark mode: set `data-theme="dark"` on `<html>` (falls back to the system preference when
unset). `theme` has one entry per plain PascalCase class in `styles.css`, named
`{Component}{Part}` after the Base UI part it themes — `theme.Button`, `theme.FieldRoot`,
`theme.DialogPopup`, `theme.AccordionTrigger`, `theme.SwitchThumb`, and so on; see
`src/index.ts` for the full list (mirrors `src/styles.css` 1:1) and Storybook for what each
part looks like — what you see there is what you get from this package.

## Why no component layer (yet)

Class binding happens at every call site, in feature code, with no wrapper hiding it. That
friction is the point: it shows what raw Base UI consumption costs before a design system
layer exists. Composed/variant styling (an icon button's padding, a modal's position, a
drawer's width) is app-level CSS or `styled()` composed at the call site, not a shared
wrapper.

A richer "Droppy" component layer that removes this per-call-site tax is a later phase,
built once that cost is measured.
