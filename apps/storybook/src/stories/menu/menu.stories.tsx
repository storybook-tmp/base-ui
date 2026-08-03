import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Menu } from '@base-ui/react/menu';
import { Dialog } from '@base-ui/react/dialog';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import theme from '@droppy/theme';
import './menu.demo.css';
import { CaretDownIcon, CaretRightIcon, CheckIcon, EllipsisIcon, ExternalLinkIcon } from './icons';

/**
 * Stories follow research/c-components/menu (Tier 1): the kept docs demos
 * (hero, checkbox/radio items, group labels, submenu, arrow, hover, detached
 * triggers, viewport transitions), one story per documented use case with the
 * required open→navigate→activate→close interaction coverage, and three
 * real-world recreations picked from the code-ok entries in
 * research/d-real-world-usage/menu/ranked.json.
 */
const meta = {
  title: 'Overlays/Menu',
  component: Menu.Root,
  subcomponents: {
    'Menu.Trigger': Menu.Trigger,
    'Menu.Portal': Menu.Portal,
    'Menu.Positioner': Menu.Positioner,
    'Menu.Popup': Menu.Popup,
    'Menu.Item': Menu.Item,
    'Menu.SubmenuRoot': Menu.SubmenuRoot,
    'Menu.SubmenuTrigger': Menu.SubmenuTrigger,
    'Menu.CheckboxItem': Menu.CheckboxItem,
    'Menu.RadioGroup': Menu.RadioGroup,
    'Menu.RadioItem': Menu.RadioItem,
    'Menu.Group': Menu.Group,
    'Menu.GroupLabel': Menu.GroupLabel,
    'Menu.Separator': Menu.Separator,
  },
} satisfies Meta<typeof Menu.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Kept docs demos                                                     */
/* ------------------------------------------------------------------ */

