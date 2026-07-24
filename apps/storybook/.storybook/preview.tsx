import * as React from 'react';
import type { Preview } from '@storybook/react-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '../src/styles/theme.css';

// TEMP DIAGNOSTIC
function focusGetterName(): string {
  const d = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'focus');
  return d?.get ? `accessor:${d.get.name}` : `data:${typeof d?.value}`;
}
function logFocus(where: string): void {
  const w = window as unknown as { __focusLog?: string[] };
  w.__focusLog ??= [];
  w.__focusLog.push(`${where}: ${focusGetterName()}`);
}

/**
 * Workaround for Storybook 10.5.x crashing Docs (MDX) pages with an uncaught
 * `TypeError: Illegal invocation` on first load — see
 * https://github.com/storybookjs/storybook/issues/35503 (fix pending in
 * https://github.com/storybookjs/storybook/pull/35528). Remove once the bundled
 * Storybook ships that fix.
 *
 * Storybook's focus/test instrumentation (core `test/preview`) replaces
 * `HTMLElement.prototype.focus` with an *accessor* whose getter reads `this.ownerDocument`
 * to select per-element behavior. react-aria's `setupGlobalFocusEvents` (bundled in
 * `@storybook/addon-docs` and run on every Docs page that embeds `<Canvas>` blocks)
 * captures focus the idiomatic way — by reading it off the prototype:
 *
 *     const focus = window.HTMLElement.prototype.focus; // getter runs with `this === HTMLElement.prototype`
 *
 * With the prototype (not a real element) as the receiver, the native `ownerDocument`
 * accessor brand-check throws `Illegal invocation`, so the Docs page fails to mount until a
 * manual refresh (after which the read happens to succeed).
 *
 * Storybook installs that accessor lazily — after `beforeAll`, around first render — so a
 * one-shot patch from preview setup always runs too early to catch it (the property is still
 * a plain native method then). Instead we guard `Object.defineProperty`: whenever an accessor
 * for `focus` is (re)installed on `HTMLElement.prototype`, we immediately re-wrap it so reads
 * *off the prototype* (or any non-element receiver) return a plain callable that never touches
 * `ownerDocument`, while reads off a real element still delegate to Storybook's
 * instrumentation — matching the upstream fix and preserving the vitest addon's focus tracking.
 */
type FocusMethod = (this: HTMLElement, ...args: unknown[]) => unknown;

const hardenedFocusGetters = new WeakSet<() => unknown>();

// Captured up front so re-hardening always uses the real API and never re-enters our guard.
const nativeDefineProperty = Object.defineProperty;

let focusGuardInstalled = false;

function hardenFocusAccessor(proto: HTMLElement): void {
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'focus');
  const originalGet = descriptor?.get;

  // Only an accessor with a getter is at risk; a plain native method is safe as-is.
  if (typeof originalGet !== 'function' || hardenedFocusGetters.has(originalGet)) {
    return;
  }
  const originalSet = descriptor!.set;

  // Capture the currently-installed (instrumented) focus method via a *connected* probe, so
  // we get the real method — not the instrumentation's detached-node no-op — and without ever
  // hitting the throwing prototype-read path.
  const host = document.body ?? document.documentElement;
  const probe = document.createElement('div');
  let installedFocus: FocusMethod;
  try {
    host.appendChild(probe);
    installedFocus = originalGet.call(probe) as FocusMethod;
  } finally {
    probe.remove();
  }

  // Handed back for prototype / non-element reads: a stable callable that forwards to the
  // captured instrumented method when react-aria later `.apply()`s it to a real element.
  function prototypeSafeFocus(this: HTMLElement, ...args: unknown[]): unknown {
    return installedFocus.apply(this, args);
  }

  const hardenedGet = function hardenedFocusGet(this: unknown) {
    // Real element receiver → preserve Storybook's per-element instrumentation.
    if (this instanceof window.HTMLElement) {
      return originalGet.call(this);
    }
    // Prototype / non-element receiver (react-aria's capture-off-prototype) → safe callable.
    return prototypeSafeFocus;
  };
  hardenedFocusGetters.add(hardenedGet);

  nativeDefineProperty(proto, 'focus', {
    configurable: true,
    enumerable: descriptor!.enumerable,
    get: hardenedGet,
    // Let react-aria (and anything else) keep wrapping focus; delegate to the
    // instrumentation's own setter so element reads reflect the new wrapper.
    set(value: FocusMethod) {
      originalSet?.call(this, value);
    },
  });
}

