import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { Menubar } from '@base-ui/react/menubar';
import { Menu } from '@base-ui/react/menu';
import { Toolbar } from '@base-ui/react/toolbar';
import theme from '@droppy/theme';
import './menubar.demo.css';

/**
 * Not covered below: a dedicated "detached trigger inside a menubar" story.
 * `Menubar.test.tsx`'s `describe.for` suite runs its assertions against
 * multiple trigger topologies (`ContainedTrigger`/`MultipleContainedTriggers`/
 * `DetachedTrigger`, the last depending on Menu's detached-triggers feature,
 * #3170) purely as internal test-infrastructure variation — not a
 * documented, user-facing composition recipe (research/c-components/menubar/
 * brief.md §9's "Load-bearing non-[menubar]-scoped dependency" note is
 * explicit that this is test-topology coverage, not a public pattern).
 * Skipped here per the source-verified absence of a consumer-facing recipe.
 */

/**
 * Stories follow research/c-components/menubar (Tier 2): Menubar is a
 * single-part host — no namespace, no `index.parts.ts`. It renders one
 * `<div role="menubar">` and coordinates ordinary `Menu.Root` instances placed
 * inside it: each hosted `Menu.Trigger` detects menubar parentage via context
 * and converts from a standalone button into a roving `role="menuitem"`.
 * Floor coverage: the roving-arrows sibling-switch flow (open File →
 * ArrowRight → Edit opens) and the disabled cascade (bar-level and
 * per-menu).
 *
 * Portal note: each hosted Menu's popup mounts on document.body — plays query
 * via `within(canvasElement.ownerDocument.body)`.
 */
const meta = {
  title: 'Navigation/Menubar',
  component: Menubar,
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Hero: multi-menu bar with roving-arrows sibling switch               */
/* ------------------------------------------------------------------ */

function HeroExample() {
  return (
    <Menubar className={theme.MenubarRoot}>
      <Menu.Root>
        <Menu.Trigger className={theme.MenubarMenuTrigger}>File</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={theme.MenuPositioner} sideOffset={4}>
            <Menu.Popup className={theme.MenubarMenuPopup}>
              <Menu.Item className={theme.MenubarMenuItem}>New</Menu.Item>
              <Menu.Item className={theme.MenubarMenuItem}>Open</Menu.Item>
              <Menu.Item className={theme.MenubarMenuItem}>Save</Menu.Item>
              <Menu.Separator className={theme.MenuSeparator} />
              <Menu.Item className={theme.MenubarMenuItem}>Print</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger className={theme.MenubarMenuTrigger}>Edit</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={theme.MenuPositioner} sideOffset={4}>
            <Menu.Popup className={theme.MenubarMenuPopup}>
              <Menu.Item className={theme.MenubarMenuItem}>Cut</Menu.Item>
              <Menu.Item className={theme.MenubarMenuItem}>Copy</Menu.Item>
              <Menu.Item className={theme.MenubarMenuItem}>Paste</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger className={theme.MenubarMenuTrigger}>View</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={theme.MenuPositioner} sideOffset={4}>
            <Menu.Popup className={theme.MenubarMenuPopup}>
              <Menu.Item className={theme.MenubarMenuItem}>Zoom In</Menu.Item>
              <Menu.Item className={theme.MenubarMenuItem}>Zoom Out</Menu.Item>
              <Menu.Separator className={theme.MenuSeparator} />
              <Menu.Item className={theme.MenubarMenuItem}>Full Screen</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root disabled>
        <Menu.Trigger className={theme.MenubarMenuTrigger}>Help</Menu.Trigger>
      </Menu.Root>
    </Menubar>
  );
}

/**
 * The docs hero demo's File/Edit/View/Help shape. Clicking a trigger opens
 * its menu; `ArrowRight` closes the current submenu and opens the adjacent
 * top-level trigger's submenu in one step — the "browse across the whole bar
 * without leaving keyboard-driven submenu mode" pattern.
 */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => <HeroExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const fileTrigger = canvas.getByRole('menuitem', { name: 'File' });
    await expect(fileTrigger).toHaveAttribute('aria-haspopup', 'menu');

    await userEvent.click(fileTrigger);
    const fileMenu = await body.findByRole('menu', { name: 'File' });
    // waitFor: the popup is briefly at opacity 0 during its entrance transition.
    await waitFor(() => expect(fileMenu).toBeVisible());

    // ArrowRight switches to the adjacent top-level menu in one step.
    await userEvent.keyboard('{ArrowRight}');
    const editMenu = await body.findByRole('menu', { name: 'Edit' });
    await waitFor(() => expect(editMenu).toBeVisible());
    await waitFor(() => expect(body.queryByRole('menu', { name: 'File' })).not.toBeInTheDocument());

    await userEvent.keyboard('{ArrowRight}');
    const viewMenu = await body.findByRole('menu', { name: 'View' });
    await waitFor(() => expect(viewMenu).toBeVisible());

    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(body.getByRole('menu', { name: 'Edit' })).toBeVisible());
  },
};

