import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { PreviewCard } from '@base-ui/react/preview-card';
import { Tooltip } from '@base-ui/react/tooltip';
import theme from '@droppy/theme';
import './preview-card.demo.css';

/**
 * Stories follow research/c-components/preview-card (Tier 2, floor coverage):
 * the hero recreation (link trigger + rich card, per the docs hero demo), the
 * keyboard focus-open interaction (the same 600ms delay as hover, per
 * brief.md §6 — this is the one input modality besides mouse hover that
 * still works), and a positioning/Arrow story.
 */
const meta = {
  title: 'Overlays/Preview Card',
  component: PreviewCard.Root,
  subcomponents: {
    'PreviewCard.Trigger': PreviewCard.Trigger,
    'PreviewCard.Portal': PreviewCard.Portal,
    'PreviewCard.Positioner': PreviewCard.Positioner,
    'PreviewCard.Popup': PreviewCard.Popup,
    'PreviewCard.Arrow': PreviewCard.Arrow,
  },
} satisfies Meta<typeof PreviewCard.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: a link inline in a sentence previews its Wikipedia destination on hover/focus — image + bolded term + one-paragraph summary. Use as the starting point for any rich, hoverable link preview. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <PreviewCard.Root>
      <p className="PreviewCardParagraph">
        The principles of good{' '}
        <PreviewCard.Trigger
          className={theme.PreviewCardTrigger}
          href="https://en.wikipedia.org/wiki/Typography"
        >
          typography
        </PreviewCard.Trigger>{' '}
        remain in the digital age.
      </p>

      <PreviewCard.Portal>
        <PreviewCard.Positioner className={theme.PreviewCardPositioner} sideOffset={8}>
          <PreviewCard.Popup className={theme.PreviewCardPopup}>
            <PreviewCard.Arrow className={theme.PreviewCardArrow} />
            <div className={theme.PreviewCardPopupContent}>
              <img
                width="224"
                height="150"
                className={theme.PreviewCardImage}
                src="https://images.unsplash.com/photo-1619615391095-dfa29e1672ef?q=80&w=448&h=300"
                alt="Station Hofplein signage in Rotterdam, Netherlands"
              />
              <p className={theme.PreviewCardSummary}>
                <strong>Typography</strong> is the art and science of arranging type to make written
                language clear, visually appealing, and effective in communication.
              </p>
            </div>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  ),
};

const arrowSides = ['top', 'right', 'bottom', 'left'] as const;

/** All positioning lives on the Positioner: `side`, `align`, `sideOffset`. `PreviewCard.Arrow`'s `data-side` attribute drives the rotation so one CSS-only arrow serves all four placements — the same contract as Tooltip and Popover. */
export const PositioningWithArrow: Story = {
  tags: ['highlight'],
  render: () => (
    <div className="PreviewCardContainer">
      {arrowSides.map((side) => (
        <PreviewCard.Root key={side} defaultOpen>
          <PreviewCard.Trigger
            className={theme.PreviewCardTrigger}
            href="https://en.wikipedia.org/wiki/Typography"
          >
            {side}
          </PreviewCard.Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              className={theme.PreviewCardPositioner}
              side={side}
              sideOffset={8}
            >
              <PreviewCard.Popup className={theme.PreviewCardPopup}>
                <PreviewCard.Arrow className={theme.PreviewCardArrow} />
                <div className={theme.PreviewCardPopupContent}>
                  <p className={theme.PreviewCardSummary}>{`side="${side}"`}</p>
                </div>
              </PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>
      ))}
    </div>
  ),
};

function ControlledOpenExample() {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<string | null>(null);

  return (
    <div className="PreviewCardStack">
      <PreviewCard.Root
        open={open}
        onOpenChange={(nextOpen, eventDetails) => {
          setOpen(nextOpen);
          setReason(eventDetails.reason ?? null);
        }}
      >
        <p className="PreviewCardParagraph">
          Focus{' '}
          <PreviewCard.Trigger
            className={theme.PreviewCardTrigger}
            href="https://en.wikipedia.org/wiki/Typography"
          >
            this link
          </PreviewCard.Trigger>{' '}
          to open it.
        </p>
        <PreviewCard.Portal>
          <PreviewCard.Positioner className={theme.PreviewCardPositioner} sideOffset={8}>
            <PreviewCard.Popup className={theme.PreviewCardPopup}>
              <PreviewCard.Arrow className={theme.PreviewCardArrow} />
              <div className={theme.PreviewCardPopupContent}>
                <p className={theme.PreviewCardSummary}>Controlled preview card</p>
              </div>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>
      <output className="PreviewCardOutput">
        open={String(open)} reason={String(reason)}
      </output>
    </div>
  );
}