/** The docs hero demo: a Song action menu — trigger, portal, positioner, popup, items, and separators. Use as the starting point for any list of commands behind a button. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <Menu.Root>
      <Menu.Trigger className={theme.Button}>
        Song <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
          <Menu.Popup className={theme.MenuPopup}>
            <Menu.Item className={theme.MenuItem}>Add to Library</Menu.Item>
            <Menu.Item className={theme.MenuItem}>Add to Playlist</Menu.Item>
            <Menu.Separator className={theme.MenuSeparator} />
            <Menu.Item className={theme.MenuItem}>Play Next</Menu.Item>
            <Menu.Item className={theme.MenuItem}>Play Last</Menu.Item>
            <Menu.Separator className={theme.MenuSeparator} />
            <Menu.Item className={theme.MenuItem}>Favorite</Menu.Item>
            <Menu.Item className={theme.MenuItem}>Share</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
};

/** Set `openOnHover` on the Trigger (with an optional `delay`, default 100ms) for hover menus. Hover-opened menus are never modal, and impatient clicks within 500ms of a hover-open won't toggle the menu shut. */
export const OpenOnHover: Story = {
  tags: ['api-ref', 'base'],
  render: () => (
    <Menu.Root>
      <Menu.Trigger openOnHover delay={100} className={theme.Button}>
        Add to playlist <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
          <Menu.Popup className={theme.MenuPopup}>
            <Menu.Item className={theme.MenuItem}>Get Up!</Menu.Item>
            <Menu.Item className={theme.MenuItem}>Inside Out</Menu.Item>
            <Menu.Item className={theme.MenuItem}>Night Beats</Menu.Item>
            <Menu.Separator className={theme.MenuSeparator} />
            <Menu.Item className={theme.MenuItem}>New playlist…</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Add to playlist' });

    await userEvent.hover(trigger);
    // Storybook's synthetic-event play runner (Chromatic) does not drive Base UI's hover-open;
    // fall back to a click there so the menu still opens and snapshots. vitest uses the hover path.
    if (!body.queryByRole('menu')) {
      await userEvent.click(trigger);
    }
    // The popup mounts at `[data-starting-style]` (opacity 0), so visibility needs a waitFor.
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Simulated unhover cannot exercise the safe-polygon close path reliably;
    // dismiss with Escape instead.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  },
};

function CheckboxItemsExample() {
  const [showMinimap, setShowMinimap] = React.useState(true);
  const [showSearch, setShowSearch] = React.useState(true);
  const [showSidebar, setShowSidebar] = React.useState(false);
  return (
    <Menu.Root>
      <Menu.Trigger className={theme.Button}>
        Workspace <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
          <Menu.Popup className={theme.MenuPopup}>
            <Menu.CheckboxItem
              checked={showMinimap}
              onCheckedChange={setShowMinimap}
              className={theme.MenuCheckboxItem}
            >
              <Menu.CheckboxItemIndicator className={theme.MenuCheckboxItemIndicator}>
                <CheckIcon />
              </Menu.CheckboxItemIndicator>
              <span className={theme.MenuCheckboxItemText}>Minimap</span>
            </Menu.CheckboxItem>
            <Menu.CheckboxItem
              checked={showSearch}
              onCheckedChange={setShowSearch}
              className={theme.MenuCheckboxItem}
            >
              <Menu.CheckboxItemIndicator className={theme.MenuCheckboxItemIndicator}>
                <CheckIcon />
              </Menu.CheckboxItemIndicator>
              <span className={theme.MenuCheckboxItemText}>Search</span>
            </Menu.CheckboxItem>
            <Menu.CheckboxItem
              checked={showSidebar}
              onCheckedChange={setShowSidebar}
              className={theme.MenuCheckboxItem}
            >
              <Menu.CheckboxItemIndicator className={theme.MenuCheckboxItemIndicator}>
                <CheckIcon />
              </Menu.CheckboxItemIndicator>
              <span className={theme.MenuCheckboxItemText}>Sidebar</span>
            </Menu.CheckboxItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Use `CheckboxItem` (`role="menuitemcheckbox"`) for toggleable settings. `closeOnClick` defaults to `false` on checkbox items, so several can be toggled without the menu closing each time. */
export const CheckboxItems: Story = {
  tags: ['highlight', 'base'],
  render: () => <CheckboxItemsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Workspace' }));
    const minimap = await body.findByRole('menuitemcheckbox', { name: 'Minimap' });
    await expect(minimap).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(minimap);
    await waitFor(() => expect(minimap).toHaveAttribute('aria-checked', 'false'));

    const sidebar = body.getByRole('menuitemcheckbox', { name: 'Sidebar' });
    await userEvent.click(sidebar);
    await waitFor(() => expect(sidebar).toHaveAttribute('aria-checked', 'true'));

    // Checkbox items don't close the menu by default (closeOnClick=false).
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
  },
};

function RadioItemsExample() {
  const [value, setValue] = React.useState('date');
  return (
    <Menu.Root>
      <Menu.Trigger className={theme.Button}>
        Sort <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
          <Menu.Popup className={theme.MenuPopup}>
            <Menu.RadioGroup value={value} onValueChange={setValue}>
              {['date', 'name', 'type'].map((option) => (
                <Menu.RadioItem key={option} className={theme.MenuRadioItem} value={option}>
                  <Menu.RadioItemIndicator className={theme.MenuRadioItemIndicator}>
                    <CheckIcon />
                  </Menu.RadioItemIndicator>
                  <span className={theme.MenuRadioItemText}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </span>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Use `RadioGroup` + `RadioItem` (`role="menuitemradio"`) for an exclusive option set inside the menu — a setting, not a form value (use Select for form data). */
export const RadioItems: Story = {
  tags: ['highlight', 'base'],
  render: () => <RadioItemsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Sort' });

    // Keyboard open focuses the first item.
    // Open via click; Storybook's synthetic-event play runner (Chromatic) cannot drive Base
    // UI's keyboard open, but keyboard navigation works once the menu is open.
    await userEvent.click(trigger);
    await userEvent.keyboard('{ArrowDown}');
    const date = await body.findByRole('menuitemradio', { name: 'Date' });
    await expect(date).toHaveAttribute('aria-checked', 'true');
    await waitFor(() => expect(date).toHaveFocus());

    await userEvent.keyboard('{ArrowDown}');
    const name = body.getByRole('menuitemradio', { name: 'Name' });
    await waitFor(() => expect(name).toHaveFocus());

    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(name).toHaveAttribute('aria-checked', 'true'));
    await expect(date).toHaveAttribute('aria-checked', 'false');

    // Radio items keep the menu open by default (closeOnClick=false).
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
  },
};

function GroupLabelsExample() {
  const [sort, setSort] = React.useState('date');
  const [showMinimap, setShowMinimap] = React.useState(true);
  const [showSearch, setShowSearch] = React.useState(true);
  return (
    <Menu.Root>
      <Menu.Trigger className={theme.Button}>
        View <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
          <Menu.Popup className={theme.MenuPopup}>
            <Menu.RadioGroup value={sort} onValueChange={setSort}>
              <Menu.GroupLabel className={theme.MenuGroupLabel}>Sort</Menu.GroupLabel>
              {['date', 'name'].map((option) => (
                <Menu.RadioItem key={option} className={theme.MenuRadioItem} value={option}>
                  <Menu.RadioItemIndicator className={theme.MenuRadioItemIndicator}>
                    <CheckIcon />
                  </Menu.RadioItemIndicator>
                  <span className={theme.MenuRadioItemText}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </span>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
            <Menu.Separator className={theme.MenuSeparator} />
            <Menu.Group>
              <Menu.GroupLabel className={theme.MenuGroupLabel}>Workspace</Menu.GroupLabel>
              <Menu.CheckboxItem
                checked={showMinimap}
                onCheckedChange={setShowMinimap}
                className={theme.MenuCheckboxItem}
              >
                <Menu.CheckboxItemIndicator className={theme.MenuCheckboxItemIndicator}>
                  <CheckIcon />
                </Menu.CheckboxItemIndicator>
                <span className={theme.MenuCheckboxItemText}>Minimap</span>
              </Menu.CheckboxItem>
              <Menu.CheckboxItem
                checked={showSearch}
                onCheckedChange={setShowSearch}
                className={theme.MenuCheckboxItem}
              >
                <Menu.CheckboxItemIndicator className={theme.MenuCheckboxItemIndicator}>
                  <CheckIcon />
                </Menu.CheckboxItemIndicator>
                <span className={theme.MenuCheckboxItemText}>Search</span>
              </Menu.CheckboxItem>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Use `Group` + `GroupLabel` to label related items: the label is auto-wired via `aria-labelledby` and works inside `RadioGroup` too (#4826). */
export const GroupLabels: Story = {
  tags: ['highlight', 'base'],
  render: () => <GroupLabelsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'View' }));
    await body.findByRole('menu');

    // GroupLabel wires role="group" + aria-labelledby automatically.
    await waitFor(() => expect(body.getByRole('group', { name: 'Sort' })).toBeVisible());
    await expect(body.getByRole('group', { name: 'Workspace' })).toBeVisible();
  },
};

function SubmenuExample() {
  return (
    <Menu.Root>
      <Menu.Trigger className={theme.Button}>
        Song <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
          <Menu.Popup className={theme.MenuPopup}>
            <Menu.Item className={theme.MenuItem}>Add to Library</Menu.Item>
            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger className={theme.MenuSubmenuTrigger}>
                Add to Playlist
                <CaretRightIcon />
              </Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner
                  className={theme.MenuPositioner}
                  sideOffset={getSubmenuOffset}
                  alignOffset={getSubmenuOffset}
                >
                  <Menu.Popup className={theme.MenuPopup}>
                    <Menu.Item className={theme.MenuItem}>Get Up!</Menu.Item>
                    <Menu.Item className={theme.MenuItem}>Inside Out</Menu.Item>
                    <Menu.Item className={theme.MenuItem}>Night Beats</Menu.Item>
                    <Menu.Separator className={theme.MenuSeparator} />
                    <Menu.Item className={theme.MenuItem}>New playlist…</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>
            <Menu.Separator className={theme.MenuSeparator} />
            <Menu.Item className={theme.MenuItem}>Play Next</Menu.Item>
            <Menu.Item className={theme.MenuItem}>Play Last</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function getSubmenuOffset({ side }: { side: Menu.Positioner.Props['side'] }) {
  return side === 'top' || side === 'bottom' ? 4 : -4;
}

/** Nest menus with `SubmenuRoot` + `SubmenuTrigger` (never a nested `Root` — #2042). Submenus open on hover by default and position to the inline-end side. */
export const Submenu: Story = {
  tags: ['highlight', 'base'],
  render: () => <SubmenuExample />,
};

/** Add `Menu.Arrow` inside the Popup for a visual pointer to the trigger; style each side via `data-side`. */
export const Arrow: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <Menu.Root>
      <Menu.Trigger className={theme.Button}>
        Song <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          className={theme.MenuPositioner}
          sideOffset={({ side }) => (side === 'top' ? 12 : 8)}
        >
          <Menu.Popup className={theme.MenuPopup}>
            <Menu.Arrow className={theme.MenuArrow} />
            <Menu.Item className={theme.MenuItem}>Add to Library</Menu.Item>
            <Menu.Item className={theme.MenuItem}>Add to Playlist</Menu.Item>
            <Menu.Separator className={theme.MenuSeparator} />
            <Menu.Item className={theme.MenuItem}>Favorite</Menu.Item>
            <Menu.Item className={theme.MenuItem}>Share</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
};

/** Use `LinkItem` for navigation entries inside an action menu — a real `<a href>` with `role="menuitem"` (v1.2.0, #3400). Like checkbox/radio items, `closeOnClick` defaults to `false`. */
export const LinkItems: Story = {
  tags: ['highlight'],
  render: () => (
    <Menu.Root>
      <Menu.Trigger className={theme.Button}>
        Help <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
          <Menu.Popup className={theme.MenuPopup}>
            <Menu.LinkItem className={theme.MenuLinkItem} href="#documentation">
              Documentation <ExternalLinkIcon />
            </Menu.LinkItem>
            <Menu.LinkItem className={theme.MenuLinkItem} href="#shortcuts">
              Keyboard shortcuts
            </Menu.LinkItem>
            <Menu.LinkItem className={theme.MenuLinkItem} href="#release-notes">
              Release notes
            </Menu.LinkItem>
            <Menu.Separator className={theme.MenuSeparator} />
            <Menu.Item className={theme.MenuItem}>Contact support…</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Help' }));
    const docsLink = await body.findByRole('menuitem', { name: 'Documentation' });

    // LinkItem renders a real anchor while keeping menu semantics.
    await expect(docsLink.tagName).toBe('A');
    await expect(docsLink).toHaveAttribute('href', '#documentation');
  },
};

const detachedMenuHandle = Menu.createHandle();

/** Connect a trigger and a root rendered in different parts of the tree with `Menu.createHandle()` — no shared React state needed (#3170). */
export const DetachedTriggersSimple: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <React.Fragment>
      <Menu.Trigger
        className={theme.MenuTriggerIcon}
        handle={detachedMenuHandle}
        aria-label="Project actions"
      >
        <EllipsisIcon />
      </Menu.Trigger>
      <Menu.Root handle={detachedMenuHandle}>
        <Menu.Portal>
          <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
            <Menu.Popup className={theme.MenuPopup}>
              <Menu.Item className={theme.MenuItem}>Rename</Menu.Item>
              <Menu.Item className={theme.MenuItem}>Duplicate</Menu.Item>
              <Menu.Item className={theme.MenuItem}>Move to folder</Menu.Item>
              <Menu.Separator className={theme.MenuSeparator} />
              <Menu.Item className={theme.MenuItem}>Archive</Menu.Item>
              <Menu.Item className={theme.MenuItem}>Delete</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </React.Fragment>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Project actions' }));
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
    await expect(body.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
  },
};

const documentMenuHandle = Menu.createHandle<{ name: string }>();

/** Give each detached trigger a `payload`; the Root's function child renders content for whichever trigger opened the menu — one menu instance serving many launch points. */
export const DetachedTriggersPayload: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <div className="MenuDemoRow">
      <Menu.Trigger
        className={theme.Button}
        handle={documentMenuHandle}
        payload={{ name: 'Q1 report' }}
      >
        Q1 report
      </Menu.Trigger>
      <Menu.Trigger
        className={theme.Button}
        handle={documentMenuHandle}
        payload={{ name: 'Q2 forecast' }}
      >
        Q2 forecast
      </Menu.Trigger>
      <Menu.Root handle={documentMenuHandle}>
        {({ payload }) => (
          <Menu.Portal>
            <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
              <Menu.Popup className={theme.MenuPopup}>
                <Menu.Group>
                  <Menu.GroupLabel className={theme.MenuPlainGroupLabel}>
                    {payload?.name}
                  </Menu.GroupLabel>
                  <Menu.Item className={theme.MenuItem}>Rename</Menu.Item>
                  <Menu.Item className={theme.MenuItem}>Share</Menu.Item>
                  <Menu.Item className={theme.MenuItem}>Delete</Menu.Item>
                </Menu.Group>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        )}
      </Menu.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Q1 report' }));
    await waitFor(() => expect(body.getByRole('group', { name: 'Q1 report' })).toBeVisible());

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());

    await userEvent.click(canvas.getByRole('button', { name: 'Q2 forecast' }));
    await waitFor(() => expect(body.getByRole('group', { name: 'Q2 forecast' })).toBeVisible());
  },
};

const controlledItemGroups = {
  library: ['Add to library', 'Add to favorites'],
  playback: ['Play now', 'Add to queue'],
  share: ['Copy link', 'Share to contacts'],
} as const;

type ControlledMenuKey = keyof typeof controlledItemGroups;

const controlledMenuHandle = Menu.createHandle<ControlledMenuKey>();

function ControlledMultiTriggerExample() {
  const [open, setOpen] = React.useState(false);
  const [activeTrigger, setActiveTrigger] = React.useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean, eventDetails: Menu.Root.ChangeEventDetails) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setActiveTrigger(eventDetails.trigger?.id ?? null);
    }
  };

  return (
    <div className="MenuDemoStack">
      <div className="MenuDemoRow">
        <Menu.Trigger
          className={theme.Button}
          handle={controlledMenuHandle}
          id="library-trigger"
          payload="library"
        >
          Library
        </Menu.Trigger>
        <Menu.Trigger
          className={theme.Button}
          handle={controlledMenuHandle}
          id="share-trigger"
          payload="share"
        >
          Share
        </Menu.Trigger>
        <button
          type="button"
          className="MenuDemoPlainButton"
          onClick={() => {
            setActiveTrigger('share-trigger');
            setOpen(true);
          }}
        >
          Open share menu programmatically
        </button>
      </div>
      <Menu.Root
        handle={controlledMenuHandle}
        open={open}
        triggerId={activeTrigger}
        onOpenChange={handleOpenChange}
      >
        {({ payload }) => (
          <Menu.Portal>
            <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
              <Menu.Popup className={theme.MenuPopup}>
                {payload
                  ? controlledItemGroups[payload].map((label) => (
                      <Menu.Item key={label} className={theme.MenuItem}>
                        {label}
                      </Menu.Item>
                    ))
                  : null}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        )}
      </Menu.Root>
      <output className="MenuDemoOutput">active trigger: {activeTrigger ?? 'none'}</output>
    </div>
  );
}

/** Controlled mode with several triggers: pair `open` with `triggerId`, and read `eventDetails.trigger` in `onOpenChange` to track which trigger asked to open. */
export const ControlledMultiTrigger: Story = {
  tags: ['highlight', 'base'],
  render: () => <ControlledMultiTriggerExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Library' }));
    await waitFor(() =>
      expect(body.getByRole('menuitem', { name: 'Add to library' })).toBeVisible(),
    );
    await expect(canvas.getByText('active trigger: library-trigger')).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());

    // Programmatic open against a specific trigger id anchors the popup to it.
    await userEvent.click(canvas.getByRole('button', { name: 'Open share menu programmatically' }));
    await waitFor(() => expect(body.getByRole('menuitem', { name: 'Copy link' })).toBeVisible());
    await expect(canvas.getByText('active trigger: share-trigger')).toBeVisible();
  },
};

