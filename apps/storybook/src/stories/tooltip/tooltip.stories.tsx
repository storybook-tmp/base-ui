import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Tooltip } from '@base-ui/react/tooltip';
import theme from '@droppy/theme';
import './tooltip.demo.css';

/**
 * Stories follow research/c-components/tooltip (Tier 2, floor coverage): the
 * hero recreation (Provider + Root + Trigger + Portal + Positioner + Popup +
 * Arrow), the keyboard focus-open interaction (the reliable play — hover is
 * flaky in a browser-automation play function, per story-plan.md notes),
 * the Provider delay-grouping mechanism (distinctive to this component), and
 * a positioning/Arrow playground.
 */
const meta = {
  title: 'Overlays/Tooltip',
  component: Tooltip.Root,
  subcomponents: {
    'Tooltip.Provider': Tooltip.Provider,
    'Tooltip.Trigger': Tooltip.Trigger,
    'Tooltip.Portal': Tooltip.Portal,
    'Tooltip.Positioner': Tooltip.Positioner,
    'Tooltip.Popup': Tooltip.Popup,
    'Tooltip.Arrow': Tooltip.Arrow,
  },
} satisfies Meta<typeof Tooltip.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: a toolbar of icon-only buttons, each labeled by a tooltip, all sharing a `Tooltip.Provider` for delay-grouping. Use as the starting point for labeling any control whose own action is unrelated to the tooltip's content. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <Tooltip.Provider>
      <div className="TooltipPanel">
        <Tooltip.Root>
          <Tooltip.Trigger className="TooltipIconButton" aria-label="Bold">
            B
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={11}>
              <Tooltip.Popup className={theme.TooltipPopup}>
                <Tooltip.Arrow className={theme.TooltipArrow} />
                Bold
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger className="TooltipIconButton" aria-label="Italic">
            I
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={11}>
              <Tooltip.Popup className={theme.TooltipPopup}>
                <Tooltip.Arrow className={theme.TooltipArrow} />
                Italic
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger className="TooltipIconButton" aria-label="Underline">
            U
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={11}>
              <Tooltip.Popup className={theme.TooltipPopup}>
                <Tooltip.Arrow className={theme.TooltipArrow} />
                Underline
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </Tooltip.Provider>
  ),
};

/** `Tooltip.Provider` groups sibling tooltips under one shared delay: the first hover/focus pays the full `600ms` open delay, but hopping to an adjacent trigger within the `timeout` window (default `400ms`) opens instantly (brief.md §6). This is the mechanism most distinctive to Tooltip among the overlay-cluster popups — Preview Card has no equivalent Provider. */
export const ProviderDelayGrouping: Story = {
  tags: ['highlight'],
  render: () => (
    <Tooltip.Provider timeout={400}>
      <div className="TooltipPanel">
        <Tooltip.Root>
          <Tooltip.Trigger className="TooltipIconButton" aria-label="Bold">
            B
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={11}>
              <Tooltip.Popup className={theme.TooltipPopup}>
                <Tooltip.Arrow className={theme.TooltipArrow} />
                Bold
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger className="TooltipIconButton" aria-label="Italic">
            I
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={11}>
              <Tooltip.Popup className={theme.TooltipPopup}>
                <Tooltip.Arrow className={theme.TooltipArrow} />
                Italic
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </Tooltip.Provider>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const bold = canvas.getByRole('button', { name: 'Bold' });
    const italic = canvas.getByRole('button', { name: 'Italic' });

    // Focus (not hover) is used here to avoid the play-function hover-flake
    // risk noted in story-plan.md; focus shares the same Provider grouping
    // context as hover for the delay-collapse behavior.
    bold.focus();
    await waitFor(() => expect(body.getByText('Bold')).toBeVisible(), { timeout: 2000 });

    // Moving focus to the sibling trigger inside the same warm Provider
    // group reopens near-instantly instead of paying the full open delay.
    italic.focus();
    await waitFor(() => expect(body.getByText('Italic')).toBeVisible(), { timeout: 2000 });
  },
};

const arrowSides = ['top', 'right', 'bottom', 'left'] as const;

