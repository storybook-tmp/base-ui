import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '@base-ui/react/avatar';
import theme from '@droppy/theme';
import './avatar.demo.css';

/**
 * Stories follow research/c-components/avatar (Tier 3): the kept hero demo
 * (image + initials-only) plus the mandatory broken-image-to-fallback play
 * exercising the async image-loading-status state machine.
 */
const meta = {
  title: 'Status & display/Avatar',
  component: Avatar.Root,
  subcomponents: {
    'Avatar.Image': Avatar.Image,
    'Avatar.Fallback': Avatar.Fallback,
  },
} satisfies Meta<typeof Avatar.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: an image avatar with a delayed initials fallback, next to a second avatar with plain text children and no `Image`/`Fallback` parts at all — the docs-sanctioned "no photo available" pattern. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <div className="Row">
      <Avatar.Root className={theme.AvatarRoot}>
        <Avatar.Image
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
          width="48"
          height="48"
          alt="Jane Doe"
          className={theme.AvatarImage}
        />
        <Avatar.Fallback delay={600} className={theme.AvatarFallback}>
          LT
        </Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root className={theme.AvatarRoot}>LT</Avatar.Root>
    </div>
  ),
};
