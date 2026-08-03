import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from '@base-ui/react/progress';
import theme from '@droppy/theme';

/**
 * Stories follow research/c-components/progress (Tier 3): the kept hero demo,
 * the mandatory determinate + indeterminate pair with ARIA-contract plays,
 * and the format/locale/range prop-guidance stories from the story plan.
 */
const meta = {
  title: 'Status & display/Progress',
  component: Progress.Root,
  subcomponents: {
    'Progress.Label': Progress.Label,
    'Progress.Track': Progress.Track,
    'Progress.Indicator': Progress.Indicator,
    'Progress.Value': Progress.Value,
  },
  args: { value: 40 },
} satisfies Meta<typeof Progress.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

function HeroExample() {
  const [value, setValue] = React.useState(20);

  // Simulate changes (same mechanism as the docs hero demo).
  React.useEffect(() => {
    const interval = setInterval(() => {
      setValue((current) => Math.min(100, Math.round(current + Math.random() * 25)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Progress.Root className={theme.ProgressRoot} value={value}>
      <Progress.Label className={theme.ProgressLabel}>Export data</Progress.Label>
      <Progress.Value className={theme.ProgressValue} />
      <Progress.Track className={theme.ProgressTrack}>
        <Progress.Indicator className={theme.ProgressIndicator} />
      </Progress.Track>
    </Progress.Root>
  );
}

/** The docs hero demo: a labeled export task whose value increments over time — the consumer always drives `value` (there is no uncontrolled mode). */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => <HeroExample />,
};
