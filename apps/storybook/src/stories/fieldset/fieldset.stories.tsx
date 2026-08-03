import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Fieldset } from '@base-ui/react/fieldset';
import { Field } from '@base-ui/react/field';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
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

/**
 * Two sub-cases in one story (story-plan #4), both source-verified against
 * `FieldsetRoot.test.tsx`:
 * - Nested fieldsets: an outer `Fieldset.Root disabled` keeps an *inner*
 *   Fieldset's control disabled even though the inner Fieldset never
 *   receives `disabled` directly — the native HTML fieldset-disables-
 *   descendants cascade, unbroken by nesting ("keeps nested fieldsets
 *   disabled when an ancestor fieldset is disabled").
 * - Composed-over: `Fieldset.Root disabled render={<RadioGroup />}` passes
 *   `disabled` through to RadioGroup's own convention (`aria-disabled="true"`)
 *   rather than normalizing it to a plain `disabled` DOM attribute — Fieldset
 *   forwards the prop, it doesn't reinterpret the target's semantics
 *   ("passes disabled to rendered Base UI roots").
 */
export const DisabledCascade: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className={theme.FieldRoot}>
      <Fieldset.Root disabled className={theme.FieldsetRoot}>
        <Fieldset.Legend className={theme.FieldsetLegend}>Outer (disabled)</Fieldset.Legend>
        <Fieldset.Root className={theme.FieldsetRoot}>
          <Fieldset.Legend className={theme.FieldsetLegend}>
            Inner (not disabled directly)
          </Fieldset.Legend>
          <Field.Root className={theme.FieldRoot}>
            <Field.Label className={theme.FieldLabel}>Company</Field.Label>
            <Field.Control
              data-testid="nested-control"
              placeholder="Enter company name"
              className={theme.Input}
            />
          </Field.Root>
        </Fieldset.Root>
      </Fieldset.Root>

      <Field.Root name="storage2">
        <Fieldset.Root
          disabled
          className={theme.FieldsetRoot}
          render={<RadioGroup data-testid="composed-radio-group" defaultValue="ssd" />}
        >
          <Fieldset.Legend className={theme.FieldsetLegend}>
            Storage type (composed-over)
          </Fieldset.Legend>
          <Field.Item className={theme.FieldItem}>
            <Radio.Root value="ssd" className={theme.RadioRoot}>
              <Radio.Indicator className={theme.RadioIndicator} />
            </Radio.Root>
            <Field.Label className={theme.FieldItemLabel}>SSD</Field.Label>
          </Field.Item>
        </Fieldset.Root>
      </Field.Root>
    </div>
  ),
  play: async ({ canvas }) => {
    const nestedControl = canvas.getByTestId('nested-control');
    await expect(nestedControl).toHaveAttribute('disabled');

    const composedGroup = canvas.getByTestId('composed-radio-group');
    await expect(composedGroup).not.toHaveAttribute('disabled');
    await expect(composedGroup).toHaveAttribute('aria-disabled', 'true');
  },
};

// `CheckboxGroupComposition` (story-plan #3) and `MultiThumbSlider`
// (story-plan #5) are intentionally skipped in this small-gap-closing pass:
// both are additional composition-recipe demonstrations beyond the floor
// (a third and fourth "Fieldset composed via render over X" example), and
// `DisabledCascade` above already exercises the composed-over-disabled
// behavior via RadioGroup, the same mechanism CheckboxGroup/Slider share.
