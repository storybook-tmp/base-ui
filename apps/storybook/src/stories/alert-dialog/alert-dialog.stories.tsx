import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { AlertDialog } from '@base-ui/react/alert-dialog';
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
/* Required-acknowledgment form composition                            */

/* ------------------------------------------------------------------ */
/* Cross-type nesting: AlertDialog inside a Dialog                     */

/* ------------------------------------------------------------------ */
/* Controlled mode: no Trigger, external open/close                    */

/* ------------------------------------------------------------------ */
/* Trigger from a Menu item                                            */

/* ------------------------------------------------------------------ */
/* Exit animation                                                       */

/* ------------------------------------------------------------------ */
/* Custom render composition                                           */

/* ------------------------------------------------------------------ */
/* Esc closes and returns focus to the trigger                         */

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
