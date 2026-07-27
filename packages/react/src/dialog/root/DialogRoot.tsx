'use client';
import * as React from 'react';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { DialogHandle } from '../store/DialogHandle';
import { type PayloadChildRenderFunction } from '../../utils/popups';
import { IsDrawerContext } from './DialogRootContext';
import { useRenderDialogRoot } from './useRenderDialogRoot';

/**
 * Groups all parts of the dialog.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogRoot<Payload>(props: DialogRoot.Props<Payload>) {
  const mode = React.useContext(IsDrawerContext) ? 'drawer' : 'dialog';
  return useRenderDialogRoot(props, mode);
}

export interface DialogRootState {}

export interface DialogRootProps<Payload = unknown> {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  modal?: boolean | 'trap-focus' | undefined;
  onOpenChange?: ((open: boolean, eventDetails: DialogRoot.ChangeEventDetails) => void) | undefined;
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  disablePointerDismissal?: boolean | undefined;
  actionsRef?: React.RefObject<DialogRoot.Actions | null> | undefined;
  handle?: DialogHandle<Payload> | undefined;
  children?: React.ReactNode | PayloadChildRenderFunction<Payload>;
  triggerId?: string | null | undefined;
  defaultTriggerId?: string | null | undefined;
}

export interface DialogRootActions {
  unmount: () => void;
  close: () => void;
}

export type DialogRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.closePress
  | typeof REASONS.focusOut
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type DialogRootChangeEventDetails =
  BaseUIChangeEventDetails<DialogRoot.ChangeEventReason> & {
    preventUnmountOnClose(): void;
  };

export namespace DialogRoot {
  export type State = DialogRootState;
  export type Props<Payload = unknown> = DialogRootProps<Payload>;
  export type Actions = DialogRootActions;
  export type ChangeEventReason = DialogRootChangeEventReason;
  export type ChangeEventDetails = DialogRootChangeEventDetails;
}
