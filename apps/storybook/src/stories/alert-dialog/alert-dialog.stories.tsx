import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import theme from '@droppy/theme';
import './alert-dialog.demo.css';

/**
 * Stories follow research/c-components/alert-dialog (Tier 2): AlertDialog is
 * Dialog with three axes hard-coded (`role="alertdialog"`, `modal` forced
 * `true`, `disablePointerDismissal` forced `true`) — the `modal` and
 * `disablePointerDismissal` props are `Omit`ted from its type entirely, not
 * merely defaulted. Floor coverage: the destructive-confirm flow (the
 * canonical reason AlertDialog exists), the no-outside-press contract
 * (Esc still closes it — only outside-press is blocked), and a
 * required-acknowledgment form composition.
 *
 * Every story renders the complete `Portal > Backdrop > Popup` subtree,
 * identical to Dialog (AlertDialog re-exports Dialog's parts verbatim).
 */
const meta = {
  title: 'Overlays/Alert Dialog',
  component: AlertDialog.Root,
  subcomponents: {
    'AlertDialog.Trigger': AlertDialog.Trigger,
    'AlertDialog.Portal': AlertDialog.Portal,
    'AlertDialog.Backdrop': AlertDialog.Backdrop,
    'AlertDialog.Popup': AlertDialog.Popup,
    'AlertDialog.Title': AlertDialog.Title,
    'AlertDialog.Description': AlertDialog.Description,
    'AlertDialog.Close': AlertDialog.Close,
  },
} satisfies Meta<typeof AlertDialog.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Hero: the destructive-confirm flow                                  */
/* ------------------------------------------------------------------ */

function HeroExample() {
  const [status, setStatus] = React.useState('idle');
  return (
    <div className="AlertDialogStack">
      <AlertDialog.Root>
        <AlertDialog.Trigger className={theme.Button}>Discard draft</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={theme.DialogBackdrop} />
          <AlertDialog.Popup className={theme.DialogPopup}>
            <div className="AlertDialogIntro">
              <AlertDialog.Title className={theme.DialogTitle}>Discard draft?</AlertDialog.Title>
              <AlertDialog.Description className={theme.DialogDescription}>
                You can&apos;t undo this action.
              </AlertDialog.Description>
            </div>
            <div className={theme.DialogActions}>
              <AlertDialog.Close className={theme.Button}>Cancel</AlertDialog.Close>
              <AlertDialog.Close
                data-color="red"
                className={theme.Button}
                onClick={() => setStatus('discarded')}
              >
                Discard
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <output className="AlertDialogOutput">status: {status}</output>
    </div>
  );
}

