'use client';
import * as React from 'react';
import { fastComponent } from '@base-ui/utils/fastHooks';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useDismiss, FloatingTree } from '../../floating-ui-react';
import { PreviewCardRootContext, usePreviewCardRootContext } from './PreviewCardContext';
import {
  createChangeEventDetails,
  type BaseUIChangeEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { PreviewCardStore } from '../store/PreviewCardStore';
import {
  FOCUSABLE_POPUP_PROPS,
  PayloadChildRenderFunction,
  useImplicitActiveTrigger,
  usePopupRootStore,
  useOpenStateTransitions,
  usePopupInteractionProps,
} from '../../utils/popups';
import { PreviewCardHandle } from '../store/PreviewCardHandle';
import { mergeProps } from '../../merge-props';

function PreviewCardRootComponent<Payload>(props: PreviewCardRoot.Props<Payload>) {
  const {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    actionsRef,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null,
    children,
  } = props;

  const store = usePopupRootStore(
    handle,
    (floatingId, nested) =>
      new PreviewCardStore<Payload>(
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

  const open = store.useState('open');
  const activeTriggerId = store.useState('activeTriggerId');
  const mounted = store.useState('mounted');
  const payload = store.useState('payload') as Payload | undefined;

  useImplicitActiveTrigger(store, { closeOnActiveTriggerUnmount: true });
  const { forceUnmount } = useOpenStateTransitions(open, store, () => {
    store.context.inlineRectCoordsRef.current = undefined;
  });

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

  const shouldRenderInteractions = open || mounted;

  return (
    <PreviewCardRootContext.Provider value={store as PreviewCardRootContext}>
      {shouldRenderInteractions && <PreviewCardInteractions store={store} />}
      {typeof children === 'function' ? children({ payload }) : children}
    </PreviewCardRootContext.Provider>
  );
}

function PreviewCardInteractions<Payload>({ store }: { store: PreviewCardStore<Payload> }) {
  const floatingRootContext = store.useState('floatingRootContext');

  const dismiss = useDismiss(floatingRootContext);
  const activeTriggerProps = dismiss.reference ?? EMPTY_OBJECT;
  const inactiveTriggerProps = dismiss.trigger ?? EMPTY_OBJECT;
  const popupProps = React.useMemo(
    () => mergeProps(FOCUSABLE_POPUP_PROPS, dismiss.floating),
    [dismiss.floating],
  );

  usePopupInteractionProps(store, {
    activeTriggerProps,
    inactiveTriggerProps,
    popupProps,
  });

  return null;
}

/**
 * Groups all parts of the preview card.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardRoot = fastComponent(function PreviewCardRoot<Payload>(
  props: PreviewCardRoot.Props<Payload>,
) {
  if (usePreviewCardRootContext(true)) {
    return <PreviewCardRootComponent {...props} />;
  }

  return (
    <FloatingTree>
      <PreviewCardRootComponent {...props} />
    </FloatingTree>
  );
});

export interface PreviewCardRootState {}

export interface PreviewCardRootProps<Payload = unknown> {
  defaultOpen?: boolean | undefined;
  open?: boolean | undefined;
  onOpenChange?:
    | ((open: boolean, eventDetails: PreviewCardRoot.ChangeEventDetails) => void)
    | undefined;
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  actionsRef?: React.RefObject<PreviewCardRoot.Actions | null> | undefined;
  handle?: PreviewCardHandle<Payload> | undefined;
  children?: React.ReactNode | PayloadChildRenderFunction<Payload>;
  triggerId?: string | null | undefined;
  defaultTriggerId?: string | null | undefined;
}

export interface PreviewCardRootActions {
  unmount: () => void;
  close: () => void;
}

export type PreviewCardRootChangeEventReason =
  | typeof REASONS.triggerHover
  | typeof REASONS.triggerFocus
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type PreviewCardRootChangeEventDetails =
  BaseUIChangeEventDetails<PreviewCardRoot.ChangeEventReason> & {
    preventUnmountOnClose(): void;
  };

export namespace PreviewCardRoot {
  export type State = PreviewCardRootState;
  export type Props<Payload = unknown> = PreviewCardRootProps<Payload>;
  export type Actions = PreviewCardRootActions;
  export type ChangeEventReason = PreviewCardRootChangeEventReason;
  export type ChangeEventDetails = PreviewCardRootChangeEventDetails;
}
