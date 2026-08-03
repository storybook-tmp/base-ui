'use client';
import * as React from 'react';
import { SelectScrollArrow } from '../scroll-arrow/SelectScrollArrow';
import type { BaseUIComponentProps } from '../../internals/types';

export const SelectScrollDownArrow = React.forwardRef(function SelectScrollDownArrow(
  props: SelectScrollDownArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return <SelectScrollArrow {...props} ref={forwardedRef} direction="down" />;
});

export interface SelectScrollDownArrowState {}

export interface SelectScrollDownArrowProps extends BaseUIComponentProps<
  'div',
  SelectScrollDownArrowState
> {
  keepMounted?: boolean | undefined;
}

export namespace SelectScrollDownArrow {
  export type State = SelectScrollDownArrowState;
  export type Props = SelectScrollDownArrowProps;
}
