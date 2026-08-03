import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Button } from '@base-ui/react/button';
import theme from '@droppy/theme';
import './button.demo.css';

/**
 * Stories follow research/c-components/button (Tier 3): the kept docs hero demo,
 * plus the two behaviors that justify Button's own existence per its decision
 * log (#2138/#2225 -> #2363) — `focusableWhenDisabled` and Enter/Space
 * activation synthesized on a non-`<button>` tag via `render`.
 */
const meta = {
  title: 'Actions/Button',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: a plain Button with default styling. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => <Button className={theme.Button}>Submit</Button>,
};

/* ------------------------------------------------------------------ */
/* Loading state (docs "loading" demo)                                  */
/* ------------------------------------------------------------------ */

function LoadingExample() {
  const [loading, setLoading] = React.useState(false);

  return (
    <Button
      className={theme.Button}
      disabled={loading}
      focusableWhenDisabled
      onClick={() => {
        setLoading(true);
        setTimeout(() => setLoading(false), 4000);
      }}
    >
      {loading ? 'Submitting' : 'Submit'}
    </Button>
  );
}

/**
 * A pending action pairs `disabled` with `focusableWhenDisabled`, so the button
 * stops responding to clicks while staying reachable by keyboard and announced
 * by screen readers instead of vanishing from the tab order.
 */
export const Loading: Story = {
  tags: ['api-ref', 'base'],
  render: () => <LoadingExample />,
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Submit' });
    await userEvent.click(button);

    const pending = await canvas.findByRole('button', { name: 'Submitting' });
    // focusableWhenDisabled exposes aria-disabled rather than the native
    // attribute, so the pending button stays in the tab order.
    await expect(pending).toHaveAttribute('aria-disabled', 'true');
    await expect(pending).toHaveAttribute('tabindex', '0');

    pending.focus();
    await expect(pending).toHaveFocus();
  },
};
