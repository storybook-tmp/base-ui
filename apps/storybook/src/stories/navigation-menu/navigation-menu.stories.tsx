import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import theme from '@droppy/theme';
import './navigation-menu.demo.css';

/**
 * Stories follow research/c-components/navigation-menu (Tier 1): the kept docs
 * demos (hero, nested submenu, nested inline submenu), one story per documented
 * use case with the required viewport-morph and keyboard interaction coverage,
 * plus real-world recreations picked from the code-ok top set in
 * research/d-real-world-usage/navigation-menu/ranked.json.
 *
 * Portal note: the popup subtree mounts on document.body, so plays query via
 * `within(canvasElement.ownerDocument.body)`. Plays prefer click over hover —
 * hover intent (safePolygon + 50ms delay) is timing-sensitive; the two stories
 * that exist to document hover behavior are the only ones that hover.
 */
const meta = {
  title: 'Navigation/Navigation Menu',
  component: NavigationMenu.Root,
  subcomponents: {
    'NavigationMenu.List': NavigationMenu.List,
    'NavigationMenu.Item': NavigationMenu.Item,
    'NavigationMenu.Trigger': NavigationMenu.Trigger,
    'NavigationMenu.Icon': NavigationMenu.Icon,
    'NavigationMenu.Content': NavigationMenu.Content,
    'NavigationMenu.Link': NavigationMenu.Link,
    'NavigationMenu.Portal': NavigationMenu.Portal,
    'NavigationMenu.Backdrop': NavigationMenu.Backdrop,
    'NavigationMenu.Positioner': NavigationMenu.Positioner,
    'NavigationMenu.Popup': NavigationMenu.Popup,
    'NavigationMenu.Viewport': NavigationMenu.Viewport,
    'NavigationMenu.Arrow': NavigationMenu.Arrow,
  },
} satisfies Meta<typeof NavigationMenu.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

/** The full Portal → Positioner → Popup → Viewport chain from the hero demo. */
function Flyout(props: NavigationMenu.Positioner.Props) {
  return (
    <NavigationMenu.Portal>
      <NavigationMenu.Positioner
        className={theme.NavigationMenuPositioner}
        sideOffset={10}
        collisionPadding={{ top: 5, bottom: 5, left: 20, right: 20 }}
        collisionAvoidance={{ side: 'none' }}
        {...props}
      >
        <NavigationMenu.Popup className={theme.NavigationMenuPopup}>
          <NavigationMenu.Arrow className={theme.NavigationMenuArrow} />
          <NavigationMenu.Viewport className={theme.NavigationMenuViewport} />
        </NavigationMenu.Popup>
      </NavigationMenu.Positioner>
    </NavigationMenu.Portal>
  );
}

function Link(props: NavigationMenu.Link.Props) {
  return (
    <NavigationMenu.Link
      render={
        // Use the `render` prop to render your framework's Link component
        // for client-side routing, e.g. `<NextLink href={props.href} />`.
        // The real href always arrives via the `{...props}` spread below.
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a />
      }
      {...props}
    />
  );
}

const overviewLinks = [
  {
    href: '#quick-start',
    title: 'Quick Start',
    description: 'Install and assemble your first component.',
  },
  {
    href: '#accessibility',
    title: 'Accessibility',
    description: 'Learn how we build accessible components.',
  },
  {
    href: '#releases',
    title: 'Releases',
    description: 'See what’s new in the latest versions.',
  },
  {
    href: '#about',
    title: 'About',
    description: 'Learn more about the project and our mission.',
  },
] as const;

const handbookLinks = [
  {
    href: '#styling',
    title: 'Styling',
    description: 'Plain CSS, Tailwind CSS, CSS-in-JS, or CSS Modules.',
  },
  {
    href: '#animation',
    title: 'Animation',
    description: 'CSS transitions, CSS animations, or JS libraries.',
  },
  {
    href: '#composition',
    title: 'Composition',
    description: 'Replace and compose parts with your own components.',
  },
] as const;

