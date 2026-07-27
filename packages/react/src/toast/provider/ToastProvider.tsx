'use client';
import * as React from 'react';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ToastContext } from './ToastProviderContext';
import type { ToastManager } from '../createToastManager';
import { ToastStore } from '../store';

/**
 * Provides a context for creating and managing toasts.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastProvider: React.FC<ToastProvider.Props> = function ToastProvider(props) {
  const { children, timeout = 5000, limit = 3, toastManager } = props;

  const store = useRefWithInit(
    () =>
      new ToastStore({
        timeout,
        limit,
        viewport: null,
        toasts: [],
        hovering: false,
        focused: false,
        isWindowFocused: true,
        prevFocusElement: null,
      }),
  ).current;

  useOnMount(store.disposeEffect);

  React.useEffect(
    function subscribeToToastManager() {
      if (!toastManager) {
        return undefined;
      }

      const unsubscribe = toastManager[' subscribe'](({ action, options }) => {
        const id = options.id;

        if (action === 'promise' && options.promise) {
          store.promiseToast(options.promise, options);
        } else if (action === 'update' && id) {
          store.updateToast(id, options);
        } else if (action === 'close') {
          store.closeToast(id);
        } else {
          store.addToast(options);
        }
      });

      return unsubscribe;
    },
    [store, toastManager],
  );

  // `limit` needs custom syncing because changing it must also recompute each
  // toast's `limited` flag; `useSyncedValues` would only update the raw value.
  useIsoLayoutEffect(() => {
    store.syncProviderProps({ timeout, limit });
  }, [store, timeout, limit]);

  return <ToastContext.Provider value={store}>{children}</ToastContext.Provider>;
};

export interface ToastProviderState {}

export interface ToastProviderProps {
  children?: React.ReactNode;
  timeout?: number | undefined;
  limit?: number | undefined;
  toastManager?: ToastManager | undefined;
}

export namespace ToastProvider {
  export type State = ToastProviderState;
  export type Props = ToastProviderProps;
}
