'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import type { AvatarRootState } from '../root/AvatarRoot';
import { avatarStateAttributesMapping } from '../root/stateAttributesMapping';

export const AvatarFallback = React.forwardRef(function AvatarFallback(
  componentProps: AvatarFallback.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, delay = 0, style, ...elementProps } = componentProps;

  const { imageLoadingStatus } = useAvatarRootContext();
  const [delayPassed, setDelayPassed] = React.useState(delay === 0);
  const timeout = useTimeout();

  React.useEffect(() => {
    if (delay > 0) {
      timeout.start(delay, () => setDelayPassed(true));
    } else {
      // Once the fallback is shown without a delay, keep it visible. Otherwise a later
      // change from no delay to a number would re-hide an already-visible fallback.
      setDelayPassed(true);
    }
    return timeout.clear;
  }, [timeout, delay]);

  const state: AvatarFallbackState = {
    imageLoadingStatus,
  };

  const element = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: avatarStateAttributesMapping,
    enabled: imageLoadingStatus !== 'loaded' && (delay === 0 || delayPassed),
  });

  return element;
});

export interface AvatarFallbackState extends AvatarRootState {}

export interface AvatarFallbackProps extends BaseUIComponentProps<'span', AvatarFallbackState> {
  delay?: number | undefined;
}

export namespace AvatarFallback {
  export type State = AvatarFallbackState;
  export type Props = AvatarFallbackProps;
}