/** External `open`/`onOpenChange` state drives the card exactly like an uncontrolled Root's internal state would, plus `eventDetails.reason` reports which interaction caused each transition — `trigger-focus` on open here, `escape-key` on close. */
export const ControlledOpen: Story = {
  tags: ['highlight'],
  render: () => <ControlledOpenExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('link', { name: 'this link' });

    await userEvent.tab();
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() => expect(body.getByText('Controlled preview card')).toBeVisible(), {
      timeout: 2000,
    });
    await waitFor(() => expect(canvas.getByText(/reason=trigger-focus/)).toBeVisible());

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(body.queryByText('Controlled preview card')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(canvas.getByText(/reason=escape-key/)).toBeVisible());
  },
};

/**
 * The boundary from the parent brief: Tooltip labels a non-link control ("the point of
 * interacting with the trigger is unrelated to the tooltip content"); Preview Card previews
 * where a real `<a href>` link goes. Rendering both side by side in the same sentence makes the
 * distinction concrete — hover/focus each in turn and compare trigger element and popup content.
 * Litmus test verbatim from brief.md §4 (colmtuite, mui/base-ui#4778): "If you're not rendering
 * a link, you should not use PreviewCard."
 */
export const TooltipVsPreviewCardDistinction: Story = {
  tags: ['highlight'],
  render: () => (
    <p className="PreviewCardParagraph">
      Click{' '}
      <Tooltip.Root>
        <Tooltip.Trigger render={<button type="button" />} className="PreviewCardPlainButton">
          Copy
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className={theme.TooltipPopup}>Copy to clipboard</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>{' '}
      to copy this snippet, or read more about{' '}
      <PreviewCard.Root>
        <PreviewCard.Trigger
          className={theme.PreviewCardTrigger}
          href="https://en.wikipedia.org/wiki/Typography"
        >
          typography
        </PreviewCard.Trigger>
        <PreviewCard.Portal>
          <PreviewCard.Positioner className={theme.PreviewCardPositioner} sideOffset={8}>
            <PreviewCard.Popup className={theme.PreviewCardPopup}>
              <PreviewCard.Arrow className={theme.PreviewCardArrow} />
              <div className={theme.PreviewCardPopupContent}>
                <img
                  width="224"
                  height="150"
                  className={theme.PreviewCardImage}
                  src="https://images.unsplash.com/photo-1619615391095-dfa29e1672ef?q=80&w=448&h=300"
                  alt="Station Hofplein signage in Rotterdam, Netherlands"
                />
                <p className={theme.PreviewCardSummary}>
                  <strong>Typography</strong> is the art of arranging type.
                </p>
              </div>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>{' '}
      first.
    </p>
  ),
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);

    // The Tooltip trigger is a plain button; its content is short text only.
    const tooltipTrigger = canvas.getByRole('button', { name: 'Copy' });
    tooltipTrigger.focus();
    await waitFor(() => expect(body.getByText('Copy to clipboard')).toBeVisible());
    expect(body.queryByRole('img')).not.toBeInTheDocument();
    tooltipTrigger.blur();
    await waitFor(() => expect(body.queryByText('Copy to clipboard')).not.toBeInTheDocument());

    // The Preview Card trigger is a real link; its content is richer (image + summary).
    const previewCardTrigger = canvas.getByRole('link', { name: 'typography' });
    previewCardTrigger.focus();
    await waitFor(() => expect(body.getByRole('img')).toBeVisible(), { timeout: 2000 });
  },
};

const detachedHandle = PreviewCard.createHandle();

/** `PreviewCard.createHandle()` connects a `Trigger` rendered anywhere in the tree to a `Root`/`Popup` declared elsewhere — no DOM parent/child relationship required, mirroring Tooltip's detached-trigger pattern. */
export const DetachedTriggerWithHandle: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <div className="PreviewCardStack">
      <p className="PreviewCardParagraph">
        See the{' '}
        <PreviewCard.Trigger
          handle={detachedHandle}
          id="detached-trigger"
          className={theme.PreviewCardTrigger}
          href="https://en.wikipedia.org/wiki/Typography"
        >
          detached trigger
        </PreviewCard.Trigger>{' '}
        above; its popup is declared separately below.
      </p>
      <button
        type="button"
        className="PreviewCardPlainButton"
        onClick={() => detachedHandle.open('detached-trigger')}
      >
        Open programmatically
      </button>
      <button
        type="button"
        className="PreviewCardPlainButton"
        onClick={() => detachedHandle.close()}
      >
        Close
      </button>

      <PreviewCard.Root handle={detachedHandle}>
        <PreviewCard.Portal>
          <PreviewCard.Positioner className={theme.PreviewCardPositioner} sideOffset={8}>
            <PreviewCard.Popup className={theme.PreviewCardPopup}>
              <PreviewCard.Arrow className={theme.PreviewCardArrow} />
              <div className={theme.PreviewCardPopupContent}>
                <p className={theme.PreviewCardSummary}>Declared elsewhere in the tree</p>
              </div>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>
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
  },
};