/** All positioning lives on the Positioner: `side`, `align`, `sideOffset`. `Tooltip.Arrow`'s `data-side` attribute drives the rotation so one CSS-only arrow serves all four placements. */
export const PositioningAndArrow: Story = {
  tags: ['highlight'],
  render: () => (
    <div className="TooltipRow">
      {arrowSides.map((side) => (
        <Tooltip.Root key={side} defaultOpen>
          <Tooltip.Trigger className={theme.Button}>{side}</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner side={side} sideOffset={8}>
              <Tooltip.Popup className={theme.TooltipPopup}>
                <Tooltip.Arrow className={theme.TooltipArrow} />
                {`side="${side}"`}
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      ))}
    </div>
  ),
};

const alignments = ['start', 'center', 'end'] as const;

/** A fuller positioning matrix: every `side` × `align` combination, each rendered open so `data-side`/`data-align`/`data-uncentered` can be spot-checked visually against `Tooltip.Arrow`'s rotation and offset. */
export const PositioningMatrix: Story = {
  tags: ['highlight'],
  render: () => (
    <div className="TooltipGrid">
      {arrowSides.map((side) =>
        alignments.map((align) => (
          <Tooltip.Root key={`${side}-${align}`} defaultOpen>
            <Tooltip.Trigger className={theme.Button}>{`${side}/${align}`}</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner side={side} align={align} sideOffset={8}>
                <Tooltip.Popup className={theme.TooltipPopup}>
                  <Tooltip.Arrow className={theme.TooltipArrow} />
                  {`${side} / ${align}`}
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        )),
      )}
    </div>
  ),
};

function ControlledOpenExample() {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<string | null>(null);

  return (
    <div className="TooltipRow">
      <Tooltip.Root
        open={open}
        onOpenChange={(nextOpen, eventDetails) => {
          setOpen(nextOpen);
          setReason(eventDetails.reason ?? null);
        }}
      >
        <Tooltip.Trigger className={theme.Button}>Focus me</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className={theme.TooltipPopup}>
              <Tooltip.Arrow className={theme.TooltipArrow} />
              Controlled tooltip
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      <output className="TooltipOutput">
        open={String(open)} reason={String(reason)}
      </output>
    </div>
  );
}

/** External `open`/`onOpenChange` state drives the tooltip exactly like an uncontrolled Root's internal state would, plus `eventDetails.reason` reports which interaction caused each transition — `trigger-focus` on open here, `escape-key` on close. */
export const ControlledOpen: Story = {
  tags: ['highlight'],
  render: () => <ControlledOpenExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Focus me' });

    await userEvent.tab();
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() => expect(body.getByText('Controlled tooltip')).toBeVisible());
    await waitFor(() => expect(canvas.getByText(/reason=trigger-focus/)).toBeVisible());

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByText('Controlled tooltip')).not.toBeInTheDocument());
    await waitFor(() => expect(canvas.getByText(/reason=escape-key/)).toBeVisible());
  },
};

const detachedHandle = Tooltip.createHandle();

/** `Tooltip.createHandle()` connects a `Trigger` rendered anywhere in the tree to a `Root`/`Popup` declared elsewhere — no parent/child DOM relationship is required. Here, external buttons call `handle.open(id)`/`handle.close()` imperatively, and the physically-separate trigger's own focus/hover still works too. */
export const DetachedTriggerHandle: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <div>
      <div className="TooltipRow">
        <Tooltip.Trigger handle={detachedHandle} id="detached-trigger" className={theme.Button}>
          Detached trigger
        </Tooltip.Trigger>
        <button
          type="button"
          className={theme.Button}
          onClick={() => detachedHandle.open('detached-trigger')}
        >
          Open programmatically
        </button>
        <button type="button" className={theme.Button} onClick={() => detachedHandle.close()}>
          Close
        </button>
      </div>

      <Tooltip.Root handle={detachedHandle}>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className={theme.TooltipPopup}>
              <Tooltip.Arrow className={theme.TooltipArrow} />
              Declared elsewhere in the tree
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open programmatically' }));
    await waitFor(() => expect(body.getByText('Declared elsewhere in the tree')).toBeVisible());

    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(body.queryByText('Declared elsewhere in the tree')).not.toBeInTheDocument(),
    );

    // The detached trigger's own focus-open path still works independently of the handle buttons.
    const trigger = canvas.getByRole('button', { name: 'Detached trigger' });
    trigger.focus();
    await waitFor(() => expect(body.getByText('Declared elsewhere in the tree')).toBeVisible());
  },
};

