import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Field } from '@base-ui/react/field';
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

// `StandaloneAriaLabel` and `ControlledWithClear` from the story plan are
// intentionally skipped: the plan itself flags `ControlledWithClear` as
// "written from first principles... tagged needs-work until cross-checked
// against #4643's actual resolution" (story-plan.md #6) -- not evidenced
// enough for this small-gap-closing pass. `StandaloneAriaLabel` would only
// re-assert the well-established "aria-label sets the accessible name" rule
// already implicitly covered by every `getByLabelText` query above.
