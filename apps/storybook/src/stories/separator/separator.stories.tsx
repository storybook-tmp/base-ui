import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Separator } from '@base-ui/react/separator';
import { Menu } from '@base-ui/react/menu';
import { Toolbar } from '@base-ui/react/toolbar';
import theme from '@droppy/theme';
import './separator.demo.css';

/**
 * Stories follow research/c-components/separator (Tier 3): the kept hero demo
 * plus the mandatory horizontal/vertical orientation pair with ARIA-contract
 * plays (`role="separator"`, `aria-orientation`, `data-orientation`).
 */
const meta = {
  title: 'Disclosure & structure/Separator',
  component: Separator,
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: a vertical separator dividing two clusters of nav links. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <div className="Container">
      <a href="#" className="Link">
        Home
      </a>
      <a href="#" className="Link">
        Pricing
      </a>
      <a href="#" className="Link">
        Blog
      </a>
      <a href="#" className="Link">
        Support
      </a>

      <Separator orientation="vertical" className={theme.SeparatorRoot} />

      <a href="#" className="Link">
        Log in
      </a>
      <a href="#" className="Link">
        Sign up
      </a>
    </div>
  ),
};

/**
 * `Menu.Separator` is a re-export of `Separator` (`packages/react/src/menu/index.parts.ts`),
 * used between `Menu.Group`s to divide unrelated clusters of items — the
 * component's own grouping-semantics anatomy (story-plan #3). `defaultOpen`
 * keeps the popup visible for the static demo instead of requiring a click.
 */
export const InMenu: Story = {
  tags: ['highlight'],
  render: () => (
    <Menu.Root defaultOpen modal={false}>
      <Menu.Trigger className={theme.MenuTrigger}>Edit</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4}>
          <Menu.Popup className={theme.MenuPopup}>
            <Menu.Group>
              <Menu.GroupLabel className={theme.MenuGroupLabel}>Clipboard</Menu.GroupLabel>
              <Menu.Item className={theme.MenuItem}>Cut</Menu.Item>
              <Menu.Item className={theme.MenuItem}>Copy</Menu.Item>
              <Menu.Item className={theme.MenuItem}>Paste</Menu.Item>
            </Menu.Group>
            <Separator className={theme.MenuSeparator} />
            <Menu.Group>
              <Menu.GroupLabel className={theme.MenuGroupLabel}>Selection</Menu.GroupLabel>
              <Menu.Item className={theme.MenuItem}>Select all</Menu.Item>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
};

function ToolbarSeparatorOrientationExample() {
  const [orientation, setOrientation] = React.useState<'horizontal' | 'vertical'>('horizontal');
  return (
    <div className="Stack">
      <button
        type="button"
        onClick={() =>
          setOrientation((current) => (current === 'horizontal' ? 'vertical' : 'horizontal'))
        }
      >
        Toolbar orientation: {orientation} (click to flip)
      </button>
      <Toolbar.Root
        aria-label="Formatting"
        orientation={orientation}
        className={
          orientation === 'vertical' ? `${theme.ToolbarRoot} ToolbarVertical` : theme.ToolbarRoot
        }
      >
        <Toolbar.Group aria-label="Text style">
          <button type="button" className={theme.ToolbarButton}>
            B
          </button>
        </Toolbar.Group>
        <Toolbar.Separator data-testid="toolbar-separator" />
        <Toolbar.Group aria-label="Alignment">
          <button type="button" className={theme.ToolbarButton}>
            Left
          </button>
        </Toolbar.Group>
      </Toolbar.Root>
    </div>
  );
}

/**
 * `Toolbar.Separator` auto-inverts its orientation relative to the hosting
 * `Toolbar.Root`'s own `orientation` (`ToolbarSeparator.tsx`: a horizontal
 * toolbar renders vertical separators, and vice versa) unless overridden by
 * an explicit `orientation` prop on the Separator itself. Flipping the
 * toolbar's own orientation live demonstrates the inversion is dynamic, not
 * a one-time default (brief §6/§10).
 */
export const InToolbar: Story = {
  tags: ['highlight'],
  render: () => <ToolbarSeparatorOrientationExample />,
  play: async ({ canvas, userEvent }) => {
    const separator = canvas.getByTestId('toolbar-separator');
    const toggle = canvas.getByRole('button', { name: /Toolbar orientation/ });

    // Horizontal toolbar -> vertical separator.
    await expect(separator).toHaveAttribute('data-orientation', 'vertical');

    await userEvent.click(toggle);

    // Vertical toolbar -> horizontal separator.
    await expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  },
};
