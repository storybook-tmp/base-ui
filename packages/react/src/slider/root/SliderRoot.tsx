'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { warn } from '@base-ui/utils/warn';
import type { BaseUIComponentProps, Orientation } from '../../internals/types';
import {
  createChangeEventDetails,
  createGenericEventDetails,
  type BaseUIChangeEventDetails,
  type BaseUIGenericEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { useValueChanged } from '../../internals/useValueChanged';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useRenderElement } from '../../internals/useRenderElement';
import { clamp } from '../../internals/clamp';
import { areArraysEqual } from '../../internals/areArraysEqual';
import { activeElement, contains } from '../../floating-ui-react/utils';
import {
  CompositeList,
  type CompositeMetadata,
} from '../../internals/composite/list/CompositeList';
import type { FieldRootState } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useRegisterFieldControl } from '../../internals/field-register-control/useRegisterFieldControl';
import { useFormContext } from '../../internals/form-context/FormContext';
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext';
import { resolveAriaLabelledBy, getDefaultLabelId } from '../../utils/resolveAriaLabelledBy';
import { asc } from '../utils/asc';
import { getSliderValue } from '../utils/getSliderValue';
import { validateMinimumDistance } from '../utils/validateMinimumDistance';
import type { ThumbMetadata } from '../thumb/SliderThumb';
import { sliderStateAttributesMapping } from './stateAttributesMapping';
import { SliderRootContext } from './SliderRootContext';
import { REASONS } from '../../internals/reasons';

function getSliderChangeEventReason(
  event: React.KeyboardEvent | React.ChangeEvent,
): SliderRootChangeEventReason {
  return 'key' in event ? REASONS.keyboard : REASONS.inputChange;
}

function areValuesEqual(
  newValue: number | readonly number[],
  oldValue: number | readonly number[],
) {
  if (typeof newValue === 'number' && typeof oldValue === 'number') {
    return newValue === oldValue;
  }
  if (Array.isArray(newValue) && Array.isArray(oldValue)) {
    return areArraysEqual(newValue, oldValue);
  }
  return false;
}

