import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Popover } from '@base-ui/react/popover';
import theme from '@droppy/theme';
import './popover.demo.css';
import { QueuePopoverExample } from './recreations/QueuePopoverExample';
import { LinkEditorToolbarExample } from './recreations/LinkEditorToolbarExample';
import { MentionAutocompleteExample } from './recreations/MentionAutocompleteExample';

/**
 * Stories follow research/c-components/popover (Tier 1): the five kept docs demos,
 * the mandatory full open/close interaction, the modal-vs-non-modal pair, the
 * detached-trigger/createHandle stories with a typed payload, the dismissal-control
 * recipe, one story per evidenced use case, and three real-world recreations from
 * the code-ok entries in research/d-real-world-usage/popover/ranked.json.
 */
const meta = {
  title: 'Overlays/Popover',
  component: Popover.Root,
  subcomponents: {
    'Popover.Trigger': Popover.Trigger,
    'Popover.Portal': Popover.Portal,
    'Popover.Positioner': Popover.Positioner,
    'Popover.Popup': Popover.Popup,
    'Popover.Arrow': Popover.Arrow,
    'Popover.Title': Popover.Title,
    'Popover.Description': Popover.Description,
    'Popover.Close': Popover.Close,
  },
} satisfies Meta<typeof Popover.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Kept docs demos                                                     */
/* ------------------------------------------------------------------ */

/** The docs hero demo: a notifications panel built from the canonical part tree — Trigger, Portal, Positioner, Popup, Arrow, Title, Description. Use as the starting point for any anchored panel of essential content. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <Popover.Root>
      <Popover.Trigger className={theme.PopoverTrigger}>Notifications</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={theme.PopoverPopup}>
            <Popover.Arrow className={theme.PopoverArrow} />
            <Popover.Title className={theme.PopoverTitle}>Notifications</Popover.Title>
            <Popover.Description className={theme.PopoverDescription}>
              You are all caught up. Good job!
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
};

/** `openOnHover` on the Trigger (not the Root) makes the popover a hybrid: hover opens it after `delay` (default 300ms of rest), and click still works for touch and keyboard users. Hover-open never moves focus. */
export const OpenOnHover: Story = {
  tags: ['api-ref', 'base'],
  render: () => (
    <Popover.Root>
      <Popover.Trigger openOnHover className={theme.PopoverTrigger}>
        Notifications
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={theme.PopoverPopup}>
            <Popover.Arrow className={theme.PopoverArrow} />
            <Popover.Title className={theme.PopoverTitle}>Notifications</Popover.Title>
            <Popover.Description className={theme.PopoverDescription}>
              You are all caught up. Good job!
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
};

const simpleHandle = Popover.createHandle();

/** A trigger rendered outside `Popover.Root`, connected through `Popover.createHandle()` — the modern answer to "open a popover from anywhere" (#2336). */
export const DetachedTriggersSimple: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <React.Fragment>
      <Popover.Trigger className={theme.PopoverTrigger} handle={simpleHandle}>
        Notifications
      </Popover.Trigger>
      <Popover.Root handle={simpleHandle}>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={theme.PopoverPopup}>
              <Popover.Arrow className={theme.PopoverArrow} />
              <Popover.Title className={theme.PopoverTitle}>Notifications</Popover.Title>
              <Popover.Description className={theme.PopoverDescription}>
                You are all caught up. Good job!
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </React.Fragment>
  ),
};

const controlledHandle = Popover.createHandle();

