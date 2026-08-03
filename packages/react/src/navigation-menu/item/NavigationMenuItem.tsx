'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import {
  NavigationMenuItemContext,
  NavigationMenuItemContextValue,
} from './NavigationMenuItemContext';
import { useBaseUiId } from '../../internals/useBaseUiId';

export const NavigationMenuItem = React.forwardRef(function NavigationMenuItem(
  componentProps: NavigationMenuItem.Props,
  forwardedRef: React.ForwardedRef<HTMLLIElement>,
) {
  const { render, className, style, value: valueProp, ...elementProps } = componentProps;

  const fallbackValue = useBaseUiId();
  const value = valueProp ?? fallbackValue;

  const element = useRenderElement('li', componentProps, {
    ref: forwardedRef,
    props: elementProps,
  });

  const contextValue: NavigationMenuItemContextValue = React.useMemo(() => ({ value }), [value]);

  return (
    <NavigationMenuItemContext.Provider value={contextValue}>
      {element}
    </NavigationMenuItemContext.Provider>
  );
});

export interface NavigationMenuItemState {}

export interface NavigationMenuItemProps extends BaseUIComponentProps<
  'li',
  NavigationMenuItemState
> {
  value?: any;
}

export namespace NavigationMenuItem {
  export type State = NavigationMenuItemState;
  export type Props = NavigationMenuItemProps;
}
