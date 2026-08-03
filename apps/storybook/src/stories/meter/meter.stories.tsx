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

/** `min`/`max` define arbitrary bounds — the default text stays the position within the range (6 of 0–8 hours reads as 75%), so text and fill agree for any bounds. */
export const BoundedRange: Story = {
  tags: ['highlight'],
  render: () => (
    <Meter.Root className={theme.MeterRoot} value={6} min={0} max={8} locale="en-US">
      <Meter.Label className={theme.MeterLabel}>Battery life</Meter.Label>
      <Meter.Value className={theme.MeterValue} />
      <Meter.Track className={theme.MeterTrack}>
        <Meter.Indicator className={theme.MeterIndicator} />
      </Meter.Track>
    </Meter.Root>
  ),
  play: async ({ canvas }) => {
    const meter = canvas.getByRole('meter', { name: 'Battery life' });
    await expect(meter).toHaveAttribute('aria-valuenow', '6');
    await expect(meter).toHaveAttribute('aria-valuemax', '8');
    await expect(canvas.getByText('75%')).toBeVisible();
  },
};

/**
 * Out-of-range values normalize rather than error, mirroring
 * `MeterRoot.test.tsx`'s parametrized "normalizes aria attributes" suite:
 * a value above `max` clamps `aria-valuenow`/text/indicator width to 100%,
 * a value below `min` clamps to 0%, and a non-finite `NaN` value clamps to
 * the same 0% as below-min rather than propagating `NaN` into the DOM.
 */
export const ClampedOutOfRangeValues: Story = {
  tags: ['highlight'],
  render: () => (
    <div className="Stack">
      <Meter.Root className={theme.MeterRoot} value={150} locale="en-US">
        <Meter.Label className={theme.MeterLabel}>Above max (value=150)</Meter.Label>
        <Meter.Value className={theme.MeterValue} />
        <Meter.Track className={theme.MeterTrack}>
          <Meter.Indicator className={theme.MeterIndicator} data-testid="indicator-above" />
        </Meter.Track>
      </Meter.Root>
      <Meter.Root className={theme.MeterRoot} value={-10} locale="en-US">
        <Meter.Label className={theme.MeterLabel}>Below min (value=-10)</Meter.Label>
        <Meter.Value className={theme.MeterValue} />
        <Meter.Track className={theme.MeterTrack}>
          <Meter.Indicator className={theme.MeterIndicator} data-testid="indicator-below" />
        </Meter.Track>
      </Meter.Root>
      <Meter.Root className={theme.MeterRoot} value={Number.NaN} locale="en-US">
        <Meter.Label className={theme.MeterLabel}>NaN value</Meter.Label>
        <Meter.Value className={theme.MeterValue} />
        <Meter.Track className={theme.MeterTrack}>
          <Meter.Indicator className={theme.MeterIndicator} data-testid="indicator-nan" />
        </Meter.Track>
      </Meter.Root>
    </div>
  ),
  play: async ({ canvas }) => {
    const above = canvas.getByRole('meter', { name: 'Above max (value=150)' });
    await expect(above).toHaveAttribute('aria-valuenow', '100');
    await expect(canvas.getByTestId('indicator-above')).toHaveAttribute(
      'style',
      expect.stringContaining('width: 100%'),
    );

    const below = canvas.getByRole('meter', { name: 'Below min (value=-10)' });
    await expect(below).toHaveAttribute('aria-valuenow', '0');
    await expect(canvas.getByTestId('indicator-below')).toHaveAttribute(
      'style',
      expect.stringContaining('width: 0%'),
    );

    const nan = canvas.getByRole('meter', { name: 'NaN value' });
    await expect(nan).toHaveAttribute('aria-valuenow', '0');
    await expect(canvas.getByTestId('indicator-nan')).toHaveAttribute(
      'style',
      expect.stringContaining('width: 0%'),
    );
  },
};
