'use client';
import type * as React from 'react';
import { DialogPortal } from '../../dialog/portal/DialogPortal';
import type { FloatingPortal } from '../../floating-ui-react';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerPortal = DialogPortal as DrawerPortal;

export interface DrawerPortalState {}

export interface DrawerPortalProps extends FloatingPortal.Props<DrawerPortalState> {
  keepMounted?: boolean | undefined;
  container?: FloatingPortal.Props<DrawerPortalState>['container'] | undefined;
}

export interface DrawerPortal {
  (
    componentProps: DrawerPortalProps & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element | null;
}

export namespace DrawerPortal {
  export type Props = DrawerPortalProps;
  export type State = DrawerPortalState;
}
