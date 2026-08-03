import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Menubar } from '@base-ui/react/menubar';
import { Menu } from '@base-ui/react/menu';
import { DirectionProvider } from '@base-ui/react/direction-provider';
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

function DisabledCascadeExample() {
  return (
    <div className="MenubarDemoRow">
      <div className="MenubarDemoStack">
        <span className="MenubarDemoOutput">Whole bar disabled</span>
        <Menubar className={theme.MenubarRoot} disabled>
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
        <span className="MenubarDemoOutput">Single menu disabled (&quot;Help&quot;)</span>
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
          <Menu.Root disabled>
            <Menu.Trigger className={theme.MenubarMenuTrigger}>Help</Menu.Trigger>
          </Menu.Root>
        </Menubar>
      </div>
    </div>
  );
}

/**
 * `disabled` on `<Menubar>` cascades to every hosted `Menu.Root` at once (they
 * OR their own `disabled` with the bar's); disabling a single `Menu.Root`
 * instead only takes out that one menu, leaving its siblings enabled.
 */
export const DisabledCascade: Story = {
  tags: ['api-ref'],
  render: () => <DisabledCascadeExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    // Variant (a): the whole bar is disabled — File opens nothing.
    const disabledBarFile = canvas.getAllByRole('menuitem', { name: 'File' })[0];
    await expect(disabledBarFile).toHaveAttribute('data-disabled');
    await userEvent.click(disabledBarFile);
    await expect(body.queryByRole('menu', { name: 'File' })).not.toBeInTheDocument();

    // Variant (b): only "Help" is disabled — File in the same bar still works.
    const enabledBarFile = canvas.getAllByRole('menuitem', { name: 'File' })[1];
    await userEvent.click(enabledBarFile);
    const fileMenu = await body.findByRole('menu', { name: 'File' });
    await waitFor(() => expect(fileMenu).toBeVisible());

    const help = canvas.getByRole('menuitem', { name: 'Help' });
    await expect(help).toHaveAttribute('data-disabled');
  },
};

/* ------------------------------------------------------------------ */
/* Vertical orientation                                                 */
/* ------------------------------------------------------------------ */

function VerticalOrientationExample() {
  return (
    <Menubar className={theme.MenubarRoot} orientation="vertical">
      <Menu.Root>
        <Menu.Trigger className={theme.MenubarMenuTrigger}>File</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={theme.MenuPositioner} sideOffset={4}>
            <Menu.Popup className={theme.MenubarMenuPopup} data-testid="file-popup">
              <Menu.Item className={theme.MenubarMenuItem}>New</Menu.Item>
              <Menu.Item className={theme.MenubarMenuItem}>Open</Menu.Item>
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
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Menubar>
  );
}

/**
 * `orientation="vertical"` switches the roving-focus axis to `ArrowUp`/
 * `ArrowDown` and, since [#4922](https://github.com/mui/base-ui/pull/4922),
 * defaults hosted popups to open on the `inline-end` side instead of
 * `bottom` — before that fix, a vertical bar's popups still opened downward,
 * awkwardly overlapping the bar's own next item.
 */
export const VerticalOrientation: Story = {
  tags: ['api-ref'],
  render: () => <VerticalOrientationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('menuitem', { name: 'File' }));
    const popup = await body.findByTestId('file-popup');
    await waitFor(() => expect(popup).toBeVisible());
    // #4922: vertical menubars default their popups to the inline-end side.
    await waitFor(() => expect(popup).toHaveAttribute('data-side', 'inline-end'));
  },
};

/* ------------------------------------------------------------------ */
/* loopFocus toggle                                                     */
/* ------------------------------------------------------------------ */

function LoopFocusToggleExample() {
  return (
    <div className="MenubarDemoRow">
      <div className="MenubarDemoStack">
        <span className="MenubarDemoOutput">loopFocus (default true)</span>
        <Menubar className={theme.MenubarRoot} data-testid="loop-bar">
          <Menu.Root>
            <Menu.Trigger className={theme.MenubarMenuTrigger}>File</Menu.Trigger>
          </Menu.Root>
          <Menu.Root>
            <Menu.Trigger className={theme.MenubarMenuTrigger}>Edit</Menu.Trigger>
          </Menu.Root>
        </Menubar>
      </div>
      <div className="MenubarDemoStack">
        <span className="MenubarDemoOutput">loopFocus=false</span>
        <Menubar className={theme.MenubarRoot} loopFocus={false} data-testid="no-loop-bar">
          <Menu.Root>
            <Menu.Trigger className={theme.MenubarMenuTrigger}>File</Menu.Trigger>
          </Menu.Root>
          <Menu.Root>
            <Menu.Trigger className={theme.MenubarMenuTrigger}>Edit</Menu.Trigger>
          </Menu.Root>
        </Menubar>
      </div>
    </div>
  );
}

/**
 * `loopFocus` (default `true`) decides whether reaching the last (or first)
 * top-level trigger with arrow keys wraps back around. Both bars here have
 * no popup content — they only exercise the roving-focus wrap behavior.
 */
export const LoopFocusToggle: Story = {
  tags: ['api-ref'],
  render: () => <LoopFocusToggleExample />,
  play: async ({ canvas, userEvent }) => {
    const loopBar = canvas.getByTestId('loop-bar');
    const loopTriggers = within(loopBar).getAllByRole('menuitem');
    loopTriggers[loopTriggers.length - 1].focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(loopTriggers[0]).toHaveFocus());

    const noLoopBar = canvas.getByTestId('no-loop-bar');
    const noLoopTriggers = within(noLoopBar).getAllByRole('menuitem');
    noLoopTriggers[noLoopTriggers.length - 1].focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(noLoopTriggers[noLoopTriggers.length - 1]).toHaveFocus());
  },
};

/* ------------------------------------------------------------------ */
/* Submenu within a menubar-hosted menu                                 */

/* ------------------------------------------------------------------ */
/* Checkbox and radio items inside a menubar-hosted menu                */

/* ------------------------------------------------------------------ */
/* Hover-switch only after the first click                             */

/* ------------------------------------------------------------------ */
/* Home/End navigation                                                  */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Menubar vs Toolbar boundary                                          */

/* ------------------------------------------------------------------ */
/* RTL — honest gap, no play                                            */
/* ------------------------------------------------------------------ */

function RTLGapExample() {
  return (
    <div className="MenubarDemoStack">
      <p className="MenubarDemoOutput">
        Known gap: `Menubar.test.tsx` has no `dir=&quot;rtl&quot;` coverage for
        horizontal-orientation arrow-key direction. Verify arrow-key direction manually in the
        menubar below.
      </p>
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <HeroExample />
        </div>
      </DirectionProvider>
    </div>
  );
}

/**
 * No play function here, deliberately — this configuration's correctness is
 * explicitly unverified upstream (no RTL-specific tests exist for Menubar),
 * so asserting behavior here would fabricate confidence the source doesn't
 * back up.
 */
export const RTLGap: Story = {
  tags: ['api-ref'],
  render: () => <RTLGapExample />,
};
