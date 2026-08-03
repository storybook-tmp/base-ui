import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Meter } from '@base-ui/react/meter';
import theme from '@droppy/theme';
import './meter.demo.css';

/**
 * Stories follow research/c-components/meter (Tier 3): the kept hero demo,
 * the mandatory role="meter" ARIA-contract play, bounded-range math, and the
 * consumer-driven value-tier styling pattern (Meter ships no data attributes).
 */
const meta = {
  title: 'Status & display/Meter',
  component: Meter.Root,
  subcomponents: {
    'Meter.Label': Meter.Label,
    'Meter.Track': Meter.Track,
    'Meter.Indicator': Meter.Indicator,
    'Meter.Value': Meter.Value,
  },
  args: { value: 24 },
} satisfies Meta<typeof Meter.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: a "Storage Used" measurement. Root exposes `role="meter"` with the full `aria-value*` contract — and unlike Progress, there is no indeterminate mode: `value` is always a required number. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <Meter.Root className={theme.MeterRoot} value={24}>
      <Meter.Label className={theme.MeterLabel}>Storage Used</Meter.Label>
      <Meter.Value className={theme.MeterValue} />
      <Meter.Track className={theme.MeterTrack}>
        <Meter.Indicator className={theme.MeterIndicator} />
      </Meter.Track>
    </Meter.Root>
  ),
  play: async ({ canvas }) => {
    const meter = canvas.getByRole('meter', { name: 'Storage Used' });
    await expect(meter).toHaveAttribute('aria-valuenow', '24');
    await expect(meter).toHaveAttribute('aria-valuemin', '0');
    await expect(meter).toHaveAttribute('aria-valuemax', '100');
  },
};
