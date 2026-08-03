'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useControlled } from '@base-ui/utils/useControlled';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { useRenderElement } from '../internals/useRenderElement';
import type { BaseUIComponentProps, HTMLProps, Orientation } from '../internals/types';
import { CompositeRoot } from '../internals/composite/root/CompositeRoot';
import { useToolbarRootContext } from '../toolbar/root/ToolbarRootContext';
import { useToolbarGroupContext } from '../toolbar/group/ToolbarGroupContext';
import { ToggleGroupContext } from './ToggleGroupContext';
import { ToggleGroupDataAttributes } from './ToggleGroupDataAttributes';
import type { BaseUIChangeEventDetails } from '../internals/createBaseUIEventDetails';
import { REASONS } from '../internals/reasons';

const stateAttributesMapping = {
  multiple(value: boolean) {
    if (value) {
      return { [ToggleGroupDataAttributes.multiple]: '' } as Record<string, string>;
    }
    return null;
  },
};

export const ToggleGroup = React.forwardRef(function ToggleGroup<Value extends string>(
  componentProps: ToggleGroup.Props<Value>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    defaultValue: defaultValueProp,
    disabled: disabledProp = false,
    loopFocus = true,
    onValueChange,
    orientation = 'horizontal',
    multiple = false,
    value: valueProp,
    className,
    render,
    style,
    ...elementProps
  } = componentProps;

  const toolbarContext = useToolbarRootContext(true);
  const toolbarGroupContext = useToolbarGroupContext(true);

  const isValueInitialized = React.useMemo(
    () => valueProp !== undefined || defaultValueProp !== undefined,
    [valueProp, defaultValueProp],
  );

  const disabled =
    (toolbarContext?.disabled ?? false) || (toolbarGroupContext?.disabled ?? false) || disabledProp;

  const [groupValue, setValueState] = useControlled({
    controlled: valueProp,
    default: valueProp === undefined ? (defaultValueProp ?? EMPTY_ARRAY) : undefined,
    name: 'ToggleGroup',
    state: 'value',
  });

  const setGroupValue = useStableCallback(
    (
      newValue: Value,
      nextPressed: boolean,
      eventDetails: BaseUIChangeEventDetails<typeof REASONS.none>,
    ) => {
      let newGroupValue: Value[];
      if (multiple) {
        newGroupValue = groupValue.slice();
        if (nextPressed) {
          newGroupValue.push(newValue);
        } else {
          newGroupValue.splice(groupValue.indexOf(newValue), 1);
        }
      } else {
        newGroupValue = nextPressed ? [newValue] : [];
      }

      onValueChange?.(newGroupValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueState(newGroupValue);
    },
  );

  const state: ToggleGroupState = { disabled, multiple, orientation };

  const contextValue: ToggleGroupContext<Value> = React.useMemo(
    () => ({
      disabled,
      orientation,
      setGroupValue,
      value: groupValue,
      isValueInitialized,
    }),
    [disabled, orientation, setGroupValue, groupValue, isValueInitialized],
  );

  const defaultProps: HTMLProps = {
    role: 'group',
  };

  const element = useRenderElement('div', componentProps, {
    enabled: Boolean(toolbarContext),
    state,
    ref: forwardedRef,
    props: [defaultProps, elementProps],
    stateAttributesMapping,
  });

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      {toolbarContext ? (
        element
      ) : (
        <CompositeRoot
          render={render}
          className={className}
          style={style}
          state={state}
          refs={[forwardedRef]}
          props={[defaultProps, elementProps]}
          stateAttributesMapping={stateAttributesMapping}
          loopFocus={loopFocus}
          enableHomeAndEndKeys
          orientation={orientation}
        />
      )}
    </ToggleGroupContext.Provider>
  );
}) as {
  <Value extends string>(
    props: ToggleGroup.Props<Value> & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
};

export interface ToggleGroupState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * When `false` only one item in the group can be pressed. If any item in
   * the group becomes pressed, the others will become unpressed.
   * When `true` multiple items can be pressed.
   * @default false
   */
  multiple: boolean;
  /**
   * The orientation of the toggle group.
   */
  orientation: Orientation;
}

export interface ToggleGroupProps<Value extends string> extends BaseUIComponentProps<
  'div',
  ToggleGroupState
> {
  value?: readonly Value[] | undefined;
  defaultValue?: readonly Value[] | undefined;
  onValueChange?:
    | ((groupValue: Value[], eventDetails: ToggleGroup.ChangeEventDetails) => void)
    | undefined;
  disabled?: boolean | undefined;
  orientation?: Orientation | undefined;
  loopFocus?: boolean | undefined;
  multiple?: boolean | undefined;
}

export type ToggleGroupChangeEventReason = typeof REASONS.none;

export type ToggleGroupChangeEventDetails = BaseUIChangeEventDetails<ToggleGroup.ChangeEventReason>;

export namespace ToggleGroup {
  export type State = ToggleGroupState;
  export type Props<Value extends string = string> = ToggleGroupProps<Value>;
  export type ChangeEventReason = ToggleGroupChangeEventReason;
  export type ChangeEventDetails = ToggleGroupChangeEventDetails;
}
