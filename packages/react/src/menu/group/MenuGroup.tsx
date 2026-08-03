'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { MenuGroupContext } from './MenuGroupContext';

export const MenuGroup = React.forwardRef(function MenuGroup(
  componentProps: MenuGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;

  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: {
      role: 'group',
      'aria-labelledby': labelId,
      ...elementProps,
    },
  });

  return <MenuGroupContext.Provider value={setLabelId}>{element}</MenuGroupContext.Provider>;
});

export interface MenuGroupProps extends BaseUIComponentProps<'div', MenuGroupState> {
  children?: React.ReactNode;
}

export interface MenuGroupState {}

export namespace MenuGroup {
  export type Props = MenuGroupProps;
  export type State = MenuGroupState;
}
