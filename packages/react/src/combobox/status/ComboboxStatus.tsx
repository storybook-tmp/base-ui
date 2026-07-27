'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useInitialLiveRegionTextMutation } from '../utils/useInitialLiveRegionTextMutation';

export const ComboboxStatus = React.forwardRef(function ComboboxStatus(
  componentProps: ComboboxStatus.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, children: childrenProp, ...elementProps } = componentProps;

  const statusRef = useInitialLiveRegionTextMutation<HTMLDivElement>();

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, statusRef],
    props: [
      {
        children: childrenProp,
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': true,
      },
      elementProps,
    ],
  });
});

export interface ComboboxStatusState {}

export interface ComboboxStatusProps extends BaseUIComponentProps<'div', ComboboxStatusState> {}

export namespace ComboboxStatus {
  export type State = ComboboxStatusState;
  export type Props = ComboboxStatusProps;
}
