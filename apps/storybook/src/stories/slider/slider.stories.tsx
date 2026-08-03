import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Slider } from '@base-ui/react/slider';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import theme from '@droppy/theme';
import './slider.demo.css';

/**
 * Floor coverage following research/c-components/slider (Tier 2 lean-plus): the docs hero
 * demo (Root+Control+Track+Indicator+Thumb+Value), keyboard-driven stepping (never a
 * synthetic drag — see the brief's note on pointer/drag testability), a two-thumb
 * range slider, a vertical orientation, and native form integration.
 */
const meta = {
  title: 'Form inputs/Slider',
  component: Slider.Root,
  subcomponents: {
    'Slider.Control': Slider.Control,
    'Slider.Track': Slider.Track,
    'Slider.Indicator': Slider.Indicator,
    'Slider.Thumb': Slider.Thumb,
    'Slider.Value': Slider.Value,
  },
} satisfies Meta<typeof Slider.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo, plus a labeled `Slider.Value` readout. Recreates `demos/hero`. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <Slider.Root defaultValue={25} className={theme.SliderRoot}>
      <Slider.Label className={theme.SliderLabel}>Volume</Slider.Label>
      <Slider.Value className={theme.SliderValue} />
      <Slider.Control className={theme.SliderControl}>
        <Slider.Track className={theme.SliderTrack}>
          <Slider.Indicator className={theme.SliderIndicator} />
          <Slider.Thumb className={theme.SliderThumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    // The real accessible node is the native <input type="range"> nested in Thumb, not a
    // custom div[role="slider"] — verified directly against source (see the MDX a11y section).
    const thumb = canvas.getByRole('slider', { name: 'Volume' });
    await expect(thumb).toHaveAttribute('aria-valuenow', '25');

    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '26'));
  },
};

/** A two-thumb range slider. Each thumb needs its own distinguishing `aria-label`, since a single `Slider.Label` names the group, not any one thumb. */
export const RangeTwoThumb: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <Slider.Root defaultValue={[25, 45]} className={theme.SliderRoot}>
      <Slider.Label className={theme.SliderLabel}>Price range</Slider.Label>
      <Slider.Value className={theme.SliderValue} />
      <Slider.Control className={theme.SliderControl}>
        <Slider.Track className={theme.SliderTrack}>
          <Slider.Indicator className={theme.SliderIndicator} />
          <Slider.Thumb index={0} aria-label="Minimum price" className={theme.SliderThumb} />
          <Slider.Thumb index={1} aria-label="Maximum price" className={theme.SliderThumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const [minThumb, maxThumb] = canvas.getAllByRole('slider');
    await expect(minThumb).toHaveAttribute('aria-valuenow', '25');
    await expect(maxThumb).toHaveAttribute('aria-valuenow', '45');

    minThumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(minThumb).toHaveAttribute('aria-valuenow', '26'));
    // The other thumb is untouched — the two are independently steppable.
    await expect(maxThumb).toHaveAttribute('aria-valuenow', '45');
  },
};

/** `orientation="vertical"` flips the geometry; ArrowUp/ArrowDown still govern stepping regardless of orientation. */
export const Vertical: Story = {
  tags: ['api-ref', 'base'],
  render: () => (
    <Slider.Root orientation="vertical" defaultValue={35} className={theme.SliderRoot}>
      <Slider.Label className={theme.SliderLabel}>Volume</Slider.Label>
      <Slider.Control className={theme.SliderControl}>
        <Slider.Track className={theme.SliderTrack}>
          <Slider.Indicator className={theme.SliderIndicator} />
          <Slider.Thumb className={theme.SliderThumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const thumb = canvas.getByRole('slider', { name: 'Volume' });
    thumb.focus();

    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '36'));

    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '34'));
  },
};

