'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import { BaseUIComponentProps } from '../../internals/types';
import { useToolbarRootContext } from '../root/ToolbarRootContext';
import type { ToolbarRootState } from '../root/ToolbarRoot';
import { ToolbarGroupContext } from './ToolbarGroupContext';

export const ToolbarGroup = React.forwardRef(function ToolbarGroup(
  componentProps: ToolbarGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    disabled: disabledProp = false,
    render,
    style,
    ...elementProps
  } = componentProps;

  const { orientation, disabled: toolbarDisabled } = useToolbarRootContext();

  const disabled = toolbarDisabled || disabledProp;

  const contextValue: ToolbarGroupContext = React.useMemo(
    () => ({
      disabled,
    }),
    [disabled],
  );

  const state: ToolbarRootState = {
    disabled,
    orientation,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ role: 'group' }, elementProps],
  });

  return (
    <ToolbarGroupContext.Provider value={contextValue}>{element}</ToolbarGroupContext.Provider>
  );
});

export interface ToolbarGroupState extends ToolbarRootState {}

export interface ToolbarGroupProps extends BaseUIComponentProps<'div', ToolbarGroupState> {
  disabled?: boolean | undefined;
}

export namespace ToolbarGroup {
  export type State = ToolbarGroupState;
  export type Props = ToolbarGroupProps;
}