/**
 * Groups all parts of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export const SliderRoot = React.forwardRef(function SliderRoot<
  Value extends number | readonly number[],
>(componentProps: SliderRoot.Props<Value>, forwardedRef: React.ForwardedRef<HTMLDivElement>) {
  const {
    'aria-labelledby': ariaLabelledByProp,
    className,
    defaultValue,
    disabled: disabledProp = false,
    id: idProp,
    format,
    largeStep = 10,
    locale,
    render,
    max = 100,
    min = 0,
    minStepsBetweenValues = 0,
    form,
    name: nameProp,
    onValueChange: onValueChangeProp,
    onValueCommitted: onValueCommittedProp,
    orientation = 'horizontal',
    step = 1,
    thumbCollisionBehavior = 'push',
    thumbAlignment = 'center',
    value: valueProp,
    style,
    ...elementProps
  } = componentProps;

  const id = useBaseUiId(idProp);
  const defaultLabelId = getDefaultLabelId(id);
  const onValueChange = useStableCallback(
    onValueChangeProp as (
      value: number | number[],
      eventDetails: SliderRoot.ChangeEventDetails,
    ) => void,
  );
  const onValueCommitted = useStableCallback(
    onValueCommittedProp as (
      value: number | readonly number[],
      eventDetails: SliderRoot.CommitEventDetails,
    ) => void,
  );

  const { clearErrors } = useFormContext();
  const {
    state: fieldState,
    disabled: fieldDisabled,
    name: fieldName,
    setTouched,
    setDirty,
    validityData,
    validation,
  } = useFieldRootContext();
  const { labelId: fieldLabelId } = useLabelableContext();
  const [labelId, setLabelId] = React.useState<string | undefined>();

  const ariaLabelledby = ariaLabelledByProp ?? resolveAriaLabelledBy(fieldLabelId, labelId);
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  // The internal value is potentially unsorted, e.g. to support frozen arrays
  // https://github.com/mui/material-ui/pull/28472
  const [valueUnwrapped, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue ?? min,
    name: 'Slider',
  });

  const sliderRef = React.useRef<HTMLElement>(null);
  const controlRef = React.useRef<HTMLElement>(null);
  const thumbRefs = React.useRef<(HTMLElement | null)[]>([]);
  // The input element nested in the pressed thumb.
  const pressedInputRef = React.useRef<HTMLInputElement>(null);
  // The px distance between the pointer and the center of a pressed thumb.
  const pressedThumbCenterOffsetRef = React.useRef<number | null>(null);
  // The index of the pressed thumb, or the closest thumb if the `Control` was pressed.
  // This is updated on pointerdown, which is sooner than the `active/activeIndex`
  // state which is updated later when the nested `input` receives focus.
  const pressedThumbIndexRef = React.useRef(-1);
  // The values when the current drag interaction started.
  const pressedValuesRef = React.useRef<readonly number[] | null>(null);
  const lastChangeReasonRef = React.useRef<SliderRoot.ChangeEventReason>('none');

  // We can't use the :active browser pseudo-classes.
  // - The active state isn't triggered when clicking on the rail.
  // - The active state isn't transferred when inversing a range slider.
  const [active, setActiveState] = React.useState(-1);
  const [lastUsedThumbIndex, setLastUsedThumbIndex] = React.useState(-1);
  const [dragging, setDragging] = React.useState(false);
  const [thumbMap, setThumbMap] = React.useState(
    () => new Map<Node, CompositeMetadata<ThumbMetadata> | null>(),
  );
  const [indicatorPosition, setIndicatorPosition] = React.useState<(number | undefined)[]>([
    undefined,
    undefined,
  ]);

  const setActive = useStableCallback((value: number) => {
    setActiveState(value);

    if (value !== -1) {
      setLastUsedThumbIndex(value);
    }
  });

  const registerFieldControlRef = useStableCallback((element: HTMLElement | null) => {
    if (element) {
      controlRef.current = element;
    }
  });

  const range = Array.isArray(valueUnwrapped);

  const values = React.useMemo(() => {
    if (!range) {
      return [clamp(valueUnwrapped as number, min, max)];
    }
    return valueUnwrapped.map((value) => clamp(value, min, max)).sort(asc);
  }, [max, min, range, valueUnwrapped]);

  const fieldValue = range ? values : values[0];

  useRegisterFieldControl(validation.inputRef, id, fieldValue, undefined, !disabled, nameProp);

  useValueChanged(fieldValue, () => {
    clearErrors(name);

    validation.change(fieldValue);

    const initialValue = validityData.initialValue as number | readonly number[] | undefined;
    let isDirty: boolean;
    if (Array.isArray(fieldValue) && Array.isArray(initialValue)) {
      isDirty = !areArraysEqual(fieldValue, initialValue);
    } else {
      isDirty = fieldValue !== initialValue;
    }
    setDirty(isDirty);
  });

  const setValue = useStableCallback(
    (newValue: number | number[], details?: SliderRoot.ChangeEventDetails) => {
      if (Number.isNaN(newValue) || areValuesEqual(newValue, valueUnwrapped)) {
        return false;
      }

      const changeDetails =
        details ??
        createChangeEventDetails(REASONS.none, undefined, undefined, { activeThumbIndex: -1 });

      // Redefine target to allow name and value to be read.
      // This allows seamless integration with the most popular form libraries.
      // https://github.com/mui/material-ui/issues/13485#issuecomment-676048492
      // Clone the event to not override `target` of the original event.
      const nativeEvent = changeDetails.event;
      const EventConstructor = (nativeEvent.constructor as typeof Event | undefined) ?? Event;
      const clonedEvent = new EventConstructor(nativeEvent.type, nativeEvent);

      Object.defineProperty(clonedEvent, 'target', {
        writable: true,
        value: { value: newValue, name },
      });

      changeDetails.event = clonedEvent;

      onValueChange(newValue, changeDetails);

      if (changeDetails.isCanceled) {
        return false;
      }

      lastChangeReasonRef.current = changeDetails.reason;

      setValueUnwrapped(newValue as Value);

      return true;
    },
  );

  const handleInputChange = useStableCallback(
    (valueInput: number, index: number, event: React.KeyboardEvent | React.ChangeEvent) => {
      const newValue = getSliderValue(valueInput, index, min, max, range, values);

      if (validateMinimumDistance(newValue, step, minStepsBetweenValues)) {
        const reason = getSliderChangeEventReason(event);
        const applied = setValue(
          newValue,
          createChangeEventDetails(reason, event.nativeEvent, undefined, {
            activeThumbIndex: index,
          }),
        );
        setTouched(true);

        if (applied) {
          onValueCommitted(newValue, createGenericEventDetails(reason, event.nativeEvent));
        }
      }
    },
  );

  if (process.env.NODE_ENV !== 'production') {
    if (min >= max) {
      warn('Slider `max` must be greater than `min`.');
    }
  }

  useIsoLayoutEffect(() => {
    const activeEl = activeElement(ownerDocument(sliderRef.current));
    if (disabled && contains(sliderRef.current, activeEl)) {
      // This is necessary because Firefox and Safari will keep focus
      // on a disabled element:
      // https://codesandbox.io/p/sandbox/mui-pr-22247-forked-h151h?file=/src/App.js
      (activeEl as HTMLElement).blur();
    }
  }, [disabled]);

  if (disabled && active !== -1) {
    setActive(-1);
  }

  const state: SliderRootState = React.useMemo(
    () => ({
      ...fieldState,
      activeThumbIndex: active,
      disabled,
      dragging,
      orientation,
      max,
      min,
      minStepsBetweenValues,
      step,
      values,
    }),
    [
      fieldState,
      active,
      disabled,
      dragging,
      max,
      min,
      minStepsBetweenValues,
      orientation,
      step,
      values,
    ],
  );

  const contextValue: SliderRootContext = React.useMemo(
    () => ({
      active,
      controlRef,
      disabled,
      dragging,
      validation,
      format,
      handleInputChange,
      indicatorPosition,
      inset: thumbAlignment !== 'center',
      labelId: ariaLabelledby,
      rootLabelId: defaultLabelId,
      largeStep,
      lastUsedThumbIndex,
      lastChangeReasonRef,
      form,
      locale,
      max,
      min,
      minStepsBetweenValues,
      name,
      onValueCommitted,
      orientation,
      pressedInputRef,
      pressedThumbCenterOffsetRef,
      pressedThumbIndexRef,
      pressedValuesRef,
      registerFieldControlRef,
      renderBeforeHydration: thumbAlignment === 'edge',
      setActive,
      setDragging,
      setIndicatorPosition,
      setLabelId,
      setValue,
      state,
      step,
      thumbCollisionBehavior,
      thumbMap,
      thumbRefs,
      values,
    }),
    [
      active,
      controlRef,
      ariaLabelledby,
      defaultLabelId,
      disabled,
      dragging,
      validation,
      format,
      handleInputChange,
      indicatorPosition,
      largeStep,
      lastUsedThumbIndex,
      lastChangeReasonRef,
      form,
      locale,
      max,
      min,
      minStepsBetweenValues,
      name,
      onValueCommitted,
      orientation,
      pressedInputRef,
      pressedThumbCenterOffsetRef,
      pressedThumbIndexRef,
      pressedValuesRef,
      registerFieldControlRef,
      setActive,
      setDragging,
      setIndicatorPosition,
      setLabelId,
      setValue,
      state,
      step,
      thumbCollisionBehavior,
      thumbAlignment,
      thumbMap,
      thumbRefs,
      values,
    ],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, sliderRef],
    props: [
      {
        'aria-labelledby': ariaLabelledby,
        id,
        role: 'group',
      },
      elementProps,
      (props) => validation.getValidationProps(disabled, props),
    ],
    stateAttributesMapping: sliderStateAttributesMapping,
  });

  return (
    <SliderRootContext.Provider value={contextValue}>
      <CompositeList elementsRef={thumbRefs} onMapChange={setThumbMap}>
        {element}
      </CompositeList>
    </SliderRootContext.Provider>
  );
}) as {
  <Value extends number | readonly number[]>(
    props: SliderRoot.Props<Value> & {
      ref?: React.Ref<HTMLDivElement> | undefined;
    },
  ): React.JSX.Element;
};

export interface SliderRootState extends FieldRootState {
  /**
   * The index of the active thumb.
   */
  activeThumbIndex: number;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the thumb is currently being dragged.
   */
  dragging: boolean;
  /**
   * The maximum value.
   */
  max: number;
  /**
   * The minimum value.
   */
  min: number;
  /**
   * The minimum steps between values in a range slider.
   * @default 0
   */
  minStepsBetweenValues: number;
  /**
   * The component orientation.
   */
  orientation: Orientation;
  /**
   * The step increment of the slider when incrementing or decrementing. It will snap
   * to multiples of this value. Decimal values are supported.
   * @default 1
   */
  step: number;
  /**
   * The raw number value of the slider.
   */
  values: readonly number[];
}

