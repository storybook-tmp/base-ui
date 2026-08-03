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

function CheckboxAndRadioItemsExample() {
  const [showMinimap, setShowMinimap] = React.useState(true);
  const [sort, setSort] = React.useState('date');
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={theme.ContextMenuTrigger} data-testid="trigger">
        Right-click this document
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className={theme.ContextMenuPositioner}>
          <ContextMenu.Popup className={theme.ContextMenuPopup}>
            <ContextMenu.CheckboxItem
              checked={showMinimap}
              onCheckedChange={setShowMinimap}
              className={theme.ContextMenuCheckboxItem}
            >
              <ContextMenu.CheckboxItemIndicator className={theme.ContextMenuCheckboxItemIndicator}>
                <CheckIcon />
              </ContextMenu.CheckboxItemIndicator>
              <span className={theme.ContextMenuCheckboxItemText}>Show Minimap</span>
            </ContextMenu.CheckboxItem>
            <ContextMenu.Separator className={theme.ContextMenuSeparator} />
            <ContextMenu.RadioGroup value={sort} onValueChange={setSort}>
              {['date', 'name', 'type'].map((option) => (
                <ContextMenu.RadioItem
                  key={option}
                  className={theme.ContextMenuRadioItem}
                  value={option}
                >
                  <ContextMenu.RadioItemIndicator className={theme.ContextMenuRadioItemIndicator}>
                    <CheckIcon />
                  </ContextMenu.RadioItemIndicator>
                  <span className={theme.ContextMenuRadioItemText}>
                    Sort by {option[0].toUpperCase() + option.slice(1)}
                  </span>
                </ContextMenu.RadioItem>
              ))}
            </ContextMenu.RadioGroup>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

/**
 * `CheckboxItem`/`RadioItem` are direct re-exports of the Menu parts —
 * identical `role="menuitemcheckbox"`/`"menuitemradio"` semantics and
 * `closeOnClick={false}` default, so several can be toggled without the menu
 * closing each time.
 */
export const CheckboxAndRadioItems: Story = {
  tags: ['highlight'],
  render: () => <CheckboxAndRadioItemsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByTestId('trigger');

    fireEvent.contextMenu(trigger, { clientX: 30, clientY: 30, button: 2 });
    const menu = await body.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());

    const minimap = within(menu).getByRole('menuitemcheckbox', { name: 'Show Minimap' });
    await expect(minimap).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(minimap);
    await waitFor(() => expect(minimap).toHaveAttribute('aria-checked', 'false'));
    // Checkbox items don't close the menu by default (closeOnClick=false).
    await waitFor(() => expect(menu).toBeVisible());

    const nameOption = within(menu).getByRole('menuitemradio', { name: 'Sort by Name' });
    await userEvent.click(nameOption);
    await waitFor(() => expect(nameOption).toHaveAttribute('aria-checked', 'true'));
    const dateOption = within(menu).getByRole('menuitemradio', { name: 'Sort by Date' });
    await expect(dateOption).toHaveAttribute('aria-checked', 'false');
  },
};

/* ------------------------------------------------------------------ */
/* Custom anchor override (#3202 — the explicit prop wins)              */
/* ------------------------------------------------------------------ */

function CustomAnchorOverrideExample() {
  const markerRef = React.useRef<HTMLDivElement>(null);
  return (
    <React.Fragment>
      <ContextMenu.Root>
        <ContextMenu.Trigger className={theme.ContextMenuTrigger} data-testid="trigger">
          Right-click anywhere here
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner
            className={theme.ContextMenuPositioner}
            anchor={markerRef}
            side="top"
          >
            <ContextMenu.Popup className={theme.ContextMenuPopup} data-testid="popup">
              <ContextMenu.Item className={theme.ContextMenuItem}>Add to Library</ContextMenu.Item>
              <ContextMenu.Item className={theme.ContextMenuItem}>Favorite</ContextMenu.Item>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
      <div ref={markerRef} className="ContextMenuDemoMarker" data-testid="marker">
        anchor
      </div>
    </React.Fragment>
  );
}

