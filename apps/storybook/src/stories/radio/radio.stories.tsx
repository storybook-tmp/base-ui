import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
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

// NOTE: a `RadioGroup` `orientation` prop (as seen on Toolbar/Tabs) was checked against
// `RadioGroupProps` in `packages/react/src/radio-group/RadioGroup.tsx` and does not exist —
// there is no evidence of a horizontal-vs-vertical layout prop, so no orientation story is
// added here (per story-plan.md's Tier-2 floor, layout direction is CSS-only, not a prop).
