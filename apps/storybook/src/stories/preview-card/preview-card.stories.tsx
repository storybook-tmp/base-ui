import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { PreviewCard } from '@base-ui/react/preview-card';
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

/** `PreviewCard.Trigger`'s own `delay`/`closeDelay` props (default `600`/`300`ms) override the timing per trigger — since focus obeys the same delay as hover (unlike Tooltip), this can be pinned reliably via focus: the `delay={0}` trigger opens near-instantly, the default-delay trigger opens only after the full ~600ms wait. */
export const DelayTuning: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="PreviewCardContainer">
      <PreviewCard.Root>
        <p className="PreviewCardParagraph">
          <PreviewCard.Trigger
            className={theme.PreviewCardTrigger}
            delay={0}
            href="https://en.wikipedia.org/wiki/Typography"
          >
            instant
          </PreviewCard.Trigger>
        </p>
        <PreviewCard.Portal>
          <PreviewCard.Positioner className={theme.PreviewCardPositioner} sideOffset={8}>
            <PreviewCard.Popup className={theme.PreviewCardPopup}>
              <PreviewCard.Arrow className={theme.PreviewCardArrow} />
              <div className={theme.PreviewCardPopupContent}>
                <p className={theme.PreviewCardSummary}>Opens with delay=0</p>
              </div>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>

      <PreviewCard.Root>
        <p className="PreviewCardParagraph">
          <PreviewCard.Trigger
            className={theme.PreviewCardTrigger}
            href="https://en.wikipedia.org/wiki/Typography"
          >
            default delay
          </PreviewCard.Trigger>
        </p>
        <PreviewCard.Portal>
          <PreviewCard.Positioner className={theme.PreviewCardPositioner} sideOffset={8}>
            <PreviewCard.Popup className={theme.PreviewCardPopup}>
              <PreviewCard.Arrow className={theme.PreviewCardArrow} />
              <div className={theme.PreviewCardPopupContent}>
                <p className={theme.PreviewCardSummary}>Opens after the default 600ms delay</p>
              </div>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    const instant = canvas.getByRole('link', { name: 'instant' });
    instant.focus();
    await waitFor(() => expect(body.getByText('Opens with delay=0')).toBeVisible());

    const withDefaultDelay = canvas.getByRole('link', { name: 'default delay' });
    withDefaultDelay.focus();
    await waitFor(
      () => expect(body.getByText('Opens after the default 600ms delay')).toBeVisible(),
      { timeout: 2000 },
    );
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
