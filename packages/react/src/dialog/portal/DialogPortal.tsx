'use client';
import * as React from 'react';
import { inertValue } from '@base-ui/utils/inertValue';
import { FloatingPortal } from '../../floating-ui-react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { DialogPortalContext } from './DialogPortalContext';
import { InternalBackdrop } from '../../utils/InternalBackdrop';

export const DialogPortal = React.forwardRef(function DialogPortal(
  props: DialogPortal.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { keepMounted = false, ...portalProps } = props;

  const { store } = useDialogRootContext();
  const mounted = store.useState('mounted');
  const modal = store.useState('modal');
  const open = store.useState('open');

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <DialogPortalContext.Provider value={keepMounted}>
      <FloatingPortal ref={forwardedRef} {...portalProps}>
        {mounted && modal === true && (
          <InternalBackdrop ref={store.context.internalBackdropRef} inert={inertValue(!open)} />
        )}
        {props.children}
      </FloatingPortal>
    </DialogPortalContext.Provider>
  );
});

export interface DialogPortalState {}

export interface DialogPortalProps extends FloatingPortal.Props<DialogPortalState> {
  keepMounted?: boolean | undefined;
  container?: FloatingPortal.Props<DialogPortalState>['container'] | undefined;
}

export namespace DialogPortal {
  export type State = DialogPortalState;
  export type Props = DialogPortalProps;
}
