'use client';
import type * as React from 'react';
import {
  DialogTrigger,
  type DialogTriggerProps,
  type DialogTriggerState,
} from '../../dialog/trigger/DialogTrigger';
import type { AlertDialogHandle } from '../handle';

export const AlertDialogTrigger = DialogTrigger as AlertDialogTrigger;

export interface AlertDialogTrigger {
  <Payload>(componentProps: AlertDialogTriggerProps<Payload>): React.JSX.Element;
}

export interface AlertDialogTriggerProps<Payload = unknown> extends Omit<
  DialogTriggerProps<Payload>,
  'handle'
> {
  handle?: AlertDialogHandle<Payload> | undefined;
}

export interface AlertDialogTriggerState extends DialogTriggerState {}

export namespace AlertDialogTrigger {
  export type Props<Payload = unknown> = AlertDialogTriggerProps<Payload>;
  export type State = AlertDialogTriggerState;
}