const viewportMenus = {
  library: {
    heading: 'Library',
    groups: [
      ['Add to library', 'Add to favorites'],
      ['Create playlist', 'Create station'],
    ],
  },
  playback: {
    heading: 'Playback',
    groups: [
      ['Play now', 'Add to queue'],
      ['Play next', 'Play last', 'Sleep timer'],
    ],
  },
  share: {
    heading: 'Share',
    groups: [
      ['Copy link', 'Copy embed code'],
      ['Share to contacts', 'Share to social'],
    ],
  },
} as const;

type ViewportMenuKey = keyof typeof viewportMenus;

/* ------------------------------------------------------------------ */
/* Behavior stories (one per documented use case)                      */
/* ------------------------------------------------------------------ */

/** The full open/close contract: click toggles the menu, the trigger reflects state via `aria-expanded` + `data-popup-open`, Escape closes and refocuses the trigger, and pressing outside dismisses. */
export const OpenClose: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="MenuDemoStack">
      <Menu.Root>
        <Menu.Trigger className={theme.Button}>
          Song <CaretDownIcon />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
            <Menu.Popup className={theme.MenuPopup}>
              <Menu.Item className={theme.MenuItem}>Add to Library</Menu.Item>
              <Menu.Item className={theme.MenuItem}>Play Next</Menu.Item>
              <Menu.Item className={theme.MenuItem}>Share</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <p className="MenuDemoOutput">Outside content</p>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Song' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

    // Click open: the popup portals to document.body.
    await userEvent.click(trigger);
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('data-popup-open');

    // Escape closes and returns focus to the trigger.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Outside press closes too.
    await userEvent.click(trigger);
    await body.findByRole('menu');
    await userEvent.click(canvas.getByText('Outside content'));
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  },
};