/**
 * The docs hero demo, made interactive: "Discard draft?" is the canonical
 * reason AlertDialog exists — a decision the user cannot escape by clicking
 * outside. `role="alertdialog"` and `aria-labelledby`/`aria-describedby` are
 * wired automatically from Title/Description.
 */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => <HeroExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Discard draft' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');

    await userEvent.click(trigger);
    const dialog = await body.findByRole('alertdialog');
    await expect(dialog).toHaveAttribute('aria-labelledby');
    await expect(dialog).toHaveAttribute('aria-describedby');
    // waitFor: popups are briefly at opacity 0 during their entrance transition.
    await waitFor(() => expect(dialog).toBeVisible());

    await userEvent.click(within(dialog).getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(canvas.getByText('status: discarded')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* No-outside-press dismissal (hard-coded contract)                    */
/* ------------------------------------------------------------------ */

function NoOutsidePressExample() {
  const [log, setLog] = React.useState<string[]>([]);
  return (
    <div className="AlertDialogStack">
      <AlertDialog.Root
        onOpenChange={(open, eventDetails) => {
          if (!open) {
            setLog((entries) => [...entries, `closed via ${eventDetails.reason}`]);
          }
        }}
      >
        <AlertDialog.Trigger className={theme.Button}>Delete project</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={theme.DialogBackdrop} data-testid="backdrop" />
          <AlertDialog.Popup className={theme.DialogPopup}>
            <div className="AlertDialogIntro">
              <AlertDialog.Title className={theme.DialogTitle}>Delete project?</AlertDialog.Title>
              <AlertDialog.Description className={theme.DialogDescription}>
                Clicking outside does not close this dialog — only an explicit choice or Esc does.
              </AlertDialog.Description>
            </div>
            <div className={theme.DialogActions}>
              <AlertDialog.Close className={theme.Button}>Cancel</AlertDialog.Close>
              <AlertDialog.Close data-color="red" className={theme.Button}>
                Delete
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <output className="AlertDialogOutput">
        {log.length > 0 ? log.join(', ') : 'no dismissal attempt yet'}
      </output>
    </div>
  );
}

/**
 * `disablePointerDismissal` is permanently `true` for AlertDialog — it cannot
 * be overridden, since the prop is `Omit`ted from the type entirely. Clicking
 * the backdrop is a documented no-op; only `AlertDialog.Close` or Esc leave
 * the dialog (Esc is deliberately *not* part of the lockdown — see
 * `useDialogRoot.ts`'s `escapeKey: isTopmost` gate, which has no
 * `disablePointerDismissal` check).
 */
export const NoOutsidePressDismissal: Story = {
  tags: ['highlight'],
  render: () => <NoOutsidePressExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Delete project' }));
    const dialog = await body.findByRole('alertdialog');
    // waitFor: the popup is briefly at opacity 0 during its entrance transition.
    await waitFor(() => expect(dialog).toBeVisible());

    // Outside press via the backdrop is ignored — the hard-coded contract.
    await userEvent.click(body.getByTestId('backdrop'));
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(dialog).toHaveAttribute('data-open');
    await expect(canvas.getByText('no dismissal attempt yet')).toBeVisible();

    // Esc is NOT blocked by the pointer-dismissal lockdown — it still closes.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(await canvas.findByText('closed via escape-key')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Required-acknowledgment form composition                            */
/* ------------------------------------------------------------------ */

const CONFIRM_PHRASE = 'delete my account';

function FormWithConfirmationExample() {
  const [phrase, setPhrase] = React.useState('');
  const [deleted, setDeleted] = React.useState(false);
  const confirmed = phrase === CONFIRM_PHRASE;

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className={theme.Button}>Delete account</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={theme.DialogBackdrop} />
        <AlertDialog.Popup className={theme.DialogPopup}>
          <div className="AlertDialogIntro">
            <AlertDialog.Title className={theme.DialogTitle}>Delete account?</AlertDialog.Title>
            <AlertDialog.Description className={theme.DialogDescription}>
              Type &quot;{CONFIRM_PHRASE}&quot; to confirm. This cannot be undone.
            </AlertDialog.Description>
          </div>
          <div className={theme.FormRoot}>
            <div className={theme.FieldRoot}>
              <label className={theme.FieldLabel} htmlFor="confirm-phrase">
                Confirmation phrase
              </label>
              <input
                id="confirm-phrase"
                className={theme.Input}
                value={phrase}
                onChange={(event) => setPhrase(event.target.value)}
              />
            </div>
          </div>
          <div className={theme.DialogActions}>
            <AlertDialog.Close className={theme.Button}>Cancel</AlertDialog.Close>
            <AlertDialog.Close
              data-color="red"
              className={theme.Button}
              disabled={!confirmed}
              onClick={() => setDeleted(true)}
            >
              Delete account
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
      {deleted ? <output className="AlertDialogOutput">account deleted</output> : null}
    </AlertDialog.Root>
  );
}

/**
 * A required-acknowledgment prompt: the destructive `AlertDialog.Close` stays
 * disabled until the user types an exact confirmation phrase — validation is
 * composed in userland, AlertDialog has no built-in equivalent.
 */
export const FormWithConfirmation: Story = {
  tags: ['highlight'],
  render: () => <FormWithConfirmationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Delete account' }));
    const dialog = await body.findByRole('alertdialog');
    const input = within(dialog).getByLabelText('Confirmation phrase');
    const deleteButton = within(dialog).getByRole('button', { name: 'Delete account' });
    await waitFor(() => expect(deleteButton).toBeDisabled());

    await userEvent.type(input, 'wrong phrase');
    await expect(deleteButton).toBeDisabled();

    await userEvent.clear(input);
    await userEvent.type(input, CONFIRM_PHRASE);
    await waitFor(() => expect(deleteButton).toBeEnabled());

    await userEvent.click(deleteButton);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(await canvas.findByText('account deleted')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Cross-type nesting: AlertDialog inside a Dialog                     */
/* ------------------------------------------------------------------ */

function NestedCloseConfirmationExample() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [name, setName] = React.useState('');

  return (
    <Dialog.Root
      open={dialogOpen}
      onOpenChange={(open) => {
        if (!open && name.trim() !== '') {
          setConfirmOpen(true);
        } else {
          setDialogOpen(open);
        }
      }}
    >
      <Dialog.Trigger className={theme.Button}>Edit profile</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={theme.DialogBackdrop} />
        <Dialog.Popup className={theme.DialogPopup}>
          <div className="AlertDialogIntro">
            <Dialog.Title className={theme.DialogTitle}>Edit profile</Dialog.Title>
          </div>
          <div className={theme.FieldRoot}>
            <label className={theme.FieldLabel} htmlFor="profile-name">
              Name
            </label>
            <input
              id="profile-name"
              className={theme.Input}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className={theme.DialogActions}>
            <Dialog.Close className={theme.Button}>Close</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>

      {/* Nested AlertDialog: a controlled confirmation for the parent Dialog's close request. */}
      <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={theme.DialogBackdrop} />
          <AlertDialog.Popup className={theme.DialogPopup}>
            <div className="AlertDialogIntro">
              <AlertDialog.Title className={theme.DialogTitle}>Discard changes?</AlertDialog.Title>
              <AlertDialog.Description className={theme.DialogDescription}>
                Your edits to &quot;{name}&quot; have not been saved.
              </AlertDialog.Description>
            </div>
            <div className={theme.DialogActions}>
              <AlertDialog.Close className={theme.Button}>Keep editing</AlertDialog.Close>
              <AlertDialog.Close
                data-color="red"
                className={theme.Button}
                onClick={() => {
                  setName('');
                  setDialogOpen(false);
                }}
              >
                Discard
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </Dialog.Root>
  );
}

/**
 * Cross-type nesting: a regular, dismissible `Dialog.Root` for the main "Edit
 * profile" flow, guarded by a controlled `AlertDialog.Root` that opens if the
 * user tries to close a dirty form (the docs' "Close confirmation" pattern,
 * recreated here as its own AlertDialog-focused story). The nested AlertDialog
 * still counts toward the parent's `[data-nested-dialog-open]` machinery even
 * though it's a different component type.
 */
export const NestedCloseConfirmation: Story = {
  tags: ['highlight'],
  render: () => <NestedCloseConfirmationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Edit profile' }));
    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());

    await userEvent.type(within(dialog).getByLabelText('Name'), 'Jane');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    const alert = await body.findByRole('alertdialog');
    await waitFor(() => expect(alert).toBeVisible());
    await expect(dialog).toBeInTheDocument();
    await expect(
      within(alert).getByText('Your edits to "Jane" have not been saved.'),
    ).toBeVisible();

    await userEvent.click(within(alert).getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(alert).not.toBeInTheDocument());
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Controlled mode: no Trigger, external open/close                    */
/* ------------------------------------------------------------------ */

function ControlledModeExample() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="AlertDialogStack">
      <div className="AlertDialogRow">
        <button type="button" className={theme.Button} onClick={() => setOpen(true)}>
          Log out externally
        </button>
        <output className="AlertDialogOutput">open: {String(open)}</output>
      </div>
      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={theme.DialogBackdrop} />
          <AlertDialog.Popup className={theme.DialogPopup}>
            <div className="AlertDialogIntro">
              <AlertDialog.Title className={theme.DialogTitle}>Log out?</AlertDialog.Title>
              <AlertDialog.Description className={theme.DialogDescription}>
                Controlled entirely by external state — no `AlertDialog.Trigger` renders here.
              </AlertDialog.Description>
            </div>
            <div className={theme.DialogActions}>
              <AlertDialog.Close className={theme.Button}>Stay signed in</AlertDialog.Close>
              <AlertDialog.Close data-color="red" className={theme.Button}>
                Log out
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}

/**
 * Fully controlled `open`/`onOpenChange` with no `AlertDialog.Trigger` at
 * all — any external event (here, a plain button) can drive `open`, and
 * `Close` still participates in `onOpenChange` like normal.
 */
export const ControlledMode: Story = {
  tags: ['highlight'],
  render: () => <ControlledModeExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await expect(canvas.getByText('open: false')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Log out externally' }));

    const dialog = await body.findByRole('alertdialog');
    await waitFor(() => expect(dialog).toBeVisible());
    await waitFor(() => expect(canvas.getByText('open: true')).toBeVisible());

    await userEvent.click(within(dialog).getByRole('button', { name: 'Log out' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await waitFor(() => expect(canvas.getByText('open: false')).toBeVisible());
  },
};

/* ------------------------------------------------------------------ */
/* Trigger from a Menu item                                            */
/* ------------------------------------------------------------------ */

function TriggerFromMenuExample() {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <Menu.Root>
        <Menu.Trigger className={theme.Button}>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={theme.MenuPositioner} sideOffset={4}>
            <Menu.Popup className={theme.MenuPopup}>
              <Menu.Item className={theme.MenuItem} onClick={() => setOpen(true)}>
                Delete project…
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={theme.DialogBackdrop} />
          <AlertDialog.Popup className={theme.DialogPopup}>
            <div className="AlertDialogIntro">
              <AlertDialog.Title className={theme.DialogTitle}>Delete project?</AlertDialog.Title>
              <AlertDialog.Description className={theme.DialogDescription}>
                Opened from a Menu.Item&apos;s onClick, not an AlertDialog.Trigger — the same
                composition Dialog documents for itself.
              </AlertDialog.Description>
            </div>
            <div className={theme.DialogActions}>
              <AlertDialog.Close className={theme.Button}>Cancel</AlertDialog.Close>
              <AlertDialog.Close data-color="red" className={theme.Button}>
                Delete
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </React.Fragment>
  );
}

/**
 * Opening an AlertDialog from a `Menu.Item`'s `onClick` — a documented
 * composition (Dialog's "Open from a menu" pattern, identical for
 * AlertDialog): the menu closes on item press, then the controlled
 * AlertDialog opens.
 */
export const TriggerFromMenu: Story = {
  tags: ['highlight'],
  render: () => <TriggerFromMenuExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }));
    const menu = await body.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());

    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Delete project…' }));
    const dialog = await body.findByRole('alertdialog');
    await waitFor(() => expect(dialog).toBeVisible());

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Exit animation                                                       */
/* ------------------------------------------------------------------ */

function ExitAnimationExample() {
  const [settled, setSettled] = React.useState('none yet');
  return (
    <div className="AlertDialogStack">
      <AlertDialog.Root onOpenChangeComplete={(open) => setSettled(open ? 'open' : 'closed')}>
        <AlertDialog.Trigger className={theme.Button}>Open animated</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={theme.DialogBackdrop} />
          <AlertDialog.Popup className={theme.DialogPopup}>
            <div className="AlertDialogIntro">
              <AlertDialog.Title className={theme.DialogTitle}>Animated alert</AlertDialog.Title>
              <AlertDialog.Description className={theme.DialogDescription}>
                CSS transitions drive both entry and exit via `data-starting-style`/
                `data-ending-style`.
              </AlertDialog.Description>
            </div>
            <div className={theme.DialogActions}>
              <AlertDialog.Close className={theme.Button}>Close</AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <output className="AlertDialogOutput">animation settled: {settled}</output>
    </div>
  );
}

/**
 * `onOpenChangeComplete` fires once a CSS transition genuinely finishes — the
 * popup stays mounted through the exit transition, only unmounting (and
 * firing `onOpenChangeComplete(false)`) once it ends.
 */
export const ExitAnimation: Story = {
  tags: ['animation'],
  render: () => <ExitAnimationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open animated' }));
    const dialog = await body.findByRole('alertdialog');
    await waitFor(() => expect(dialog).toBeVisible());
    await waitFor(() => expect(canvas.getByText('animation settled: open')).toBeVisible());

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await waitFor(() => expect(canvas.getByText('animation settled: closed')).toBeVisible());
  },
};