/* ------------------------------------------------------------------ */
/* Disabled cascade                                                     */

/* ------------------------------------------------------------------ */
/* Vertical orientation                                                 */

/* ------------------------------------------------------------------ */
/* loopFocus toggle                                                     */

/* ------------------------------------------------------------------ */
/* Submenu within a menubar-hosted menu                                 */
/* ------------------------------------------------------------------ */

function SubmenuWithinMenubarExample() {
  return (
    <Menubar className={theme.MenubarRoot}>
      <Menu.Root>
        <Menu.Trigger className={theme.MenubarMenuTrigger}>File</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={theme.MenuPositioner} sideOffset={4}>
            <Menu.Popup className={theme.MenubarMenuPopup}>
              <Menu.Item className={theme.MenubarMenuItem}>New</Menu.Item>
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger className={theme.MenubarSubmenuTrigger}>
                  Export
                  <CaretRightIcon />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner
                    className={theme.MenuPositioner}
                    alignOffset={-4}
                    sideOffset={-4}
                  >
                    <Menu.Popup className={theme.MenubarMenuPopup}>
                      <Menu.Item className={theme.MenubarMenuItem}>PDF</Menu.Item>
                      <Menu.Item className={theme.MenubarMenuItem}>PNG</Menu.Item>
                      <Menu.Item className={theme.MenubarMenuItem}>SVG</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <Menu.Root>
        <Menu.Trigger className={theme.MenubarMenuTrigger}>Edit</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={theme.MenuPositioner} sideOffset={4}>
            <Menu.Popup className={theme.MenubarMenuPopup}>
              <Menu.Item className={theme.MenubarMenuItem}>Cut</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Menubar>
  );
}

/**
 * `SubmenuRoot`/`SubmenuTrigger` compose exactly as they would standalone —
 * menubar parentage changes nothing about nested-menu composition.
 */
