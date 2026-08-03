'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import type { RadioRootState } from '../root/RadioRoot';
import { useRadioRootContext } from '../root/RadioRootContext';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { type TransitionStatus, useTransitionStatus } from '../../internals/useTransitionStatus';

export const RadioIndicator = React.forwardRef(function RadioIndicator(
  componentProps: RadioIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, style, keepMounted = false, ...elementProps } = componentProps;

  const rootState = useRadioRootContext();

  const rendered = rootState.checked;

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(rendered);

  const state: RadioIndicatorState = {
    ...rootState,
    transitionStatus,
  };

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);

  const shouldRender = keepMounted || mounted;

  const element = useRenderElement('span', componentProps, {
    ref: [forwardedRef, indicatorRef],
    state,
    props: elementProps,
    stateAttributesMapping,
  });

  useOpenChangeComplete({
    open: rendered,
    ref: indicatorRef,
    onComplete() {
      if (!rendered) {
        setMounted(false);
      }
    },
  });

  if (!shouldRender) {
    return null;
  }

  return element;
});

export interface RadioIndicatorProps extends BaseUIComponentProps<'span', RadioIndicatorState> {
  keepMounted?: boolean | undefined;
}

export interface RadioIndicatorState extends RadioRootState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export namespace RadioIndicator {
  export type Props = RadioIndicatorProps;
  export type State = RadioIndicatorState;
}
