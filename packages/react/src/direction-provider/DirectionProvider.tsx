'use client';
import * as React from 'react';
import {
  DirectionContext,
  type TextDirection,
} from '../internals/direction-context/DirectionContext';

export const DirectionProvider: React.FC<DirectionProvider.Props> = function DirectionProvider(
  props,
) {
  const { direction = 'ltr' } = props;
  const contextValue = React.useMemo(() => ({ direction }), [direction]);
  return (
    <DirectionContext.Provider value={contextValue}>{props.children}</DirectionContext.Provider>
  );
};

export interface DirectionProviderState {}

export interface DirectionProviderProps {
  children?: React.ReactNode;
  direction?: TextDirection | undefined;
}

export namespace DirectionProvider {
  export type State = DirectionProviderState;
  export type Props = DirectionProviderProps;
}
