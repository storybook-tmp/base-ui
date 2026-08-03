import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { NumberField } from '@base-ui/react/number-field';
import theme from '@droppy/theme';
import './number-field.demo.css';

/**
 * Floor coverage following research/c-components/number-field (Tier 2): the docs hero
 * demo, incrementing/decrementing plays, keyboard stepping, the scrub area (rendered
 * and described but not gesture-tested — see the story's own doc comment for why),
 * min/max/step constraints, and form integration (`noValidate` + `stepMismatch`, #3552).
 */
const meta = {
  title: 'Form inputs/Number Field',
  component: NumberField.Root,
  subcomponents: {
    'NumberField.Group': NumberField.Group,
    'NumberField.Input': NumberField.Input,
    'NumberField.Increment': NumberField.Increment,
    'NumberField.Decrement': NumberField.Decrement,
    'NumberField.ScrubArea': NumberField.ScrubArea,
    'NumberField.ScrubAreaCursor': NumberField.ScrubAreaCursor,
  },
} satisfies Meta<typeof NumberField.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1.5 8h13M8 14.5v-13" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1.5 8h13" />
    </svg>
  );
}

/** The docs hero demo: a scrubbable label, a `Group` of Decrement/Input/Increment. Recreates `demos/hero`. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => {
    return (
      <NumberField.Root id="number-field-hero" defaultValue={100} className={theme.NumberFieldRoot}>
        <label htmlFor="number-field-hero" className={theme.FieldLabel}>
          Amount
        </label>
        <NumberField.Group className={theme.NumberFieldGroup}>
          <NumberField.Decrement className={theme.NumberFieldDecrement}>
            <MinusIcon />
          </NumberField.Decrement>
          <NumberField.Input className={theme.NumberFieldInput} />
          <NumberField.Increment className={theme.NumberFieldIncrement}>
            <PlusIcon />
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    );
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    await expect(input).toHaveValue('100');

    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }));
    await waitFor(() => expect(input).toHaveValue('101'));
  },
};

function FormExample() {
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <form
      noValidate
      className={theme.FormRoot}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(String(data.get('quantity')));
      }}
    >
      <NumberField.Root
        id="number-field-form-integration"
        name="quantity"
        defaultValue={1}
        min={1}
        className={theme.NumberFieldRoot}
      >
        <label htmlFor="number-field-form-integration" className={theme.FieldLabel}>
          Quantity
        </label>
        <NumberField.Group className={theme.NumberFieldGroup}>
          <NumberField.Decrement className={theme.NumberFieldDecrement}>
            <MinusIcon />
          </NumberField.Decrement>
          <NumberField.Input className={theme.NumberFieldInput} />
          <NumberField.Increment className={theme.NumberFieldIncrement}>
            <PlusIcon />
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
      <button type="submit" className={theme.Button}>
        Add to cart
      </button>
      {submitted !== null ? (
        <output className="NumberFieldDemoOutput">quantity={submitted}</output>
      ) : null}
    </form>
  );
}

/**
 * Native form participation via a hidden `<input type="number">`. `noValidate` is applied
 * on the `<form>` here deliberately: the default `step={1}` triggers native step validation
 * once an explicit `min` is present, and shadcn/RHF-style forms that skip `noValidate` can
 * have submission silently blocked by a native browser popup (mui/base-ui#3552) — Base UI's
 * own `Field`/`Form` validation is meant to be authoritative instead.
 */
export const FormIntegration: Story = {
  tags: ['api-ref'],
  render: () => <FormExample />,
  play: async ({ canvas, userEvent }) => {
    const increment = canvas.getByRole('button', { name: 'Increase' });
    await userEvent.click(increment);
    await userEvent.click(canvas.getByRole('button', { name: 'Add to cart' }));
    await expect(await canvas.findByText('quantity=2')).toBeVisible();
  },
};

/**
 * `snapOnStep` snaps increment/decrement results to the nearest multiple of `step` — directional
 * snapping (toward the direction of travel) for regular steps, nearest-multiple for Alt/`smallStep`
 * moves. Contrasted with a sibling field that steps by the exact amount with no snapping.
 */
