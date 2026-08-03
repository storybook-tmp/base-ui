import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { OTPField } from '@base-ui/react/otp-field';
import { Field } from '@base-ui/react/field';
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

function TypeToCompleteExample() {
  const id = React.useId();
  const [complete, setComplete] = React.useState<string | null>(null);
  return (
    <div className={theme.FieldRoot}>
      <label htmlFor={id} className={theme.FieldLabel}>
        Verification code
      </label>
      <OTPField.Root
        id={id}
        length={OTP_LENGTH}
        className={theme.OtpFieldRoot}
        onValueComplete={(value) => setComplete(value)}
      >
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={theme.OtpFieldInput}
            aria-label={index === 0 ? undefined : `Character ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField.Root>
      <output className="OtpFieldDemoOutput">
        {complete !== null ? `complete=${complete}` : 'incomplete'}
      </output>
    </div>
  );
}

/** Typing digits fills each slot and auto-advances focus; `onValueComplete` fires once the last slot is filled. */
export const TypeToComplete: Story = {
  tags: ['highlight'],
  args: { length: OTP_LENGTH },
  render: () => <TypeToCompleteExample />,
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');

    inputs[0].focus();
    for (const digit of '12345') {
      // eslint-disable-next-line no-await-in-loop
      await userEvent.keyboard(digit);
    }
    await waitFor(() => expect(inputs[4]).toHaveValue('5'));
    await expect(canvas.getByText('incomplete')).toBeVisible();

    await userEvent.keyboard('6');
    await expect(await canvas.findByText('complete=123456')).toBeVisible();
  },
};

function PasteCompletesCodeExample() {
  const id = React.useId();
  const [complete, setComplete] = React.useState<string | null>(null);
  return (
    <div className={theme.FieldRoot}>
      <label htmlFor={id} className={theme.FieldLabel}>
        Verification code
      </label>
      <OTPField.Root
        id={id}
        length={OTP_LENGTH}
        className={theme.OtpFieldRoot}
        onValueComplete={(value) => setComplete(value)}
      >
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={theme.OtpFieldInput}
            aria-label={index === 0 ? undefined : `Character ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField.Root>
      <output className="OtpFieldDemoOutput">
        {complete !== null ? `complete=${complete}` : 'incomplete'}
      </output>
    </div>
  );
}

/** Pasting a full code splits it across every slot in one operation, following the project's own tested paste technique (a manually-defined `clipboardData` on a real `paste` event). */
export const PasteCompletesCode: Story = {
  tags: ['highlight'],
  args: { length: OTP_LENGTH },
  render: () => <PasteCompletesCodeExample />,
  play: async ({ canvas }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { getData: () => '123456' },
    });
    fireEvent(inputs[0], pasteEvent);

    await waitFor(() => expect(inputs.map((input) => input.value).join('')).toBe('123456'));
    await expect(await canvas.findByText('complete=123456')).toBeVisible();
  },
};

/**
 * Both slots hold one contiguous string value under the hood, so removing a character
 * always splices the underlying string — later characters shift left to fill the gap.
 * Backspace on an *empty*, non-first slot cascades backward to the nearest filled slot
 * (a deliberately forgiving UX, not a bug); Delete never moves focus, but a middle-slot
 * Delete still visibly shifts every later slot's character down by one, per the project's
 * own tested contract (`OTPFieldInput.test.tsx`, `defaultValue="1234"` + Delete on slot 1
 * → `['1','3','4','','','']`, focus unchanged).
 */
function BackspaceNavigationExample() {
  const cascadeId = React.useId();
  const deleteId = React.useId();
  return (
    <div className={theme.FieldRoot}>
      <div className={theme.FieldRoot}>
        <label htmlFor={cascadeId} className={theme.FieldLabel}>
          Backspace cascades to the nearest filled slot
        </label>
        <OTPField.Root
          id={cascadeId}
          defaultValue="123"
          length={OTP_LENGTH}
          aria-label="Backspace demo code"
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
      </div>
      <div className={theme.FieldRoot}>
        <label htmlFor={deleteId} className={theme.FieldLabel}>
          Delete shifts later characters, focus stays put
        </label>
        <OTPField.Root
          id={deleteId}
          defaultValue="1234"
          length={OTP_LENGTH}
          aria-label="Delete demo code"
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
      </div>
    </div>
  );
}