function FormExample() {
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <form
      className={theme.FormRoot}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(String(data.get('volume')));
      }}
    >
      <Slider.Root name="volume" defaultValue={20} className={theme.SliderRoot}>
        <Slider.Label className={theme.SliderLabel}>Volume</Slider.Label>
        <Slider.Value className={theme.SliderValue} />
        <Slider.Control className={theme.SliderControl}>
          <Slider.Track className={theme.SliderTrack}>
            <Slider.Indicator className={theme.SliderIndicator} />
            <Slider.Thumb className={theme.SliderThumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <button type="submit" className={theme.Button}>
        Save
      </button>
      {submitted !== null ? <output className="SliderDemoOutput">volume={submitted}</output> : null}
    </form>
  );
}

/** Each `Slider.Thumb` nests a real native `<input type="range">` carrying `name`/`form`, so a single-thumb slider participates in native form submission with zero extra machinery. */
export const FormIntegration: Story = {
  tags: ['api-ref'],
  render: () => <FormExample />,
  play: async ({ canvas, userEvent }) => {
    const thumb = canvas.getByRole('slider', { name: 'Volume' });
    thumb.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '22'));

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(await canvas.findByText('volume=22')).toBeVisible();
  },
};

/**
 * `minStepsBetweenValues` gates the *keyboard* path too (`handleInputChange`'s own
 * `validateMinimumDistance` check), not only pointer drag — verified from source: the change is
 * rejected outright (the value stays put) rather than partially applied. `End` on the lower
 * thumb of a range slider jumps directly to the largest value that still respects the gap
 * (`neighbor - step * minStepsBetweenValues`); one further `ArrowRight` press is then rejected.
 */
export const MinStepsBetweenValues: Story = {
  tags: ['api-ref'],
  render: () => (
    <Slider.Root
      defaultValue={[30, 50]}
      min={0}
      max={100}
      step={5}
      minStepsBetweenValues={1}
      className={theme.SliderRoot}
    >
      <Slider.Label className={theme.SliderLabel}>Price range</Slider.Label>
      <Slider.Value className={theme.SliderValue} />
      <Slider.Control className={theme.SliderControl}>
        <Slider.Track className={theme.SliderTrack}>
          <Slider.Indicator className={theme.SliderIndicator} />
          <Slider.Thumb index={0} aria-label="Minimum price" className={theme.SliderThumb} />
          <Slider.Thumb index={1} aria-label="Maximum price" className={theme.SliderThumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const [minThumb] = canvas.getAllByRole('slider');
    minThumb.focus();

    // Jumps to the closest value that still respects the 5-unit (step * minStepsBetweenValues) gap.
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(minThumb).toHaveAttribute('aria-valuenow', '45'));

    // One more step would collide with the other thumb (distance 0 < 5) — rejected outright.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(minThumb).toHaveAttribute('aria-valuenow', '45'));
  },
};

/**
 * RTL flips the *physical* meaning of ArrowRight/ArrowLeft (`getNewValue(..., rtl ? -1 : 1, ...)`
 * in source) so the key still "advances" in the direction it visually points on screen — but
 * that means the underlying numeric value **decreases** on ArrowRight in RTL, the opposite of
 * LTR. This is the surprising, easy-to-miss half of the RTL contract; the visual-only pairing
 * (`dir="rtl"` + `DirectionProvider`) is shown without a play in `direction-provider.stories.tsx`.
 */
export const RTL: Story = {
  tags: ['api-ref'],
  render: () => (
    <div dir="rtl">
      <DirectionProvider direction="rtl">
        <Slider.Root defaultValue={50} className={theme.SliderRoot}>
          <Slider.Label className={theme.SliderLabel}>Volume</Slider.Label>
          <Slider.Value className={theme.SliderValue} />
          <Slider.Control className={theme.SliderControl}>
            <Slider.Track className={theme.SliderTrack}>
              <Slider.Indicator className={theme.SliderIndicator} />
              <Slider.Thumb className={theme.SliderThumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </DirectionProvider>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const thumb = canvas.getByRole('slider', { name: 'Volume' });
    thumb.focus();

    // ArrowRight decreases the numeric value in RTL — it still visually advances rightward.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '49'));

    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '50'));
  },
};

/**
 * `Slider.Value`'s `format`/`locale` (raw `Intl.NumberFormatOptions`, read from `Slider.Root`)
 * drive the visible readout, while `Slider.Thumb`'s `getAriaValueText` can produce a more
 * meaningful screen-reader announcement than the raw formatted number.
 */
