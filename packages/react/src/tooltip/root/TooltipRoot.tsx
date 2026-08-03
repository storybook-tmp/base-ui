'use client';
import * as React from 'react';
import { fastComponent } from '@base-ui/utils/fastHooks';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { TooltipRootContext } from './TooltipRootContext';
import { useClientPoint, useDismiss } from '../../floating-ui-react';
import {
  type BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../internals/createBaseUIEventDetails';
import {
  FOCUSABLE_POPUP_PROPS,
  useImplicitActiveTrigger,
  usePopupRootStore,
  useOpenStateTransitions,
  usePopupInteractionProps,
  type PayloadChildRenderFunction,
} from '../../utils/popups';
import { mergeProps } from '../../merge-props';
import { TooltipStore } from '../store/TooltipStore';
import { type TooltipHandle } from '../store/TooltipHandle';
import { REASONS } from '../../internals/reasons';

export const TooltipRoot = fastComponent(function TooltipRoot<Payload>(
  props: TooltipRoot.Props<Payload>,
) {
  const {
    disabled = false,
    defaultOpen = false,
    open: openProp,
    disableHoverablePopup = false,
    trackCursorAxis = 'none',
    actionsRef,
    onOpenChange,
    onOpenChangeComplete,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null,
    children,
  } = props;

  const store = usePopupRootStore(
    handle,
    (floatingId, nested) =>
      new TooltipStore<Payload>(
        {
          open: defaultOpen,
          openProp,
          activeTriggerId: defaultTriggerIdProp,
          triggerIdProp,
        },
        floatingId,
        nested,
      ),
  );

  store.useControlledProp('openProp', openProp);
  store.useControlledProp('triggerIdProp', triggerIdProp);

  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  const openState = store.useState('open');
  const open = !disabled && openState;

  const activeTriggerId = store.useState('activeTriggerId');
  const mounted = store.useState('mounted');
  const payload = store.useState('payload') as Payload | undefined;

  store.useSyncedValues({
    trackCursorAxis,
    disableHoverablePopup,
  });

  store.useSyncedValue('disabled', disabled);

  useImplicitActiveTrigger(store, { closeOnActiveTriggerUnmount: true });
  const { forceUnmount, transitionStatus } = useOpenStateTransitions(open, store);
  const isInstantPhase = store.useState('isInstantPhase');
  const instantType = store.useState('instantType');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');

  // Animations should be instant in two cases:
  // 1) Opening during the provider's instant phase (adjacent tooltip opens instantly)
  // 2) Closing because another tooltip opened (reason === 'none')
  // Otherwise, allow the animation to play. In particular, do not disable animations
  // during the 'ending' phase unless it's due to a sibling opening.
  const previousInstantTypeRef = React.useRef<string | undefined | null>(null);

  useIsoLayoutEffect(() => {
    if (openState && disabled) {
      store.setOpen(false, createChangeEventDetails(REASONS.disabled));
    }
  }, [openState, disabled, store]);

  useIsoLayoutEffect(() => {
    if (
      (transitionStatus === 'ending' && lastOpenChangeReason === REASONS.none) ||
      (transitionStatus !== 'ending' && isInstantPhase)
    ) {
      // Capture the current instant type so we can restore it later
      // and set to 'delay' to disable animations while moving from one trigger to another
      // within a delay group.
      if (instantType !== 'delay') {
        previousInstantTypeRef.current = instantType;
      }
      store.set('instantType', 'delay');
    } else if (previousInstantTypeRef.current !== null) {
      store.set('instantType', previousInstantTypeRef.current);
      previousInstantTypeRef.current = null;
    }
  }, [transitionStatus, isInstantPhase, lastOpenChangeReason, instantType, store]);

  useIsoLayoutEffect(() => {
    if (open) {
      if (activeTriggerId == null) {
        store.set('payload', undefined);
      }
    }
  }, [store, activeTriggerId, open]);

  const handleImperativeClose = React.useCallback(() => {
    store.setOpen(false, createChangeEventDetails(REASONS.imperativeAction));
  }, [store]);

  React.useImperativeHandle(
    actionsRef,
    () => ({ unmount: forceUnmount, close: handleImperativeClose }),
    [forceUnmount, handleImperativeClose],
  );

  const shouldRenderInteractions = open || mounted || (!disabled && trackCursorAxis !== 'none');

  return (
    <TooltipRootContext.Provider value={store as TooltipRootContext}>
      {shouldRenderInteractions && (
        <TooltipInteractions store={store} disabled={disabled} trackCursorAxis={trackCursorAxis} />
      )}
      {typeof children === 'function' ? children({ payload }) : children}
    </TooltipRootContext.Provider>
  );
});

export interface TooltipRootState {}

export interface TooltipRootProps<Payload = unknown> {
  defaultOpen?: boolean | undefined;
  open?: boolean | undefined;
  onOpenChange?:
    | ((open: boolean, eventDetails: TooltipRoot.ChangeEventDetails) => void)
    | undefined;
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  disableHoverablePopup?: boolean | undefined;
  trackCursorAxis?: 'none' | 'x' | 'y' | 'both' | undefined;
  actionsRef?: React.RefObject<TooltipRoot.Actions | null> | undefined;
  disabled?: boolean | undefined;
  handle?: TooltipHandle<Payload> | undefined;
  children?: React.ReactNode | PayloadChildRenderFunction<Payload>;
  triggerId?: string | null | undefined;
  defaultTriggerId?: string | null | undefined;
}

export interface TooltipRootActions {
  unmount: () => void;
  close: () => void;
}

export type TooltipRootChangeEventReason =
  | typeof REASONS.triggerHover
  | typeof REASONS.triggerFocus
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.disabled
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type TooltipRootChangeEventDetails =
  BaseUIChangeEventDetails<TooltipRoot.ChangeEventReason> & {
    preventUnmountOnClose(): void;
  };

export namespace TooltipRoot {
  export type State = TooltipRootState;
  export type Props<Payload = unknown> = TooltipRootProps<Payload>;
  export type Actions = TooltipRootActions;
  export type ChangeEventReason = TooltipRootChangeEventReason;
  export type ChangeEventDetails = TooltipRootChangeEventDetails;
}

function TooltipInteractions<Payload>({
  store,
  disabled,
  trackCursorAxis,
}: {
  store: TooltipStore<Payload>;
  disabled: boolean;
  trackCursorAxis: 'none' | 'x' | 'y' | 'both';
}) {
  const floatingRootContext = store.useState('floatingRootContext');

  const dismiss = useDismiss(floatingRootContext, {
    enabled: !disabled,
    referencePress: () => store.select('closeOnClick'),
  });
  const clientPoint = useClientPoint(floatingRootContext, {
    enabled: !disabled && trackCursorAxis !== 'none',
    axis: trackCursorAxis === 'none' ? undefined : trackCursorAxis,
  });

  const activeTriggerProps = React.useMemo(
    () => mergeProps(clientPoint.reference, dismiss.reference),
    [clientPoint.reference, dismiss.reference],
  );
  const inactiveTriggerProps = React.useMemo(
    () => mergeProps(clientPoint.trigger, dismiss.trigger),
    [clientPoint.trigger, dismiss.trigger],
  );
  const popupProps = React.useMemo(
    () => mergeProps(FOCUSABLE_POPUP_PROPS, clientPoint.floating, dismiss.floating),
    [clientPoint.floating, dismiss.floating],
  );

  usePopupInteractionProps(store, {
    activeTriggerProps,
    inactiveTriggerProps,
    popupProps,
  });

  return null;
}