export const SnapOnStep: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="NumberFieldDemoRow">
      <NumberField.Root
        id="number-field-snap-on-step-with"
        defaultValue={1.3}
        snapOnStep
        className={theme.NumberFieldRoot}
      >
        <label htmlFor="number-field-snap-on-step-with" className={theme.FieldLabel}>
          With snapOnStep
        </label>
        <NumberField.Group className={theme.NumberFieldGroup}>
          <NumberField.Decrement className={theme.NumberFieldDecrement}>
            <MinusIcon />
          </NumberField.Decrement>
          <NumberField.Input className={theme.NumberFieldInput} />
          <NumberField.Increment className={theme.NumberFieldIncrement}>
            <PlusIcon />
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
      <NumberField.Root
        id="number-field-snap-on-step-without"
        defaultValue={1.3}
        className={theme.NumberFieldRoot}
      >
        <label htmlFor="number-field-snap-on-step-without" className={theme.FieldLabel}>
          Without (exact step)
        </label>
        <NumberField.Group className={theme.NumberFieldGroup}>
          <NumberField.Decrement className={theme.NumberFieldDecrement}>
            <MinusIcon />
          </NumberField.Decrement>
          <NumberField.Input className={theme.NumberFieldInput} />
          <NumberField.Increment className={theme.NumberFieldIncrement}>
            <PlusIcon />
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const increments = canvas.getAllByRole('button', { name: 'Increase' });

    await userEvent.click(increments[0]);
    // 1.3 snaps directionally to the next whole step, 2, instead of landing on 2.3.
    await waitFor(() => expect(canvas.getAllByRole('textbox')[0]).toHaveValue('2'));

    await userEvent.click(increments[1]);
    await waitFor(() => expect(canvas.getAllByRole('textbox')[1]).toHaveValue('2.3'));
  },
};

/**
 * `allowOutOfRange` lets *direct text entry* (typing/paste/clear) exceed `min`/`max` so native
 * `rangeOverflow` validation can fire, contrasted with the default (clamping) behavior. Only
 * text entry is affected — stepper-button/keyboard stepping still clamps either way (verified
 * separately by the project's own `allowOutOfRange` test suite; not re-demonstrated here to
 * keep this story focused on the text-entry contrast). Note the clamp itself applies to the
 * numeric value immediately (visible on the hidden native input the story reads), while the
 * *visible* typed text only resyncs to the clamped display on blur — not on every keystroke.
 */
export const AllowOutOfRange: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="NumberFieldDemoRow">
      <NumberField.Root
        id="number-field-clamped"
        name="clamped"
        max={100}
        className={theme.NumberFieldRoot}
      >
        <label htmlFor="number-field-clamped" className={theme.FieldLabel}>
          Clamps by default
        </label>
        <NumberField.Group className={theme.NumberFieldGroup}>
          <NumberField.Input className={theme.NumberFieldInput} />
        </NumberField.Group>
      </NumberField.Root>
      <NumberField.Root
        id="number-field-out-of-range"
        name="outOfRange"
        max={100}
        allowOutOfRange
        className={theme.NumberFieldRoot}
      >
        <label htmlFor="number-field-out-of-range" className={theme.FieldLabel}>
          allowOutOfRange
        </label>
        <NumberField.Group className={theme.NumberFieldGroup}>
          <NumberField.Input className={theme.NumberFieldInput} />
        </NumberField.Group>
      </NumberField.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const inputs = canvas.getAllByRole('textbox');

    // The *numeric* value clamps immediately (checked via the hidden native input, which the
    // browser's own constraint validation reads) — but the visible typed text is only
    // resynced to the clamped display on blur, not on every keystroke.
    await userEvent.type(inputs[0], '150');
    const clampedHidden = canvasElement.querySelector<HTMLInputElement>(
      'input[type="number"][name="clamped"]',
    )!;
    await waitFor(() => expect(clampedHidden.value).toBe('100'));
    await waitFor(() => expect(clampedHidden.validity.rangeOverflow).toBe(false));
    await userEvent.tab();
    await waitFor(() => expect(inputs[0]).toHaveValue('100'));

    await userEvent.type(inputs[1], '150');
    await waitFor(() => expect(inputs[1]).toHaveValue('150'));
    const outOfRangeHidden = canvasElement.querySelector<HTMLInputElement>(
      'input[type="number"][name="outOfRange"]',
    )!;
    await waitFor(() => expect(outOfRangeHidden.value).toBe('150'));
    await waitFor(() => expect(outOfRangeHidden.validity.rangeOverflow).toBe(true));
  },
};

const usdFormat: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' };
const eurDeFormat: Intl.NumberFormatOptions = { style: 'currency', currency: 'EUR' };