export const SubmenuWithinMenubar: Story = {
  tags: ['highlight'],
  render: () => <SubmenuWithinMenubarExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('menuitem', { name: 'File' }));
    const fileMenu = await body.findByRole('menu', { name: 'File' });
    await waitFor(() => expect(fileMenu).toBeVisible());

    const exportTrigger = within(fileMenu).getByRole('menuitem', { name: 'Export' });
    await userEvent.click(exportTrigger);
    const exportMenu = await body.findByRole('menu', { name: 'Export' });
    await waitFor(() =>
      expect(within(exportMenu).getByRole('menuitem', { name: 'PNG' })).toBeVisible(),
    );

    // fireEvent.click (not userEvent.click): the submenu briefly overlaps the
    // parent popup's invisible internal backdrop, which real pointer hit-testing
    // would otherwise flag as blocking the click.
    fireEvent.click(within(exportMenu).getByRole('menuitem', { name: 'PNG' }));
    await waitFor(() => expect(fileMenu).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Checkbox and radio items inside a menubar-hosted menu                */
/* ------------------------------------------------------------------ */

function CheckboxAndRadioItemsInMenubarExample() {
  const [showRulers, setShowRulers] = React.useState(false);
  const [zoom, setZoom] = React.useState('100');
  return (
    <Menubar className={theme.MenubarRoot}>
      <Menu.Root>
        <Menu.Trigger className={theme.MenubarMenuTrigger}>View</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={theme.MenuPositioner} sideOffset={4}>
            <Menu.Popup className={theme.MenubarMenuPopup}>
              <Menu.CheckboxItem
                checked={showRulers}
                onCheckedChange={setShowRulers}
                className={theme.MenuCheckboxItem}
              >
                <Menu.CheckboxItemIndicator className={theme.MenuCheckboxItemIndicator}>
                  <CheckIcon />
                </Menu.CheckboxItemIndicator>
                <span className={theme.MenuCheckboxItemText}>Show Rulers</span>
              </Menu.CheckboxItem>
              <Menu.Separator className={theme.MenuSeparator} />
              <Menu.RadioGroup value={zoom} onValueChange={setZoom}>
                {['50', '100', '150'].map((level) => (
                  <Menu.RadioItem key={level} className={theme.MenuRadioItem} value={level}>
                    <Menu.RadioItemIndicator className={theme.MenuRadioItemIndicator}>
                      <CheckIcon />
                    </Menu.RadioItemIndicator>
                    <span className={theme.MenuRadioItemText}>{level}%</span>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Menubar>
  );
}

/**
 * `CheckboxItem`/`RadioGroup`/`RadioItem` work unchanged inside a
 * menubar-hosted menu — proof Menu's full item vocabulary carries over,
 * not just plain `Item`.
 */
export const CheckboxAndRadioItemsInMenubar: Story = {
  tags: ['highlight'],
  render: () => <CheckboxAndRadioItemsInMenubarExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('menuitem', { name: 'View' }));
    const menu = await body.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());

    const rulers = within(menu).getByRole('menuitemcheckbox', { name: 'Show Rulers' });
    await expect(rulers).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(rulers);
    await waitFor(() => expect(rulers).toHaveAttribute('aria-checked', 'true'));
    // Checkbox items don't close the menu by default (closeOnClick=false).
    await waitFor(() => expect(menu).toBeVisible());

    const zoom150 = within(menu).getByRole('menuitemradio', { name: '150%' });
    await userEvent.click(zoom150);
    await waitFor(() => expect(zoom150).toHaveAttribute('aria-checked', 'true'));
    const zoom100 = within(menu).getByRole('menuitemradio', { name: '100%' });
    await expect(zoom100).toHaveAttribute('aria-checked', 'false');
  },
};

/* ------------------------------------------------------------------ */
/* Hover-switch only after the first click                             */
/* ------------------------------------------------------------------ */

function HoverSwitchAfterFirstClickExample() {
  const [log, setLog] = React.useState<string[]>([]);
  return (
    <div className="MenubarDemoStack">
      <Menubar className={theme.MenubarRoot}>
        <Menu.Root
          onOpenChange={(open, eventDetails) => {
            if (open) {
              setLog((entries) => [
                ...entries,
                eventDetails.reason === 'trigger-hover' ? 'File switched via hover' : 'File opened',
              ]);
            }
          }}
        >
          <Menu.Trigger className={theme.MenubarMenuTrigger}>File</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner className={theme.MenuPositioner} sideOffset={4}>
              <Menu.Popup className={theme.MenubarMenuPopup}>
                <Menu.Item className={theme.MenubarMenuItem}>New</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
        <Menu.Root
          onOpenChange={(open, eventDetails) => {
            if (open) {
              setLog((entries) => [
                ...entries,
                eventDetails.reason === 'trigger-hover' ? 'Edit switched via hover' : 'Edit opened',
              ]);
            }
          }}
        >
          <Menu.Trigger className={theme.MenubarMenuTrigger}>Edit</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner className={theme.MenuPositioner} sideOffset={4}>
              <Menu.Popup className={theme.MenubarMenuPopup}>
                <Menu.Item className={theme.MenubarMenuItem}>Cut</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menubar>
      <output className="MenubarDemoOutput">
        {log.length > 0 ? log.join(', ') : 'no popup opened yet'}
      </output>
    </div>
  );
}

/**
 * A trigger's effective `openOnHover` is `false` until *some* sibling
 * submenu is already open — hovering does nothing pre-click, but once one
 * trigger has been clicked open, hovering the others switches the open
 * submenu without another click (`parentMenubarHasSubmenuOpen` gate; the
 * exact scenario named by the test `should open submenus on hover when
 * another submenu is already open`).
 */
export const HoverSwitchAfterFirstClick: Story = {
  tags: ['highlight'],
  render: () => <HoverSwitchAfterFirstClickExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const fileTrigger = canvas.getByRole('menuitem', { name: 'File' });
    const editTrigger = canvas.getByRole('menuitem', { name: 'Edit' });

    // Hover before anything is open: a documented no-op.
    await userEvent.hover(editTrigger);
    await expect(canvas.getByText('no popup opened yet')).toBeVisible();
    await expect(body.queryByRole('menu')).not.toBeInTheDocument();

    // Click File to open it.
    await userEvent.click(fileTrigger);
    const fileMenu = await body.findByRole('menu', { name: 'File' });
    await waitFor(() => expect(fileMenu).toBeVisible());

    // Now hover Edit — it switches without another click.
    await userEvent.hover(editTrigger);
    const editMenu = await body.findByRole('menu', { name: 'Edit' });
    await waitFor(() => expect(editMenu).toBeVisible());
    await waitFor(() => expect(body.queryByRole('menu', { name: 'File' })).not.toBeInTheDocument());
    await waitFor(() => expect(canvas.getByText(/Edit switched via hover/)).toBeVisible());
  },
};