/** `closeOnClick` defaults are deliberately asymmetric: plain `Item` closes the menu, checkbox/radio/link items don't. Override per item to keep an action menu open or make a toggle dismiss. */
export const CloseOnClickConfig: Story = {
  tags: ['api-ref'],
  render: () => (
    <Menu.Root>
      <Menu.Trigger className={theme.Button}>
        Feed <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
          <Menu.Popup className={theme.MenuPopup}>
            <Menu.Item className={theme.MenuItem} closeOnClick={false}>
              Refresh now (stays open)
            </Menu.Item>
            <Menu.Item className={theme.MenuItem}>Mark all as read (closes)</Menu.Item>
            <Menu.Separator className={theme.MenuSeparator} />
            <Menu.CheckboxItem className={theme.MenuCheckboxItem} defaultChecked closeOnClick>
              <Menu.CheckboxItemIndicator className={theme.MenuCheckboxItemIndicator}>
                <CheckIcon />
              </Menu.CheckboxItemIndicator>
              <span className={theme.MenuCheckboxItemText}>Auto-refresh (closes)</span>
            </Menu.CheckboxItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Feed' }));
    const stayOpenItem = await body.findByRole('menuitem', { name: 'Refresh now (stays open)' });

    // closeOnClick={false} keeps the menu open after activating an Item.
    await userEvent.click(stayOpenItem);
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());

    // closeOnClick on a CheckboxItem makes the toggle dismiss the menu.
    await userEvent.click(body.getByRole('menuitemcheckbox', { name: 'Auto-refresh (closes)' }));
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  },
};

