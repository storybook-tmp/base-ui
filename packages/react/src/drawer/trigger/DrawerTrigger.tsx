'use client';
import type * as React from 'react';
import { DialogTrigger } from '../../dialog/trigger/DialogTrigger';
import type { DrawerHandle } from '../handle';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';

export const DrawerTrigger = DialogTrigger as DrawerTrigger;

export interface DrawerTrigger {
  <Payload>(
    componentProps: DrawerTriggerProps<Payload> & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
}

export interface DrawerTriggerProps<Payload = unknown>
  extends NativeButtonProps, BaseUIComponentProps<'button', DrawerTriggerState> {
  handle?: DrawerHandle<Payload> | undefined;
  payload?: Payload | undefined;
  id?: string | undefined;
}

export interface DrawerTriggerState {
  /**
   * Whether the trigger is currently disabled.
   */
  disabled: boolean;
  /**
   * Whether the drawer is currently open and was opened by this trigger.
   */
  open: boolean;
}

export namespace DrawerTrigger {
  export type Props<Payload = unknown> = DrawerTriggerProps<Payload>;
  export type State = DrawerTriggerState;
}
