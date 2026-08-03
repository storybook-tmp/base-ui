'use client';
import type * as React from 'react';
import { DialogPortal } from '../../dialog/portal/DialogPortal';
import type { FloatingPortal } from '../../floating-ui-react';

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
