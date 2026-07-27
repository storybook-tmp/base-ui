import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Switch } from '@base-ui/react/switch';
import { Field } from '@base-ui/react/field';
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

function ControlledExample() {
  const [checked, setChecked] = React.useState(false);
  return (
    <div className={theme.FormRoot}>
      <label className={theme.SwitchLabel}>
        <Switch.Root checked={checked} onCheckedChange={setChecked} className={theme.SwitchRoot}>
          <Switch.Thumb className={theme.SwitchThumb} />
        </Switch.Root>
        Airplane mode
      </label>
      <span className="SwitchDemoOutput">{checked ? 'On' : 'Off'}</span>
    </div>
  );
}

/** Use `checked` + `onCheckedChange` when external state must drive or observe the switch. */
export const Controlled: Story = {
  tags: ['highlight'],
  render: () => <ControlledExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('switch', { name: 'Airplane mode' }));
    await expect(canvas.getByText('On')).toBeVisible();
  },
};

/** Use the Field parts when you need a managed label, description, or validation wiring. */
export const WithFieldLabel: Story = {
  tags: ['highlight'],
  render: () => (
    <Field.Root>
      <Field.Label className={theme.SwitchLabel}>
        <Switch.Root defaultChecked className={theme.SwitchRoot}>
          <Switch.Thumb className={theme.SwitchThumb} />
        </Switch.Root>
        Marketing emails
      </Field.Label>
    </Field.Root>
  ),
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

/**
 * Project-wide CSS smoke check (exactly one across the whole Storybook, per the
 * generated setup prompt): asserts a concrete computed style from the Droppy
 * theme stylesheet, proving `@droppy/theme` and shared preview styles actually load.
 */
export const CssCheck: Story = {
  tags: ['highlight'],
  render: () => (
    <Switch.Root defaultChecked className={theme.SwitchRoot} aria-label="CSS check switch">
      <Switch.Thumb className={theme.SwitchThumb} />
    </Switch.Root>
  ),
  play: async ({ canvas }) => {
    const switchEl = canvas.getByRole('switch', { name: 'CSS check switch' });
    // .SwitchRoot sets width: 2.25rem — 36px. Fails if the theme stylesheet did not load.
    await expect(getComputedStyle(switchEl).width).toBe('36px');
  },
};
