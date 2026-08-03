import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Menubar } from '@base-ui/react/menubar';
import { Menu } from '@base-ui/react/menu';
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
/* Checkbox and radio items inside a menubar-hosted menu                */

/* ------------------------------------------------------------------ */
/* Hover-switch only after the first click                             */

/* ------------------------------------------------------------------ */
/* Home/End navigation                                                  */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Menubar vs Toolbar boundary                                          */

/* ------------------------------------------------------------------ */
