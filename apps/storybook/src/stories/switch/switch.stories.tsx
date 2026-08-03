import * as React from 'react';
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

/** Use `render` + `nativeButton` to render an actual `<button>` element (default is a `<span>`). */
export const NativeButton: Story = {
  tags: ['api-ref'],
  render: () => (
    <label className={theme.SwitchLabel}>
      <Switch.Root nativeButton render={<button type="button" />} className={theme.SwitchRoot}>
        <Switch.Thumb className={theme.SwitchThumb} />
      </Switch.Root>
      Dark mode
    </label>
  ),
};

/** `disabled` switches expose `data-disabled` on every part for styling. */
export const Disabled: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className={theme.FormRoot}>
      <label className={theme.SwitchLabel}>
        <Switch.Root disabled className={theme.SwitchRoot}>
          <Switch.Thumb className={theme.SwitchThumb} />
        </Switch.Root>
        Disabled off
      </label>
      <label className={theme.SwitchLabel}>
        <Switch.Root disabled defaultChecked className={theme.SwitchRoot}>
          <Switch.Thumb className={theme.SwitchThumb} />
        </Switch.Root>
        Disabled on
      </label>
    </div>
  ),
};

function FormExample() {
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <form
      className={theme.FormRoot}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(String(data.get('newsletter')));
      }}
    >
      <label className={theme.SwitchLabel}>
        <Switch.Root name="newsletter" className={theme.SwitchRoot}>
          <Switch.Thumb className={theme.SwitchThumb} />
        </Switch.Root>
        Subscribe to the newsletter
      </label>
      <button type="submit" className={theme.Button}>
        Save
      </button>
      {submitted !== null ? (
        <output className="SwitchDemoOutput">newsletter={submitted}</output>
      ) : null}
    </form>
  );
}

/** The switch participates in native forms through a hidden input; `name` keys the submitted value. */
export const FormIntegration: Story = {
  tags: ['api-ref'],
  render: () => <FormExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('switch', { name: 'Subscribe to the newsletter' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(await canvas.findByText('newsletter=on')).toBeVisible();
  },
};
