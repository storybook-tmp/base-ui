import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Toolbar } from '@base-ui/react/toolbar';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle } from '@base-ui/react/toggle';
import { Menu } from '@base-ui/react/menu';
import { NumberField } from '@base-ui/react/number-field';
import theme from '@droppy/theme';

/**
 * Stories follow research/c-components/toolbar (Tier 3): the kept docs hero
 * demo (mixed children sharing one composite tab stop) plus the required
 * composite-keyboard coverage, and the `Toolbar.Button render={<Menu.Trigger />}`
 * composition recipe from the docs "Using with Menu" example. Toolbar never
 * enables Home/End (`enableHomeAndEndKeys` is not passed to its CompositeRoot)
 * — only Tab (single stop) and orientation-appropriate arrows are wired; a
 * ToggleGroup nested here defers entirely to this CompositeRoot, so it loses
 * the Home/End support it has when used standalone (see the toggle-group
 * stories/MDX).
 */
const meta = {
  title: 'Actions/Toolbar',
  component: Toolbar.Root,
  subcomponents: {
    'Toolbar.Button': Toolbar.Button,
    'Toolbar.Separator': Toolbar.Separator,
    'Toolbar.Group': Toolbar.Group,
  },
} satisfies Meta<typeof Toolbar.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Mixed content sharing one composite tab stop: an alignment ToggleGroup,
 * a separator, and a plain Toolbar.Group of format buttons.
 */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <Toolbar.Root aria-label="Formatting" className={theme.ToolbarRoot}>
      <ToggleGroup
        aria-label="Alignment"
        defaultValue={['align-left']}
        className={theme.ToolbarGroup}
      >
        <Toolbar.Button render={<Toggle />} value="align-left" className={theme.ToolbarButton}>
          Align Left
        </Toolbar.Button>
        <Toolbar.Button render={<Toggle />} value="align-right" className={theme.ToolbarButton}>
          Align Right
        </Toolbar.Button>
      </ToggleGroup>
      <Toolbar.Separator className={theme.ToolbarSeparator} />
      <Toolbar.Group aria-label="Numerical format" className={theme.ToolbarGroup}>
        <Toolbar.Button aria-label="Format as currency" className={theme.ToolbarButton}>
          $
        </Toolbar.Button>
        <Toolbar.Button aria-label="Format as percent" className={theme.ToolbarButton}>
          %
        </Toolbar.Button>
      </Toolbar.Group>
    </Toolbar.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const alignLeft = canvas.getByRole('button', { name: 'Align Left' });
    const alignRight = canvas.getByRole('button', { name: 'Align Right' });
    const currency = canvas.getByRole('button', { name: 'Format as currency' });

    // Single composite tab stop: only the first item is in the tab sequence up front.
    await expect(alignLeft).toHaveAttribute('tabindex', '0');
    await expect(alignRight).toHaveAttribute('tabindex', '-1');

    await userEvent.tab();
    await expect(alignLeft).toHaveFocus();

    // Arrow keys rove focus in one continuous sequence, spanning the nested
    // ToggleGroup and the plain Toolbar.Group as if they were flat siblings.
    await userEvent.keyboard('{ArrowRight}');
    await expect(alignRight).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    await expect(currency).toHaveFocus();
  },
};

function ToolbarWithMenuExample() {
  return (
    <Toolbar.Root aria-label="Document actions" className={theme.ToolbarRoot}>
      <Toolbar.Button aria-label="Bold" className={theme.ToolbarButton}>
        B
      </Toolbar.Button>
      <Toolbar.Separator className={theme.ToolbarSeparator} />
      <Menu.Root>
        <Toolbar.Button render={<Menu.Trigger />} className={theme.ToolbarButton}>
          More actions
        </Toolbar.Button>
        <Menu.Portal>
          <Menu.Positioner className={theme.MenuPositioner} sideOffset={4}>
            <Menu.Popup className={theme.MenuPopup}>
              <Menu.Item className={theme.MenuItem}>Duplicate</Menu.Item>
              <Menu.Item className={theme.MenuItem}>Delete</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Toolbar.Root>
  );
}

/**
 * Composing a popup trigger into the toolbar: `Toolbar.Button render={<Menu.Trigger />}`
 * keeps `Toolbar.Button` as the composite-registered DOM node while `Menu.Trigger`
 * supplies its own ARIA (`aria-haspopup`, `aria-expanded`). The menu content
 * portals to `document.body`, so it must be queried there.
 */
export const ToolbarButtonAsMenuTrigger: Story = {
  tags: ['highlight'],
  render: () => <ToolbarWithMenuExample />,
  play: async ({ canvas, userEvent, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'More actions' });

    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

    await userEvent.click(trigger);
    const menu = await body.findByRole('menu');
    // The theme's Menu.Popup mounts with an enter transition
    // (data-starting-style opacity 0 -> 1); findByRole resolves on the next
    // DOM mutation, often before that transition has advanced at all, so
    // wait for the popup to actually be visible rather than asserting
    // immediately.
    await waitFor(() => {
      expect(menu).toBeVisible();
    });
    await waitFor(async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await userEvent.click(await body.findByRole('menuitem', { name: 'Duplicate' }));
    await waitFor(async () => {
      await expect(body.queryByRole('menu')).not.toBeInTheDocument();
    });
  },
};

