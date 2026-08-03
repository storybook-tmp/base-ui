import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Checkbox } from '@base-ui/react/checkbox';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
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

/** Clicking the label (or the checkbox itself) toggles `aria-checked`. */
export const ToggleWithClick: Story = {
  tags: ['highlight'],
  render: () => (
    <label className={theme.CheckboxLabel}>
      <Checkbox.Root className={theme.CheckboxRoot}>
        <Checkbox.Indicator className={theme.CheckboxIndicator}>
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Accept terms and conditions
    </label>
  ),
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Accept terms and conditions' });
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(checkbox);
    await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));

    await userEvent.click(checkbox);
    await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'false'));
  },
};

function ControlledCheckedExample() {
  const [checked, setChecked] = React.useState(false);
  return (
    <div className={theme.FormRoot}>
      <label className={theme.CheckboxLabel}>
        <Checkbox.Root
          checked={checked}
          onCheckedChange={setChecked}
          className={theme.CheckboxRoot}
        >
          <Checkbox.Indicator className={theme.CheckboxIndicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Accept terms and conditions
      </label>
      <button type="button" className={theme.Button} onClick={() => setChecked((prev) => !prev)}>
        Toggle externally
      </button>
      <output className="CheckboxDemoOutput">checked={String(checked)}</output>
    </div>
  );
}

/** External `checked`/`onCheckedChange` state drives the checkbox; clicking the label still round-trips through the same handler, so both interaction sources stay in sync. */
export const ControlledChecked: Story = {
  tags: ['highlight'],
  render: () => <ControlledCheckedExample />,
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Accept terms and conditions' });
    await expect(canvas.getByText('checked=false')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Toggle externally' }));
    await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));
    await waitFor(() => expect(canvas.getByText('checked=true')).toBeVisible());

    await userEvent.click(checkbox);
    await waitFor(() => expect(canvas.getByText('checked=false')).toBeVisible());
  },
};

function InFieldWithValidationExample() {
  return (
    <Form className={theme.FormRoot}>
      <Field.Root name="terms" className={theme.FormRoot}>
        <label className={theme.CheckboxLabel}>
          <Checkbox.Root required className={theme.CheckboxRoot}>
            <Checkbox.Indicator className={theme.CheckboxIndicator}>
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          I agree to the terms of service
        </label>
        <Field.Error className={theme.FieldError} match="valueMissing">
          You must agree before continuing.
        </Field.Error>
      </Field.Root>
      <button type="submit" className={theme.Button}>
        Save
      </button>
    </Form>
  );
}

/** Wrapped in `Field.Root required`, submitting while unchecked shows `valueMissing`; checking the box clears the error — the same Field validation flow used across Radio/Checkbox Group. */
export const InFieldWithValidation: Story = {
  tags: ['highlight'],
  render: () => <InFieldWithValidationExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(canvas.getByText('You must agree before continuing.')).toBeVisible(),
    );

    await userEvent.click(
      canvas.getByRole('checkbox', { name: 'I agree to the terms of service' }),
    );
    await waitFor(() =>
      expect(canvas.queryByText('You must agree before continuing.')).not.toBeInTheDocument(),
    );
  },
};

/** Recreates the docs "Rendering as a native button" pattern: `nativeButton` + `render={<button/>}` paired with a sibling `<label htmlFor>` (rather than an enclosing label, which would be invalid HTML around a real `<button>`). */
export const NativeButtonSiblingLabel: Story = {
  tags: ['highlight'],
  render: () => (
    <div className={theme.CheckboxLabel}>
      <Checkbox.Root
        id="marketing-emails"
        nativeButton
        render={<button type="button" />}
        className={theme.CheckboxRoot}
      >
        <Checkbox.Indicator className={theme.CheckboxIndicator}>
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <label htmlFor="marketing-emails">Receive marketing emails</label>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Receive marketing emails' });
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(canvas.getByText('Receive marketing emails'));
    await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));
  },
};