function DetachedTriggersControlledExample() {
  const [open, setOpen] = React.useState(false);
  const [triggerId, setTriggerId] = React.useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean, eventDetails: Popover.Root.ChangeEventDetails) => {
    setOpen(isOpen);
    setTriggerId(eventDetails.trigger?.id ?? null);
  };

  return (
    <React.Fragment>
      <div className="PopoverContainer">
        <Popover.Trigger
          className={theme.PopoverTrigger}
          handle={controlledHandle}
          id="dtc-trigger-1"
        >
          Trigger 1
        </Popover.Trigger>
        <Popover.Trigger
          className={theme.PopoverTrigger}
          handle={controlledHandle}
          id="dtc-trigger-2"
        >
          Trigger 2
        </Popover.Trigger>
        <button
          type="button"
          className={theme.PopoverTrigger}
          onClick={() => {
            setTriggerId('dtc-trigger-2');
            setOpen(true);
          }}
        >
          Open programmatically
        </button>
      </div>
      <Popover.Root
        handle={controlledHandle}
        open={open}
        onOpenChange={handleOpenChange}
        triggerId={triggerId}
      >
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={theme.PopoverPopup}>
              <Popover.Arrow className={theme.PopoverArrow} />
              <Popover.Title className={theme.PopoverTitle}>Notifications</Popover.Title>
              <Popover.Description className={theme.PopoverDescription}>
                You are all caught up. Good job!
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </React.Fragment>
  );
}

/** Controlled mode with multiple triggers: `open` + `triggerId` on the Root, with the active trigger delivered in `eventDetails.trigger`. Forgetting `triggerId` positions the popup at the viewport origin (#3577). */
export const DetachedTriggersControlled: Story = {
  tags: ['highlight', 'base'],
  render: () => <DetachedTriggersControlledExample />,
};

const morphHandle = Popover.createHandle<React.ComponentType>();

function NotificationsPanel() {
  return (
    <div className="PopoverStack">
      <Popover.Title className={theme.PopoverTitle}>Notifications</Popover.Title>
      <Popover.Description className={theme.PopoverDescription}>
        You are all caught up. Good job!
      </Popover.Description>
    </div>
  );
}

function ActivityPanel() {
  return (
    <div className="PopoverStack">
      <Popover.Title className={theme.PopoverTitle}>Activity</Popover.Title>
      <Popover.Description className={theme.PopoverDescription}>
        Nothing interesting happened recently.
      </Popover.Description>
    </div>
  );
}

function ProfilePanel() {
  return (
    <div className="PopoverProfilePanel">
      <Popover.Title className={theme.PopoverTitle}>Jason Eventon</Popover.Title>
      <span className="PopoverAvatar" aria-hidden>
        JE
      </span>
      <span className="PopoverPlan">Pro plan</span>
      <div className="PopoverProfileActions">
        <a href="#profile-settings">Profile settings</a>
        <a href="#log-out">Log out</a>
      </div>
    </div>
  );
}

/** The full detached-triggers demo: three triggers share one popup through a typed handle, passing a component as `payload`. The Positioner/Popup transition `top/left` and `--popup-width/height`, and `Popover.Viewport` slides content by `data-activation-direction`. */
export const DetachedTriggersFull: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <div className="PopoverContainer">
      <Popover.Trigger
        className={theme.PopoverTrigger}
        handle={morphHandle}
        payload={NotificationsPanel}
      >
        Notifications
      </Popover.Trigger>
      <Popover.Trigger
        className={theme.PopoverTrigger}
        handle={morphHandle}
        payload={ActivityPanel}
      >
        Activity
      </Popover.Trigger>
      <Popover.Trigger className={theme.PopoverTrigger} handle={morphHandle} payload={ProfilePanel}>
        Profile
      </Popover.Trigger>
      <Popover.Root handle={morphHandle}>
        {({ payload: Payload }) => (
          <Popover.Portal>
            <Popover.Positioner className={theme.PopoverTransitionPositioner} sideOffset={8}>
              <Popover.Popup className={theme.PopoverTransitionPopup}>
                <Popover.Arrow className={theme.PopoverArrow} />
                <Popover.Viewport className={theme.PopoverViewport}>
                  {Payload !== undefined && <Payload />}
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Interaction stories (behavior + a11y pinning)                       */

interface PlanDetails {
  name: string;
  price: string;
  blurb: string;
}

/* ------------------------------------------------------------------ */
/* Use-case stories                                                    */

interface OrderRow {
  id: string;
  customer: string;
  total: string;
  status: string;
}

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/popover)        */
/* ------------------------------------------------------------------ */

/**
 * Recreation of the play-queue popover in the museeks music player's title bar:
 * the Trigger composes a custom icon button via `render`, while the Positioner's
 * `anchor` points at the whole header wrapper so the panel aligns with the bar,
 * not the small button. Recomposed from martpie/museeks `Header.tsx` (MIT,
 * code-ok, research/d-real-world-usage/popover/ranked.json #2).
 */
export const RealWorldQueuePopover: Story = {
  tags: ['recreation', 'examples'],
  render: () => <QueuePopoverExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Open the queue' });
    const header = trigger.parentElement as HTMLElement;

    await userEvent.click(trigger);
    const popup = await body.findByRole('dialog');
    await waitFor(() => expect(within(popup).getByText('Glass Harbor — Undertow')).toBeVisible());

    // The popup is end-aligned to the header wrapper, not to the icon button.
    await waitFor(() =>
      expect(
        Math.abs(popup.getBoundingClientRect().right - header.getBoundingClientRect().right),
      ).toBeLessThanOrEqual(1),
    );
  },
};

