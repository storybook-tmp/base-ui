'use client';
import * as React from 'react';
import { SelectScrollArrow } from '../scroll-arrow/SelectScrollArrow';
import type { BaseUIComponentProps } from '../../internals/types';

/**
 * An element that scrolls the select popup down when hovered. Does not render when using touch input.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
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
