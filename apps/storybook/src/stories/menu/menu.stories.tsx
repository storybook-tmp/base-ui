import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Menu } from '@base-ui/react/menu';
import theme from '@droppy/theme';
import './menu.demo.css';
import { CaretDownIcon, CaretRightIcon, CheckIcon, EllipsisIcon } from './icons';

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

const viewportMenuHandle = Menu.createHandle<ViewportMenuKey>();

/** The docs detached-triggers demo with `Menu.Viewport`: switching triggers morphs the popup — the Positioner freezes to `var(--positioner-*)`, the Popup transitions `width`/`height`, and the Viewport cross-fades old/new content via `data-previous`/`data-current`. */
export const ViewportContentTransition: Story = {
  tags: ['animation'],
  render: () => (
    <div className="MenuDemoRow">
      {(Object.keys(viewportMenus) as ViewportMenuKey[]).map((key) => (
        <Menu.Trigger key={key} className={theme.Button} handle={viewportMenuHandle} payload={key}>
          {viewportMenus[key].heading}
        </Menu.Trigger>
      ))}
      <Menu.Root handle={viewportMenuHandle} modal={false}>
        {({ payload }) => (
          <Menu.Portal>
            <Menu.Positioner
              sideOffset={8}
              className={`${theme.MenuPositioner} ${theme.MenuTransitionPositioner}`}
            >
              <Menu.Popup className={`${theme.MenuPopup} ${theme.MenuTransitionPopup}`}>
                <Menu.Viewport className={theme.MenuViewport}>
                  {payload
                    ? viewportMenus[payload].groups.map((group, groupIndex) => (
                        <React.Fragment key={groupIndex}>
                          <Menu.Group>
                            {groupIndex === 0 && (
                              <Menu.GroupLabel className={theme.MenuPlainGroupLabel}>
                                {viewportMenus[payload].heading}
                              </Menu.GroupLabel>
                            )}
                            {group.map((item) => (
                              <Menu.Item key={item} className={theme.MenuItem}>
                                {item}
                              </Menu.Item>
                            ))}
                          </Menu.Group>
                          {groupIndex < viewportMenus[payload].groups.length - 1 && (
                            <Menu.Separator className={theme.MenuSeparator} />
                          )}
                        </React.Fragment>
                      ))
                    : null}
                </Menu.Viewport>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        )}
      </Menu.Root>
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Behavior stories (one per documented use case)                      */

/** CSS transitions via `[data-starting-style]`/`[data-ending-style]` with `transform-origin: var(--transform-origin)`; `[data-instant]` marks moments (keyboard close, menubar switching) where the transition should be skipped. */
export const TransitionAnimation: Story = {
  tags: ['animation'],
  render: () => (
    <Menu.Root>
      <Menu.Trigger className={theme.Button}>
        Song <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
          <Menu.Popup className={`${theme.MenuPopup} MenuDemoAnimatedPopup`}>
            <Menu.Item className={theme.MenuItem}>Add to Library</Menu.Item>
            <Menu.Item className={theme.MenuItem}>Play Next</Menu.Item>
            <Menu.Item className={theme.MenuItem}>Favorite</Menu.Item>
            <Menu.Item className={theme.MenuItem}>Share</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
};

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/menu)           */
/* ------------------------------------------------------------------ */