/* ------------------------------------------------------------------ */
/* Custom render composition                                           */
/* ------------------------------------------------------------------ */

function CustomTriggerButton({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      data-testid="custom-trigger"
      className={className ?? theme.Button}
      {...props}
    >
      <TrashIcon /> Delete item
    </button>
  );
}

function CustomRenderCompositionExample() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger render={<CustomTriggerButton className={theme.Button} />} />
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={theme.DialogBackdrop} />
        <AlertDialog.Popup
          className={theme.DialogPopup}
          render={(props, state) => (
            <section
              {...props}
              data-testid="custom-popup-element"
              data-nested={state.nested || undefined}
            />
          )}
        >
          <div className="AlertDialogIntro">
            <AlertDialog.Title className={theme.DialogTitle}>Delete item?</AlertDialog.Title>
            <AlertDialog.Description className={theme.DialogDescription}>
              The Trigger renders through a custom button component, and the Popup renders as a
              native &lt;section&gt; instead of a &lt;div&gt; — both via the `render` prop.
            </AlertDialog.Description>
          </div>
          <div className={theme.DialogActions}>
            <AlertDialog.Close className={theme.Button}>Cancel</AlertDialog.Close>
            <AlertDialog.Close data-color="red" className={theme.Button}>
              Delete
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/**
 * `render` composes both the Trigger (a custom button component) and the
 * Popup (a native `<section>` instead of the default `<div>`) while every
 * AlertDialog behavior — `role="alertdialog"`, focus trap, no outside-press
 * dismissal — is preserved unchanged.
 */
