import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Dialog } from '@base-ui/react/dialog';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { ScrollArea } from '@base-ui/react/scroll-area';
import theme from '@droppy/theme';
import './dialog.demo.css';
import { XIcon } from './icons';

/**
 * Stories follow research/c-components/dialog (Tier 1): the eight kept docs demos,
 * one story per documented use case (the modal spectrum, dismissal reasons, focus
 * props, animation, nesting, handles/payloads, forms), the required full open→close
 * interaction story, and two real-world recreations picked from the top code-ok
 * entries in research/d-real-world-usage/dialog/ranked.json.
 *
 * Every story renders the complete `Portal > Backdrop > Popup` subtree and controls
 * visibility through the Root — conditionally rendering only the Popup breaks
 * unmount detection (#2186).
 */
const meta = {
  title: 'Overlays/Dialog',
  component: Dialog.Root,
  subcomponents: {
    'Dialog.Trigger': Dialog.Trigger,
    'Dialog.Portal': Dialog.Portal,
    'Dialog.Backdrop': Dialog.Backdrop,
    'Dialog.Popup': Dialog.Popup,
    'Dialog.Title': Dialog.Title,
    'Dialog.Description': Dialog.Description,
    'Dialog.Close': Dialog.Close,
  },
} satisfies Meta<typeof Dialog.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Kept docs demos + core behavior                                     */
/* ------------------------------------------------------------------ */

/** The docs hero demo: Trigger → Portal → Backdrop → Popup with Title, Description, and Close. Use as the starting point for any self-contained task or message layered over the whole page. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger className={theme.Button}>View notifications</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={theme.DialogBackdrop} />
        <Dialog.Popup className={theme.DialogPopup}>
          <div className="DialogIntro">
            <Dialog.Title className={theme.DialogTitle}>Notifications</Dialog.Title>
            <Dialog.Description className={theme.DialogDescription}>
              You are all caught up. Good job!
            </Dialog.Description>
          </div>
          <div className={theme.DialogActions}>
            <Dialog.Close className={theme.Button}>Close</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
};

/** Dialogs nest without extra APIs: the parent tracks descendants and exposes `[data-nested-dialog-open]` + `--nested-dialogs` so it can recede behind the child (docs `nested` demo). Esc closes only the topmost dialog. */
export const NestedDialogs: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger className={theme.Button}>View notifications</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={theme.DialogBackdrop} />
        <Dialog.Popup className="DialogNestedPopup">
          <div className="DialogIntro">
            <Dialog.Title className={theme.DialogTitle}>Notifications</Dialog.Title>
            <Dialog.Description className={theme.DialogDescription}>
              You are all caught up. Good job!
            </Dialog.Description>
          </div>
          <div className={theme.DialogActions}>
            <Dialog.Root>
              <Dialog.Trigger className={theme.Button}>Customize</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Popup className="DialogNestedPopup">
                  <div className="DialogIntro">
                    <Dialog.Title className={theme.DialogTitle}>
                      Customize notifications
                    </Dialog.Title>
                    <Dialog.Description className={theme.DialogDescription}>
                      Review your settings here.
                    </Dialog.Description>
                  </div>
                  <div className={theme.DialogActions}>
                    <Dialog.Close className={theme.Button}>Close</Dialog.Close>
                  </div>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'View notifications' }));
    const parent = await body.findByRole('dialog', { name: 'Notifications' });

    await userEvent.click(within(parent).getByRole('button', { name: 'Customize' }));
    const child = await body.findByRole('dialog', { name: 'Customize notifications' });
    await waitFor(() => expect(parent).toHaveAttribute('data-nested-dialog-open'));

    // Esc closes only the topmost (child) dialog.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(child).not.toBeInTheDocument());
    await expect(parent).toBeVisible();
    await waitFor(() => expect(parent).not.toHaveAttribute('data-nested-dialog-open'));
  },
};

