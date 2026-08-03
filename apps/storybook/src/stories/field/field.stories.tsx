import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import theme from '@droppy/theme';
import './field.demo.css';

/**
 * Stories follow research/c-components/field (Tier 1): the docs hero, the forms-handbook
 * labeling and grouping patterns, the validation-mode matrix (onSubmit default per #3013),
 * custom/cross-field/async validate, a control-swap set (Input/Select/Checkbox/textarea),
 * the state-attribute machine, server errors, the RHF-style controlled adapter (#2950),
 * and two real-world recreations picked from the code-ok entries in
 * research/d-real-world-usage/field/ranked.json.
 */
const meta = {
  title: 'Form inputs/Field',
  component: Field.Root,
  subcomponents: {
    'Field.Label': Field.Label,
    'Field.Control': Field.Control,
    'Field.Description': Field.Description,
    'Field.Error': Field.Error,
    'Field.Item': Field.Item,
    'Field.Validity': Field.Validity,
  },
} satisfies Meta<typeof Field.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Anatomy & labeling                                                  */
/* ------------------------------------------------------------------ */

/** The docs hero demo: label, control, error, and description — all id/aria wiring is automatic. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <Field.Root className={theme.FieldRoot}>
      <Field.Label className={theme.FieldLabel}>Name</Field.Label>
      <Field.Control required placeholder="Required" className={theme.Input} />

      <Field.Error className={theme.FieldError} match="valueMissing">
        Please enter your name
      </Field.Error>

      <Field.Description className={theme.FieldDescription}>
        Visible on your profile
      </Field.Description>
    </Field.Root>
  ),
};

/* ------------------------------------------------------------------ */
/* Validation modes                                                    */
/* ------------------------------------------------------------------ */

function OnSubmitModeExample() {
  const [status, setStatus] = React.useState<string | null>(null);
  return (
    <Form
      className={theme.FormRoot}
      onSubmit={(event) => {
        event.preventDefault();
        setStatus('Saved');
      }}
    >
      <Field.Root name="fullName" className={theme.FieldRoot}>
        <Field.Label className={theme.FieldLabel}>Full name</Field.Label>
        <Field.Control required placeholder="Required" className={theme.Input} />
        <Field.Error className={theme.FieldError} match="valueMissing">
          Please enter your full name.
        </Field.Error>
      </Field.Root>
      <button type="submit" className={theme.Button}>
        Submit
      </button>
      {status ? <output className="FieldDemoOutput">{status}</output> : null}
    </Form>
  );
}

/** The default mode (`onSubmit`, #3013): nothing is flagged while the user types, clears, or blurs — errors only appear on the first submit attempt, after which the field re-validates live. Requires a surrounding `Form` (or an explicit mode) — a standalone field never submits, so `validate` never runs. */
export const ValidationModeOnSubmit: Story = {
  tags: ['api-ref'],
  render: () => <OnSubmitModeExample />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Full name');

    // Touch, dirty, empty, and blur the field: still no error before submit.
    await userEvent.type(input, 'x');
    await userEvent.clear(input);
    await userEvent.tab();
    await expect(canvas.queryByText('Please enter your full name.')).not.toBeInTheDocument();

    // First submit attempt commits validation and focuses the invalid field.
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await canvas.findByText('Please enter your full name.');
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'));

    // After a submit attempt the field re-validates on every change.
    await userEvent.type(input, 'Ada Lovelace');
    await waitFor(() =>
      expect(canvas.queryByText('Please enter your full name.')).not.toBeInTheDocument(),
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByText('Saved')).toBeVisible();
  },
};

/** `validationMode="onBlur"`: typing an invalid value shows nothing until focus leaves the control — the middle ground between submit-gated and live validation. Works standalone, without a `Form`. */
export const ValidationModeOnBlur: Story = {
  tags: ['api-ref'],
  render: () => (
    <Field.Root validationMode="onBlur" className={theme.FieldRoot}>
      <Field.Label className={theme.FieldLabel}>Work email</Field.Label>
      <Field.Control type="email" placeholder="you@company.com" className={theme.Input} />
      <Field.Error className={theme.FieldError} match="typeMismatch">
        Enter a valid email address.
      </Field.Error>
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Work email');

    await userEvent.type(input, 'not-an-email');
    // No error while typing.
    await expect(canvas.queryByText('Enter a valid email address.')).not.toBeInTheDocument();

    // Blur commits validation.
    await userEvent.tab();
    await expect(await canvas.findByText('Enter a valid email address.')).toBeVisible();

    // Fix the value; the next blur clears the error.
    await userEvent.clear(input);
    await userEvent.type(input, 'ada@company.com');
    await userEvent.tab();
    await waitFor(() =>
      expect(canvas.queryByText('Enter a valid email address.')).not.toBeInTheDocument(),
    );
  },
};

/** `validationMode="onChange"`: every keystroke validates — here a custom `validate` enforces a minimum length (mirroring the native `minLength` constraint, which also carries a `tooShort` key for `Field.Error match`) — errors appear and disappear mid-typing. Reserve it for instant-feedback inputs; the maintainers argue submit-gated validation is the less noisy default (#2142). */
export const ValidationModeOnChange: Story = {
  tags: ['api-ref'],
  render: () => (
    <Field.Root
      validationMode="onChange"
      validate={(value) =>
        typeof value === 'string' && value.length > 0 && value.length < 6
          ? 'Use at least 6 characters.'
          : null
      }
      className={theme.FieldRoot}
    >
      <Field.Label className={theme.FieldLabel}>Passphrase</Field.Label>
      <Field.Control
        type="password"
        required
        minLength={6}
        placeholder="At least 6 characters"
        className={theme.Input}
      />
      <Field.Error className={theme.FieldError} />
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Passphrase');

    await userEvent.type(input, 'abc');
    await expect(await canvas.findByText('Use at least 6 characters.')).toBeVisible();

    await userEvent.type(input, 'def');
    await waitFor(() =>
      expect(canvas.queryByText('Use at least 6 characters.')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(input).toHaveAttribute('data-valid'));
  },
};

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Wrapping controls                                                   */

/* ------------------------------------------------------------------ */
/* State attributes, server errors, external libraries, animation      */

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/field)          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Icons (inline SVGs, matching the docs demos)                        */
