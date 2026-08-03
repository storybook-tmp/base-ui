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

function ControlledCollapsibleDemo() {
  const [open, setOpen] = React.useState(false);
  const [lastReason, setLastReason] = React.useState<string | null>(null);

  return (
    <div>
      <div className="ExternalControls">
        <button type="button" className="ExternalButton" onClick={() => setOpen((v) => !v)}>
          Toggle externally
        </button>
      </div>
      <Collapsible.Root
        className={theme.CollapsibleRoot}
        open={open}
        onOpenChange={(nextOpen, eventDetails) => {
          setOpen(nextOpen);
          setLastReason(eventDetails.reason ?? null);
        }}
      >
        <Collapsible.Trigger className={theme.CollapsibleTrigger}>
          Recovery keys
          <CaretRightIcon className={theme.CollapsibleIcon} />
        </Collapsible.Trigger>
        <Collapsible.Panel className={theme.CollapsiblePanel}>
          <div className={theme.CollapsibleContent}>
            <div>alien-bean-pasta</div>
          </div>
        </Collapsible.Panel>
      </Collapsible.Root>
      <div className="Log" data-testid="reason-log">
        last onOpenChange reason: {lastReason ?? 'none yet'}
      </div>
    </div>
  );
}

/**
 * `open` can be driven from anywhere, not just the Trigger — here, an
 * external button outside the Collapsible tree entirely. `onOpenChange`'s
 * `eventDetails.reason` distinguishes how the change happened: pressing the
 * Trigger reports `'trigger-press'`; the external button here calls
 * `setOpen` directly and never goes through `onOpenChange` at all, since it
 * isn't the Trigger driving the change.
 */
export const Controlled: Story = {
  tags: ['highlight'],
  render: () => <ControlledCollapsibleDemo />,
  play: async ({ canvas, userEvent }) => {
    const externalButton = canvas.getByRole('button', { name: 'Toggle externally' });
    const trigger = canvas.getByRole('button', { name: 'Recovery keys' });
    const reasonLog = canvas.getByTestId('reason-log');

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(reasonLog).toHaveTextContent('last onOpenChange reason: none yet');

    await userEvent.click(externalButton);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    // The external button sets `open` directly — no `onOpenChange` reason.
    await expect(reasonLog).toHaveTextContent('last onOpenChange reason: none yet');

    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    // Pressing the Trigger itself reports back through onOpenChange.
    await waitFor(() =>
      expect(reasonLog).toHaveTextContent('last onOpenChange reason: trigger-press'),
    );
  },
};

/**
 * A `Collapsible.Panel` can contain an entirely independent, nested
 * `Collapsible.Root`. Unlike Accordion, Collapsible does not coordinate with
 * any siblings at all — the outer panel can be closed without first closing
 * the inner one, and vice versa.
 */
export const Nested: Story = {
  tags: ['highlight'],
  render: () => (
    <Collapsible.Root className={theme.CollapsibleRoot}>
      <Collapsible.Trigger className={theme.CollapsibleTrigger}>
        Recovery keys
        <CaretRightIcon className={theme.CollapsibleIcon} />
      </Collapsible.Trigger>
      <Collapsible.Panel className={theme.CollapsiblePanel}>
        <div className={theme.CollapsibleContent}>
          <div>alien-bean-pasta</div>
          <Collapsible.Root className={`${theme.CollapsibleRoot} NestedCollapsible`}>
            <Collapsible.Trigger className={theme.CollapsibleTrigger}>
              Backup phrase
              <CaretRightIcon className={theme.CollapsibleIcon} />
            </Collapsible.Trigger>
            <Collapsible.Panel className={theme.CollapsiblePanel}>
              <div className={theme.CollapsibleContent}>
                <div>horse-battery-staple</div>
              </div>
            </Collapsible.Panel>
          </Collapsible.Root>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const outerTrigger = canvas.getByRole('button', { name: 'Recovery keys' });
    await userEvent.click(outerTrigger);
    await waitFor(() => expect(outerTrigger).toHaveAttribute('aria-expanded', 'true'));

    const innerTrigger = canvas.getByRole('button', { name: 'Backup phrase' });
    await userEvent.click(innerTrigger);
    await waitFor(() => expect(innerTrigger).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(canvas.getByText('horse-battery-staple')).toBeVisible());

    // Closing the outer one does not require the inner one to close first —
    // no forced coordination, unlike Accordion.
    await userEvent.click(outerTrigger);
    await waitFor(() => expect(outerTrigger).toHaveAttribute('aria-expanded', 'false'));
  },
};

/** A single Collapsible composed inside a settings-card layout, showing it works normally embedded in ordinary surrounding markup rather than as a standalone widget. */
export const WithinCard: Story = {
  tags: ['highlight'],
  render: () => (
    <div className="Card">
      <div className="CardHeader">Security</div>
      <div className="CardBody">
        <Collapsible.Root className={theme.CollapsibleRoot}>
          <Collapsible.Trigger className={theme.CollapsibleTrigger}>
            Recovery keys
            <CaretRightIcon className={theme.CollapsibleIcon} />
          </Collapsible.Trigger>
          <Collapsible.Panel className={theme.CollapsiblePanel}>
            <div className={theme.CollapsibleContent}>
              <div>alien-bean-pasta</div>
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
      </div>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Recovery keys' });
    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(canvas.getByText('alien-bean-pasta')).toBeVisible());
  },
};
