import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, spyOn, waitFor } from 'storybook/test';
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

function RenderCompositionExample() {
  const [activations, setActivations] = React.useState(0);
  return (
    <div className="Row">
      <Button
        render={<div />}
        nativeButton={false}
        className={theme.Button}
        onClick={() => setActivations((count) => count + 1)}
      >
        Custom tag
      </Button>
      <span className="Output">Activations: {activations}</span>
    </div>
  );
}

/**
 * `render` + `nativeButton={false}` lets Button render as another tag (e.g. a
 * `<div>`) while remaining accessible: Base UI synthesizes the Enter/Space ->
 * click activation a real `<button>` gets from the browser for free.
 */
export const RenderComposition: Story = {
  tags: ['highlight'],
  render: () => <RenderCompositionExample />,
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Custom tag' });
    await expect(button.tagName).toBe('DIV');

    await userEvent.tab();
    await expect(button).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByText('Activations: 1')).toBeVisible();

    await userEvent.keyboard(' ');
    await expect(canvas.getByText('Activations: 2')).toBeVisible();
  },
};

function NativeButtonMismatchExample() {
  const [mounted, setMounted] = React.useState(false);
  return (
    <div className="Row">
      <button type="button" className={theme.Button} onClick={() => setMounted(true)}>
        Mount mismatched button
      </button>
      {mounted ? (
        <Button render={<span />} className={theme.Button}>
          Custom span
        </Button>
      ) : null}
    </div>
  );
}

/**
 * `nativeButton` defaults to `true`. Rendering a non-`<button>` tag (e.g. via
 * `render={<span />}`) without also setting `nativeButton={false}` triggers a
 * dev-mode `Base UI:` console error, verified against the exact string in
 * `useButton.ts`/`useButton.test.tsx` ("errors if nativeButton=true but ref is
 * not a button"). The mismatched button is mounted on demand (rather than on
 * initial render) so the play function's `console.error` spy is installed
 * before the mount-time warning effect fires.
 */
export const NativeButtonMismatchWarning: Story = {
  tags: ['highlight'],
  render: () => <NativeButtonMismatchExample />,
  play: async ({ canvas, userEvent }) => {
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {});
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Mount mismatched button' }));
      // The warning is a dev-only guard (`process.env.NODE_ENV !== 'production'`), so it is not
      // emitted in the production Storybook build (Chromatic). Assert it only where it fires.
      if (process.env.NODE_ENV !== 'production') {
        await waitFor(() => {
          expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining(
              'Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true.',
            ),
          );
        });
      }
    } finally {
      errorSpy.mockRestore();
    }
  },
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