export const FormattedValueWithGetAriaValueText: Story = {
  tags: ['api-ref'],
  render: () => (
    <Slider.Root
      defaultValue={40}
      format={{ style: 'unit', unit: 'percent' }}
      className={theme.SliderRoot}
    >
      <Slider.Label className={theme.SliderLabel}>Volume</Slider.Label>
      <Slider.Value className={theme.SliderValue} />
      <Slider.Control className={theme.SliderControl}>
        <Slider.Track className={theme.SliderTrack}>
          <Slider.Indicator className={theme.SliderIndicator} />
          <Slider.Thumb
            getAriaValueText={(formattedValue) => `${formattedValue} volume`}
            className={theme.SliderThumb}
          />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
  play: async ({ canvas }) => {
    const thumb = canvas.getByRole('slider', { name: 'Volume' });
    await expect(thumb).toHaveAttribute('aria-valuetext', '40% volume');
    await expect(canvas.getByText('40%')).toBeVisible();
  },
};

/**
 * `disabled` puts the same `data-disabled` attribute on every part (Root, Control, Track,
 * Indicator, Thumb) per the duplicated-data-attribute doctrine, and the nested `<input
 * type="range">` gets a real native `disabled` attribute — unlike Number Field's stepper
 * buttons, which use `aria-disabled` to stay focusable, a disabled range input is genuinely
 * excluded from the Tab order, requiring zero workaround.
 */
export const DisabledState: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="SliderDemoRow">
      <Slider.Root defaultValue={50} disabled className={theme.SliderRoot}>
        <Slider.Label className={theme.SliderLabel}>Disabled</Slider.Label>
        <Slider.Control data-testid="disabled-control" className={theme.SliderControl}>
          <Slider.Track className={theme.SliderTrack}>
            <Slider.Indicator className={theme.SliderIndicator} />
            <Slider.Thumb className={theme.SliderThumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Slider.Root defaultValue={50} className={theme.SliderRoot}>
        <Slider.Label className={theme.SliderLabel}>Enabled</Slider.Label>
        <Slider.Control className={theme.SliderControl}>
          <Slider.Track className={theme.SliderTrack}>
            <Slider.Indicator className={theme.SliderIndicator} />
            <Slider.Thumb className={theme.SliderThumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  ),
  play: async ({ canvas }) => {
    const disabledThumb = canvas.getByRole('slider', { name: 'Disabled' });
    const enabledThumb = canvas.getByRole('slider', { name: 'Enabled' });

    await expect(disabledThumb).toBeDisabled();
    await expect(disabledThumb).not.toHaveFocus();
    const disabledControl = canvas.getByTestId('disabled-control');
    await expect(disabledControl).toHaveAttribute('data-disabled');

    await expect(enabledThumb).not.toBeDisabled();
  },
};

/* ------------------------------------------------------------------ */
/* Edge-aligned thumb (docs "edge-alignment" demo)                      */
/* ------------------------------------------------------------------ */

/**
 * `thumbAlignment="edge"` aligns the thumb's edge with the track's edge at the
 * extremes instead of centering it, so the thumb never overhangs the track.
 */
export const EdgeAlignment: Story = {
  tags: ['api-ref', 'base'],
  render: () => (
    <Slider.Root thumbAlignment="edge" defaultValue={25} className={theme.SliderRoot}>
      <Slider.Label className={theme.SliderLabel}>Volume</Slider.Label>
      <Slider.Control className={theme.SliderControl}>
        <Slider.Track className={theme.SliderTrack}>
          <Slider.Indicator className={theme.SliderIndicator} />
          <Slider.Thumb className={theme.SliderThumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
  play: async ({ canvas }) => {
    // Edge alignment insets the thumb, so it stays visibility:hidden (its role="slider"
    // input out of the a11y tree) until a post-mount measurement lands. Retry until it's there.
    const thumb = await waitFor(() => canvas.getByRole('slider', { name: 'Volume' }));
    await expect(thumb).toHaveAttribute('aria-valuenow', '25');
  },
};
