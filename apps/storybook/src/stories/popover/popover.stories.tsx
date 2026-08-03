import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
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

/** The CSS animation contract: transition `[data-starting-style]`/`[data-ending-style]` and scale from `var(--transform-origin)` so the popup grows out of its anchor point. */
export const TransitionStartingEndingStyle: Story = {
  tags: ['animation'],
  render: () => (
    <Popover.Root>
      <Popover.Trigger className={theme.PopoverTrigger}>Toggle panel</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={`${theme.PopoverPopup} PopoverTransitionExtra`}>
            <Popover.Arrow className={theme.PopoverArrow} />
            <Popover.Title className={theme.PopoverTitle}>Animated</Popover.Title>
            <Popover.Description className={theme.PopoverDescription}>
              Scales in from the transform origin, and back out on close.
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
};

function KeepMountedExample() {
  const [settled, setSettled] = React.useState('closed');
  return (
    <div className="PopoverStack">
      <Popover.Root onOpenChangeComplete={(open) => setSettled(open ? 'open' : 'closed')}>
        <Popover.Trigger className={theme.PopoverTrigger}>Toggle panel</Popover.Trigger>
        <Popover.Portal keepMounted>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={`${theme.PopoverPopup} PopoverTransitionExtra`}>
              <Popover.Description className={theme.PopoverDescription}>
                This popup stays mounted while closed.
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <output className="PopoverOutput">transition settled: {settled}</output>
    </div>
  );
}

/** `keepMounted` on the Portal keeps the closed popup in the DOM (hidden), and `onOpenChangeComplete` fires once enter/exit transitions settle — pair with `actionsRef.unmount()` when driving exit animations from JavaScript. */
export const KeepMountedExitAnimation: Story = {
  tags: ['animation'],
  render: () => <KeepMountedExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    // keepMounted: the popup exists in the DOM (hidden) before ever opening.
    await expect(body.getByRole('dialog', { hidden: true })).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Toggle panel' }));
    await expect(await canvas.findByText('transition settled: open')).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await expect(await canvas.findByText('transition settled: closed')).toBeVisible();
    await expect(body.getByRole('dialog', { hidden: true })).toBeInTheDocument();
  },
};

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/popover)        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Icons (inlined — stories must not import docs assets)               */
