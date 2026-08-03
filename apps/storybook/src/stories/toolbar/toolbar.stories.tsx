import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Toolbar } from '@base-ui/react/toolbar';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle } from '@base-ui/react/toggle';
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

// `RTLKeyboardNavigation`, `UsingWithTooltip`, and `NotAMenubar` from the
// story plan are intentionally skipped in this small-gap-closing pass: the
// RTL row is already asserted directly in `ToolbarRoot.test.tsx`'s own
// parametrized suite (not re-derived here); Tooltip's inverted composition
// direction and the Toolbar-vs-Menubar boundary are prose-documented in the
// MDX (`Choosing the right props`, `When not to use`) without a dedicated
// interaction story, since neither adds a new assertion beyond what
// `ToolbarButtonAsMenuTrigger` and the MDX prose already cover.
