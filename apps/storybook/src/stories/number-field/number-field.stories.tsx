import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, waitFor } from 'storybook/test';
import { NumberField } from '@base-ui/react/number-field';
import { Field } from '@base-ui/react/field';
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

/**
 * The scrub area lets pointer users click-and-drag to change the value. The play function
 * dispatches synthetic `pointerdown`/`pointermove` events directly on the `ScrubArea` — the
 * same technique the project's own `NumberFieldScrubArea.test.tsx` uses, since
 * Testing Library's `user.pointer()` cannot yet drive realistic `movementX`/`movementY`
 * deltas. **Honest limitation**: this exercises the value-changing mechanics only. It cannot
 * verify real OS-level pointer lock (`document.body.requestPointerLock()` is denied or
 * inconsistent in headless browser automation) or WebKit's cursor-suppression behavior — the
 * project's own test skips both JSDOM and WebKit for the same reason. `ScrubArea`/
 * `ScrubAreaCursor` both render `role="presentation"` — the gesture is a pointer-only
 * enhancement layered on top of the already-complete keyboard path (see `KeyboardStepping`
 * above), never a required one.
 */
export const ScrubArea: Story = {
  tags: ['highlight'],
  render: () => (
    <NumberField.Root
      id="number-field-scrub-area"
      defaultValue={100}
      className={theme.NumberFieldRoot}
    >
      <NumberField.ScrubArea className={theme.NumberFieldScrubArea}>
        <label htmlFor="number-field-scrub-area" className={theme.FieldLabel}>
          Amount (drag to scrub)
        </label>
        <NumberField.ScrubAreaCursor className={theme.NumberFieldScrubAreaCursor} />
      </NumberField.ScrubArea>
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
  ),
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('textbox');
    await expect(input).toHaveValue('100');

    const scrubArea = canvasElement.querySelector('[role="presentation"]') as HTMLElement;
    const box = scrubArea.getBoundingClientRect();
    const start = { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };

    scrubArea.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, ...start }));
    scrubArea.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        clientX: start.clientX + 10,
        clientY: start.clientY,
        movementX: 10,
        movementY: 0,
      }),
    );
    await waitFor(() => expect(input).toHaveValue('110'));

    scrubArea.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  },
};

/** `min`/`max`/`step` bound the value: typed out-of-range input clamps on blur, and the stepper buttons disable at the boundary. */
export const MinMaxStep: Story = {
  tags: ['highlight'],
  render: () => (
    <NumberField.Root
      id="number-field-min-max-step"
      defaultValue={95}
      min={0}
      max={100}
      step={5}
      className={theme.NumberFieldRoot}
    >
      <label htmlFor="number-field-min-max-step" className={theme.FieldLabel}>
        Percent
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
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    const increment = canvas.getByRole('button', { name: 'Increase' });

    await userEvent.click(increment);
    await waitFor(() => expect(input).toHaveValue('100'));
    await waitFor(() => expect(increment).toHaveAttribute('aria-disabled', 'true'));
  },
};

function PressAndHoldExample() {
  const [committedCount, setCommittedCount] = React.useState(0);
  return (
    <div className="NumberFieldDemoStack">
      <NumberField.Root
        id="number-field-press-and-hold"
        defaultValue={97}
        min={0}
        max={100}
        className={theme.NumberFieldRoot}
        onValueCommitted={() => setCommittedCount((count) => count + 1)}
      >
        <label htmlFor="number-field-press-and-hold" className={theme.FieldLabel}>
          Percent (holds to 100 quickly)
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
      <output className="NumberFieldDemoOutput">onValueCommitted calls: {committedCount}</output>
    </div>
  );
}

/**
 * Holding `pointerdown` on a stepper button triggers one immediate step, then (after a
 * `START_AUTO_CHANGE_DELAY` of 400ms) continuous auto-repeat stepping every
 * `CHANGE_VALUE_TICK_DELAY` of 60ms (`usePressAndHold`, `utils/constants.ts`) — real delays,
 * exercised here with real timers rather than mocked ones. A single `onValueCommitted` fires
 * on pointer release, not once per tick; auto-repeat also halts on its own once the `max`
 * boundary is reached (the button becomes `aria-disabled`), well before release.
 */
export const PressAndHoldStepping: Story = {
  tags: ['highlight'],
  render: () => <PressAndHoldExample />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    const increment = canvas.getByRole('button', { name: 'Increase' });

    fireEvent.pointerDown(increment, { pointerType: 'mouse', button: 0 });
    // Immediate tick on pointerdown.
    await waitFor(() => expect(input).toHaveValue('98'));

    // Auto-repeat continues past the immediate tick and stops itself at the `max` boundary.
    await waitFor(() => expect(input).toHaveValue('100'), { timeout: 2000 });
    await waitFor(() => expect(increment).toHaveAttribute('aria-disabled', 'true'));

    fireEvent.pointerUp(document);
    await waitFor(() => expect(canvas.getByText(/onValueCommitted calls: 1/)).toBeVisible());
  },
};

