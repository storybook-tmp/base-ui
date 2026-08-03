import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
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

function HorizontalRuleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        stroke="currentColor"
        vectorEffect="non-scaling-stroke"
      />
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

/** `indeterminate` sets `aria-checked="mixed"` independently of `checked` — it is not overridden or auto-cleared by clicking. */
export const Indeterminate: Story = {
  tags: ['api-ref'],
  render: () => (
    <label className={theme.CheckboxLabel}>
      <Checkbox.Root indeterminate className={theme.CheckboxRoot}>
        <Checkbox.Indicator className={theme.CheckboxIndicator}>
          <HorizontalRuleIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Select all fruits
    </label>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox', { name: 'Select all fruits' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
  },
};

function FormExample() {
  const [submitted, setSubmitted] = React.useState<string | null | undefined>(undefined);
  return (
    <form
      className={theme.FormRoot}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(data.get('newsletter') as string | null);
      }}
    >
      <label className={theme.CheckboxLabel}>
        <Checkbox.Root name="newsletter" uncheckedValue="off" className={theme.CheckboxRoot}>
          <Checkbox.Indicator className={theme.CheckboxIndicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Subscribe to the newsletter
      </label>
      <button type="submit" className={theme.Button}>
        Save
      </button>
      {submitted !== undefined ? (
        <output className="CheckboxDemoOutput">newsletter={submitted}</output>
      ) : null}
    </form>
  );
}

/** With `uncheckedValue` set, an unchecked checkbox submits that explicit sentinel rather than being absent from `FormData` (#3406's opt-in escape hatch). */
export const FormWithUncheckedValue: Story = {
  tags: ['api-ref'],
  render: () => <FormExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(canvas.getByText('newsletter=off')).toBeVisible());

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Subscribe to the newsletter' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(canvas.getByText('newsletter=on')).toBeVisible());
  },
};

/**
 * A single `Checkbox.Root parent` inside a small `CheckboxGroup` — the "select all" coordinator.
 * `parent` is declared here on `Checkbox.Root` because that's its public prop location, but the
 * full tri-state cycle algorithm (`mixed → on → off → mixed`, disabled-child exclusion, nested
 * groups) is demonstrated in depth in
 * [Checkbox Group](?path=/docs/form-inputs-checkbox-group--docs)'s own stories — this story is a
 * narrow preview showing only that the prop lives on `Checkbox.Root`.
 */
export const ParentCheckboxPreview: Story = {
  tags: ['api-ref'],
  render: () => (
    <CheckboxGroup
      aria-label="Fruits"
      defaultValue={['apple']}
      allValues={['apple', 'banana', 'cherry']}
      className={theme.FormRoot}
    >
      <label className={theme.CheckboxLabel}>
        <Checkbox.Root parent className={theme.CheckboxRoot}>
          <Checkbox.Indicator className={theme.CheckboxIndicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        All fruits
      </label>
      <label className={theme.CheckboxLabel} style={{ paddingLeft: '1.5rem' }}>
        <Checkbox.Root value="apple" className={theme.CheckboxRoot}>
          <Checkbox.Indicator className={theme.CheckboxIndicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Apple
      </label>
      <label className={theme.CheckboxLabel} style={{ paddingLeft: '1.5rem' }}>
        <Checkbox.Root value="banana" className={theme.CheckboxRoot}>
          <Checkbox.Indicator className={theme.CheckboxIndicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Banana
      </label>
      <label className={theme.CheckboxLabel} style={{ paddingLeft: '1.5rem' }}>
        <Checkbox.Root value="cherry" className={theme.CheckboxRoot}>
          <Checkbox.Indicator className={theme.CheckboxIndicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Cherry
      </label>
    </CheckboxGroup>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox', { name: 'All fruits' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
  },
};

/** `readOnly` blocks every toggle path (click, Space) while a sibling `disabled` checkbox is shown for comparison — both stay visibly ticked/unticked but neither can change state. */
export const ReadOnlyBlocksToggle: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className={theme.FormRoot}>
      <label className={theme.CheckboxLabel}>
        <Checkbox.Root defaultChecked readOnly className={theme.CheckboxRoot}>
          <Checkbox.Indicator className={theme.CheckboxIndicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Read-only (checked)
      </label>
      <label className={theme.CheckboxLabel}>
        <Checkbox.Root disabled className={theme.CheckboxRoot}>
          <Checkbox.Indicator className={theme.CheckboxIndicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Disabled (unchecked)
      </label>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const readOnlyCheckbox = canvas.getByRole('checkbox', { name: 'Read-only (checked)' });
    await expect(readOnlyCheckbox).toHaveAttribute('aria-readonly', 'true');

    await userEvent.click(canvas.getByText('Read-only (checked)'));
    await waitFor(() => expect(readOnlyCheckbox).toHaveAttribute('aria-checked', 'true'));
  },
};