function CloseConfirmationExample() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [textareaValue, setTextareaValue] = React.useState('');
  const titleId = React.useId();

  return (
    <Dialog.Root
      open={dialogOpen}
      onOpenChange={(open) => {
        // Show the close confirmation if there is text in the textarea.
        if (!open && textareaValue) {
          setConfirmationOpen(true);
        } else {
          setTextareaValue('');
          setDialogOpen(open);
        }
      }}
    >
      <Dialog.Trigger className={theme.Button}>Tweet</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={theme.DialogBackdrop} />
        <Dialog.Popup className={theme.DialogPopup}>
          <Dialog.Title id={titleId} className={theme.DialogTitle}>
            New tweet
          </Dialog.Title>
          <form
            className="DialogTextareaContainer"
            onSubmit={(event) => {
              event.preventDefault();
              setDialogOpen(false);
            }}
          >
            <textarea
              aria-labelledby={titleId}
              required
              className={theme.FieldTextarea}
              placeholder="What’s on your mind?"
              value={textareaValue}
              onChange={(event) => setTextareaValue(event.target.value)}
            />
            <div className={theme.DialogActions}>
              <Dialog.Close className={theme.Button}>Cancel</Dialog.Close>
              <button type="submit" className={theme.Button}>
                Tweet
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>

      {/* Confirmation dialog */}
      <AlertDialog.Root open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Popup className={theme.DialogPopup}>
            <div className="DialogIntro">
              <AlertDialog.Title className={theme.DialogTitle}>Discard tweet?</AlertDialog.Title>
              <AlertDialog.Description className={theme.DialogDescription}>
                Your tweet will be lost.
              </AlertDialog.Description>
            </div>
            <div className={theme.DialogActions}>
              <AlertDialog.Close className={theme.Button}>Go back</AlertDialog.Close>
              <button
                type="button"
                className={theme.Button}
                onClick={() => {
                  setConfirmationOpen(false);
                  setDialogOpen(false);
                  setTextareaValue('');
                }}
              >
                Discard
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </Dialog.Root>
  );
}