export const CustomRenderComposition: Story = {
  tags: ['highlight'],
  render: () => <CustomRenderCompositionExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByTestId('custom-trigger');
    await expect(trigger.tagName).toBe('BUTTON');

    await userEvent.click(trigger);
    const popup = await body.findByTestId('custom-popup-element');
    await waitFor(() => expect(popup).toBeVisible());
    await expect(popup.tagName).toBe('SECTION');
    await expect(popup).toHaveAttribute('role', 'alertdialog');

    await userEvent.click(within(popup).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(popup).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Esc closes and returns focus to the trigger                         */
/* ------------------------------------------------------------------ */

function EscFocusReturnExample() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className={theme.Button}>Sign out</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={theme.DialogBackdrop} />
        <AlertDialog.Popup className={theme.DialogPopup}>
          <div className="AlertDialogIntro">
            <AlertDialog.Title className={theme.DialogTitle}>Sign out?</AlertDialog.Title>
            <AlertDialog.Description className={theme.DialogDescription}>
              Press Escape to close — focus returns to the trigger that opened this dialog.
            </AlertDialog.Description>
          </div>
          <div className={theme.DialogActions}>
            <AlertDialog.Close className={theme.Button}>Cancel</AlertDialog.Close>
            <AlertDialog.Close data-color="red" className={theme.Button}>
              Sign out
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/**
 * Esc is the one dismissal path still open (outside-press is permanently
 * blocked) — closing via Esc restores focus to the Trigger that opened the
 * dialog, the same `FloatingFocusManager` behavior Dialog relies on.
 */
export const EscFocusReturn: Story = {
  tags: ['tests'],
  render: () => <EscFocusReturnExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Sign out' });

    await userEvent.click(trigger);
    const dialog = await body.findByRole('alertdialog');
    await waitFor(() => expect(dialog).toBeVisible());

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/* ------------------------------------------------------------------ */
/* Handle + payload reused across many triggers                        */
/* ------------------------------------------------------------------ */

const deleteRowDialog = AlertDialog.createHandle<string>();

function HandleWithPayloadExample() {
  const [rows, setRows] = React.useState(['Marketing plan', 'Budget draft', 'Team roster']);
  return (
    <div className="AlertDialogStack">
      <ul className="AlertDialogList">
        {rows.map((row) => (
          <li key={row} className="AlertDialogRow">
            <span>{row}</span>
            <AlertDialog.Trigger className={theme.Button} handle={deleteRowDialog} payload={row}>
              Delete
            </AlertDialog.Trigger>
          </li>
        ))}
      </ul>
      <AlertDialog.Root handle={deleteRowDialog}>
        {({ payload }) => (
          <AlertDialog.Portal>
            <AlertDialog.Backdrop className={theme.DialogBackdrop} />
            <AlertDialog.Popup className={theme.DialogPopup}>
              <div className="AlertDialogIntro">
                <AlertDialog.Title className={theme.DialogTitle}>Delete row?</AlertDialog.Title>
                <AlertDialog.Description className={theme.DialogDescription}>
                  Delete &quot;{payload}&quot;?
                </AlertDialog.Description>
              </div>
              <div className={theme.DialogActions}>
                <AlertDialog.Close className={theme.Button}>Cancel</AlertDialog.Close>
                <AlertDialog.Close
                  data-color="red"
                  className={theme.Button}
                  onClick={() => {
                    if (payload !== undefined) {
                      setRows((current) => current.filter((entry) => entry !== payload));
                    }
                  }}
                >
                  Delete
                </AlertDialog.Close>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        )}
      </AlertDialog.Root>
    </div>
  );
}

/**
 * One `AlertDialog.createHandle<Payload>()` shared by many detached
 * triggers, each with its own `payload` — the "delete buttons throughout a
 * list" pattern named in the brief: a single confirmation instance reads
 * which row is being confirmed from the active trigger's payload.
 */
export const HandleWithPayload: Story = {
  tags: ['api-ref'],
  render: () => <HandleWithPayloadExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const deleteButtons = canvas.getAllByRole('button', { name: 'Delete' });

    await userEvent.click(deleteButtons[1]);
    const dialog = await body.findByRole('alertdialog');
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(within(dialog).getByText('Delete "Budget draft"?')).toBeVisible();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await waitFor(() => expect(canvas.queryByText('Budget draft')).not.toBeInTheDocument());
  },
};

function TrashIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path
        d="M3 4h10M6 4V2.5h4V4M4.5 4l.5 9.5h6l.5-9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Detached triggers: simple (docs demo)                                */
/* ------------------------------------------------------------------ */

const simpleAlertHandle = AlertDialog.createHandle();

/**
 * A `handle` connects a Trigger to a Root declared elsewhere in the tree, so the
 * confirmation markup lives in one place while the button that opens it can sit
 * anywhere.
 */
export const DetachedTriggersSimple: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <div className="AlertDialogStack">
      <AlertDialog.Trigger className={theme.Button} handle={simpleAlertHandle}>
        Discard draft
      </AlertDialog.Trigger>

      <AlertDialog.Root handle={simpleAlertHandle}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={theme.DialogBackdrop} />
          <AlertDialog.Viewport>
            <AlertDialog.Popup className={theme.DialogPopup}>
              <AlertDialog.Title className={theme.DialogTitle}>Discard draft?</AlertDialog.Title>
              <AlertDialog.Description className={theme.DialogDescription}>
                Your changes will be lost.
              </AlertDialog.Description>
              <div className={theme.DialogActions}>
                <AlertDialog.Close className={theme.Button}>Cancel</AlertDialog.Close>
                <AlertDialog.Close className={theme.Button}>Discard</AlertDialog.Close>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Discard draft' }));

    const dialog = await body.findByRole('alertdialog');
    await waitFor(() => expect(dialog).toBeVisible());

    await userEvent.click(body.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Detached triggers: controlled + payload (docs demo)                  */
/* ------------------------------------------------------------------ */

interface AlertPayload {
  message: string;
}

const controlledAlertHandle = AlertDialog.createHandle<AlertPayload>();

const ALERT_TRIGGERS: Array<[string, string, string]> = [
  ['alert-1', 'Discard draft', 'Discard draft?'],
  ['alert-2', 'Delete project', 'Delete project?'],
  ['alert-3', 'Sign out', 'Sign out?'],
];

function DetachedTriggersControlledExample() {
  const [open, setOpen] = React.useState(false);
  const [triggerId, setTriggerId] = React.useState<string | null>(null);

  return (
    <div className="AlertDialogStack">
      <div className="AlertDialogRow">
        {ALERT_TRIGGERS.map(([id, label, message]) => (
          <AlertDialog.Trigger
            key={id}
            id={id}
            className={theme.Button}
            handle={controlledAlertHandle}
            payload={{ message }}
          >
            {label}
          </AlertDialog.Trigger>
        ))}
      </div>

      <AlertDialog.Root
        handle={controlledAlertHandle}
        open={open}
        onOpenChange={(isOpen, eventDetails) => {
          setOpen(isOpen);
          setTriggerId(eventDetails.trigger?.id ?? null);
        }}
        triggerId={triggerId}
      >
        {({ payload }) => (
          <AlertDialog.Portal>
            <AlertDialog.Backdrop className={theme.DialogBackdrop} />
            <AlertDialog.Viewport>
              <AlertDialog.Popup className={theme.DialogPopup}>
                <AlertDialog.Title className={theme.DialogTitle}>
                  {payload?.message ?? 'Are you sure?'}
                </AlertDialog.Title>
                <AlertDialog.Description className={theme.DialogDescription}>
                  This action cannot be undone.
                </AlertDialog.Description>
                <div className={theme.DialogActions}>
                  <AlertDialog.Close className={theme.Button}>Cancel</AlertDialog.Close>
                  <AlertDialog.Close className={theme.Button}>Confirm</AlertDialog.Close>
                </div>
              </AlertDialog.Popup>
            </AlertDialog.Viewport>
          </AlertDialog.Portal>
        )}
      </AlertDialog.Root>
    </div>
  );
}

/**
 * One confirmation instance reused across a list of destructive actions: each
 * detached trigger supplies its own typed `payload`, and `open`/`triggerId`
 * keep the dialog under app control.
 */
export const DetachedTriggersControlled: Story = {
  tags: ['highlight', 'base'],
  render: () => <DetachedTriggersControlledExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Delete project' }));

    // The popup renders the payload of the trigger that opened it.
    await waitFor(() => expect(body.getByText('Delete project?')).toBeVisible());

    await userEvent.click(body.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
  },
};
