import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Checkbox } from '@base-ui/react/checkbox';
import theme from '@droppy/theme';
import './checkbox.demo.css';

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

/**
 * Stories follow research/c-components/checkbox (Tier 2): the docs hero (enclosing-label
 * checkbox, Root + Indicator), the Space/click toggle interaction, the tri-state
 * `indeterminate` prop (not overridden by `checked`, #-verified against
 * `CheckboxRoot.test.tsx`), and native form submission with `uncheckedValue` — the #3406
 * "match native off state" contract: an unchecked checkbox submits nothing by default.
 */
const meta = {
  title: 'Form inputs/Checkbox',
  component: Checkbox.Root,
  subcomponents: { 'Checkbox.Indicator': Checkbox.Indicator },
} satisfies Meta<typeof Checkbox.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: an enclosing label, checked by default. */
export const Basic: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <label className={theme.CheckboxLabel}>
      <Checkbox.Root defaultChecked className={theme.CheckboxRoot}>
        <Checkbox.Indicator className={theme.CheckboxIndicator}>
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Enable notifications
    </label>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox', { name: 'Enable notifications' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  },
};
