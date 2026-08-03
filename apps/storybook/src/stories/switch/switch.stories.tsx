import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Switch } from '@base-ui/react/switch';
import theme from '@droppy/theme';
import './switch.demo.css';

/**
 * Stories follow research/c-components/switch (Tier 3): the kept hero demo,
 * one story per documented use case (labeling, native button, form integration),
 * plus state variants driven by the data-attribute contract.
 */
const meta = {
  title: 'Form inputs/Switch',
  component: Switch.Root,
  subcomponents: { 'Switch.Thumb': Switch.Thumb },
} satisfies Meta<typeof Switch.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: label-wrapped switch, on by default. Use as the starting point for any boolean setting with immediate effect. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <label className={theme.SwitchLabel}>
      <Switch.Root defaultChecked className={theme.SwitchRoot}>
        <Switch.Thumb className={theme.SwitchThumb} />
      </Switch.Root>
      Notifications
    </label>
  ),
  play: async ({ canvas, userEvent }) => {
    const switchEl = canvas.getByRole('switch', { name: 'Notifications' });
    await expect(switchEl).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(switchEl);
    await expect(switchEl).toHaveAttribute('aria-checked', 'false');
  },
};
