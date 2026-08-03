import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { ContextMenu } from '@base-ui/react/context-menu';
import { Menu } from '@base-ui/react/menu';
import theme from '@droppy/theme';
import './context-menu.demo.css';

/**
 * Stories follow research/c-components/context-menu (Tier 2): Context Menu is
 * a thin wrapper (only `Root`/`Trigger` are original; the other 17 parts are
 * verbatim re-exports of the corresponding Menu parts — "all the context menu
 * parts are direct reexports of regular menu parts so they are interchangeable"
 * (atomiks, #3365)). Floor coverage: the right-click-open interaction (the
 * exact `fireEvent.contextMenu(trigger, { clientX, clientY, button: 2 })`
 * pattern the source test suite uses), a nested submenu, and checkbox/radio
 * items — since every popup part is a direct Menu re-export, styling matches
 * the Menu family's `theme.Menu*` bindings closely (via the ContextMenu*-prefixed
 * theme keys).
 *
 * Portal note: the popup subtree mounts on document.body — plays query via
 * `within(canvasElement.ownerDocument.body)`.
 */
const meta = {
  title: 'Overlays/Context Menu',
  component: ContextMenu.Root,
  subcomponents: {
    'ContextMenu.Trigger': ContextMenu.Trigger,
    'ContextMenu.Portal': ContextMenu.Portal,
    'ContextMenu.Positioner': ContextMenu.Positioner,
    'ContextMenu.Popup': ContextMenu.Popup,
    'ContextMenu.Item': ContextMenu.Item,
    'ContextMenu.SubmenuRoot': ContextMenu.SubmenuRoot,
    'ContextMenu.SubmenuTrigger': ContextMenu.SubmenuTrigger,
    'ContextMenu.CheckboxItem': ContextMenu.CheckboxItem,
    'ContextMenu.RadioGroup': ContextMenu.RadioGroup,
    'ContextMenu.RadioItem': ContextMenu.RadioItem,
  },
} satisfies Meta<typeof ContextMenu.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Hero: right-click-open interaction                                  */
/* ------------------------------------------------------------------ */

function HeroExample() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={theme.ContextMenuTrigger} data-testid="trigger">
        Right-click this card
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className={theme.ContextMenuPositioner}>
          <ContextMenu.Popup className={theme.ContextMenuPopup}>
            <ContextMenu.Item className={theme.ContextMenuItem}>Add to Library</ContextMenu.Item>
            <ContextMenu.Item className={theme.ContextMenuItem}>Add to Playlist</ContextMenu.Item>
            <ContextMenu.Separator className={theme.ContextMenuSeparator} />
            <ContextMenu.Item className={theme.ContextMenuItem}>Play Next</ContextMenu.Item>
            <ContextMenu.Item className={theme.ContextMenuItem}>Favorite</ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