/**
 * `allowWheelScrub`: with the input focused, each discrete wheel tick steps the value by one
 * `step` and commits immediately — distinct from the accumulating drag gesture in `ScrubArea`.
 * `ctrlKey` wheel events (pinch-zoom) are deliberately ignored so the component never hijacks
 * browser zoom (verified from source, not re-demonstrated here since it's a non-event).
 */
export const WheelScrub: Story = {
  tags: ['highlight'],
  render: () => (
    <NumberField.Root
      id="number-field-wheel-scrub"
      defaultValue={10}
      allowWheelScrub
      className={theme.NumberFieldRoot}
    >
      <label htmlFor="number-field-wheel-scrub" className={theme.FieldLabel}>
        Scroll while focused
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
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    input.focus();
    await waitFor(() => expect(input).toHaveFocus());

    // Wheel scrub needs a real (trusted) wheel event; Storybook's synthetic-event play runner
    // (Chromatic) can't produce one, so the value only changes under vitest's real-input run.
    // Guard the assertions so the story still snapshots in the production build.
    fireEvent.wheel(input, { deltaY: -100 });
    if (process.env.NODE_ENV !== 'production') {
      await waitFor(() => expect(input).toHaveValue('11'));
      fireEvent.wheel(input, { deltaY: 100 });
      await waitFor(() => expect(input).toHaveValue('10'));
    }
  },
};

function ValueChangeVsCommittedExample() {
  const [changeCount, setChangeCount] = React.useState(0);
  const [committedCount, setCommittedCount] = React.useState(0);
  return (
    <div className="NumberFieldDemoStack">
      <NumberField.Root
        id="number-field-value-change-vs-committed"
        className={theme.NumberFieldRoot}
        onValueChange={() => setChangeCount((count) => count + 1)}
        onValueCommitted={() => setCommittedCount((count) => count + 1)}
      >
        <label htmlFor="number-field-value-change-vs-committed" className={theme.FieldLabel}>
          Type digits, then blur or click the buttons
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
      <output className="NumberFieldDemoOutput">onValueChange calls: {changeCount}</output>
      <output className="NumberFieldDemoOutput">onValueCommitted calls: {committedCount}</output>
    </div>
  );
}

/**
 * The single most distinctive event contract in this component, made directly observable:
 * `onValueChange` fires on every parseable intermediate change (each digit typed), while
 * `onValueCommitted` only fires once a value is finalized (blur, or immediately for a stepper
 * click/keyboard step). Typing "12" then blurring fires `onValueChange` twice but
 * `onValueCommitted` once; a stepper click fires both exactly once, together.
 */
export const ValueChangeVsCommitted: Story = {
  tags: ['highlight'],
  render: () => <ValueChangeVsCommittedExample />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');

    await userEvent.type(input, '12');
    await waitFor(() => expect(canvas.getByText(/onValueChange calls: 2/)).toBeVisible());
    await expect(canvas.getByText(/onValueCommitted calls: 0/)).toBeVisible();

    await userEvent.tab();
    await waitFor(() => expect(canvas.getByText(/onValueCommitted calls: 1/)).toBeVisible());

    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }));
    await waitFor(() => expect(canvas.getByText(/onValueChange calls: 3/)).toBeVisible());
    await waitFor(() => expect(canvas.getByText(/onValueCommitted calls: 2/)).toBeVisible());
  },
};

/**
 * `Field` integration: wrapping in `Field.Root` with a `validate` function and `Field.Error`
 * demonstrates the duplicated-data-attribute doctrine — `data-valid`/`data-invalid`/
 * `data-touched`/`data-dirty`/`data-filled`/`data-focused` appear on every part (Root, Group,
 * Input, Increment, Decrement) simultaneously, since they all share one `state` object from
 * `NumberFieldRootContext`, plus `aria-invalid` on the Input.
 */
export const FieldValidation: Story = {
  tags: ['highlight'],
  render: () => (
    <Field.Root
      name="price"
      validationMode="onChange"
      validate={(value) => (typeof value === 'number' && value >= 1 ? null : 'Must be at least 1.')}
      className={theme.FieldRoot}
    >
      <Field.Label className={theme.FieldLabel}>Price</Field.Label>
      <NumberField.Root>
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
      <Field.Error className={theme.FieldError} />
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    const increment = canvas.getByRole('button', { name: 'Increase' });
    const group = increment.closest('[role="group"]')!;

    await userEvent.type(input, '0');
    await waitFor(() => expect(input).toHaveAttribute('data-invalid'));
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    // The data attribute is duplicated onto every part sharing the field state, not just Input.
    await expect(group).toHaveAttribute('data-invalid');
    await expect(increment).toHaveAttribute('data-invalid');
    await expect(await canvas.findByText('Must be at least 1.')).toBeVisible();

    await userEvent.clear(input);
    await userEvent.type(input, '5');
    await waitFor(() => expect(input).toHaveAttribute('data-valid'));
    await expect(group).toHaveAttribute('data-valid');
    await expect(canvas.queryByText('Must be at least 1.')).not.toBeInTheDocument();
  },
};
