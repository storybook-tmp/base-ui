import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import theme from '@droppy/theme';
import '../dialog.demo.css';

/**
 * Recreation of an edge-docked side panel: a fully controlled Dialog with no Trigger
 * (routes/app state open it), positioned against the viewport edge with a slide
 * transition and a form + footer actions. Recomposed from oxidecomputer/console
 * `SideModal.tsx`/`Modal.tsx` (MPL-2.0, code-ok,
 * research/d-real-world-usage/dialog/ranked.json #4).
 */
export function SidePanelExample() {
  const [open, setOpen] = React.useState(false);
  const [saved, setSaved] = React.useState<string | null>(null);
  const nameId = React.useId();
  return (
    <div className="DialogStack">
      {/* No Dialog.Trigger: app state opens the panel, oxide-console style. */}
      <button type="button" className={theme.Button} onClick={() => setOpen(true)}>
        Edit instance
      </button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className={theme.DialogBackdrop} />
          <Dialog.Popup className="DialogSheetPopup">
            <div className="DialogIntro">
              <Dialog.Title className={theme.DialogTitle}>Edit instance</Dialog.Title>
              <Dialog.Description className={theme.DialogDescription}>
                db-primary · us-east-1
              </Dialog.Description>
            </div>
            <form
              className="DialogSheetForm"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                setSaved(String(data.get('name')));
                setOpen(false);
              }}
            >
              <div className={theme.FieldRoot}>
                <label className={theme.FieldLabel} htmlFor={nameId}>
                  Instance name
                </label>
                <input id={nameId} name="name" defaultValue="db-primary" className={theme.Input} />
              </div>
              <div className="DialogSheetFooter">
                <Dialog.Close className="DialogGhostButton">Cancel</Dialog.Close>
                <button type="submit" className={theme.Button}>
                  Save changes
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      {saved !== null ? <output className="DialogOutput">Saved: {saved}</output> : null}
    </div>
  );
}