/**
 * Recreation of the link editor in the flashtype markdown editor's formatting
 * toolbar: `Toolbar.Button` composes `Popover.Trigger` via `render` inside a
 * roving-tabindex toolbar, and `initialFocus` routes focus straight to the URL
 * input, past the "Remove link" button (the same idea as Gutenberg's
 * deprioritized-initial-focus hook). Recomposed from opral/flashtype
 * `formatting-toolbar.tsx` (MIT, code-ok,
 * research/d-real-world-usage/popover/ranked.json #3).
 */
export const RealWorldLinkEditorToolbar: Story = {
  tags: ['recreation', 'examples'],
  render: () => <LinkEditorToolbarExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const editLink = canvas.getByRole('button', { name: 'Edit link' });

    await userEvent.click(editLink);
    const popup = await body.findByRole('dialog');

    // initialFocus skips the "Remove link" button and focuses the URL input.
    const urlInput = within(popup).getByRole('textbox', { name: 'URL' });
    await waitFor(() => expect(urlInput).toHaveFocus());

    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, 'https://base-ui.com');
    await userEvent.click(within(popup).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(canvas.getByText('href: https://base-ui.com')).toBeVisible();
    // Focus returns to the composed toolbar trigger.
    await waitFor(() => expect(editLink).toHaveFocus());
  },
};

/**
 * Recreation of the @-mention file autocomplete in takopi (a personal AI
 * assistant): a triggerless, fully controlled popover anchored to the textarea
 * with `anchor={textareaRef}` and `side="top"`, plus `initialFocus={false}` and
 * `finalFocus={false}` so keyboard focus never leaves the textarea. Recomposed
 * from egoist/takopi `mention-popover.tsx` (Apache-2.0, code-ok,
 * research/d-real-world-usage/popover/ranked.json #5).
 */
export const RealWorldMentionAutocomplete: Story = {
  tags: ['recreation', 'examples'],
  render: () => <MentionAutocompleteExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const textarea = canvas.getByRole('textbox', { name: 'Message' });

    await userEvent.click(textarea);
    await userEvent.type(textarea, 'Check @');
    const popup = await body.findByRole('dialog');

    // initialFocus={false}: focus never leaves the textarea while open.
    await expect(textarea).toHaveFocus();

    await userEvent.click(within(popup).getByRole('button', { name: 'README.md' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(textarea).toHaveValue('Check @README.md ');
    await expect(textarea).toHaveFocus();
  },
};

/* ------------------------------------------------------------------ */
/* Icons (inlined — stories must not import docs assets)               */
