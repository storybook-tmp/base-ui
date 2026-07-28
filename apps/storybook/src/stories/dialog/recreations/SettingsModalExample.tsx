import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import theme from '@droppy/theme';
import '../dialog.demo.css';
import { XIcon } from '../icons';

/**
 * Recreation of the canonical copy-paste wrapper: a `DialogContent`-style component
 * (Popup→Content, Backdrop→Overlay vocabulary) used here as a settings dialog with
 * sections. Recomposed from shadcn-ui/ui `apps/v4/registry/bases/base/ui/dialog.tsx`
 * (MIT, code-ok, research/d-real-world-usage/dialog/ranked.json #1).
 */

/**
 * Wrapper layer in the shadcn/ui style: one component hides the
 * `Portal > Backdrop > Popup` plumbing and always renders a corner X close button.
 */
function AppDialogContent({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className={theme.DialogBackdrop} />
      <Dialog.Popup className={theme.DialogPopup}>
        <div className="DialogIntro">
          <Dialog.Title className={theme.DialogTitle}>{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className={theme.DialogDescription}>
              {description}
            </Dialog.Description>
          ) : null}
        </div>
        {children}
        <Dialog.Close className="DialogCornerClose" aria-label="Close">
          <XIcon />
        </Dialog.Close>
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

export function SettingsModalExample() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className={theme.Button}>Open settings</Dialog.Trigger>
      <AppDialogContent title="Workspace settings" description="Changes apply immediately.">
        <div className="DialogSection">
          <h3 className="DialogSectionTitle">Appearance</h3>
          <p className="DialogSectionBody">Theme, density, and accent color.</p>
        </div>
        <div className="DialogSection">
          <h3 className="DialogSectionTitle">Notifications</h3>
          <p className="DialogSectionBody">Mentions, replies, and weekly digests.</p>
        </div>
        <div className={theme.DialogActions}>
          <Dialog.Close className={theme.Button}>Done</Dialog.Close>
        </div>
      </AppDialogContent>
    </Dialog.Root>
  );
}