/* ------------------------------------------------------------------ */
/* Detached triggers: controlled (docs demo)                            */
/* ------------------------------------------------------------------ */

const controlledPreviewHandle = PreviewCard.createHandle();

function DetachedTriggersControlledExample() {
  const [open, setOpen] = React.useState(false);
  const [triggerId, setTriggerId] = React.useState<string | null>(null);

  return (
    <div className="PreviewCardStack">
      <p className="PreviewCardParagraph">
        Read about{' '}
        <PreviewCard.Trigger
          handle={controlledPreviewHandle}
          id="controlled-typography"
          className={theme.PreviewCardTrigger}
          href="https://en.wikipedia.org/wiki/Typography"
        >
          typography
        </PreviewCard.Trigger>{' '}
        or{' '}
        <PreviewCard.Trigger
          handle={controlledPreviewHandle}
          id="controlled-design"
          className={theme.PreviewCardTrigger}
          href="https://en.wikipedia.org/wiki/Design"
        >
          design
        </PreviewCard.Trigger>
        .
      </p>
      <button
        type="button"
        className="PreviewCardPlainButton"
        onClick={() => {
          setTriggerId('controlled-design');
          setOpen(true);
        }}
      >
        Open programmatically
      </button>

      <PreviewCard.Root
        handle={controlledPreviewHandle}
        open={open}
        onOpenChange={(isOpen, eventDetails) => {
          setOpen(isOpen);
          setTriggerId(eventDetails.trigger?.id ?? null);
        }}
        triggerId={triggerId}
      >
        <PreviewCard.Portal>
          <PreviewCard.Positioner className={theme.PreviewCardPositioner} sideOffset={8}>
            <PreviewCard.Popup className={theme.PreviewCardPopup}>
              <PreviewCard.Arrow className={theme.PreviewCardArrow} />
              <div className={theme.PreviewCardPopupContent}>
                <p className={theme.PreviewCardSummary}>Controlled preview card</p>
              </div>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>
    </div>
  );
}

/**
 * `open`/`onOpenChange` plus `triggerId` put one shared card under app control
 * across several link triggers, so it can be opened programmatically against a
 * chosen link rather than only by hover.
 */
export const DetachedTriggersControlled: Story = {
  tags: ['highlight', 'base'],
  render: () => <DetachedTriggersControlledExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Open programmatically' }));
    await waitFor(() => expect(body.getByText('Controlled preview card')).toBeVisible());
  },
};

/* ------------------------------------------------------------------ */
/* Detached triggers: full payload (docs demo)                          */
/* ------------------------------------------------------------------ */

const payloadPreviewHandle = PreviewCard.createHandle<React.ReactNode>();

const PREVIEW_LINKS: Array<[string, string, string]> = [
  ['typography', 'Typography', 'The art of arranging type for legibility and style.'],
  ['design', 'Design', 'Planning the form and function of an object or system.'],
];

/**
 * A typed `createHandle<Payload>()` gives each link its own `payload`, so one
 * Root and one Popup serve every trigger and the card content is read from the
 * render-prop argument.
 */
export const DetachedTriggersFull: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <div className="PreviewCardStack">
      <p className="PreviewCardParagraph">
        {PREVIEW_LINKS.map(([id, label, summary], index) => (
          <React.Fragment key={id}>
            {index > 0 && ' and '}
            <PreviewCard.Trigger
              handle={payloadPreviewHandle}
              id={id}
              className={theme.PreviewCardTrigger}
              href={`https://en.wikipedia.org/wiki/${label}`}
              payload={summary}
            >
              {label}
            </PreviewCard.Trigger>
          </React.Fragment>
        ))}
        .
      </p>

      <PreviewCard.Root handle={payloadPreviewHandle}>
        {({ payload }) => (
          <PreviewCard.Portal>
            <PreviewCard.Positioner className={theme.PreviewCardPositioner} sideOffset={8}>
              <PreviewCard.Popup className={theme.PreviewCardPopup}>
                <PreviewCard.Arrow className={theme.PreviewCardArrow} />
                <div className={theme.PreviewCardPopupContent}>
                  <p className={theme.PreviewCardSummary}>{payload}</p>
                </div>
              </PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        )}
      </PreviewCard.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('link', { name: 'Design' });
    // Re-fire the hover each poll: a dropped first hover isn't replayed. interval must
    // exceed the 600ms OPEN_DELAY rest-timer, or each retry cancels it before it fires.
    await waitFor(
      async () => {
        await userEvent.unhover(trigger);
        await userEvent.hover(trigger);
        expect(
          body.getByText('Planning the form and function of an object or system.'),
        ).toBeVisible();
      },
      { timeout: 6000, interval: 900 },
    );
  },
};
