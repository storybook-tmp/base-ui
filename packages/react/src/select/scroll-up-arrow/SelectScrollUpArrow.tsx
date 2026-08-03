'use client';
import * as React from 'react';
import { SelectScrollArrow } from '../scroll-arrow/SelectScrollArrow';
import type { BaseUIComponentProps } from '../../internals/types';

export const SelectScrollUpArrow = React.forwardRef(function SelectScrollUpArrow(
  props: SelectScrollUpArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return <SelectScrollArrow {...props} ref={forwardedRef} direction="up" />;
});

export interface SelectScrollUpArrowState {}

export interface SelectScrollUpArrowProps extends BaseUIComponentProps<
  'div',
  SelectScrollUpArrowState
> {
  keepMounted?: boolean | undefined;
}

export namespace SelectScrollUpArrow {
  export type State = SelectScrollUpArrowState;
  export type Props = SelectScrollUpArrowProps;
}