/**
 * An explicit `anchor` prop on `Positioner` always wins over the automatic
 * pointer-derived anchor — a fix, not the original behavior
 * ([#3202](https://github.com/mui/base-ui/pull/3202) corrected a bug where
 * the explicit prop was silently ignored). Right-clicking anywhere in the
 * trigger area opens the popup at the fixed marker element, not at the click
 * coordinates.
 */
export const CustomAnchorOverride: Story = {
  tags: ['highlight'],
  render: () => <CustomAnchorOverrideExample />,
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByTestId('trigger');
    const marker = canvas.getByTestId('marker');

    // Right-click far from the marker — the popup should still seat at the marker.
    fireEvent.contextMenu(trigger, { clientX: 10, clientY: 10, button: 2 });
    const popup = await body.findByTestId('popup');
    await waitFor(() => expect(popup).toBeVisible());

    const markerRect = marker.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    // The popup is seated at the marker (well above it, not near the click point at 10,10).
    await expect(popupRect.bottom).toBeLessThanOrEqual(markerRect.top + 1);

    fireEvent.click(within(popup).getByRole('menuitem', { name: 'Favorite' }));
    await waitFor(() => expect(popup).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Disabled trigger — native menu allowed                               */

/* ------------------------------------------------------------------ */
/* Long-press (touch) — documented, not played                         */
/* ------------------------------------------------------------------ */

function LongPressDescriptionExample() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={theme.ContextMenuTrigger} data-testid="trigger">
        Long-press this on touch (500ms, cancels on &gt;10px movement)
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className={theme.ContextMenuPositioner}>
          <ContextMenu.Popup className={theme.ContextMenuPopup}>
            <ContextMenu.Item className={theme.ContextMenuItem}>Reply</ContextMenu.Item>
            <ContextMenu.Item className={theme.ContextMenuItem}>Copy</ContextMenu.Item>
            <ContextMenu.Item className={theme.ContextMenuItem}>Delete</ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

/**
 * Long-press mechanics (documented here rather than driven by a `play`
 * function — simulating real touch timing/movement reliably from a
 * synthetic-event play function is out of scope for this story, per the
 * source test suite which exercises this with fake timers, not Testing
 * Library user events): single-touch only; a 500ms `LONG_PRESS_DELAY`
 * (shared with the desktop drag-release grace timer, despite the name
 * suggesting it's touch-only); a 10px movement threshold cancels the
 * long-press to disambiguate a deliberate long-press from a scroll gesture
 * starting under the finger; `WebkitTouchCallout: 'none'` suppresses iOS's
 * native text-selection callout from competing with the custom menu.
 */
export const LongPressDescription: Story = {
  tags: ['highlight'],
  render: () => <LongPressDescriptionExample />,
};

/* ------------------------------------------------------------------ */
/* Group labels                                                        */
/* ------------------------------------------------------------------ */

function GroupLabelsExample() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={theme.ContextMenuTrigger} data-testid="trigger">
        Right-click this file
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className={theme.ContextMenuPositioner}>
          <ContextMenu.Popup className={theme.ContextMenuPopup}>
            <ContextMenu.Group>
              <ContextMenu.GroupLabel className={theme.ContextMenuGroupLabel}>
                File
              </ContextMenu.GroupLabel>
              <ContextMenu.Item className={theme.ContextMenuItem}>Rename</ContextMenu.Item>
              <ContextMenu.Item className={theme.ContextMenuItem}>Duplicate</ContextMenu.Item>
            </ContextMenu.Group>
            <ContextMenu.Separator className={theme.ContextMenuSeparator} />
            <ContextMenu.Group>
              <ContextMenu.GroupLabel className={theme.ContextMenuGroupLabel}>
                Danger
              </ContextMenu.GroupLabel>
              <ContextMenu.Item className={theme.ContextMenuItem}>Delete</ContextMenu.Item>
            </ContextMenu.Group>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

/**
 * `Group` + `GroupLabel` are direct re-exports of the Menu parts — the label
 * is auto-wired via `aria-labelledby` onto the `role="group"` container,
 * unchanged by context-menu parentage.
 */
export const GroupLabels: Story = {
  tags: ['highlight'],
  render: () => <GroupLabelsExample />,
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByTestId('trigger');

    fireEvent.contextMenu(trigger, { clientX: 30, clientY: 30, button: 2 });
    await body.findByRole('menu');

    await waitFor(() => expect(body.getByRole('group', { name: 'File' })).toBeVisible());
    await expect(body.getByRole('group', { name: 'Danger' })).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Link items                                                          */
/* ------------------------------------------------------------------ */

function LinkItemsExample() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={theme.ContextMenuTrigger} data-testid="trigger">
        Right-click this article
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className={theme.ContextMenuPositioner}>
          <ContextMenu.Popup className={theme.ContextMenuPopup}>
            <ContextMenu.LinkItem className={theme.ContextMenuLinkItem} href="#documentation">
              Open documentation
            </ContextMenu.LinkItem>
            <ContextMenu.LinkItem className={theme.ContextMenuLinkItem} href="#shortcuts">
              Keyboard shortcuts
            </ContextMenu.LinkItem>
            <ContextMenu.Separator className={theme.ContextMenuSeparator} />
            <ContextMenu.Item className={theme.ContextMenuItem}>Copy link</ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

/**
 * `LinkItem` is a direct re-export of `Menu.LinkItem` — a real `<a href>`
 * carrying `role="menuitem"`. Like checkbox/radio items, `closeOnClick`
 * defaults to `false` on link items.
 */
export const LinkItems: Story = {
  tags: ['highlight'],
  render: () => <LinkItemsExample />,
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByTestId('trigger');

    fireEvent.contextMenu(trigger, { clientX: 30, clientY: 30, button: 2 });
    const menu = await body.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());

    const docsLink = within(menu).getByRole('menuitem', { name: 'Open documentation' });
    await expect(docsLink.tagName).toBe('A');
    await expect(docsLink).toHaveAttribute('href', '#documentation');
  },
};

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
/* ------------------------------------------------------------------ */

function CloseOnClickConfigurationExample() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={theme.ContextMenuTrigger} data-testid="trigger">
        Right-click this feed item
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className={theme.ContextMenuPositioner}>
          <ContextMenu.Popup className={theme.ContextMenuPopup}>
            <ContextMenu.Item className={theme.ContextMenuItem} closeOnClick={false}>
              Refresh now (stays open)
            </ContextMenu.Item>
            <ContextMenu.Item className={theme.ContextMenuItem}>
              Mark as read (closes)
            </ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

/**
 * `closeOnClick` defaults to `true` on a plain `Item` — override it per item
 * to keep the popup open after activation, identical to Menu's contract
 * since `Item` is a direct re-export.
 */
export const CloseOnClickConfiguration: Story = {
  tags: ['highlight'],
  render: () => <CloseOnClickConfigurationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByTestId('trigger');

    fireEvent.contextMenu(trigger, { clientX: 30, clientY: 30, button: 2 });
    const menu = await body.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());

    const stayOpenItem = within(menu).getByRole('menuitem', { name: 'Refresh now (stays open)' });
    await userEvent.click(stayOpenItem);
    await waitFor(() => expect(menu).toBeVisible());

    const closesItem = within(menu).getByRole('menuitem', { name: 'Mark as read (closes)' });
    await userEvent.click(closesItem);
    await waitFor(() => expect(menu).not.toBeInTheDocument());
  },
};

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

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M13.5 4.5L6 12l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
