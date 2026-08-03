import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Popover } from '@base-ui/react/popover';
import { Checkbox } from '@base-ui/react/checkbox';
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

/** The default is non-modal: the rest of the page stays interactive, so clicking an outside field closes the popover and the field receives the interaction in the same gesture. */
export const NonModalDefault: Story = {
  tags: ['highlight'],
  render: () => (
    <div className="PopoverRow">
      <Popover.Root>
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
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <input className={theme.Input} aria-label="Outside input" placeholder="Outside input" />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Display settings' }));
    await body.findByRole('dialog');

    // The page is not blocked: one click closes the popover and lands in the input.
    const input = canvas.getByRole('textbox', { name: 'Outside input' });
    await userEvent.click(input);
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(input).toHaveFocus();
    await userEvent.type(input, 'still interactive');
    await expect(input).toHaveValue('still interactive');
  },
};

/** `modal="trap-focus"` loops keyboard focus without locking scroll or outside pointers (#1571): there is no internal backdrop, and an outside press still dismisses. */
export const TrapFocusMode: Story = {
  tags: ['highlight'],
  render: () => (
    <div className="PopoverRow">
      <Popover.Root modal="trap-focus">
        <Popover.Trigger className={theme.PopoverTrigger}>Insert variable</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={theme.PopoverPopup}>
              <Popover.Title className={theme.PopoverTitle}>Insert variable</Popover.Title>
              <div className="PopoverRow">
                <button type="button" className={theme.PopoverTrigger}>
                  Insert name
                </button>
                <button type="button" className={theme.PopoverTrigger}>
                  Insert email
                </button>
              </div>
              <Popover.Close className={theme.PopoverTrigger}>Cancel</Popover.Close>
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

    await userEvent.click(canvas.getByRole('button', { name: 'Insert variable' }));
    const popup = await body.findByRole('dialog');

    // Unlike `modal`, no internal backdrop is rendered — pointers stay unlocked.
    await expect(doc.querySelector('[role="presentation"][data-base-ui-inert]')).toBeNull();

    // Keyboard focus still loops inside the popup.
    const first = within(popup).getByRole('button', { name: 'Insert name' });
    await waitFor(() => expect(first).toHaveFocus());
    await userEvent.tab();
    await userEvent.tab();
    await expect(within(popup).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(first).toHaveFocus());

    // While focus is trapped, outside content is aria-hidden for assistive
    // tech (so role queries no longer see it), but pointers stay unlocked —
    // an outside press still closes the popover.
    await userEvent.click(canvas.getByText('Outside button'));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

const imperativeHandle = Popover.createHandle();

/** The handle's imperative methods: `handle.open(triggerId)` opens the popup anchored to the registered trigger from anywhere in the app, and `handle.close()` dismisses it. Calls are ignored while no Root is mounted. */
export const DetachedHandleImperative: Story = {
  tags: ['highlight'],
  render: () => (
    <div className="PopoverStack">
      <Popover.Trigger
        className={theme.PopoverTrigger}
        handle={imperativeHandle}
        id="saved-searches"
      >
        Saved searches
      </Popover.Trigger>
      <div className="PopoverRow">
        <button
          type="button"
          className={theme.PopoverTrigger}
          onClick={() => imperativeHandle.open('saved-searches')}
        >
          Open via handle.open()
        </button>
        <button
          type="button"
          className={theme.PopoverTrigger}
          onClick={() => imperativeHandle.close()}
        >
          Close via handle.close()
        </button>
      </div>
      <Popover.Root handle={imperativeHandle}>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={theme.PopoverPopup}>
              <Popover.Arrow className={theme.PopoverArrow} />
              <Popover.Title className={theme.PopoverTitle}>Saved searches</Popover.Title>
              <Popover.Description className={theme.PopoverDescription}>
                Anchored to the registered trigger, wherever the call came from.
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Saved searches' });

    await userEvent.click(canvas.getByRole('button', { name: 'Open via handle.open()' }));
    const popup = await body.findByRole('dialog');
    await waitFor(() => expect(popup).toBeVisible());
    // The popup is associated with (and anchored to) the registered trigger.
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

    await userEvent.click(canvas.getByRole('button', { name: 'Close via handle.close()' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

interface PlanDetails {
  name: string;
  price: string;
  blurb: string;
}

function DismissalControlExample() {
  const [open, setOpen] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);

  return (
    <div className="PopoverStack">
      <div className="PopoverRow">
        <Popover.Root
          open={open}
          onOpenChange={(nextOpen, eventDetails) => {
            // Veto outside interactions. An outside click arrives as `focus-out`
            // (focus leaves the popup) followed by `outside-press` — both must be
            // filtered, or the first one still closes the popover.
            if (eventDetails.reason === 'outside-press' || eventDetails.reason === 'focus-out') {
              eventDetails.cancel();
              setLog((entries) => [...entries, `${eventDetails.reason} (canceled)`]);
              return;
            }
            setOpen(nextOpen);
            setLog((entries) => [...entries, eventDetails.reason]);
          }}
        >
          <Popover.Trigger className={theme.PopoverTrigger}>Edit widget</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup className={theme.PopoverPopup}>
                <Popover.Title className={theme.PopoverTitle}>Widget settings</Popover.Title>
                <Popover.Description className={theme.PopoverDescription}>
                  Clicking outside will not close this popover.
                </Popover.Description>
                <Popover.Close className={theme.PopoverTrigger}>Done</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
        <button type="button" className={theme.PopoverTrigger}>
          Outside area
        </button>
      </div>
      <output className="PopoverOutput">reasons: {log.length > 0 ? log.join(', ') : 'none'}</output>
    </div>
  );
}

/** The dismissal-control recipe: there is no `disablePointerDismissal` on Popover — filter `eventDetails.reason` and call `eventDetails.cancel()` instead (#2314, #3716, #4466). An outside click arrives as `focus-out` then `outside-press`, so both are vetoed; the Close button (`close-press`) still works. */
export const CancelCloseOnOutsidePress: Story = {
  tags: ['highlight'],
  render: () => <DismissalControlExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Edit widget' }));
    const popup = await body.findByRole('dialog');
    await expect(canvas.getByText(/trigger-press/)).toBeVisible();

    // Both dismissal reasons are canceled, so the popover stays open.
    await userEvent.click(canvas.getByRole('button', { name: 'Outside area' }));
    await expect(await canvas.findByText(/outside-press \(canceled\)/)).toBeVisible();
    await waitFor(() => expect(popup).toBeVisible());

    // Explicit close actions still go through.
    await userEvent.click(within(popup).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(canvas.getByText(/close-press/)).toBeVisible();
  },
};

/** The hover trigger is hybrid by design (#2623): clicking it also opens the popover and "sticks" it, so touch and keyboard users are never locked out. Clicking again closes it. */
export const HoverStickOnClick: Story = {
  tags: ['highlight'],
  render: () => (
    <Popover.Root>
      <Popover.Trigger openOnHover className={theme.PopoverTrigger}>
        Shortcuts
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={theme.PopoverPopup}>
            <Popover.Arrow className={theme.PopoverArrow} />
            <Popover.Description className={theme.PopoverDescription}>
              Press ? anywhere to open the shortcut list.
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Shortcuts' });

    // Click works even though the trigger also opens on hover.
    await userEvent.click(trigger);
    const popup = await body.findByRole('dialog');
    await waitFor(() => expect(popup).toBeVisible());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // A second click closes the stuck-open popover.
    await userEvent.click(trigger);
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Use-case stories                                                    */
/* ------------------------------------------------------------------ */

/** The infotip pattern — the documented alternative to a tooltip on an info icon (#3530): the content is essential, so it must be reachable by touch and screen readers. `openOnHover` keeps the hover convenience for mouse users. */
export const Infotip: Story = {
  tags: ['highlight'],
  render: () => (
    <div className="PopoverRow">
      <span className="PopoverLabel">Estimated tax</span>
      <Popover.Root>
        <Popover.Trigger
          openOnHover
          className={theme.PopoverIconTrigger}
          aria-label="More information about estimated tax"
        >
          i
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="top" sideOffset={8}>
            <Popover.Popup className={theme.PopoverPopup}>
              <Popover.Arrow className={theme.PopoverArrow} />
              <Popover.Description className={theme.PopoverDescription}>
                Calculated from your delivery address at checkout.
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  ),
};

function FilterPanelExample() {
  const [applied, setApplied] = React.useState('none');
  return (
    <div className="PopoverStack">
      <Popover.Root>
        <Popover.Trigger className={theme.PopoverTrigger}>Filter results</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={theme.PopoverPopup}>
              <Popover.Title className={theme.PopoverTitle}>Filters</Popover.Title>
              <form
                className="PopoverForm"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  setApplied([...data.keys()].join(', ') || 'none');
                }}
              >
                <label className={theme.CheckboxLabel}>
                  <Checkbox.Root name="in-stock" defaultChecked className={theme.CheckboxRoot}>
                    <Checkbox.Indicator className={theme.CheckboxIndicator}>
                      <CheckIcon />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  In stock
                </label>
                <label className={theme.CheckboxLabel}>
                  <Checkbox.Root name="on-sale" className={theme.CheckboxRoot}>
                    <Checkbox.Indicator className={theme.CheckboxIndicator}>
                      <CheckIcon />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  On sale
                </label>
                <Popover.Close className={theme.PopoverTrigger} type="submit">
                  Apply
                </Popover.Close>
              </form>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <output className="PopoverOutput">Applied: {applied}</output>
    </div>
  );
}

/** Interactive content is what separates popovers from tooltips: a small filter form with checkboxes, applied by a `Popover.Close` that doubles as the submit button. */
export const FilterPanelForm: Story = {
  tags: ['highlight'],
  render: () => <FilterPanelExample />,
};

interface OrderRow {
  id: string;
  customer: string;
  total: string;
  status: string;
}

const orderHandle = Popover.createHandle<OrderRow>();

const orderCustomers = [
  'Ada',
  'Grace',
  'Alan',
  'Edsger',
  'Barbara',
  'Donald',
  'Radia',
  'Vint',
  'Tim',
  'Margaret',
];

const orders: OrderRow[] = orderCustomers.map((customer, index) => ({
  id: `#10${String(index + 1).padStart(2, '0')}`,
  customer,
  total: `$${(index + 1) * 12}.00`,
  status: index % 3 === 0 ? 'Refunded' : 'Paid',
}));

/** The #3577 archetype: ten table rows share a single `Popover.Root` through a typed handle, so the tree contains one popup instead of ten. Each row's trigger passes the row as `payload`. */
export const TableRowSharedPopover: Story = {
  tags: ['highlight'],
  render: () => (
    <React.Fragment>
      <table className="PopoverTable">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer}</td>
              <td>
                <Popover.Trigger
                  className={theme.PopoverTrigger}
                  handle={orderHandle}
                  payload={order}
                >
                  Details
                </Popover.Trigger>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Popover.Root handle={orderHandle}>
        {({ payload }) => (
          <Popover.Portal>
            <Popover.Positioner side="right" sideOffset={8}>
              <Popover.Popup className={theme.PopoverPopup}>
                <Popover.Arrow className={theme.PopoverArrow} />
                <Popover.Title className={theme.PopoverTitle}>Order {payload?.id}</Popover.Title>
                <Popover.Description className={theme.PopoverDescription}>
                  {payload?.customer} — {payload?.total} ({payload?.status})
                </Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    </React.Fragment>
  ),
};

/** An explicit `Popover.Backdrop` dims the page behind a modal popover. Recomposes the optional-backdrop idea from WordPress Gutenberg's `@wordpress/ui` popover (GPL, link-only — described, not copied). */
export const WithBackdrop: Story = {
  tags: ['highlight'],
  render: () => (
    <Popover.Root modal>
      <Popover.Trigger className={theme.PopoverTrigger}>Review changes</Popover.Trigger>
      <Popover.Portal>
        <Popover.Backdrop className={theme.PopoverBackdrop} />
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={theme.PopoverPopup}>
            <Popover.Title className={theme.PopoverTitle}>Review changes</Popover.Title>
            <Popover.Description className={theme.PopoverDescription}>
              The dimmed backdrop focuses attention while this popover is open.
            </Popover.Description>
            <Popover.Close className={theme.PopoverTrigger}>Got it</Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
};

function CustomAnchorExample() {
  const previewRef = React.useRef<HTMLElement>(null);
  return (
    <div className="PopoverRow">
      <Popover.Root>
        <Popover.Trigger className={theme.PopoverTrigger}>Explain expression</Popover.Trigger>
        <code className="PopoverAnchorTarget" ref={previewRef}>
          subtotal * 1.21
        </code>
        <Popover.Portal>
          <Popover.Positioner anchor={previewRef} side="bottom" align="start" sideOffset={8}>
            <Popover.Popup className={theme.PopoverPopup}>
              <Popover.Arrow className={theme.PopoverArrow} />
              <Popover.Description className={theme.PopoverDescription}>
                21% VAT is applied to the subtotal.
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

/** The Positioner `anchor` prop positions the popup against an element other than the trigger — the sanctioned answer to "attach to an arbitrary DOM node" (#2157, #3577; LyteNyte Grid anchors cell popovers this way). */
export const CustomAnchor: Story = {
  tags: ['highlight'],
  render: () => <CustomAnchorExample />,
};

/** All positioning lives on the Positioner: `side`, `align`, `sideOffset`, `alignOffset`, `collisionPadding`. Tweak them via controls; design systems often compress these into one `placement` prop (dify-ui), but the primitives keep the axes separate. */
export const PositionerPlayground: StoryObj<typeof Popover.Positioner> = {
  tags: ['highlight'],
  args: {
    side: 'bottom',
    align: 'center',
    sideOffset: 8,
    alignOffset: 0,
    collisionPadding: 5,
  },
  argTypes: {
    side: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left', 'inline-start', 'inline-end'],
    },
    align: { control: 'select', options: ['start', 'center', 'end'] },
    sideOffset: { control: 'number' },
    alignOffset: { control: 'number' },
    collisionPadding: { control: 'number' },
  },
  render: (args) => (
    <Popover.Root defaultOpen>
      <Popover.Trigger className={theme.PopoverTrigger}>Anchor</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner {...args}>
          <Popover.Popup className={theme.PopoverPopup}>
            <Popover.Arrow className={theme.PopoverArrow} />
            <Popover.Title className={theme.PopoverTitle}>Anchor</Popover.Title>
            <Popover.Description className={theme.PopoverDescription}>
              Positioned with side, align, and offsets.
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
};

/** Inside sticky or fixed-positioned ancestors, the default `absolute` positioning can lag while scrolling — `positionMethod="fixed"` on the Positioner is the documented fix (#3653). */
export const PositionMethodFixedInSticky: Story = {
  tags: ['highlight'],
  render: () => (
    <div className="PopoverScrollArea">
      <div className="PopoverStickyHeader">
        <span className="PopoverLabel">Inbox</span>
        <Popover.Root>
          <Popover.Trigger className={theme.PopoverTrigger}>Sort</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner positionMethod="fixed" sideOffset={8}>
              <Popover.Popup className={theme.PopoverPopup}>
                <Popover.Description className={theme.PopoverDescription}>
                  positionMethod="fixed" keeps this popup steady while the list scrolls under the
                  sticky header.
                </Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
      {Array.from({ length: 12 }, (_, index) => (
        <p key={index} className="PopoverFiller">
          Conversation {index + 1}
        </p>
      ))}
    </div>
  ),
};

/** Nested popovers just work: a child Root joins the parent's floating tree, and its portal automatically nests inside the parent's. If you use a custom portal `container`, set it only on the root Portal (#1930). */
export const NestedPopovers: Story = {
  tags: ['highlight'],
  render: () => (
    <Popover.Root>
      <Popover.Trigger className={theme.PopoverTrigger}>Share</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={theme.PopoverPopup}>
            <Popover.Title className={theme.PopoverTitle}>Share</Popover.Title>
            <Popover.Description className={theme.PopoverDescription}>
              Share this document with your team.
            </Popover.Description>
            <Popover.Root>
              <Popover.Trigger className={theme.PopoverTrigger}>Permissions</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner side="right" sideOffset={8}>
                  <Popover.Popup className={theme.PopoverPopup}>
                    <Popover.Arrow className={theme.PopoverArrow} />
                    <Popover.Description className={theme.PopoverDescription}>
                      Viewers can read, editors can write.
                    </Popover.Description>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
};

function InitialFinalFocusExample() {
  const urlInputRef = React.useRef<HTMLInputElement>(null);
  const summaryRef = React.useRef<HTMLButtonElement>(null);
  return (
    <div className="PopoverStack">
      <Popover.Root>
        <Popover.Trigger className={theme.PopoverTrigger}>Add bookmark</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup
              className={theme.PopoverPopup}
              initialFocus={urlInputRef}
              finalFocus={summaryRef}
            >
              <Popover.Title className={theme.PopoverTitle}>Add bookmark</Popover.Title>
              <label className="PopoverLabel">
                Name
                <input className={theme.Input} defaultValue="Base UI" />
              </label>
              <label className="PopoverLabel">
                URL
                <input
                  ref={urlInputRef}
                  className={theme.Input}
                  defaultValue="https://base-ui.com"
                />
              </label>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <button type="button" ref={summaryRef} className={theme.PopoverTrigger}>
        Focus lands here on close
      </button>
    </div>
  );
}

/** `initialFocus` routes opening focus to a specific element (here the second input) and `finalFocus` overrides where focus returns on close — the preferred way to restore focus when the trigger itself may disappear (#4084). */
export const InitialFinalFocus: Story = {
  tags: ['highlight'],
  render: () => <InitialFinalFocusExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Add bookmark' }));
    const popup = await body.findByRole('dialog');

    // initialFocus skips the first input and lands on the URL field.
    const urlInput = within(popup).getByRole('textbox', { name: 'URL' });
    await waitFor(() => expect(urlInput).toHaveFocus());

    // finalFocus sends focus to the designated element instead of the trigger.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Focus lands here on close' })).toHaveFocus(),
    );
  },
};

const directionHandle = Popover.createHandle<string>();

/** A minimal `Popover.Viewport` setup: two triggers swap string payloads, and the old/new content slide according to `data-activation-direction`. Freeze the Positioner to `--positioner-width/height` during transitions so the popup cannot thrash. */
export const ViewportContentDirection: Story = {
  tags: ['highlight'],
  render: () => (
    <div className="PopoverContainer">
      <Popover.Trigger
        className={theme.PopoverTrigger}
        handle={directionHandle}
        payload="This panel opened from the left trigger."
      >
        Left
      </Popover.Trigger>
      <Popover.Trigger
        className={theme.PopoverTrigger}
        handle={directionHandle}
        payload="This panel opened from the right trigger."
      >
        Right
      </Popover.Trigger>
      <Popover.Root handle={directionHandle}>
        {({ payload }) => (
          <Popover.Portal>
            <Popover.Positioner className={theme.PopoverTransitionPositioner} sideOffset={8}>
              <Popover.Popup className={theme.PopoverTransitionPopup}>
                <Popover.Viewport className={theme.PopoverViewport}>
                  <Popover.Description className={theme.PopoverDescription}>
                    {payload}
                  </Popover.Description>
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    </div>
  ),
};

const arrowSides = ['top', 'right', 'bottom', 'left'] as const;

/** `Popover.Arrow` tracks the anchor on every side; its `data-side` attribute drives the rotation so one SVG-free CSS arrow serves all four placements. */
export const ArrowSides: Story = {
  tags: ['highlight'],
  render: () => (
    <div className="PopoverArrowGrid">
      {arrowSides.map((side) => (
        <Popover.Root key={side} defaultOpen>
          <Popover.Trigger className={theme.PopoverTrigger}>{side}</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side={side} sideOffset={8}>
              <Popover.Popup className={theme.PopoverPopup}>
                <Popover.Arrow className={theme.PopoverArrow} />
                <Popover.Title className={theme.PopoverTitle}>Arrow demo</Popover.Title>
                <Popover.Description className={theme.PopoverDescription}>
                  {`side="${side}"`}
                </Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ))}
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/popover)        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Icons (inlined — stories must not import docs assets)               */
/* ------------------------------------------------------------------ */

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1.5 5.5 4 8l4.5-6" />
    </svg>
  );
}
