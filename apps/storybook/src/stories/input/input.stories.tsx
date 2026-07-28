import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import { Form } from '@base-ui/react/form';
import { Input } from '@base-ui/react/input';
import theme from '@droppy/theme';
import './input.demo.css';

/**
 * Stories follow research/c-components/input (Tier 3, lean brief): `Input.tsx`
 * is a 17-line component that renders `<Field.Control ref={forwardedRef} {...props} />`
 * and nothing else — Input *is* Field.Control under an intention-revealing name
 * (brief §1, §2). Every story below proves one part of that inherited contract
 * rather than re-deriving Field's own test matrix.
 */
const meta = {
  title: 'Form inputs/Input',
  component: Input,
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Field-integrated composition (the reason Input exists, brief §2): nested in `Field.Root`, `Input` "just works" with zero wiring props — labeling and the full validity/interaction state machine come for free the moment it's inside a Field tree. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <Field.Root className={theme.FieldRoot}>
      <Field.Label className={theme.FieldLabel}>Name</Field.Label>
      <Input placeholder="e.g. Colm Tuite" className={theme.Input} />
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Name');
    await expect(input).not.toHaveAttribute('data-filled');

    await userEvent.type(input, 'Ada Lovelace');
    await expect(input).toHaveValue('Ada Lovelace');
    await waitFor(() => expect(input).toHaveAttribute('data-filled'));
  },
};

/** Every attribute in `InputDataAttributes.ts` populates on the `<input>` itself once nested in `Field.Root` — an empty required field turns invalid on blur, then valid once filled (brief §1, §8, verbatim restatement of Field's contract). */
export const ValidationStates: Story = {
  tags: ['highlight'],
  render: () => (
    <Field.Root name="email" validationMode="onBlur" className={theme.FieldRoot}>
      <Field.Label className={theme.FieldLabel}>Work email</Field.Label>
      <Input required type="email" placeholder="you@company.com" className={theme.Input} />
      <Field.Error className={theme.FieldError} match="valueMissing">
        Please enter your email.
      </Field.Error>
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Work email');
    await expect(input).not.toHaveAttribute('data-invalid');

    // Dirty the field, then empty it: a blur now commits full validation.
    // (A *pristine* empty required field is deliberately not flagged on blur,
    // to reduce error noise — only a field the user has actually touched can
    // fail on `valueMissing` alone.)
    await userEvent.type(input, 'x');
    await userEvent.clear(input);
    await userEvent.tab();
    await waitFor(() => expect(input).toHaveAttribute('data-touched'));
    await waitFor(() => expect(input).toHaveAttribute('data-invalid'));
    await expect(await canvas.findByText('Please enter your email.')).toBeVisible();

    await userEvent.type(input, 'ada@base-ui.com');
    await userEvent.tab();
    await waitFor(() => expect(input).toHaveAttribute('data-valid'));
    await expect(input).not.toHaveAttribute('data-invalid');
  },
};

function FormExample() {
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <Form
      className={theme.FormRoot}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(String(data.get('displayName')));
      }}
    >
      <Field.Root name="displayName" className={theme.FieldRoot}>
        <Field.Label className={theme.FieldLabel}>Display name</Field.Label>
        <Input required placeholder="e.g. Ada Lovelace" className={theme.Input} />
      </Field.Root>
      <button type="submit" className={theme.Button}>
        Save
      </button>
      {submitted !== null ? <output className="InputDemoOutput">saved: {submitted}</output> : null}
    </Form>
  );
}

/** `Input` submits through the same hidden-input/native-form contract as `Field.Control` — no code of its own, entirely inherited (brief §6). */
export const FormIntegration: Story = {
  tags: ['highlight'],
  render: () => <FormExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Display name'), 'Ada Lovelace');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(await canvas.findByText('saved: Ada Lovelace')).toBeVisible();
  },
};

/**
 * The actual hero-demo pattern (brief §5, §6): a plain `<label>` wrapping
 * `Input`, with no `Field.Root` anywhere in the tree. Proves the other half
 * of Input's duality claim — it never throws or misbehaves outside a Field
 * tree, and `data-disabled` is the only state attribute that still means
 * anything (no `data-touched`/`data-valid`/`data-dirty`, since there is no
 * Field validity state machine to drive them).
 */
export const StandaloneNoField: Story = {
  tags: ['highlight'],
  render: () => (
    <label className={theme.FieldRoot}>
      <span className={theme.FieldLabel}>Search</span>
      <Input placeholder="Type to search…" className={theme.Input} />
    </label>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Search');
    await userEvent.type(input, 'base-ui');
    await userEvent.tab();

    await expect(input).not.toHaveAttribute('data-touched');
    await expect(input).not.toHaveAttribute('data-valid');
    await expect(input).not.toHaveAttribute('data-dirty');
  },
};

/**
 * `Fieldset.Root disabled` cascades the native `disabled` attribute down to
 * every nested control, including an `Input` nested two levels down inside a
 * `Field.Root` — `Input` never receives `disabled` directly, it inherits the
 * native HTML fieldset-disables-descendants behavior unchanged, exactly as
 * `FieldsetRoot.test.tsx` "keeps nested fieldsets disabled..." pins for
 * `Field.Control` (brief §6, cross-references the fieldset stories'
 * `DisabledCascade` story).
 */
export const DisabledFromFieldset: Story = {
  tags: ['highlight'],
  render: () => (
    <Fieldset.Root disabled className={theme.FieldRoot}>
      <Fieldset.Legend className={theme.FieldLabel}>Account details</Fieldset.Legend>
      <Field.Root className={theme.FieldRoot}>
        <Field.Label className={theme.FieldLabel}>Display name</Field.Label>
        <Input placeholder="e.g. Ada Lovelace" className={theme.Input} />
      </Field.Root>
    </Fieldset.Root>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Display name');
    await expect(input).toHaveAttribute('disabled');
    await expect(input).toHaveAttribute('data-disabled');
  },
};

// `StandaloneAriaLabel` and `ControlledWithClear` from the story plan are
// intentionally skipped: the plan itself flags `ControlledWithClear` as
// "written from first principles... tagged needs-work until cross-checked
// against #4643's actual resolution" (story-plan.md #6) -- not evidenced
// enough for this small-gap-closing pass. `StandaloneAriaLabel` would only
// re-assert the well-established "aria-label sets the accessible name" rule
// already implicitly covered by every `getByLabelText` query above.
