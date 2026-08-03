import type { Meta, StoryObj } from '@storybook/react-vite';
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