/**
 * `disabled` on `Toolbar.Root` cascades to every Button/Input/Group but
 * deliberately never to `Toolbar.Link` (links can't be disabled), matching
 * `ToolbarRoot.test.tsx` "disables all toolbar items except links".
 */
export const DisabledCascadeExceptLinks: Story = {
  tags: ['api-ref'],
  render: () => (
    <Toolbar.Root aria-label="Mixed items (disabled)" disabled className={theme.ToolbarRoot}>
      <Toolbar.Button className={theme.ToolbarButton}>Bold</Toolbar.Button>
      <Toolbar.Link href="https://base-ui.com" className={theme.ToolbarButton}>
        Docs
      </Toolbar.Link>
      <Toolbar.Group aria-label="Alignment" className={theme.ToolbarGroup}>
        <Toolbar.Button className={theme.ToolbarButton}>Left</Toolbar.Button>
      </Toolbar.Group>
      <Toolbar.Input defaultValue="" aria-label="Search" className={theme.ToolbarButton} />
    </Toolbar.Root>
  ),
  play: async ({ canvas }) => {
    const bold = canvas.getByRole('button', { name: 'Bold' });
    const left = canvas.getByRole('button', { name: 'Left' });
    const input = canvas.getByRole('textbox', { name: 'Search' });
    const link = canvas.getByRole('link', { name: 'Docs' });
    const group = canvas.getByRole('group', { name: 'Alignment' });

    await expect(bold).toHaveAttribute('aria-disabled', 'true');
    await expect(bold).toHaveAttribute('data-disabled');
    await expect(left).toHaveAttribute('aria-disabled', 'true');
    await expect(left).toHaveAttribute('data-disabled');
    await expect(input).toHaveAttribute('aria-disabled', 'true');
    await expect(input).toHaveAttribute('data-disabled');
    await expect(group).toHaveAttribute('data-disabled');

    // Links are exempt from the disabled cascade entirely.
    await expect(link).not.toHaveAttribute('aria-disabled');
    await expect(link).not.toHaveAttribute('data-disabled');
  },
};

function ToolbarWithNumberFieldExample() {
  return (
    <Toolbar.Root aria-label="Document settings" className={theme.ToolbarRoot}>
      <Toolbar.Button className={theme.ToolbarButton}>Bold</Toolbar.Button>
      <Toolbar.Separator className={theme.ToolbarSeparator} />
      <NumberField.Root defaultValue={12} min={8} max={96}>
        <NumberField.Group className={theme.ToolbarGroup}>
          <NumberField.Decrement className={theme.ToolbarButton}>-</NumberField.Decrement>
          <Toolbar.Input
            render={<NumberField.Input aria-label="Font size" />}
            className={theme.ToolbarButton}
            style={{ width: '3rem', textAlign: 'center' }}
          />
          <NumberField.Increment className={theme.ToolbarButton}>+</NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </Toolbar.Root>
  );
}

/**
 * Composing `NumberField.Input` into `Toolbar.Input` (docs "Using with
 * NumberField" recipe): arrow keys behave differently depending on where
 * focus is. On the toolbar's Buttons, arrows rove the shared composite tab
 * stop. Once focus moves *into* the Input, ArrowUp/ArrowDown are captured by
 * NumberField itself to increment/decrement the value (native text-cursor
 * semantics for ArrowLeft/ArrowRight) -- the roving-focus contract only
 * applies when the Input is not the active element's own consumer of that
 * key. This is the one documented behavioral tension on the whole toolbar
 * docs page (brief §4, §6, §7).
 */
export const UsingWithNumberFieldInput: Story = {
  tags: ['highlight'],
  render: () => <ToolbarWithNumberFieldExample />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: 'Font size' });
    await expect(input).toHaveValue('12');

    input.focus();
    await expect(input).toHaveFocus();

    // ArrowUp/ArrowDown increments/decrements the NumberField value while
    // focus stays inside the input -- it does not rove toolbar focus away.
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(input).toHaveValue('13'));
    await expect(input).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(input).toHaveValue('12'));
  },
};

// `RTLKeyboardNavigation`, `UsingWithTooltip`, and `NotAMenubar` from the
// story plan are intentionally skipped in this small-gap-closing pass: the
// RTL row is already asserted directly in `ToolbarRoot.test.tsx`'s own
// parametrized suite (not re-derived here); Tooltip's inverted composition
// direction and the Toolbar-vs-Menubar boundary are prose-documented in the
// MDX (`Choosing the right props`, `When not to use`) without a dedicated
// interaction story, since neither adds a new assertion beyond what
// `ToolbarButtonAsMenuTrigger` and the MDX prose already cover.
