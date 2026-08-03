'use client';
import * as React from 'react';
import { FloatingPortal } from '../../floating-ui-react';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { PopoverPortalContext } from './PopoverPortalContext';

export const PopoverPortal = React.forwardRef(function PopoverPortal(
  props: PopoverPortal.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { keepMounted = false, ...portalProps } = props;

  const { store } = usePopoverRootContext();
  const mounted = store.useState('mounted');

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <PopoverPortalContext.Provider value={keepMounted}>
      <FloatingPortal ref={forwardedRef} {...portalProps} />
    </PopoverPortalContext.Provider>
  );
});

export interface PopoverPortalState {}

export interface PopoverPortalProps extends FloatingPortal.Props<PopoverPortalState> {
  keepMounted?: boolean | undefined;
}

export namespace PopoverPortal {
  export type State = PopoverPortalState;
  export type Props = PopoverPortalProps;
}