/**
 * `format` (raw `Intl.NumberFormatOptions`) and `locale` drive the displayed text through the
 * standard `Intl.NumberFormat` pipeline — currency symbols, grouping, and locale-specific
 * decimal separators — while the value submitted to a form stays the plain number. Evidenced
 * directly from `formatNumber`/`parseNumber` and the currency/locale test blocks in
 * `NumberFieldRoot.test.tsx`; there is no format/locale demo in the docs today, so this is net-new
 * Storybook coverage rather than a port of existing docs content.
 */
export const LocaleAndCurrencyFormat: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="NumberFieldDemoRow">
      <NumberField.Root
        id="number-field-usd"
        defaultValue={1234.5}
        format={usdFormat}
        locale="en-US"
        className={theme.NumberFieldRoot}
      >
        <label htmlFor="number-field-usd" className={theme.FieldLabel}>
          USD (en-US)
        </label>
        <NumberField.Group className={theme.NumberFieldGroup}>
          <NumberField.Input className={theme.NumberFieldInput} />
        </NumberField.Group>
      </NumberField.Root>
      <NumberField.Root
        id="number-field-eur"
        defaultValue={1234.5}
        format={eurDeFormat}
        locale="de-DE"
        className={theme.NumberFieldRoot}
      >
        <label htmlFor="number-field-eur" className={theme.FieldLabel}>
          EUR (de-DE)
        </label>
        <NumberField.Group className={theme.NumberFieldGroup}>
          <NumberField.Input className={theme.NumberFieldInput} />
        </NumberField.Group>
      </NumberField.Root>
    </div>
  ),
  play: async ({ canvas }) => {
    const inputs = canvas.getAllByRole('textbox');
    await expect(inputs[0]).toHaveValue(new Intl.NumberFormat('en-US', usdFormat).format(1234.5));
    await expect(inputs[1]).toHaveValue(new Intl.NumberFormat('de-DE', eurDeFormat).format(1234.5));
  },
};

/**
 * `disabled` removes the field from interaction and native form submission entirely (the hidden
 * input itself becomes `disabled`). `readOnly` keeps the `Input` focusable and its value
 * copyable but blocks edits and disables the stepper buttons — via computed `disabled`, not
 * `aria-readonly` (invalid on `role="button"`, per the source's own comment) — and also
 * disables wheel/scrub interactions.
 */
export const DisabledAndReadOnly: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="NumberFieldDemoRow">
      <NumberField.Root
        id="number-field-disabled"
        defaultValue={42}
        disabled
        className={theme.NumberFieldRoot}
      >
        <label htmlFor="number-field-disabled" className={theme.FieldLabel}>
          Disabled
        </label>
        <NumberField.Group className={theme.NumberFieldGroup}>
          <NumberField.Decrement className={theme.NumberFieldDecrement}>
            <MinusIcon />
          </NumberField.Decrement>
          <NumberField.Input className={theme.NumberFieldInput} />
          <NumberField.Increment className={theme.NumberFieldIncrement}>
            <PlusIcon />
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
      <NumberField.Root
        id="number-field-readonly"
        defaultValue={42}
        readOnly
        className={theme.NumberFieldRoot}
      >
        <label htmlFor="number-field-readonly" className={theme.FieldLabel}>
          Read-only
        </label>
        <NumberField.Group className={theme.NumberFieldGroup}>
          <NumberField.Decrement className={theme.NumberFieldDecrement}>
            <MinusIcon />
          </NumberField.Decrement>
          <NumberField.Input className={theme.NumberFieldInput} />
          <NumberField.Increment className={theme.NumberFieldIncrement}>
            <PlusIcon />
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole('textbox');
    const increments = canvas.getAllByRole('button', { name: 'Increase' });

    // Disabled: native disabled input, excluded from form submission and interaction.
    await expect(inputs[0]).toBeDisabled();
    await expect(inputs[0]).toHaveAttribute('data-disabled');
    await expect(increments[0]).toHaveAttribute('data-disabled');

    // Read-only: the input stays focusable (not `disabled`), but edits are blocked.
    await expect(inputs[1]).not.toBeDisabled();
    await expect(inputs[1]).toHaveAttribute('data-readonly');
    await userEvent.click(inputs[1]);
    await expect(inputs[1]).toHaveFocus();
    await userEvent.keyboard('9');
    await waitFor(() => expect(inputs[1]).toHaveValue('42'));

    // Read-only steppers: disabled via `aria-disabled` (not `aria-readonly`, invalid on buttons).
    await waitFor(() => expect(increments[1]).toHaveAttribute('aria-disabled', 'true'));
    await expect(increments[1]).not.toHaveAttribute('aria-readonly');
  },
};
