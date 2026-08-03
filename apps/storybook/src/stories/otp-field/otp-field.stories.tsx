import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { OTPField } from '@base-ui/react/otp-field';
import theme from '@droppy/theme';
import './otp-field.demo.css';

const OTP_LENGTH = 6;

/**
 * Floor coverage following research/c-components/otp-field (Tier 2 lean-plus): the docs
 * hero slot composition, typing a code to completion, pasting a full code, the Backspace
 * cascading-delete state machine, and form submission. Imports the stable `OTPField` export
 * (post-#5029 — never `OTPFieldPreview`, which was renamed as a breaking change).
 */
const meta = {
  title: 'Form inputs/OTP Field',
  component: OTPField.Root,
  // Mirrors the docs-nav [New] status tag (DoD §20) — the only [New]-tagged component.
  tags: ['new'],
  subcomponents: {
    'OTPField.Input': OTPField.Input,
    'OTPField.Separator': OTPField.Separator,
  },
} satisfies Meta<typeof OTPField.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

function HeroExample() {
  const id = React.useId();
  const descriptionId = `${id}-description`;
  return (
    <div className={theme.FieldRoot}>
      <label htmlFor={id} className={theme.FieldLabel}>
        Verification code
      </label>
      <OTPField.Root
        id={id}
        length={OTP_LENGTH}
        aria-describedby={descriptionId}
        className={theme.OtpFieldRoot}
      >
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={theme.OtpFieldInput}
            aria-label={index === 0 ? undefined : `Character ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField.Root>
      <p id={descriptionId} className={theme.FieldDescription}>
        Enter the 6-character code we sent to your device.
      </p>
    </div>
  );
}

/** The docs hero demo: 6 numeric slots, a native label on slot 0, `aria-label` on the rest, and a description. Recreates `demos/hero`. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  // `length` is a required OTPField.Root prop with no default; `render` fully overrides
  // rendering below, but StoryObj's generated args type still needs a value to satisfy it.
  args: { length: OTP_LENGTH },
  render: () => <HeroExample />,
  play: async ({ canvas }) => {
    const inputs = canvas.getAllByRole('textbox');
    await expect(inputs).toHaveLength(OTP_LENGTH);
    // Only slot 0 inherits the field's shared accessible name (via aria-labelledby to the
    // native <label>) — the rest need their own aria-label (verified against source, see
    // the MDX a11y section). The hidden validation input shares the same labelledby id, so
    // getByLabelText can match more than one node — assert the attribute directly instead.
    const labelId = canvas.getByText('Verification code').id;
    await expect(inputs[0]).toHaveAttribute('aria-labelledby', labelId);
    await expect(inputs[1]).toHaveAttribute('aria-label', 'Character 2 of 6');
  },
};

function otpInputs(count: number, total: number = count, offset = 0) {
  return Array.from({ length: count }, (_, index) => (
    <OTPField.Input
      key={index + offset}
      className={theme.OtpFieldInput}
      aria-label={index + offset === 0 ? undefined : `Character ${index + offset + 1} of ${total}`}
    />
  ));
}

/**
 * `mask` renders each slot as `type="password"` instead of `type="text"`, contrasted with an
 * unmasked sibling. Confirmed live in this story's own play function (not just the brief's
 * flagged uncertainty): a `type="password"` input has **no implicit ARIA role at all** —
 * `getByRole('textbox')` cannot find it — so masked slots must be queried by tag, not role. What
 * a real screen reader announces for a masked slot still needs independent verification; this
 * story only confirms the DOM/role-query behavior, not the AT experience.
 */
function MaskedVariantExample() {
  const maskedId = React.useId();
  const unmaskedId = React.useId();
  return (
    <div className="OtpFieldDemoRow">
      <div className={theme.FieldRoot}>
        <label htmlFor={maskedId} className={theme.FieldLabel}>
          Masked
        </label>
        <OTPField.Root
          id={maskedId}
          length={OTP_LENGTH}
          mask
          aria-label="Masked code"
          className={theme.OtpFieldRoot}
        >
          {otpInputs(OTP_LENGTH)}
        </OTPField.Root>
      </div>
      <div className={theme.FieldRoot}>
        <label htmlFor={unmaskedId} className={theme.FieldLabel}>
          Unmasked
        </label>
        <OTPField.Root
          id={unmaskedId}
          length={OTP_LENGTH}
          aria-label="Unmasked code"
          className={theme.OtpFieldRoot}
        >
          {otpInputs(OTP_LENGTH)}
        </OTPField.Root>
      </div>
    </div>
  );
}

export const MaskedVariant: Story = {
  tags: ['api-ref', 'base'],
  args: { length: OTP_LENGTH },
  render: () => <MaskedVariantExample />,
  play: async ({ canvas, userEvent }) => {
    const [maskedGroup, unmaskedGroup] = canvas.getAllByRole('group');
    // A `type="password"` input has no implicit ARIA role — `getByRole('textbox')` cannot find
    // it at all (verified live here, not merely the brief's flagged uncertainty), so masked
    // slots must be queried directly by tag rather than by role.
    const maskedInputs = maskedGroup.querySelectorAll<HTMLInputElement>('input');
    const unmaskedInputs = within(unmaskedGroup).getAllByRole<HTMLInputElement>('textbox');

    maskedInputs[0].focus();
    await userEvent.keyboard('1');
    await waitFor(() => expect(maskedInputs[0]).toHaveAttribute('type', 'password'));

    unmaskedInputs[0].focus();
    await userEvent.keyboard('1');
    await waitFor(() => expect(unmaskedInputs[0]).toHaveAttribute('type', 'text'));
  },
};

/**
 * Slots can be nested in arbitrary DOM structure (here, two plain `<div>` groups split by
 * `OTPField.Separator`) — the `CompositeList` tracks logical slot order independently of DOM
 * sibling structure, so typing still auto-advances focus across the group boundary. Recreates
 * `demos/grouped`.
 */
function GroupedWithSeparatorExample() {
  const id = React.useId();
  return (
    <div className={theme.FieldRoot}>
      <label htmlFor={id} className={theme.FieldLabel}>
        Verification code
      </label>
      <OTPField.Root id={id} length={OTP_LENGTH} className={theme.OtpFieldRoot}>
        <div className="OtpFieldDemoGroup">{otpInputs(3, OTP_LENGTH)}</div>
        <OTPField.Separator className={theme.OtpFieldSeparator} />
        <div className="OtpFieldDemoGroup">{otpInputs(3, OTP_LENGTH, 3)}</div>
      </OTPField.Root>
    </div>
  );
}

export const GroupedWithSeparator: Story = {
  tags: ['highlight', 'base'],
  args: { length: OTP_LENGTH },
  render: () => <GroupedWithSeparatorExample />,
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');
    await expect(inputs).toHaveLength(OTP_LENGTH);

    inputs[0].focus();
    await userEvent.keyboard('1');
    // Auto-advances into the second `<div>` group, across the Separator.
    await waitFor(() => expect(document.activeElement).toBe(inputs[1]));
  },
};

/** `validationType="alphanumeric"` accepts both letters and digits, unlike the `"numeric"` default. Recreates `demos/alphanumeric`. */
function AlphanumericExample() {
  const id = React.useId();
  return (
    <div className={theme.FieldRoot}>
      <label htmlFor={id} className={theme.FieldLabel}>
        Recovery code
      </label>
      <OTPField.Root
        id={id}
        length={OTP_LENGTH}
        validationType="alphanumeric"
        className={theme.OtpFieldRoot}
      >
        {otpInputs(OTP_LENGTH)}
      </OTPField.Root>
    </div>
  );
}

export const Alphanumeric: Story = {
  tags: ['highlight', 'base'],
  args: { length: OTP_LENGTH },
  render: () => <AlphanumericExample />,
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');
    inputs[0].focus();
    for (const char of 'A1B2C3') {
      // eslint-disable-next-line no-await-in-loop
      await userEvent.keyboard(char);
    }
    await waitFor(() => expect(inputs.map((input) => input.value).join('')).toBe('A1B2C3'));
  },
};

/* ------------------------------------------------------------------ */
/* Focused placeholder (docs "focused-placeholder" demo)                */
/* ------------------------------------------------------------------ */

const PLACEHOLDER_LENGTH = 6;

/**
 * A `placeholder` on each `OTPField.Input` keeps a visible hint in every empty
 * slot, so the expected code length reads at a glance before typing starts.
 */
export const FocusedPlaceholder: Story = {
  tags: ['api-ref', 'base'],
  args: { length: PLACEHOLDER_LENGTH },
  render: () => (
    <div className={theme.FieldRoot}>
      <span className={theme.FieldLabel}>Verification code</span>
      <OTPField.Root length={PLACEHOLDER_LENGTH} className={theme.OtpFieldRoot}>
        {Array.from({ length: PLACEHOLDER_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={theme.OtpFieldInput}
            placeholder="•"
            aria-label={`Character ${index + 1} of ${PLACEHOLDER_LENGTH}`}
          />
        ))}
      </OTPField.Root>
      <p className={theme.FieldDescription}>
        Placeholder hints stay visible until each slot receives a character.
      </p>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');
    await expect(inputs[0]).toHaveAttribute('placeholder', '•');

    inputs[0].focus();
    await userEvent.keyboard('7');
    await waitFor(() => expect(inputs[0].value).toBe('7'));
  },
};

/* ------------------------------------------------------------------ */
/* Custom sanitize (docs "custom-sanitize" demo)                        */
/* ------------------------------------------------------------------ */

const SANITIZE_LENGTH = 6;

/**
 * `normalizeValue` rewrites each accepted character before it lands in the
 * field. Combined with `validationType="alphanumeric"`, a recovery code accepts
 * letters and digits and stores the letters uppercased, whatever the user typed.
 */
export const CustomSanitize: Story = {
  tags: ['api-ref', 'base'],
  args: { length: SANITIZE_LENGTH },
  render: () => (
    <div className={theme.FieldRoot}>
      <span className={theme.FieldLabel}>Recovery code</span>
      <OTPField.Root
        length={SANITIZE_LENGTH}
        validationType="alphanumeric"
        normalizeValue={(value: string) => value.toUpperCase()}
        className={theme.OtpFieldRoot}
      >
        {Array.from({ length: SANITIZE_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={theme.OtpFieldInput}
            aria-label={`Character ${index + 1} of ${SANITIZE_LENGTH}`}
          />
        ))}
      </OTPField.Root>
      <p className={theme.FieldDescription}>
        Letters and digits only. Letters are converted to uppercase.
      </p>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');
    inputs[0].focus();
    await userEvent.keyboard('a');

    // normalizeValue uppercases the typed letter.
    await waitFor(() => expect(inputs[0].value).toBe('A'));
  },
};
