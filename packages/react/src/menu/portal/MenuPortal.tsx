'use client';
import * as React from 'react';
import { FloatingPortal } from '../../floating-ui-react';
import { useMenuRootContext } from '../root/MenuRootContext';
import { MenuPortalContext } from './MenuPortalContext';

export const MenuPortal = React.forwardRef(function MenuPortal(
  props: MenuPortal.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { keepMounted = false, ...portalProps } = props;

  const { store } = useMenuRootContext();
  const mounted = store.useState('mounted');

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <MenuPortalContext.Provider value={keepMounted}>
      <FloatingPortal ref={forwardedRef} {...portalProps} />
    </MenuPortalContext.Provider>
  );
});

export interface MenuPortalState {}

export interface MenuPortalProps extends FloatingPortal.Props<MenuPortalState> {
  /**
   * Whether to keep the portal mounted in the DOM while the popup is hidden.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace MenuPortal {
  export type State = MenuPortalState;
  export type Props = MenuPortalProps;
}
