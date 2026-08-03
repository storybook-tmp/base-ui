'use client';
import { FloatingPortalLite } from '../../utils/FloatingPortalLite';

export const ToastPortal = FloatingPortalLite;

export interface ToastPortalState {}

export interface ToastPortalProps extends FloatingPortalLite.Props<ToastPortalState> {}

export namespace ToastPortal {
  export type State = ToastPortalState;
  export type Props = ToastPortalProps;
}
