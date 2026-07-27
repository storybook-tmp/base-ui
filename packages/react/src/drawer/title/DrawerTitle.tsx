'use client';
import type * as React from 'react';
import { DialogTitle } from '../../dialog/title/DialogTitle';
import type { BaseUIComponentProps } from '../../internals/types';

export const DrawerTitle = DialogTitle as DrawerTitle;

export interface DrawerTitleProps extends BaseUIComponentProps<'h2', DrawerTitleState> {}

export interface DrawerTitleState {}

export interface DrawerTitle {
  (componentProps: DrawerTitleProps): React.JSX.Element;
}

export namespace DrawerTitle {
  export type Props = DrawerTitleProps;
  export type State = DrawerTitleState;
}
