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

/** `format` switches the visible text to the raw value (here a unit format); `getAriaValueText` overrides only the spoken text — the visible `Meter.Value` is unaffected. */
export const FormattedValue: Story = {
  tags: ['api-ref'],
  render: () => (
    <Meter.Root
      className={theme.MeterRoot}
      value={6.5}
      min={0}
      max={16}
      locale="en-US"
      format={{ style: 'unit', unit: 'gigabyte' }}
      getAriaValueText={(formattedValue) => `${formattedValue} of 16 gigabytes used`}
    >
      <Meter.Label className={theme.MeterLabel}>Memory used</Meter.Label>
      <Meter.Value className={theme.MeterValue} />
      <Meter.Track className={theme.MeterTrack}>
        <Meter.Indicator className={theme.MeterIndicator} />
      </Meter.Track>
    </Meter.Root>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('6.5 GB')).toBeVisible();
    const meter = canvas.getByRole('meter', { name: 'Memory used' });
    await expect(meter).toHaveAttribute('aria-valuetext', '6.5 GB of 16 gigabytes used');
  },
};

function TieredMeter({ label, value }: { label: string; value: number }) {
  // MeterIndicatorLow/MeterIndicatorHigh are tier overlays, not standalone
  // replacements — combine with the base MeterIndicator class (see
  // @droppy/theme's styles.css comment on these two keys).
  let indicatorClass: string = theme.MeterIndicator;
  if (value >= 90) {
    indicatorClass = `${theme.MeterIndicator} ${theme.MeterIndicatorHigh}`;
  } else if (value < 50) {
    indicatorClass = `${theme.MeterIndicator} ${theme.MeterIndicatorLow}`;
  }
  return (
    <Meter.Root className={theme.MeterRoot} value={value}>
      <Meter.Label className={theme.MeterLabel}>{label}</Meter.Label>
      <Meter.Value className={theme.MeterValue} />
      <Meter.Track className={theme.MeterTrack}>
        <Meter.Indicator className={indicatorClass} />
      </Meter.Track>
    </Meter.Root>
  );
}

/** Meter ships **no** data attributes (low/high segment styling was designed then dropped — open #1434), so tier colors must be computed by the consumer from `value`/`min`/`max`, as here. */
export const ValueTierStyling: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="Stack">
      <TieredMeter label="Disk A" value={30} />
      <TieredMeter label="Disk B" value={72} />
      <TieredMeter label="Disk C" value={95} />
    </div>
  ),
};

/**
 * The same value/format formats differently per `locale` — a regression
 * guard in spirit for the open SSR/locale issue #4616 cited across this
 * batch's Progress brief (an explicit `locale` keeps `Intl.NumberFormat`
 * output stable and hydration-safe rather than relying on the runtime's
 * ambient locale).
 */
export const LocaleVariants: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="Stack">
      <Meter.Root
        className={theme.MeterRoot}
        value={30}
        format={{ style: 'currency', currency: 'EUR' }}
        locale="en-US"
      >
        <Meter.Label className={theme.MeterLabel}>Budget (en-US)</Meter.Label>
        <Meter.Value className={theme.MeterValue} />
        <Meter.Track className={theme.MeterTrack}>
          <Meter.Indicator className={theme.MeterIndicator} />
        </Meter.Track>
      </Meter.Root>
      <Meter.Root
        className={theme.MeterRoot}
        value={30}
        format={{ style: 'currency', currency: 'EUR' }}
        locale="de-DE"
      >
        <Meter.Label className={theme.MeterLabel}>Budget (de-DE)</Meter.Label>
        <Meter.Value className={theme.MeterValue} />
        <Meter.Track className={theme.MeterTrack}>
          <Meter.Indicator className={theme.MeterIndicator} />
        </Meter.Track>
      </Meter.Root>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('€30.00')).toBeVisible();
    await expect(canvas.getByText('30,00 €')).toBeVisible();
  },
};
