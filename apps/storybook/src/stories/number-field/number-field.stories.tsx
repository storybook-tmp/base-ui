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
