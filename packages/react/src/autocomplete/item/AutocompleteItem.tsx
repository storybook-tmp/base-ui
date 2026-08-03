'use client';
import type * as React from 'react';
import { ComboboxItem } from '../../combobox/item/ComboboxItem';
import type { BaseUIComponentProps, NonNativeButtonProps } from '../../internals/types';

export const AutocompleteItem = ComboboxItem as AutocompleteItem;

export interface AutocompleteItemState {
  /**
   * Whether the item should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
}

export interface AutocompleteItemProps
  extends NonNativeButtonProps, Omit<BaseUIComponentProps<'div', AutocompleteItemState>, 'id'> {
  children?: React.ReactNode;
  onClick?: BaseUIComponentProps<'div', AutocompleteItemState>['onClick'] | undefined;
  index?: number | undefined;
  value?: any;
  disabled?: boolean | undefined;
}

export interface AutocompleteItem {
  (componentProps: AutocompleteItemProps & React.RefAttributes<HTMLDivElement>): React.JSX.Element;
}

export namespace AutocompleteItem {
  export type State = AutocompleteItemState;
  export type Props = AutocompleteItemProps;
}
