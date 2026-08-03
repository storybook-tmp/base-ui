'use client';
import * as React from 'react';
import { FloatingPortal } from '../../floating-ui-react';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import { NavigationMenuPortalContext } from './NavigationMenuPortalContext';

export const NavigationMenuPortal = React.forwardRef(function NavigationMenuPortal(
  props: NavigationMenuPortal.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { keepMounted = false, ...portalProps } = props;

  const { mounted } = useNavigationMenuRootContext();

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <NavigationMenuPortalContext.Provider value={keepMounted}>
      <FloatingPortal ref={forwardedRef} {...portalProps} />
    </NavigationMenuPortalContext.Provider>
  );
});

export interface NavigationMenuPortalState {}

export interface NavigationMenuPortalProps extends FloatingPortal.Props<NavigationMenuPortalState> {
  keepMounted?: boolean | undefined;
  container?: FloatingPortal.Props<NavigationMenuPortalState>['container'] | undefined;
}

export namespace NavigationMenuPortal {
  export type State = NavigationMenuPortalState;
  export type Props = NavigationMenuPortalProps;
}
