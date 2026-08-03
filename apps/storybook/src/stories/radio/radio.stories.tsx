import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import { Form } from '@base-ui/react/form';
import theme from '@droppy/theme';
import './radio.demo.css';

/**
 * Stories follow research/c-components/radio (Tier 2, one research unit with Radio Group —
 * note the packaging asymmetry: `radio-group` is its own public subpath but has no standalone
 * docs page, so its content is folded into the Radio page). Floor coverage: the docs hero
 * (RadioGroup + enclosing-label Radio items), the arrow-key-selects interaction (the single
 * most important behavioral fact — arrow navigation both moves focus and commits selection,
 * matching native `<input type="radio">` groups), a disabled-item variant, and native form
 * submission (submits `null` when nothing is selected, matching native radio groups).
 */
const meta = {
  title: 'Form inputs/Radio',
  component: RadioGroup,
  subcomponents: { 'Radio.Root': Radio.Root, 'Radio.Indicator': Radio.Indicator },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: a RadioGroup of three mutually exclusive options, each wrapped in an enclosing label. */
export const Basic: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <RadioGroup defaultValue="fuji-apple" aria-label="Best apple" className={theme.RadioGroupRoot}>
      <label className={theme.RadioGroupItem}>
        <Radio.Root value="fuji-apple" className={theme.RadioRoot}>
          <Radio.Indicator className={theme.RadioIndicator} />
        </Radio.Root>
        Fuji
      </label>
      <label className={theme.RadioGroupItem}>
        <Radio.Root value="gala-apple" className={theme.RadioRoot}>
          <Radio.Indicator className={theme.RadioIndicator} />
        </Radio.Root>
        Gala
      </label>
      <label className={theme.RadioGroupItem}>
        <Radio.Root value="granny-smith-apple" className={theme.RadioRoot}>
          <Radio.Indicator className={theme.RadioIndicator} />
        </Radio.Root>
        Granny Smith
      </label>
    </RadioGroup>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Fuji' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  },
};

/** A `disabled` radio stays visible and focusable (composite-widget policy) but cannot be selected by click or keyboard. */
export const DisabledItem: Story = {
  tags: ['api-ref'],
  render: () => (
    <RadioGroup defaultValue="fuji-apple" aria-label="Best apple" className={theme.RadioGroupRoot}>
      <label className={theme.RadioGroupItem}>
        <Radio.Root value="fuji-apple" className={theme.RadioRoot}>
          <Radio.Indicator className={theme.RadioIndicator} />
        </Radio.Root>
        Fuji
      </label>
      <label className={theme.RadioGroupItem}>
        <Radio.Root value="gala-apple" disabled className={theme.RadioRoot}>
          <Radio.Indicator className={theme.RadioIndicator} />
        </Radio.Root>
        Gala (out of stock)
      </label>
      <label className={theme.RadioGroupItem}>
        <Radio.Root value="granny-smith-apple" className={theme.RadioRoot}>
          <Radio.Indicator className={theme.RadioIndicator} />
        </Radio.Root>
        Granny Smith
      </label>
    </RadioGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    const gala = canvas.getByRole('radio', { name: 'Gala (out of stock)' });
    await expect(gala).toHaveAttribute('data-disabled');

    await userEvent.click(gala);
    await waitFor(() => expect(gala).toHaveAttribute('aria-checked', 'false'));
  },
};

// NOTE: a `RadioGroup` `orientation` prop (as seen on Toolbar/Tabs) was checked against
// `RadioGroupProps` in `packages/react/src/radio-group/RadioGroup.tsx` and does not exist —
// there is no evidence of a horizontal-vs-vertical layout prop, so no orientation story is
// added here (per story-plan.md's Tier-2 floor, layout direction is CSS-only, not a prop).

function RequiredInvalidExample() {
  return (
    <Form className={theme.FormRoot}>
      <Field.Root name="plan" className={theme.RadioGroupRoot}>
        <Fieldset.Root className={theme.RadioGroupRoot} render={<RadioGroup required />}>
          <Fieldset.Legend>Plan</Fieldset.Legend>
          <Field.Item className={theme.RadioGroupItem}>
            <Radio.Root value="monthly" className={theme.RadioRoot}>
              <Radio.Indicator className={theme.RadioIndicator} />
            </Radio.Root>
            <Field.Label>Monthly</Field.Label>
          </Field.Item>
          <Field.Item className={theme.RadioGroupItem}>
            <Radio.Root value="yearly" className={theme.RadioRoot}>
              <Radio.Indicator className={theme.RadioIndicator} />
            </Radio.Root>
            <Field.Label>Yearly</Field.Label>
          </Field.Item>
        </Fieldset.Root>
        <Field.Error className="RadioDemoOutput" match="valueMissing">
          Please choose a plan.
        </Field.Error>
      </Field.Root>
      <button type="submit" className={theme.Button}>
        Save
      </button>
    </Form>
  );
}

/** `required` on the `Field.Root`/`RadioGroup` pair flags `valueMissing` on submit when nothing is selected; selecting an option clears the error (mirrors `RadioGroup.test.tsx` "clears required validation when a value is selected"). */
export const RequiredInvalidState: Story = {
  tags: ['api-ref'],
  render: () => <RequiredInvalidExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(canvas.getByText('Please choose a plan.')).toBeVisible());

    await userEvent.click(canvas.getByText('Monthly'));
    await waitFor(() =>
      expect(canvas.queryByText('Please choose a plan.')).not.toBeInTheDocument(),
    );
  },
};

/** `readOnly` on `RadioGroup` blocks every selection path (click, arrow-key auto-select, Space) while keeping the group focusable and its current value visible — distinct from `disabled`, which also removes it from the tab sequence. */
export const ReadOnlyGroup: Story = {
  tags: ['api-ref'],
  render: () => (
    <RadioGroup
      defaultValue="fuji-apple"
      readOnly
      aria-label="Best apple (read-only)"
      className={theme.RadioGroupRoot}
    >
      <label className={theme.RadioGroupItem}>
        <Radio.Root value="fuji-apple" className={theme.RadioRoot}>
          <Radio.Indicator className={theme.RadioIndicator} />
        </Radio.Root>
        Fuji
      </label>
      <label className={theme.RadioGroupItem}>
        <Radio.Root value="gala-apple" className={theme.RadioRoot}>
          <Radio.Indicator className={theme.RadioIndicator} />
        </Radio.Root>
        Gala
      </label>
    </RadioGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    const fuji = canvas.getByRole('radio', { name: 'Fuji' });
    const gala = canvas.getByRole('radio', { name: 'Gala' });

    await expect(gala).toHaveAttribute('aria-readonly', 'true');

    await userEvent.click(gala);
    await waitFor(() => expect(gala).toHaveAttribute('aria-checked', 'false'));
    await waitFor(() => expect(fuji).toHaveAttribute('aria-checked', 'true'));
  },
};