/* ------------------------------------------------------------------ */
/* Detached triggers: controlled (docs demo)                            */
/* ------------------------------------------------------------------ */

const controlledTooltip = Tooltip.createHandle();

function DetachedTriggersControlledExample() {
  const [open, setOpen] = React.useState(false);
  const [triggerId, setTriggerId] = React.useState<string | null>(null);

  return (
    <Tooltip.Provider>
      <div className="TooltipRow">
        {['trigger-1', 'trigger-2', 'trigger-3'].map((id, index) => (
          <Tooltip.Trigger
            key={id}
            className={theme.Button}
            handle={controlledTooltip}
            id={id}
            aria-label={`Trigger ${index + 1}`}
          >
            {index + 1}
          </Tooltip.Trigger>
        ))}
        <button
          type="button"
          className={theme.Button}
          onClick={() => {
            setTriggerId('trigger-2');
            setOpen(true);
          }}
        >
          Open programmatically
        </button>
      </div>

      <Tooltip.Root
        handle={controlledTooltip}
        open={open}
        onOpenChange={(isOpen, eventDetails) => {
          setOpen(isOpen);
          setTriggerId(eventDetails.trigger?.id ?? null);
        }}
        triggerId={triggerId}
      >
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className={theme.TooltipPopup}>
              <Tooltip.Arrow className={theme.TooltipArrow} />
              Controlled tooltip
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

/**
 * `open`/`onOpenChange` plus `triggerId` drive one shared popup across several
 * detached triggers. `eventDetails.trigger` reports which trigger caused each
 * change, so the popup can be opened programmatically against a chosen trigger.
 */
export const DetachedTriggersControlled: Story = {
  tags: ['highlight', 'base'],
  render: () => <DetachedTriggersControlledExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Open programmatically' }));
    await waitFor(() => expect(body.getByText('Controlled tooltip')).toBeVisible());
  },
};

/* ------------------------------------------------------------------ */
/* Detached triggers: full payload (docs demo)                          */
/* ------------------------------------------------------------------ */

const payloadTooltip = Tooltip.createHandle<React.ReactNode>();

const PAYLOAD_TRIGGERS: Array<[string, string]> = [
  ['Audio', 'Listen to audio preview'],
  ['Timer', 'Set a timer'],
  ['Delete', 'Delete: This action cannot be undone'],
];

/**
 * A typed `createHandle<Payload>()` lets each detached trigger carry its own
 * `payload`, so one Root and one Popup serve every trigger and the content is
 * read from the render-prop argument.
 */
export const DetachedTriggersFull: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <Tooltip.Provider>
      <div className="TooltipRow">
        {PAYLOAD_TRIGGERS.map(([label, payload]) => (
          <Tooltip.Trigger
            key={label}
            className={theme.Button}
            handle={payloadTooltip}
            payload={payload}
          >
            {label}
          </Tooltip.Trigger>
        ))}
      </div>

      <Tooltip.Root handle={payloadTooltip}>
        {({ payload }) => (
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={8}>
              <Tooltip.Popup className={theme.TooltipPopup}>
                <Tooltip.Arrow className={theme.TooltipArrow} />
                {payload}
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    </Tooltip.Provider>
  ),
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Timer' });
    // Focus only opens the tooltip when it counts as :focus-visible, which a bare first
    // .focus() may not in a capture harness — and a dropped open isn't replayed. Re-fire
    // each poll via blur+focus (re-focusing an already-focused element won't refire onFocus).
    await waitFor(
      () => {
        trigger.blur();
        trigger.focus();
        expect(body.getByText('Set a timer')).toBeVisible();
      },
      { timeout: 3000 },
    );
  },
};
