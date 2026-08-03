import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Popover } from '@base-ui/react/popover';
import theme from '@droppy/theme';
import './popover.demo.css';

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
/* ------------------------------------------------------------------ */

/** The full interaction contract in one story: click opens a `role="dialog"` popup portalled to `document.body`, Escape closes and restores focus to the trigger, and pressing outside dismisses. */
export const OpenCloseInteraction: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="PopoverRow">
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
      <button type="button" className={theme.PopoverTrigger}>
        Outside area
      </button>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Notifications' });

    // Open: the popup portals to <body> and the trigger reflects the state.
    await userEvent.click(trigger);
    const popup = await body.findByRole('dialog');
    // The popup fades in via [data-starting-style], so wait out the transition.
    await waitFor(() => expect(popup).toBeVisible());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('data-popup-open');

    // Escape closes and returns focus to the trigger.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Reopen, then an outside press dismisses it.
    await userEvent.click(trigger);
    await body.findByRole('dialog');
    await userEvent.click(canvas.getByRole('button', { name: 'Outside area' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

/** `modal` locks scroll and disables outside pointer interaction via an internal backdrop. Focus trapping only activates because a `Popover.Close` is rendered — visually hidden here — so assistive tech always has an escape hatch (#4084). */
export const ModalTrue: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="PopoverRow">
      <Popover.Root modal>
        <Popover.Trigger className={theme.PopoverTrigger}>Display settings</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={theme.PopoverPopup}>
              <Popover.Title className={theme.PopoverTitle}>Display settings</Popover.Title>
              <div className="PopoverRow">
                <button type="button" className={theme.PopoverTrigger}>
                  Reset
                </button>
                <button type="button" className={theme.PopoverTrigger}>
                  Apply
                </button>
              </div>
              {/* #4084: modal focus trapping requires a rendered Close. */}
              <Popover.Close className={theme.PopoverClose}>Close</Popover.Close>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <button type="button" className={theme.PopoverTrigger}>
        Outside button
      </button>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Display settings' }));
    const popup = await body.findByRole('dialog');

    // The internal backdrop disables pointer interaction with the page.
    await waitFor(() =>
      expect(doc.querySelector('[role="presentation"][data-base-ui-inert]')).not.toBeNull(),
    );

    // Focus is trapped: Reset → Apply → (hidden) Close → wraps back to Reset.
    const reset = within(popup).getByRole('button', { name: 'Reset' });
    await waitFor(() => expect(reset).toHaveFocus());
    await userEvent.tab();
    await expect(within(popup).getByRole('button', { name: 'Apply' })).toHaveFocus();
    await userEvent.tab();
    await expect(within(popup).getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(reset).toHaveFocus());
  },
};

interface PlanDetails {
  name: string;
  price: string;
  blurb: string;
}

const planHandle = Popover.createHandle<PlanDetails>();

const plans: PlanDetails[] = [
  { name: 'Free', price: '$0', blurb: 'For personal projects.' },
  { name: 'Pro', price: '$16', blurb: 'For growing teams.' },
  { name: 'Enterprise', price: 'Custom', blurb: 'For large organizations.' },
];

/** Multiple triggers share one popup through a typed handle (`createHandle<PlanDetails>()`); each trigger carries a `payload` and the Root's function child renders it. Clicking another trigger moves the popup instead of closing it, reusing the same DOM node. */
export const MultipleTriggersPayload: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="PopoverContainer">
      {plans.map((plan) => (
        <Popover.Trigger
          key={plan.name}
          className={theme.PopoverTrigger}
          handle={planHandle}
          payload={plan}
        >
          {plan.name}
        </Popover.Trigger>
      ))}
      <Popover.Root handle={planHandle}>
        {({ payload }) => (
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup className={theme.PopoverPopup}>
                <Popover.Arrow className={theme.PopoverArrow} />
                <Popover.Title className={theme.PopoverTitle}>{payload?.name} plan</Popover.Title>
                <Popover.Description className={theme.PopoverDescription}>
                  {payload?.price} per month — {payload?.blurb}
                </Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Pro' }));
    const popup = await body.findByRole('dialog');
    await waitFor(() => expect(within(popup).getByText(/\$16 per month/)).toBeVisible());

    // Switching triggers swaps the payload in the same popup node.
    await userEvent.click(canvas.getByRole('button', { name: 'Enterprise' }));
    await expect(await within(popup).findByText(/Custom per month/)).toBeVisible();
    await expect(body.getByRole('dialog')).toBe(popup);
  },
};

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

/* ------------------------------------------------------------------ */
/* Icons (inlined — stories must not import docs assets)               */
