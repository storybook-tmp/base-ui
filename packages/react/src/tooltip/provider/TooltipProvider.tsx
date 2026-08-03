'use client';
import * as React from 'react';
import { FloatingDelayGroup } from '../../floating-ui-react';
import { TooltipProviderContext } from './TooltipProviderContext';

export const TooltipProvider: React.FC<TooltipProvider.Props> = function TooltipProvider(props) {
  const { delay, closeDelay, timeout = 400 } = props;

  const contextValue: TooltipProviderContext = React.useMemo(
    () => ({
      delay,
      closeDelay,
    }),
    [delay, closeDelay],
  );

  const delayValue = React.useMemo(() => ({ open: delay, close: closeDelay }), [delay, closeDelay]);

  return (
    <TooltipProviderContext.Provider value={contextValue}>
      <FloatingDelayGroup delay={delayValue} timeoutMs={timeout}>
        {props.children}
      </FloatingDelayGroup>
    </TooltipProviderContext.Provider>
  );
};

export interface TooltipProviderState {}

export interface TooltipProviderProps {
  children?: React.ReactNode;
  delay?: number | undefined;
  closeDelay?: number | undefined;
  timeout?: number | undefined;
}

export namespace TooltipProvider {
  export type State = TooltipProviderState;
  export type Props = TooltipProviderProps;
}