export interface SliderRootProps<
  Value extends number | readonly number[] = number | readonly number[],
> extends BaseUIComponentProps<'div', SliderRootState> {
  defaultValue?: Value | undefined;
  disabled?: boolean | undefined;
  format?: Intl.NumberFormatOptions | undefined;
  locale?: Intl.LocalesArgument | undefined;
  max?: number | undefined;
  min?: number | undefined;
  minStepsBetweenValues?: number | undefined;
  name?: string | undefined;
  form?: string | undefined;
  orientation?: Orientation | undefined;
  step?: number | undefined;
  largeStep?: number | undefined;
  thumbAlignment?: 'center' | 'edge' | 'edge-client-only' | undefined;
  thumbCollisionBehavior?: 'push' | 'swap' | 'none' | undefined;
  value?: Value | undefined;
  onValueChange?:
    | ((
        value: Value extends number ? number : Value,
        eventDetails: SliderRoot.ChangeEventDetails,
      ) => void)
    | undefined;
  onValueCommitted?:
    | ((
        value: Value extends number ? number : Value,
        eventDetails: SliderRoot.CommitEventDetails,
      ) => void)
    | undefined;
}

export interface SliderRootChangeEventCustomProperties {
  /**
   * The index of the active thumb at the time of the change.
   */
  activeThumbIndex: number;
}

export type SliderRootChangeEventReason =
  | typeof REASONS.inputChange
  | typeof REASONS.trackPress
  | typeof REASONS.drag
  | typeof REASONS.keyboard
  | typeof REASONS.none;
export type SliderRootChangeEventDetails = BaseUIChangeEventDetails<
  SliderRoot.ChangeEventReason,
  SliderRootChangeEventCustomProperties
>;

export type SliderRootCommitEventReason =
  | typeof REASONS.inputChange
  | typeof REASONS.trackPress
  | typeof REASONS.drag
  | typeof REASONS.keyboard
  | typeof REASONS.none;
export type SliderRootCommitEventDetails = BaseUIGenericEventDetails<SliderRoot.CommitEventReason>;

export namespace SliderRoot {
  export type State = SliderRootState;
  export type Props<Value extends number | readonly number[] = number | readonly number[]> =
    SliderRootProps<Value>;
  export type ChangeEventReason = SliderRootChangeEventReason;
  export type ChangeEventDetails = SliderRootChangeEventDetails;
  export type CommitEventReason = SliderRootCommitEventReason;
  export type CommitEventDetails = SliderRootCommitEventDetails;
}
