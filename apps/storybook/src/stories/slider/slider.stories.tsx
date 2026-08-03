import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Slider } from '@base-ui/react/slider';
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