function installFocusInstrumentationGuard(): void {
  if (typeof window === 'undefined' || typeof window.HTMLElement === 'undefined') {
    return;
  }
  const proto = window.HTMLElement.prototype;

  // If the instrumentation already installed its accessor, harden it right away.
  hardenFocusAccessor(proto);

  if (focusGuardInstalled) {
    return;
  }
  focusGuardInstalled = true;

  const guardedDefineProperty = ((
    target: object,
    property: PropertyKey,
    attributes: PropertyDescriptor,
  ): object => {
    const result = nativeDefineProperty(target, property, attributes);
    if (
      target === proto &&
      property === 'focus' &&
      typeof attributes.get === 'function' &&
      !hardenedFocusGetters.has(attributes.get)
    ) {
      // Storybook just (re)installed its instrumented accessor — wrap it before react-aria
      // reads `focus` off the prototype on the first Docs render.
      hardenFocusAccessor(proto);
    }
    return result;
  }) as typeof Object.defineProperty;

  Object.defineProperty = guardedDefineProperty;
}

// Guard as early as possible (module eval) and again once all preview annotations — including
// Storybook's focus instrumentation — have been applied.
logFocus('module-eval:before');
installFocusInstrumentationGuard();
logFocus('module-eval:after');

const withHardenedFocus = (Story: React.ComponentType) => {
  logFocus('decorator-render:before');
  installFocusInstrumentationGuard();
  logFocus('decorator-render:after');
  return <Story />;
};

const preview: Preview = {
  // Re-assert the guard after preview annotations are applied, in case a later realm/reset
  // restored the native `Object.defineProperty`.
  beforeAll() {
    logFocus('beforeAll:before');
    installFocusInstrumentationGuard();
    logFocus('beforeAll:after');
  },

  beforeEach() {
    logFocus('beforeEach:before');
    installFocusInstrumentationGuard();
    logFocus('beforeEach:after');
  },

  // Declares the `theme` global (same key the addon-themes preset registers) with
  // light as the startup theme; also lets iframe URLs override it via
  // &globals=theme:dark.
  initialGlobals: {
    theme: 'light',
  },

  decorators: [
    withHardenedFocus,
    // Toolbar theme picker + `theme` global. Stamps data-theme on <html>, which
    // src/styles/theme.css keys the semantic --ds-color-* vars on.
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
  ],
  parameters: {
    layout: 'centered',

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    docs: {
      // Show top-level section headings only (h2). Components list up to 19 API parts as h3
      // under "API reference", plus many behavior + recreation h3s — including them overflows
      // the sticky TOC and pushes sections like "In the wild" below the fold.
      toc: {
        headingSelector: 'h2',
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },

    options: {
      storySort: {
        order: [
          'Overview',
          ['Introduction', 'Principles', 'Choosing components', 'Brand principles'],
          'BaseUI Patterns',
          [
            'Build a validated form',
            'Choosing an overlay',
            'Pickers: select, combobox, autocomplete',
            'Menus & navigation',
            'Composite keyboard navigation',
            'Animating open and close',
          ],
          'Form inputs',
          'Overlays',
          'Navigation',
          'Disclosure & structure',
          'Actions',
          'Status & display',
          'Utilities',
          'Research',
          [
            'About this research',
            'The brief (PROMPT)',
            'Progress ledger',
            'Final report (SUMMARY)',
          ],
        ],
      },
    },
  },
};

export default preview;
