import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, waitFor } from 'storybook/test';
import { Slider } from '@base-ui/react/slider';
import { Field } from '@base-ui/react/field';
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

function ControlledExample() {
  const [value, setValue] = React.useState(20);
  const [changeCount, setChangeCount] = React.useState(0);
  const [committedCount, setCommittedCount] = React.useState(0);
  return (
    <div className="SliderDemoStack">
      <Slider.Root
        value={value}
        onValueChange={(newValue) => {
          setValue(newValue as number);
          setChangeCount((count) => count + 1);
        }}
        onValueCommitted={() => setCommittedCount((count) => count + 1)}
        className={theme.SliderRoot}
      >
        <Slider.Label className={theme.SliderLabel}>Controlled volume</Slider.Label>
        <Slider.Value className={theme.SliderValue} />
        <Slider.Control className={theme.SliderControl}>
          <Slider.Track className={theme.SliderTrack}>
            <Slider.Indicator className={theme.SliderIndicator} />
            <Slider.Thumb className={theme.SliderThumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <output className="SliderDemoOutput">onValueChange calls: {changeCount}</output>
      <output className="SliderDemoOutput">onValueCommitted calls: {committedCount}</output>
    </div>
  );
}

/**
 * A fully controlled slider (`value` + `onValueChange`) with `onValueCommitted` tracked
 * separately. For keyboard interactions the two callbacks fire 1:1, once per keypress — unlike a
 * drag gesture, where `onValueChange` fires continuously but `onValueCommitted` only once, on
 * release (mirrors Number Field's analogous `ValueChangeVsCommitted` story).
 */
export const ControlledValueWithCommit: Story = {
  tags: ['highlight'],
  render: () => <ControlledExample />,
  play: async ({ canvas, userEvent }) => {
    const thumb = canvas.getByRole('slider', { name: 'Controlled volume' });
    thumb.focus();

    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '23'));
    await waitFor(() => expect(canvas.getByText(/onValueChange calls: 3/)).toBeVisible());
    await expect(canvas.getByText(/onValueCommitted calls: 3/)).toBeVisible();
  },
};

/**
 * `Field` integration: the slider registers with the surrounding `Field.Root` the same way
 * Number Field does (`useRegisterFieldControl`), so `data-valid`/`data-invalid`/`data-touched`/
 * `data-dirty`/`data-focused` appear on every part (Root, Control, Track, Indicator, Thumb)
 * simultaneously, and `Field.Error` renders from the `validate` function.
 */
export const FieldIntegration: Story = {
  tags: ['highlight'],
  render: () => (
    <Field.Root
      validationMode="onChange"
      validate={(value) =>
        typeof value === 'number' && value >= 10 ? null : 'Must be at least 10.'
      }
      className="SliderDemoStack"
    >
      <Field.Label className={theme.SliderLabel}>Minimum spend</Field.Label>
      <Slider.Root defaultValue={5} min={0} max={20}>
        <Slider.Value className={theme.SliderValue} />
        <Slider.Control data-testid="field-control" className={theme.SliderControl}>
          <Slider.Track className={theme.SliderTrack}>
            <Slider.Indicator className={theme.SliderIndicator} />
            <Slider.Thumb className={theme.SliderThumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Field.Error className={theme.FieldError} />
    </Field.Root>
  ),
  play: async ({ canvas }) => {
    const thumb = canvas.getByRole('slider', { name: 'Minimum spend' });
    const control = canvas.getByTestId('field-control');
    // `data-valid`/`data-invalid` land on Thumb's outer <div> host, not the nested
    // `role="slider"` <input> itself — the div is the input's direct parent.
    const thumbHost = thumb.parentElement as HTMLElement;

    fireEvent.keyDown(thumb, { key: 'ArrowRight', shiftKey: true });
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '15'));
    await waitFor(() => expect(thumbHost).toHaveAttribute('data-valid'));
    await expect(control).toHaveAttribute('data-valid');
    await expect(canvas.queryByText('Must be at least 10.')).not.toBeInTheDocument();
  },
};

/**
 * Marks aren't a built-in feature — the legacy `Mark`/`marks` API was dropped in the #373
 * rewrite (still open: #462) — so they're hand-composed `<span>` children of `Track`, recreating
 * the `DelayUntilRepeat` pattern from `experiments/slider/slider.tsx`. Net-new Storybook
 * coverage: a documented workaround recipe, not a port of an existing docs demo.
 */
export const CustomMarks: Story = {
  tags: ['highlight'],
  render: () => (
    <Slider.Root defaultValue={2} min={0} max={5} step={1} className={theme.SliderRoot}>
      <Slider.Label className={theme.SliderLabel}>Delay until repeat</Slider.Label>
      <Slider.Control className={theme.SliderControl}>
        <Slider.Track className={theme.SliderMarksTrack}>
          <span className={theme.SliderMark} />
          <span className={theme.SliderMark} />
          <span className={theme.SliderMark} />
          <span className={theme.SliderMark} />
          <span className={theme.SliderMark} />
          <span className={theme.SliderMark} />
          <Slider.Thumb className={theme.SliderThumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
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