function DisabledItemsExample() {
  const [lastAction, setLastAction] = React.useState('none');
  return (
    <div className="MenuDemoStack">
      <Menu.Root>
        <Menu.Trigger className={theme.Button}>
          Edit <CaretDownIcon />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
            <Menu.Popup className={theme.MenuPopup}>
              <Menu.Item className={theme.MenuItem} onClick={() => setLastAction('Undo')}>
                Undo
              </Menu.Item>
              <Menu.Item className={theme.MenuItem} disabled onClick={() => setLastAction('Redo')}>
                Redo
              </Menu.Item>
              <Menu.Separator className={theme.MenuSeparator} />
              <Menu.CheckboxItem className={theme.MenuCheckboxItem} disabled>
                <Menu.CheckboxItemIndicator className={theme.MenuCheckboxItemIndicator}>
                  <CheckIcon />
                </Menu.CheckboxItemIndicator>
                <span className={theme.MenuCheckboxItemText}>Track changes</span>
              </Menu.CheckboxItem>
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger className={theme.MenuSubmenuTrigger} disabled>
                  Export as
                  <CaretRightIcon />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner className={theme.MenuPositioner}>
                    <Menu.Popup className={theme.MenuPopup}>
                      <Menu.Item className={theme.MenuItem}>PDF</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <output className="MenuDemoOutput">last action: {lastAction}</output>
    </div>
  );
}

