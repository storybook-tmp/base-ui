import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Collapsible } from '@base-ui/react/collapsible';
import theme from '@droppy/theme';
import './collapsible.demo.css';

/**
 * Stories follow research/c-components/collapsible (Tier 3, lean brief): the
 * hero Trigger+Panel demo, `keepMounted`, and `hiddenUntilFound` (browser
 * find-in-page support).
 *
 * Collapsible is the shared primitive Accordion is built on — each
 * `Accordion.Item` calls `useCollapsibleRoot`/`useCollapsiblePanel` directly
 * rather than reimplementing open/close/measurement logic (brief §1). Unlike
 * Accordion, Collapsible coordinates with no siblings: it has no `value`
 * prop, just a single boolean `open` state.
 */
const meta = {
  title: 'Disclosure & structure/Collapsible',
  component: Collapsible.Root,
  subcomponents: {
    'Collapsible.Trigger': Collapsible.Trigger,
    'Collapsible.Panel': Collapsible.Panel,
  },
} satisfies Meta<typeof Collapsible.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

function CaretRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M6 12V4l4.5 4z" />
    </svg>
  );
}

/** The docs hero demo: a single Trigger+Panel pair, closed by default. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <Collapsible.Root className={theme.CollapsibleRoot}>
      <Collapsible.Trigger className={theme.CollapsibleTrigger}>
        Recovery keys
        <CaretRightIcon className={theme.CollapsibleIcon} />
      </Collapsible.Trigger>
      <Collapsible.Panel className={theme.CollapsiblePanel}>
        <div className={theme.CollapsibleContent}>
          <div>alien-bean-pasta</div>
          <div>wild-irish-burrito</div>
          <div>horse-battery-staple</div>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Recovery keys' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByText('alien-bean-pasta')).not.toBeInTheDocument();

    await userEvent.click(trigger);

    // Panel height animates via `--collapsible-panel-height`; wait for the
    // transition to settle before asserting the panel content is visible.
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(canvas.getByText('alien-bean-pasta')).toBeVisible());

    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await waitFor(() => expect(canvas.queryByText('alien-bean-pasta')).not.toBeInTheDocument());
  },
};

/**
 * The Panel's height is driven by `--collapsible-panel-height`
 * (`CollapsiblePanelCssVars`), written as an inline style on the Panel node
 * itself. This asserts the mechanism directly — the rendered height grows
 * from `0` while opening and returns to `0` while closing — rather than just
 * asserting the CSS recipe is present in the stylesheet.
 */
export const AnimatedHeight: Story = {
  tags: ['animation'],
  render: () => (
    <Collapsible.Root className={theme.CollapsibleRoot}>
      <Collapsible.Trigger className={theme.CollapsibleTrigger}>
        Recovery keys
        <CaretRightIcon className={theme.CollapsibleIcon} />
      </Collapsible.Trigger>
      <Collapsible.Panel
        className={theme.CollapsiblePanel}
        data-testid="animated-panel"
        keepMounted
      >
        <div className={theme.CollapsibleContent}>
          <div>alien-bean-pasta</div>
          <div>wild-irish-burrito</div>
          <div>horse-battery-staple</div>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
  play: async ({ canvasElement, canvas, userEvent }) => {
    // `keepMounted` keeps the panel present (but hidden) at all times, so
    // its height can be measured before the very first open.
    const panel = canvasElement.querySelector('[data-testid="animated-panel"]') as HTMLElement;
    const trigger = canvas.getByRole('button', { name: 'Recovery keys' });

    await expect(panel.getBoundingClientRect().height).toBe(0);

    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(panel.getBoundingClientRect().height).toBeGreaterThan(0));
    await waitFor(() =>
      expect(panel.style.getPropertyValue('--collapsible-panel-height')).not.toBe('0px'),
    );

    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await waitFor(() => expect(panel.getBoundingClientRect().height).toBe(0));
  },
};