function LinkCards({
  links,
}: {
  links: ReadonlyArray<{ href: string; title: string; description: string }>;
}) {
  return (
    <ul className={theme.NavigationMenuFlexLinkList}>
      {links.map((item) => (
        <li key={item.href}>
          <Link className={theme.NavigationMenuLinkCard} href={item.href}>
            <h3 className={theme.NavigationMenuLinkTitle}>{item.title}</h3>
            <p className={theme.NavigationMenuLinkDescription}>{item.description}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Kept docs demos                                                     */
/* ------------------------------------------------------------------ */

/** The docs hero demo: a `<nav>` bar whose triggers open link-card panels in one shared, morphing popup, plus a plain link item — triggers and plain links mix freely in one List. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <NavigationMenu.Root className={theme.NavigationMenuRoot}>
      <NavigationMenu.List className={theme.NavigationMenuList}>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={theme.NavigationMenuTrigger}>
            Overview
            <NavigationMenu.Icon className={theme.NavigationMenuIcon}>
              <CaretDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={theme.NavigationMenuContent}>
            <ul className={theme.NavigationMenuGridLinkList}>
              {overviewLinks.map((item) => (
                <li key={item.href}>
                  <Link className={theme.NavigationMenuLinkCard} href={item.href}>
                    <h3 className={theme.NavigationMenuLinkTitle}>{item.title}</h3>
                    <p className={theme.NavigationMenuLinkDescription}>{item.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={theme.NavigationMenuTrigger}>
            Handbook
            <NavigationMenu.Icon className={theme.NavigationMenuIcon}>
              <CaretDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={theme.NavigationMenuContent}>
            <LinkCards links={handbookLinks} />
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <Link
            className={theme.NavigationMenuTrigger}
            href="#github"
            onClick={(event) => event.preventDefault()}
          >
            GitHub
          </Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <Flyout />
    </NavigationMenu.Root>
  ),
};

function NestedPopupSubmenuExample() {
  return (
    <NavigationMenu.Root className={theme.NavigationMenuRoot} aria-label="Main">
      <NavigationMenu.List className={theme.NavigationMenuList}>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={theme.NavigationMenuTrigger}>
            Overview
            <NavigationMenu.Icon className={theme.NavigationMenuIcon}>
              <CaretDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={theme.NavigationMenuContent}>
            <ul className={theme.NavigationMenuFlexLinkList}>
              {overviewLinks.slice(0, 2).map((item) => (
                <li key={item.href}>
                  <Link className={theme.NavigationMenuLinkCard} href={item.href}>
                    <h3 className={theme.NavigationMenuLinkTitle}>{item.title}</h3>
                    <p className={theme.NavigationMenuLinkDescription}>{item.description}</p>
                  </Link>
                </li>
              ))}
              <li>
                {/* A full nested Root (renders <div>, not <nav>) opens a second
                    flyout beside the first and shares its dismissal tree. */}
                <NavigationMenu.Root orientation="vertical">
                  <NavigationMenu.List>
                    <NavigationMenu.Item>
                      <NavigationMenu.Trigger className={theme.NavigationMenuLinkCard}>
                        <span className={theme.NavigationMenuLinkTitle}>Handbook</span>
                        <p className={theme.NavigationMenuLinkDescription}>
                          How to use the library effectively.
                        </p>
                        <NavigationMenu.Icon className="NavDemoNestedIcon">
                          <CaretRightIcon />
                        </NavigationMenu.Icon>
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content className={theme.NavigationMenuContent}>
                        <LinkCards links={handbookLinks} />
                      </NavigationMenu.Content>
                    </NavigationMenu.Item>
                  </NavigationMenu.List>

                  <NavigationMenu.Portal>
                    <NavigationMenu.Positioner
                      className={theme.NavigationMenuPositioner}
                      sideOffset={8}
                      alignOffset={-8}
                      align="end"
                      side="right"
                    >
                      {/* Distinguishes this nested flyout's <nav> landmark from the
                          outer Flyout's (both render <nav> with no other differentiator). */}
                      <NavigationMenu.Popup
                        className={theme.NavigationMenuPopup}
                        aria-label="Handbook"
                      >
                        <NavigationMenu.Viewport className={theme.NavigationMenuViewport} />
                      </NavigationMenu.Popup>
                    </NavigationMenu.Positioner>
                  </NavigationMenu.Portal>
                </NavigationMenu.Root>
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <Flyout collisionAvoidance={undefined} />
    </NavigationMenu.Root>
  );
}

/** The docs "Nested submenus" demo: a nested vertical `Root` with its own Portal/Positioner inside a parent `Content` opens a second flyout beside the first — both share one FloatingTree so dismissal propagates ([#2978](https://github.com/mui/base-ui/pull/2978)). */
export const NestedPopupSubmenu: Story = {
  tags: ['highlight', 'base'],
  render: () => <NestedPopupSubmenuExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Overview' }));
    await waitFor(() => expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible());

    // The nested trigger lives inside the first popup's panel.
    const nestedTrigger = body.getByRole('button', { name: /Handbook/ });
    await userEvent.click(nestedTrigger);

    // A second flyout opens beside the first; the parent panel stays open.
    await waitFor(() => expect(body.getByRole('link', { name: /Styling/ })).toBeVisible());
    await expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible();
    await expect(nestedTrigger).toHaveAttribute('aria-expanded', 'true');
  },
};

const audienceMenus = [
  {
    value: 'developers',
    label: 'For developers',
    hint: 'APIs and integration guides',
    title: 'Build on the platform',
    links: [
      { href: '#components', title: 'Components', description: 'Composable building blocks.' },
      { href: '#hooks', title: 'Hooks', description: 'Headless state and behavior.' },
    ],
  },
  {
    value: 'designers',
    label: 'For designers',
    hint: 'Kits, tokens, and specs',
    title: 'Design with the system',
    links: [
      { href: '#figma-kit', title: 'Figma kit', description: 'Every part, every state.' },
      { href: '#tokens', title: 'Design tokens', description: 'Color, type, and spacing.' },
    ],
  },
] as const;

function NestedInlineSubmenuExample() {
  return (
    <NavigationMenu.Root className={theme.NavigationMenuRoot} aria-label="Main">
      <NavigationMenu.List className={theme.NavigationMenuList}>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={theme.NavigationMenuTrigger}>
            Product
            <NavigationMenu.Icon className={theme.NavigationMenuIcon}>
              <CaretDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={`${theme.NavigationMenuContent} NavDemoInlineContent`}>
            {/* Inline mode: the nested Root renders only List + Viewport with a
                defaultValue — content swaps inside the parent's panel with no
                new Portal/Positioner/Popup (#2269). */}
            <NavigationMenu.Root orientation="vertical" defaultValue="developers">
              <div className="NavDemoSubmenuLayout">
                <NavigationMenu.List className="NavDemoSubmenuList">
                  {audienceMenus.map((menu) => (
                    <NavigationMenu.Item key={menu.value} value={menu.value}>
                      <NavigationMenu.Trigger className="NavDemoSubmenuTrigger">
                        <span className="NavDemoSubmenuLabel">{menu.label}</span>
                        <span className="NavDemoSubmenuHint">{menu.hint}</span>
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content className="NavDemoSubmenuContent">
                        <h4 className="NavDemoSubmenuTitle">{menu.title}</h4>
                        <ul className="NavDemoLinkList">
                          {menu.links.map((link) => (
                            <li key={link.href}>
                              <Link className={theme.NavigationMenuLinkCard} href={link.href}>
                                <h5 className={theme.NavigationMenuLinkTitle}>{link.title}</h5>
                                <p className={theme.NavigationMenuLinkDescription}>
                                  {link.description}
                                </p>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenu.Content>
                    </NavigationMenu.Item>
                  ))}
                </NavigationMenu.List>

                <NavigationMenu.Viewport className="NavDemoSubmenuViewport" />
              </div>
            </NavigationMenu.Root>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <Link className={theme.NavigationMenuTrigger} href="#releases">
            Releases
          </Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <Flyout />
    </NavigationMenu.Root>
  );
}

/** The docs "Nested inline submenus" demo: Portal/Positioner/Popup are optional as a group — a nested `Root` rendering only `List` + `Viewport` (with `defaultValue`) swaps second-level content in place inside the parent panel. */
export const NestedInlineSubmenu: Story = {
  tags: ['highlight', 'base'],
  render: () => <NestedInlineSubmenuExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Product' }));
    // defaultValue renders the developers panel immediately.
    await waitFor(() => expect(body.getByRole('link', { name: /Components/ })).toBeVisible());

    // Exactly two <nav> landmarks: the Root bar and the portalled Popup.
    // The inline nested Root renders a <div> and adds no popup.
    const navCountWhileOpen = doc.querySelectorAll('nav').length;
    await expect(navCountWhileOpen).toBe(2);

    // Switching to the second inline trigger swaps content in place.
    await userEvent.click(body.getByRole('button', { name: /For designers/ }));
    await waitFor(() => expect(body.getByRole('link', { name: /Figma kit/ })).toBeVisible());
    await waitFor(() =>
      expect(body.queryByRole('link', { name: /Components/ })).not.toBeInTheDocument(),
    );
    await expect(doc.querySelectorAll('nav').length).toBe(navCountWhileOpen);
  },
};

/* ------------------------------------------------------------------ */
/* Behavior stories (one per documented use case)                      */

function AnimatedExample() {
  const [exitCount, setExitCount] = React.useState(0);
  return (
    <div className="NavDemoStack">
      <NavigationMenu.Root
        className={theme.NavigationMenuRoot}
        onOpenChangeComplete={(open) => {
          if (!open) {
            setExitCount((count) => count + 1);
          }
        }}
      >
        <NavigationMenu.List className={theme.NavigationMenuList}>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger className={theme.NavigationMenuTrigger}>
              Overview
              <NavigationMenu.Icon className={theme.NavigationMenuIcon}>
                <CaretDownIcon />
              </NavigationMenu.Icon>
            </NavigationMenu.Trigger>
            <NavigationMenu.Content
              className={`${theme.NavigationMenuContent} NavDemoContentNarrow`}
            >
              <LinkCards links={overviewLinks.slice(0, 2)} />
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger className={theme.NavigationMenuTrigger}>
              Handbook
              <NavigationMenu.Icon className={theme.NavigationMenuIcon}>
                <CaretDownIcon />
              </NavigationMenu.Icon>
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className={`${theme.NavigationMenuContent} NavDemoContentWide`}>
              <LinkCards links={handbookLinks} />
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <Flyout />
      </NavigationMenu.Root>
      <output className="NavDemoOutput">exit transitions completed: {exitCount}</output>
    </div>
  );
}

/** The animation contract: Popup/Content expose `data-open`/`data-starting-style`/`data-ending-style` (+ `data-activation-direction` on Content, `data-instant` on the Positioner), the popup CSS transitions the size variables, and `onOpenChangeComplete(false)` fires only after the exit transition settles. */
export const AnimatedMorphTransition: Story = {
  tags: ['animation'],
  render: () => <AnimatedExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Overview' });

    await userEvent.click(trigger);
    await waitFor(() => expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible());
    await expect(canvas.getByText('exit transitions completed: 0')).toBeVisible();

    // Escape starts the exit transition; completion is reported asynchronously
    // after CSS transitions finish, then the popup unmounts.
    await userEvent.keyboard('{Escape}');
    await expect(await canvas.findByText('exit transitions completed: 1')).toBeVisible();
    await waitFor(() =>
      expect(body.queryByRole('link', { name: /Quick Start/ })).not.toBeInTheDocument(),
    );
  },
};

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/navigation-menu) */
/* ------------------------------------------------------------------ */

type CmsNavEntry =
  | { type: 'link'; label: string; href: string }
  | {
      type: 'group';
      label: string;
      items: ReadonlyArray<{ href: string; title: string; description: string }>;
    };

/* ------------------------------------------------------------------ */
/* Icons (inlined — stories must not import docs assets)               */
/* ------------------------------------------------------------------ */

function CaretDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 6H4l4 4.5z" />
    </svg>
  );
}

function CaretRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M6 12V4l4.5 4z" />
    </svg>
  );
}