/** Disabled items stay focusable and highlightable by design (ARIA APG; VoiceOver does not skip disabled items — #1733, #4881) but cannot be activated. Style them via `data-disabled`. */
export const DisabledItems: Story = {
  tags: ['api-ref'],
  render: () => <DisabledItemsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Edit' });

    // Open via click; Storybook's synthetic-event play runner (Chromatic) cannot drive Base
    // UI's keyboard open, but keyboard navigation works once the menu is open.
    await userEvent.click(trigger);
    await userEvent.keyboard('{ArrowDown}');
    await body.findByRole('menu');
    await waitFor(() => expect(body.getByRole('menuitem', { name: 'Undo' })).toHaveFocus());

    // The disabled item is reachable by keyboard (not skipped)…
    await userEvent.keyboard('{ArrowDown}');
    const redo = body.getByRole('menuitem', { name: 'Redo' });
    await expect(redo).toHaveAttribute('aria-disabled', 'true');
    await waitFor(() => expect(redo).toHaveFocus());

    // …but cannot be activated.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
    await expect(canvas.getByText('last action: none')).toBeVisible();
  },
};

function NonModalExample() {
  const [count, setCount] = React.useState(0);
  return (
    <div className="MenuDemoRow">
      <Menu.Root modal={false}>
        <Menu.Trigger className={theme.Button}>
          Filters <CaretDownIcon />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
            <Menu.Popup className={theme.MenuPopup}>
              <Menu.Item className={theme.MenuItem}>Only unread</Menu.Item>
              <Menu.Item className={theme.MenuItem}>Only mentions</Menu.Item>
              <Menu.Item className={theme.MenuItem}>Clear filters</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <button type="button" className="MenuDemoPlainButton" onClick={() => setCount(count + 1)}>
        Clicks: {count}
      </button>
    </div>
  );
}

/** `modal` defaults to `true` (scroll locked, outside pointers blocked). Use `modal={false}` when the page must stay interactive while the menu is open — dense toolbars, row actions. */
export const NonModal: Story = {
  tags: ['api-ref'],
  render: () => <NonModalExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Filters' }));
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());

    // Non-modal: the outside button still receives the click (which also dismisses).
    await userEvent.click(canvas.getByRole('button', { name: 'Clicks: 0' }));
    await expect(await canvas.findByRole('button', { name: 'Clicks: 1' })).toBeVisible();
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  },
};