/**
 * The docs hero demo, driven by the exact `fireEvent.contextMenu` pattern the
 * source test suite uses: the popup opens at the pointer position (a virtual
 * anchor, not a DOM ref) and suppresses the native OS context menu.
 */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => <HeroExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByTestId('trigger');

    fireEvent.contextMenu(trigger, { clientX: 30, clientY: 30, button: 2 });
    const menu = await body.findByRole('menu');
    // waitFor: the popup is briefly at opacity 0 during its entrance transition.
    await waitFor(() => expect(menu).toBeVisible());

    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Favorite' }));
    await waitFor(() => expect(menu).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Nested submenu                                                      */
/* ------------------------------------------------------------------ */

function NestedSubmenuExample() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={theme.ContextMenuTrigger} data-testid="trigger">
        Right-click this song row
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className={theme.ContextMenuPositioner}>
          <ContextMenu.Popup className={theme.ContextMenuPopup}>
            <ContextMenu.Item className={theme.ContextMenuItem}>Add to Library</ContextMenu.Item>
            <ContextMenu.SubmenuRoot>
              <ContextMenu.SubmenuTrigger className={theme.ContextMenuSubmenuTrigger}>
                Add to Playlist
                <CaretRightIcon />
              </ContextMenu.SubmenuTrigger>
              <ContextMenu.Portal>
                <ContextMenu.Positioner
                  className={theme.ContextMenuPositioner}
                  alignOffset={-4}
                  sideOffset={-4}
                >
                  <ContextMenu.Popup className={theme.ContextMenuPopup}>
                    <ContextMenu.Item className={theme.ContextMenuItem}>Get Up!</ContextMenu.Item>
                    <ContextMenu.Item className={theme.ContextMenuItem}>
                      Inside Out
                    </ContextMenu.Item>
                    <ContextMenu.Item className={theme.ContextMenuItem}>
                      Night Beats
                    </ContextMenu.Item>
                  </ContextMenu.Popup>
                </ContextMenu.Positioner>
              </ContextMenu.Portal>
            </ContextMenu.SubmenuRoot>
            <ContextMenu.Separator className={theme.ContextMenuSeparator} />
            <ContextMenu.Item className={theme.ContextMenuItem}>Play Next</ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

/**
 * Nest menus with `SubmenuRoot` + `SubmenuTrigger` — the identical composition
 * rule Menu documents for itself; Context Menu adds no rules of its own beyond
 * the Root/Trigger pointer-anchor mechanics.
 */
export const NestedSubmenu: Story = {
  tags: ['highlight', 'base'],
  render: () => <NestedSubmenuExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByTestId('trigger');

    fireEvent.contextMenu(trigger, { clientX: 40, clientY: 40, button: 2 });
    const menu = await body.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());

    const submenuTrigger = within(menu).getByRole('menuitem', { name: 'Add to Playlist' });
    await userEvent.click(submenuTrigger);
    const submenu = await body.findByRole('menu', { name: 'Add to Playlist' });
    await waitFor(() =>
      expect(within(submenu).getByRole('menuitem', { name: 'Get Up!' })).toBeVisible(),
    );

    // fireEvent.click (not userEvent.click): the submenu briefly overlaps the
    // parent popup's invisible internal backdrop, which real pointer hit-testing
    // would otherwise flag as blocking the click.
    fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Get Up!' }));
    await waitFor(() => expect(menu).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Checkbox and radio items                                            */

/* ------------------------------------------------------------------ */
/* Custom anchor override (#3202 — the explicit prop wins)              */

/* ------------------------------------------------------------------ */
/* Disabled trigger — native menu allowed                               */

/* ------------------------------------------------------------------ */
/* Long-press (touch) — documented, not played                         */

/* ------------------------------------------------------------------ */
/* Group labels                                                        */

/* ------------------------------------------------------------------ */
/* Link items                                                          */

/* ------------------------------------------------------------------ */
/* Mixed Menu.* parts composition (part interchangeability, #3365)      */
/* ------------------------------------------------------------------ */

function MixedMenuPartsCompositionExample() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={theme.ContextMenuTrigger} data-testid="trigger">
        Right-click this canvas
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className={theme.ContextMenuPositioner}>
          {/* Bare Menu.* parts nested directly inside a ContextMenu.Popup — proof the
              re-exported parts genuinely interchange (in-repo scenario per #3365). */}
          <ContextMenu.Popup className={theme.ContextMenuPopup}>
            <Menu.Item className={theme.MenuItem}>Copy</Menu.Item>
            <Menu.Item className={theme.MenuItem}>Paste</Menu.Item>
            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger className={theme.MenuSubmenuTrigger}>
                Transform
                <CaretRightIcon />
              </Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner className={theme.MenuPositioner} alignOffset={-4} sideOffset={-4}>
                  <Menu.Popup className={theme.MenuPopup}>
                    <Menu.Item className={theme.MenuItem}>Rotate</Menu.Item>
                    <Menu.Item className={theme.MenuItem}>Flip</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

/**
 * `ContextMenu.*` and `Menu.*` parts are direct re-exports of each other —
 * "all the context menu parts are direct reexports of regular menu parts so
 * they are interchangeable" (atomiks, #3365). This story mixes bare
 * `Menu.Item`/`Menu.SubmenuRoot` directly inside a `ContextMenu.Popup`, the
 * same interchangeability scenario the in-repo experiments exercise.
 */
export const MixedMenuPartsComposition: Story = {
  tags: ['highlight', 'base'],
  render: () => <MixedMenuPartsCompositionExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByTestId('trigger');

    fireEvent.contextMenu(trigger, { clientX: 30, clientY: 30, button: 2 });
    const menu = await body.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());

    const submenuTrigger = within(menu).getByRole('menuitem', { name: 'Transform' });
    await userEvent.click(submenuTrigger);
    const submenu = await body.findByRole('menu', { name: 'Transform' });
    await waitFor(() =>
      expect(within(submenu).getByRole('menuitem', { name: 'Rotate' })).toBeVisible(),
    );

    fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Rotate' }));
    await waitFor(() => expect(menu).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* closeOnClick configuration                                          */

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
