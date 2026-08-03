import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Separator } from '@base-ui/react/separator';
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

/** Default `orientation="horizontal"` (full width, thin height) between stacked content — `role="separator"` with `aria-orientation="horizontal"` and the matching `data-orientation` styling hook (mandatory orientation story, story-plan #1). */
export const Horizontal: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="Stack">
      <p className="Text">Section one</p>
      <Separator className={theme.SeparatorRoot} />
      <p className="Text">Section two</p>
    </div>
  ),
  play: async ({ canvas }) => {
    const separator = canvas.getByRole('separator');
    await expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  },
};

/** `orientation="vertical"` between inline content, mirroring the hero demo's nav-link pattern — flips both `aria-orientation` and `data-orientation` (mandatory orientation story, story-plan #2). */
export const Vertical: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="Row">
      <span className="Text">Left</span>
      <Separator orientation="vertical" className={theme.SeparatorRoot} />
      <span className="Text">Right</span>
    </div>
  ),
  play: async ({ canvas }) => {
    const separator = canvas.getByRole('separator');
    await expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    await expect(separator).toHaveAttribute('data-orientation', 'vertical');
  },
};