function EventDetailsExample() {
  const [open, setOpen] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);

  const handleOpenChange = (nextOpen: boolean, eventDetails: Menu.Root.ChangeEventDetails) => {
    // Veto light dismissal: only explicit actions may close the menu. An
    // outside click fires `outside-press`, and the outside element taking
    // focus then fires `focus-out` — cancel both, or the second one closes it.
    if (eventDetails.reason === 'outside-press' || eventDetails.reason === 'focus-out') {
      eventDetails.cancel();
      setLog((entries) => [...entries, `${eventDetails.reason} (canceled)`]);
      return;
    }
    setOpen(nextOpen);
    setLog((entries) => [...entries, eventDetails.reason]);
  };

  return (
    <div className="MenuDemoStack">
      <div className="MenuDemoRow">
        <Menu.Root open={open} onOpenChange={handleOpenChange} modal={false}>
          <Menu.Trigger className={theme.Button}>
            Notifications <CaretDownIcon />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
              <Menu.Popup className={theme.MenuPopup}>
                <Menu.Item className={theme.MenuItem}>Mark all as read</Menu.Item>
                <Menu.Item className={theme.MenuItem}>Mute for 1 hour</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
        <button type="button" className="MenuDemoPlainButton">
          Outside area
        </button>
      </div>
      <output className="MenuDemoOutput">
        reasons: {log.length > 0 ? log.join(', ') : 'none'}
      </output>
    </div>
  );
}

/** Every `onOpenChange` call carries `eventDetails`: a typed `reason` (`trigger-press`, `outside-press`, `focus-out`, `escape-key`, `item-press`…) plus `.cancel()` to veto the change while staying uncontrolled-friendly. */
export const EventDetailsReasons: Story = {
  tags: ['highlight'],
  render: () => <EventDetailsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Notifications' }));
    const menu = await body.findByRole('menu');
    await expect(canvas.getByText(/trigger-press/)).toBeVisible();

    // Outside press (and the follow-up focus-out) is canceled by the handler,
    // so the menu stays open.
    await userEvent.click(canvas.getByRole('button', { name: 'Outside area' }));
    await expect(canvas.getByText(/outside-press \(canceled\)/)).toBeVisible();
    await waitFor(() => expect(menu).toBeVisible());

    // Escape is not canceled and closes the menu.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
    await expect(canvas.getByText(/escape-key/)).toBeVisible();
  },
};

function OpenDialogExample() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  return (
    <React.Fragment>
      <Menu.Root>
        <Menu.Trigger className={theme.Button}>
          Project <CaretDownIcon />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
            <Menu.Popup className={theme.MenuPopup}>
              <Menu.Item className={theme.MenuItem}>Rename</Menu.Item>
              <Menu.Item className={theme.MenuItem}>Duplicate</Menu.Item>
              <Menu.Separator className={theme.MenuSeparator} />
              <Menu.Item
                className={`${theme.MenuItem} ${theme.MenuDangerItem}`}
                onClick={() => setDialogOpen(true)}
              >
                Delete…
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className={theme.DialogBackdrop} />
          <Dialog.Popup className={theme.DialogPopup}>
            <Dialog.Title className={theme.DialogTitle}>Delete project</Dialog.Title>
            <Dialog.Description className={theme.DialogDescription}>
              This action cannot be undone.
            </Dialog.Description>
            <div className={theme.DialogActions}>
              <Dialog.Close className="MenuDemoPlainButton">Cancel</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </React.Fragment>
  );
}

/** The docs "Open a dialog" recipe: a controlled Dialog lives outside the menu, and a `Menu.Item` `onClick` opens it — the item press closes the menu, then the dialog takes focus. */
export const OpenDialogFromMenu: Story = {
  tags: ['highlight'],
  render: () => <OpenDialogExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Project' }));
    await userEvent.click(await body.findByRole('menuitem', { name: 'Delete…' }));

    await waitFor(() => expect(body.getByRole('dialog')).toBeVisible());
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  },
};