/** Guard unsaved input by branching in `onOpenChange`: a close request with text present opens a nested AlertDialog instead of closing (docs `close-confirmation` demo). */
export const CloseConfirmation: Story = {
  tags: ['highlight', 'base'],
  render: () => <CloseConfirmationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Tweet' }));
    const dialog = await body.findByRole('dialog');
    await userEvent.type(within(dialog).getByRole('textbox'), 'Draft in progress');

    // Esc while there is text: the confirmation opens instead of closing.
    await userEvent.keyboard('{Escape}');
    const confirmation = await body.findByRole('alertdialog');
    // waitFor: popups are briefly at opacity 0 during their entrance transition.
    await waitFor(() => expect(confirmation).toBeVisible());
    await expect(dialog).toBeInTheDocument();

    await userEvent.click(within(confirmation).getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(confirmation).not.toBeInTheDocument());
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

const CONTENT_SECTIONS = [
  {
    title: 'What a dialog is for',
    body: 'Use a dialog when the user must complete a focused task or read something important without navigating away.',
  },
  {
    title: 'Anatomy at a glance',
    body: 'Root, Trigger, Portal, Backdrop, Viewport, Popup, Title, Description, Close. Keep the title short and specific.',
  },
  {
    title: 'Opening and closing',
    body: 'Control it with the `open` and `onOpenChange` props, or let it manage state internally.',
  },
  {
    title: 'Keyboard and focus behavior',
    body: 'Focus moves inside the dialog when it opens. Tab and Shift+Tab loop within, and Esc requests close.',
  },
  {
    title: 'Accessible labeling',
    body: 'Set an explicit title and description using the Dialog.Title and Dialog.Description parts.',
  },
  {
    title: 'Backdrop and page scrolling',
    body: 'The backdrop separates layers while background content is inert. Keep copy clear and buttons obvious.',
  },
  {
    title: 'Portals and stacking',
    body: 'Dialogs render in a portal so they sit above the app content and avoid local z-index wars.',
  },
  {
    title: 'Close affordances',
    body: 'Always offer a visible close button. Touch screen-reader users need a targetable control to escape.',
  },
];

function OutsideScrollExample() {
  const popupRef = React.useRef<HTMLDivElement>(null);
  return (
    <Dialog.Root>
      <Dialog.Trigger className={theme.Button}>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={theme.DialogBackdrop} />
        <Dialog.Viewport className="DialogViewport">
          <ScrollArea.Root style={{ position: undefined }} className="DialogScrollViewport">
            <ScrollArea.Viewport className="DialogScrollViewport">
              <ScrollArea.Content className="DialogScrollContent">
                <Dialog.Popup ref={popupRef} className="DialogFlowPopup" initialFocus={popupRef}>
                  <div className="DialogPopupHeader">
                    <Dialog.Title className={theme.DialogTitle}>Dialog</Dialog.Title>
                    <Dialog.Description className={theme.DialogDescription}>
                      This layout keeps an outer container scrollable while the dialog can extend
                      past the bottom edge.
                    </Dialog.Description>
                    <Dialog.Close className="DialogIconClose" aria-label="Close">
                      <XIcon />
                    </Dialog.Close>
                  </div>
                  {CONTENT_SECTIONS.map((item) => (
                    <section className="DialogSection" key={item.title}>
                      <h3 className="DialogSectionTitle">{item.title}</h3>
                      <p className="DialogSectionBody">{item.body}</p>
                    </section>
                  ))}
                </Dialog.Popup>
              </ScrollArea.Content>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar className="DialogScrollbar">
              <ScrollArea.Thumb className="DialogScrollbarThumb" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The outside-scroll layout (docs `outside-scroll` demo): `Dialog.Viewport` wraps a Scroll Area so the page container scrolls and the popup may extend past the bottom edge ([#2808](https://github.com/mui/base-ui/pull/2808)). */
export const OutsideScroll: Story = {
  tags: ['highlight', 'base'],
  render: () => <OutsideScrollExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    // Portal smoke: the Viewport > ScrollArea > Popup tree mounts on document.body.
    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
    const dialog = await body.findByRole('dialog');
    // waitFor: the popup is briefly at opacity 0 during its entrance transition.
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

/** The inside-scroll layout (docs `inside-scroll` demo): the popup stays fully on screen and its body region scrolls via a nested Scroll Area. */
export const InsideScroll: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger className={theme.Button}>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={theme.DialogBackdrop} />
        <Dialog.Viewport className="DialogCenteredViewport">
          <Dialog.Popup className="DialogInsidePopup">
            <div className="DialogInsideHeader">
              <Dialog.Title className={theme.DialogTitle}>Dialog</Dialog.Title>
              <Dialog.Description className={theme.DialogDescription}>
                This layout keeps the popup fully on screen while allowing its content to scroll.
              </Dialog.Description>
            </div>
            <ScrollArea.Root className="DialogInsideBody">
              <ScrollArea.Viewport className="DialogInsideBodyViewport">
                <ScrollArea.Content className="DialogInsideBodyContent">
                  {CONTENT_SECTIONS.map((item) => (
                    <section className="DialogSection" key={item.title}>
                      <h3 className="DialogSectionTitle">{item.title}</h3>
                      <p className="DialogSectionBody">{item.body}</p>
                    </section>
                  ))}
                </ScrollArea.Content>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar className="DialogScrollbar">
                <ScrollArea.Thumb className="DialogScrollbarThumb" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
            <div className="DialogInsideActions">
              <Dialog.Close className={theme.Button}>Close</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
    const dialog = await body.findByRole('dialog');
    // waitFor: the popup is briefly at opacity 0 during its entrance transition.
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

/** Elements that look detached (a floating close button) must stay inside `Dialog.Popup` for tab order and screen readers: the popup gets `pointer-events: none` and the inner surface restores `pointer-events: auto` (docs `uncontained` demo). */
export const UncontainedContent: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger className={theme.Button}>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={theme.DialogBackdrop} />
        <Dialog.Viewport className="DialogUncontainedViewport">
          <Dialog.Popup className="DialogUncontainedPopup">
            <Dialog.Close className="DialogFloatingClose" aria-label="Close">
              <XIcon />
            </Dialog.Close>
            <div className="DialogUncontainedSurface">
              <div className="DialogIntro">
                <Dialog.Title className={theme.DialogTitle}>Media preview</Dialog.Title>
                <Dialog.Description className={theme.DialogDescription}>
                  The close button floats above this surface but remains inside the popup subtree.
                </Dialog.Description>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
    const dialog = await body.findByRole('dialog');
    // The visually detached close button is still inside the dialog for a11y.
    const close = within(dialog).getByRole('button', { name: 'Close' });
    await userEvent.click(close);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Detached triggers & handles                                         */
/* ------------------------------------------------------------------ */

const notificationsDialog = Dialog.createHandle();

/** `Dialog.createHandle()` associates a `Dialog.Trigger` rendered anywhere in the app with its `Dialog.Root` — no shared React state needed (docs `detached-triggers-simple` demo, [#2974](https://github.com/mui/base-ui/pull/2974)). */
export const DetachedTriggerSimple: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <React.Fragment>
      <Dialog.Trigger className={theme.Button} handle={notificationsDialog}>
        View notifications
      </Dialog.Trigger>

      <Dialog.Root handle={notificationsDialog}>
        <Dialog.Portal>
          <Dialog.Backdrop className={theme.DialogBackdrop} />
          <Dialog.Popup className={theme.DialogPopup}>
            <div className="DialogIntro">
              <Dialog.Title className={theme.DialogTitle}>Notifications</Dialog.Title>
              <Dialog.Description className={theme.DialogDescription}>
                You are all caught up. Good job!
              </Dialog.Description>
            </div>
            <div className={theme.DialogActions}>
              <Dialog.Close className={theme.Button}>Close</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </React.Fragment>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'View notifications' }));
    const dialog = await body.findByRole('dialog');
    // waitFor: the popup is briefly at opacity 0 during its entrance transition.
    await waitFor(() =>
      expect(within(dialog).getByText('You are all caught up. Good job!')).toBeVisible(),
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

const detachedDialog = Dialog.createHandle<number>();

function DetachedTriggersControlledExample() {
  const [open, setOpen] = React.useState(false);
  const [triggerId, setTriggerId] = React.useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setOpen(isOpen);
    setTriggerId(eventDetails.trigger?.id ?? null);
  };

  return (
    <React.Fragment>
      <div className="DialogContainer">
        <Dialog.Trigger
          className={theme.Button}
          handle={detachedDialog}
          id="detached-trigger-1"
          payload={1}
        >
          Open 1
        </Dialog.Trigger>
        <Dialog.Trigger
          className={theme.Button}
          handle={detachedDialog}
          id="detached-trigger-2"
          payload={2}
        >
          Open 2
        </Dialog.Trigger>
        <button
          className={theme.Button}
          type="button"
          onClick={() => {
            setTriggerId('detached-trigger-2');
            setOpen(true);
          }}
        >
          Open programmatically
        </button>
      </div>

      <Dialog.Root
        handle={detachedDialog}
        open={open}
        onOpenChange={handleOpenChange}
        triggerId={triggerId}
      >
        {({ payload }) => (
          <Dialog.Portal>
            <Dialog.Backdrop className={theme.DialogBackdrop} />
            <Dialog.Popup className={theme.DialogPopup}>
              {payload !== undefined && (
                <Dialog.Title className={theme.DialogTitle}>Dialog {payload}</Dialog.Title>
              )}
              <div className={theme.DialogActions}>
                <Dialog.Close className={theme.Button}>Close</Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </React.Fragment>
  );
}

/** Controlled mode with multiple detached triggers: manage `open` + `triggerId` (read `eventDetails.trigger` — there is no separate `onTriggerIdChange`), and each trigger's `payload` reaches the Root's render-prop children (docs `detached-triggers-controlled` demo). */
export const DetachedTriggersControlled: Story = {
  tags: ['highlight', 'base'],
  render: () => <DetachedTriggersControlledExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger1 = canvas.getByRole('button', { name: 'Open 1' });
    const trigger2 = canvas.getByRole('button', { name: 'Open 2' });

    await userEvent.click(trigger1);
    const dialog = await body.findByRole('dialog', { name: 'Dialog 1' });
    // ARIA state is synchronized on the active trigger only.
    await expect(trigger1).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger2).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());

    await userEvent.click(canvas.getByRole('button', { name: 'Open programmatically' }));
    const dialog2 = await body.findByRole('dialog', { name: 'Dialog 2' });
    await waitFor(() => expect(trigger2).toHaveAttribute('aria-expanded', 'true'));
    await userEvent.click(within(dialog2).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog2).not.toBeInTheDocument());
  },
};

interface ReleasePayload {
  name: string;
  version: string;
}

/* ------------------------------------------------------------------ */
/* Modality spectrum                                                   */

/* ------------------------------------------------------------------ */
/* State, dismissal, and event details                                 */

/* ------------------------------------------------------------------ */
/* Focus management                                                    */

/* ------------------------------------------------------------------ */
/* Forms & composition                                                 */

/* ------------------------------------------------------------------ */
/* Animation & mounting                                                */

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/dialog)         */
/* ------------------------------------------------------------------ */
