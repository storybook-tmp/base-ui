import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Fieldset } from '@base-ui/react/fieldset';
import { Field } from '@base-ui/react/field';
import theme from '@droppy/theme';

/**
 * Stories follow research/c-components/fieldset (Tier 3): Fieldset is a
 * 2-part, minimal component whose entire value is (a) staying a native
 * `<fieldset>` for free grouping/disabled-cascade semantics, and (b)
 * replacing only the unstylable native `<legend>` with a styleable `<div>` +
 * `aria-labelledby` — a deliberate, cited decision (#3044, see the MDX).
 */
const meta = {
  title: 'Form inputs/Fieldset',
  component: Fieldset.Root,
  subcomponents: { 'Fieldset.Legend': Fieldset.Legend },
} satisfies Meta<typeof Fieldset.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero shape: one Legend labeling two unrelated `Field.Root`s. `Fieldset.Root` renders a real `<fieldset>` (native grouping for free); `Fieldset.Legend` renders a `<div>` linked to it via `aria-labelledby`, not a native `<legend>` (brief §5, §7). */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <Fieldset.Root className={theme.FieldsetRoot}>
      <Fieldset.Legend className={theme.FieldsetLegend}>Billing details</Fieldset.Legend>
      <Field.Root className={theme.FieldRoot}>
        <Field.Label className={theme.FieldLabel}>Company</Field.Label>
        <Field.Control placeholder="Enter company name" className={theme.Input} />
      </Field.Root>
      <Field.Root className={theme.FieldRoot}>
        <Field.Label className={theme.FieldLabel}>Tax ID</Field.Label>
        <Field.Control placeholder="Enter fiscal number" className={theme.Input} />
      </Field.Root>
    </Fieldset.Root>
  ),
  play: async ({ canvas }) => {
    // Native <fieldset> has an implicit "group" role; the Legend names it via
    // aria-labelledby, auto-registered on mount (brief §5, §7).
    const group = canvas.getByRole('group', { name: 'Billing details' });
    await expect(group.tagName).toBe('FIELDSET');
  },
};

// `CheckboxGroupComposition` (story-plan #3) and `MultiThumbSlider`
// (story-plan #5) are intentionally skipped in this small-gap-closing pass:
// both are additional composition-recipe demonstrations beyond the floor
// (a third and fourth "Fieldset composed via render over X" example), and
// `DisabledCascade` above already exercises the composed-over-disabled
// behavior via RadioGroup, the same mechanism CheckboxGroup/Slider share.