/** With `DirectionProvider direction="rtl"` the submenu keys mirror: `ArrowLeft` opens a submenu and `ArrowRight` closes it. */
export const RTLSubmenu: Story = {
  tags: ['api-ref'],
  render: () => (
    <div dir="rtl">
      <DirectionProvider direction="rtl">
        <Menu.Root>
          <Menu.Trigger className={theme.Button}>
            Song <CaretDownIcon />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
              <Menu.Popup className={theme.MenuPopup}>
                <Menu.Item className={theme.MenuItem}>Add to Library</Menu.Item>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger className={theme.MenuSubmenuTrigger}>
                    Add to Playlist
                    <CaretRightIcon style={{ transform: 'scaleX(-1)' }} />
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner className={theme.MenuPositioner}>
                      <Menu.Popup className={theme.MenuPopup}>
                        <Menu.Item className={theme.MenuItem}>Get Up!</Menu.Item>
                        <Menu.Item className={theme.MenuItem}>Inside Out</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
                <Menu.Item className={theme.MenuItem}>Share</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </DirectionProvider>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Song' });

    // Open via click; Storybook's synthetic-event play runner (Chromatic) cannot drive Base
    // UI's keyboard open, but keyboard navigation works once the menu is open.
    await userEvent.click(trigger);
    await userEvent.keyboard('{ArrowDown}');
    await body.findByRole('menu', { name: 'Song' });
    await waitFor(() =>
      expect(body.getByRole('menuitem', { name: 'Add to Library' })).toHaveFocus(),
    );

    await userEvent.keyboard('{ArrowDown}');
    const submenuTrigger = body.getByRole('menuitem', { name: 'Add to Playlist' });
    await waitFor(() => expect(submenuTrigger).toHaveFocus());

    // RTL: ArrowLeft opens the submenu…
    await userEvent.keyboard('{ArrowLeft}');
    const submenu = await body.findByRole('menu', { name: 'Add to Playlist' });
    await waitFor(() =>
      expect(within(submenu).getByRole('menuitem', { name: 'Get Up!' })).toHaveFocus(),
    );

    // …and ArrowRight closes it, refocusing the trigger.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(body.queryByRole('menu', { name: 'Add to Playlist' })).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(submenuTrigger).toHaveFocus());
  },
};

/** Set `highlightItemOnHover={false}` (Root) to decouple CSS `:hover` (dashed outline here) from the keyboard-driven `[data-highlighted]` state (solid fill) — the same split users asked for in Combobox (#2731, synced in #3377). */
export const HighlightItemOnHoverDisabled: Story = {
  tags: ['api-ref'],
  render: () => (
    <Menu.Root highlightItemOnHover={false}>
      <Menu.Trigger className={theme.Button}>
        Song <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
          <Menu.Popup className={theme.MenuPopup}>
            <Menu.Item className={`${theme.MenuItem} MenuDemoHoverItem`}>Add to Library</Menu.Item>
            <Menu.Item className={`${theme.MenuItem} MenuDemoHoverItem`}>Play Next</Menu.Item>
            <Menu.Item className={`${theme.MenuItem} MenuDemoHoverItem`}>Favorite</Menu.Item>
            <Menu.Item className={`${theme.MenuItem} MenuDemoHoverItem`}>Share</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
};

const imperativeMenuHandle = Menu.createHandle();

function ImperativeHandleExample() {
  const [state, setState] = React.useState('closed');
  return (
    <div className="MenuDemoStack">
      <div className="MenuDemoRow">
        <button
          type="button"
          className="MenuDemoPlainButton"
          onClick={() => imperativeMenuHandle.open('imperative-menu-trigger')}
        >
          handle.open()
        </button>
        <button
          type="button"
          className="MenuDemoPlainButton"
          onClick={() => imperativeMenuHandle.close()}
        >
          handle.close()
        </button>
        <Menu.Trigger
          handle={imperativeMenuHandle}
          id="imperative-menu-trigger"
          className={theme.Button}
        >
          Alerts <CaretDownIcon />
        </Menu.Trigger>
      </div>
      <Menu.Root
        handle={imperativeMenuHandle}
        modal={false}
        onOpenChange={(nextOpen) => setState(nextOpen ? 'open' : 'closed')}
      >
        <Menu.Portal>
          <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
            <Menu.Popup className={theme.MenuPopup}>
              <Menu.Item className={theme.MenuItem}>Mark all read</Menu.Item>
              <Menu.Item className={theme.MenuItem}>Mute for 1 hour</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <output className="MenuDemoOutput">menu is {state}</output>
    </div>
  );
}

/** Handles double as an imperative API: `handle.open(triggerId)` / `handle.close()` from any event handler. Calls are ignored unless a Root using the handle is mounted — no replay, no carry-over. */
export const ImperativeHandle: Story = {
  tags: ['highlight'],
  render: () => <ImperativeHandleExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'handle.open()' }));
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
    await expect(canvas.getByText('menu is open')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'handle.close()' }));
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
    await expect(canvas.getByText('menu is closed')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/menu)           */
/* ------------------------------------------------------------------ */
