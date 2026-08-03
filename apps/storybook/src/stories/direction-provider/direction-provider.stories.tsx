import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import theme from '@droppy/theme';

/**
 * Stories follow research/c-components/direction-provider (Tier 3 utils
 * floor): `DirectionProvider` renders no DOM of its own — it only configures
 * *behavior* (arrow-key direction, positioning sides) for descendant Base UI
 * components. It never sets `dir`/CSS itself (brief §2, #831), so every story
 * pairs it with an app-owned `dir="rtl"` on the container, per the docs.
 */
const meta = {
  title: 'Utilities/Direction Provider',
  component: DirectionProvider,
} satisfies Meta<typeof DirectionProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The behavior the provider exists for: composite keyboard navigation flips with direction. `useCompositeRoot` swaps the "forward" arrow key in RTL (`ArrowLeft` instead of `ArrowRight`) — this is a real interaction change, not a visual one, and it only happens because `DirectionProvider` tells the `ToggleGroup` its direction is RTL. */
export const FlipCompositeRTL: Story = {
  tags: ['highlight'],
  render: () => (
    <div dir="rtl">
      <DirectionProvider direction="rtl">
        <ToggleGroup
          aria-label="Text alignment"
          defaultValue={['left']}
          className={theme.ToggleGroupRoot}
        >
          <Toggle aria-label="Align left" value="left" className={theme.ToggleGroupItem}>
            L
          </Toggle>
          <Toggle aria-label="Align center" value="center" className={theme.ToggleGroupItem}>
            C
          </Toggle>
          <Toggle aria-label="Align right" value="right" className={theme.ToggleGroupItem}>
            R
          </Toggle>
        </ToggleGroup>
      </DirectionProvider>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const left = canvas.getByRole('button', { name: 'Align left' });
    const center = canvas.getByRole('button', { name: 'Align center' });

    await userEvent.tab();
    await expect(left).toHaveFocus();

    // In RTL, ArrowLeft is the "forward" key (useCompositeRoot.ts): focus
    // moves to the next item, mirroring what ArrowRight does in LTR.
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(center).toHaveFocus());
  },
};