export const BackspaceNavigation: Story = {
  tags: ['highlight'],
  args: { length: OTP_LENGTH },
  render: () => <BackspaceNavigationExample />,
  play: async ({ canvas, userEvent }) => {
    const [cascadeGroup, deleteGroup] = canvas.getAllByRole('group');
    const cascadeInputs = within(cascadeGroup).getAllByRole<HTMLInputElement>('textbox');
    const deleteInputs = within(deleteGroup).getAllByRole<HTMLInputElement>('textbox');

    // Slots 0-2 are filled ("1","2","3"); slot 3 is the first empty slot.
    cascadeInputs[3].focus();
    await userEvent.keyboard('{Backspace}');
    // Cascades backward: clears the nearest filled slot (2) and moves focus there.
    await waitFor(() => expect(cascadeInputs[2]).toHaveValue(''));
    await waitFor(() => expect(document.activeElement).toBe(cascadeInputs[2]));

    // Delete on slot 1 ("2") removes that character from the underlying string; slots 2-3
    // ("3","4") shift left to fill the gap. Focus stays on slot 1.
    deleteInputs[1].focus();
    await userEvent.keyboard('{Delete}');
    await waitFor(() =>
      expect(deleteInputs.map((input) => input.value)).toEqual(['1', '3', '4', '', '', '']),
    );
    await expect(document.activeElement).toBe(deleteInputs[1]);
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

function InvalidCharacterFeedbackExample() {
  const id = React.useId();
  const [message, setMessage] = React.useState('');
  return (
    <div className={theme.FieldRoot}>
      <label htmlFor={id} className={theme.FieldLabel}>
        Verification code (digits only)
      </label>
      <OTPField.Root
        id={id}
        length={OTP_LENGTH}
        className={theme.OtpFieldRoot}
        onValueChange={() => setMessage('')}
        onValueInvalid={(value) => setMessage(`"${value}" contains unsupported characters.`)}
      >
        {otpInputs(OTP_LENGTH)}
      </OTPField.Root>
      <p role="alert" className={theme.FieldError}>
        {message}
      </p>
    </div>
  );
}

/**
 * The default `validationType="numeric"` rejects non-digit characters outright — the slot stays
 * unchanged — and `onValueInvalid` fires with the raw rejected string, recreating the docs'
 * `useInvalidFeedback` pattern from `demos/custom-sanitize`.
 */
export const InvalidCharacterFeedback: Story = {
  tags: ['highlight'],
  args: { length: OTP_LENGTH },
  render: () => <InvalidCharacterFeedbackExample />,
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');

    inputs[0].focus();
    await userEvent.keyboard('a');
    await expect(inputs[0]).toHaveValue('');
    await expect(await canvas.findByText('"a" contains unsupported characters.')).toBeVisible();

    await userEvent.keyboard('1');
    await waitFor(() => expect(inputs[0]).toHaveValue('1'));
    await waitFor(() =>
      expect(canvas.queryByText('"a" contains unsupported characters.')).not.toBeInTheDocument(),
    );
  },
};

/**
 * `Field` integration: the root registers with the surrounding `Field.Root` the same way Number
 * Field and Slider do (`useRegisterFieldControl`), so `data-valid`/`data-invalid` land on
 * `OTPField.Root` (which renders `role="group"`) and `Field.Error` renders from `validate`.
 */
export const FieldValidation: Story = {
  tags: ['highlight'],
  args: { length: OTP_LENGTH },
  render: () => (
    <Field.Root
      name="otp"
      validationMode="onChange"
      validate={(value) =>
        typeof value === 'string' && value.length === OTP_LENGTH ? null : 'Enter all 6 digits.'
      }
      className={theme.FieldRoot}
    >
      <Field.Label className={theme.FieldLabel}>Verification code</Field.Label>
      <OTPField.Root length={OTP_LENGTH} className={theme.OtpFieldRoot}>
        {otpInputs(OTP_LENGTH)}
      </OTPField.Root>
      <Field.Error className={theme.FieldError} />
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');
    const group = canvas.getByRole('group');

    inputs[0].focus();
    for (const digit of '123') {
      // eslint-disable-next-line no-await-in-loop
      await userEvent.keyboard(digit);
    }
    await waitFor(() => expect(group).toHaveAttribute('data-invalid'));
    await expect(await canvas.findByText('Enter all 6 digits.')).toBeVisible();

    for (const digit of '456') {
      // eslint-disable-next-line no-await-in-loop
      await userEvent.keyboard(digit);
    }
    await waitFor(() => expect(group).toHaveAttribute('data-valid'));
    await expect(canvas.queryByText('Enter all 6 digits.')).not.toBeInTheDocument();
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

/** `length` isn't hardcoded to 6 — any positive integer works, here a 4-character code. `onValueComplete` fires once the shorter code is filled. */
export const CustomLength: Story = {
  tags: ['highlight'],
  args: { length: 4 },
  render: () => {
    function FourDigitExample() {
      const id = React.useId();
      const [complete, setComplete] = React.useState<string | null>(null);
      return (
        <div className={theme.FieldRoot}>
          <label htmlFor={id} className={theme.FieldLabel}>
            PIN
          </label>
          <OTPField.Root
            id={id}
            length={4}
            className={theme.OtpFieldRoot}
            onValueComplete={setComplete}
          >
            {otpInputs(4)}
          </OTPField.Root>
          <output className="OtpFieldDemoOutput">
            {complete !== null ? `complete=${complete}` : 'incomplete'}
          </output>
        </div>
      );
    }
    return <FourDigitExample />;
  },
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');
    await expect(inputs).toHaveLength(4);

    inputs[0].focus();
    for (const digit of '1234') {
      // eslint-disable-next-line no-await-in-loop
      await userEvent.keyboard(digit);
    }
    await expect(await canvas.findByText('complete=1234')).toBeVisible();
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