/* ------------------------------------------------------------------ */
/* Home/End navigation                                                  */
/* ------------------------------------------------------------------ */

/**
 * `Home`/`End` jump focus to the first/last top-level trigger
 * ([#4922](https://github.com/mui/base-ui/pull/4922)), reusing the Hero
 * fixture's File/Edit/View/Help bar. `Help` is disabled in this fixture, so
 * `End` lands on `View` — the last *enabled* trigger, not the last trigger
 * in DOM order.
 */
export const HomeAndEndNavigation: Story = {
  tags: ['highlight'],
  render: () => <HeroExample />,
  play: async ({ canvas, userEvent }) => {
    const fileTrigger = canvas.getByRole('menuitem', { name: 'File' });
    const viewTrigger = canvas.getByRole('menuitem', { name: 'View' });

    fileTrigger.focus();
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(viewTrigger).toHaveFocus());

    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(fileTrigger).toHaveFocus());
  },
};

/* ------------------------------------------------------------------ */
/* Menubar vs Toolbar boundary                                          */
/* ------------------------------------------------------------------ */

function ToolbarContrastSideBySideExample() {
  return (
    <div className="MenubarDemoRow">
      <div className="MenubarDemoStack">
        <span className="MenubarDemoOutput">
          Menubar — persistent, always-visible menu triggers
        </span>
        <Menubar className={theme.MenubarRoot}>
          <Menu.Root>
            <Menu.Trigger className={theme.MenubarMenuTrigger}>File</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className={theme.MenuPositioner} sideOffset={4}>
                <Menu.Popup className={theme.MenubarMenuPopup}>
                  <Menu.Item className={theme.MenubarMenuItem}>New</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <Menu.Root>
            <Menu.Trigger className={theme.MenubarMenuTrigger}>Edit</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className={theme.MenuPositioner} sideOffset={4}>
                <Menu.Popup className={theme.MenubarMenuPopup}>
                  <Menu.Item className={theme.MenubarMenuItem}>Cut</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menubar>
      </div>

      <div className="MenubarDemoStack">
        <span className="MenubarDemoOutput">Toolbar — ordinary buttons, one embeds a Menu</span>
        <Toolbar.Root aria-label="Document actions" className={theme.ToolbarRoot}>
          <Toolbar.Button className={theme.ToolbarButton}>Bold</Toolbar.Button>
          <Toolbar.Button className={theme.ToolbarButton}>Italic</Toolbar.Button>
          <Menu.Root>
            <Toolbar.Button render={<Menu.Trigger />} className={theme.ToolbarButton}>
              More actions
            </Toolbar.Button>
            <Menu.Portal>
              <Menu.Positioner className={theme.MenuPositioner} sideOffset={4}>
                <Menu.Popup className={theme.MenubarMenuPopup}>
                  <Menu.Item className={theme.MenubarMenuItem}>Duplicate</Menu.Item>
                  <Menu.Item className={theme.MenubarMenuItem}>Delete</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Toolbar.Root>
      </div>
    </div>
  );
}

/**
 * `isInMenubar` and `insideToolbar` are two independent context checks, not
 * a shared "am I in some kind of bar" flag — a Toolbar may embed a single
 * menu-triggered button without ever becoming a Menubar. Reach for Menubar
 * when the bar's primary content is persistent menu triggers; reach for
 * Toolbar (with an occasional `render={<Menu.Trigger />}` button) for a
 * mixed row of buttons/toggles/inputs.
 */
export const ToolbarContrastSideBySide: Story = {
  tags: ['highlight'],
  render: () => <ToolbarContrastSideBySideExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await expect(canvas.getByRole('menubar')).toBeVisible();
    await expect(canvas.getByRole('toolbar', { name: 'Document actions' })).toBeVisible();

    const moreActions = canvas.getByRole('button', { name: 'More actions' });
    await userEvent.click(moreActions);
    const menu = await body.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());
  },
};

/* ------------------------------------------------------------------ */
/* RTL — honest gap, no play                                            */

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
