'use client';
import * as React from 'react';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useOnFirstRender } from '@base-ui/utils/useOnFirstRender';
import { usePreviousValue } from '@base-ui/utils/usePreviousValue';
import { isElementDisabled } from '@base-ui/utils/isElementDisabled';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useStore, Store } from '@base-ui/utils/store';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '@base-ui/utils/empty';
import {
  useClick,
  useDismiss,
  useFloatingRootContext,
  useListNavigation,
  useTypeahead,
} from '../../floating-ui-react';
import { SelectRootContext, SelectFloatingContext } from './SelectRootContext';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useRegisterFieldControl } from '../../internals/field-register-control/useRegisterFieldControl';
import { useLabelableId } from '../../internals/labelable-provider/useLabelableId';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import { selectors, type State as StoreState } from '../store';
import {
  type BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { useFormContext } from '../../internals/form-context/FormContext';
import { type Group, stringifyAsLabel, stringifyAsValue } from '../../internals/resolveValueLabel';
import {
  compareItemEquality,
  defaultItemEquality,
  findItemIndex,
} from '../../internals/itemEquality';
import { areArraysEqual } from '../../internals/areArraysEqual';
import { useValueChanged } from '../../internals/useValueChanged';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { getMaxScrollOffset, normalizeScrollOffset } from '../../utils/scrollEdges';
import { FOCUSABLE_POPUP_PROPS } from '../../utils/popups';
import { mergeProps } from '../../merge-props';

/**
 * Groups all parts of the select.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectRoot<Value, Multiple extends boolean | undefined = false>(
  props: SelectRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const {
    id,
    value: valueProp,
    defaultValue = null,
    onValueChange,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    name: nameProp,
    form,
    autoComplete,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    modal = true,
    actionsRef,
    inputRef,
    onOpenChangeComplete,
    items,
    multiple = false,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue = defaultItemEquality,
    highlightItemOnHover = true,
    children,
  } = props;

  const { clearErrors } = useFormContext();
  const {
    setDirty,
    setTouched,
    setFocused,
    validityData,
    setFilled,
    name: fieldName,
    disabled: fieldDisabled,
    validation,
    validationMode,
  } = useFieldRootContext();

  const generatedId = useLabelableId({ id });

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: multiple ? (defaultValue ?? EMPTY_ARRAY) : defaultValue,
    name: 'Select',
    state: 'value',
  });

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'Select',
    state: 'open',
  });

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const labelsRef = React.useRef<Array<string | null>>([]);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const scrollHandlerRef = React.useRef<((el: HTMLDivElement) => void) | null>(null);
  const scrollArrowsMountedCountRef = React.useRef(0);
  const valueRef = React.useRef<HTMLSpanElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const typingRef = React.useRef(false);
  const firstItemTextRef = React.useRef<HTMLElement | null>(null);
  const selectedItemTextRef = React.useRef<HTMLElement | null>(null);
  const selectionRef = React.useRef({
    allowSelectedMouseUp: false,
    allowUnselectedMouseUp: false,
    dragY: 0,
  });
  const alignItemWithTriggerActiveRef = React.useRef(false);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
  const { openMethod, triggerProps: interactionTypeProps } = useOpenInteractionType(open);

  const store = useRefWithInit(
    () =>
      new Store<StoreState>({
        id: generatedId,
        labelId: undefined,
        modal,
        multiple,
        itemToStringLabel,
        itemToStringValue,
        isItemEqualToValue,
        value,
        open,
        mounted,
        transitionStatus,
        items,
        forceMount: false,
        openMethod: null,
        activeIndex: null,
        selectedIndex: null,
        popupProps: {},
        triggerProps: {},
        triggerElement: null,
        positionerElement: null,
        listElement: null,
        popupSide: null,
        scrollUpArrowVisible: false,
        scrollDownArrowVisible: false,
        hasScrollArrows: false,
      }),
  ).current;

  const activeIndex = useStore(store, selectors.activeIndex);
  const selectedIndex = useStore(store, selectors.selectedIndex);
  const triggerElement = useStore(store, selectors.triggerElement);
  const positionerElement = useStore(store, selectors.positionerElement);

  const previousOpenMethod = usePreviousValue(openMethod);
  const renderedOpenMethod = openMethod ?? previousOpenMethod ?? null;

  const serializedValue = React.useMemo(() => {
    // In multiple mode the shared input is nameless; per-value entries are submitted via
    // `hiddenInputs`. Its value is therefore irrelevant, and passing the whole array to
    // `stringifyAsValue` would invoke a user `itemToStringValue` with an array it doesn't expect.
    if (multiple) {
      return '';
    }
    return stringifyAsValue(value, itemToStringValue);
  }, [multiple, value, itemToStringValue]);

  const fieldStringValue = React.useMemo(() => {
    if (multiple && Array.isArray(value)) {
      return value.map((currentValue) => stringifyAsValue(currentValue, itemToStringValue));
    }
    return stringifyAsValue(value, itemToStringValue);
  }, [multiple, value, itemToStringValue]);

  const controlRef = useValueAsRef(store.state.triggerElement);
  const getStringifiedValueForForm = useStableCallback(() => fieldStringValue);

  useRegisterFieldControl(
    controlRef,
    generatedId,
    value,
    getStringifiedValueForForm,
    !disabled,
    nameProp,
  );

  const initialValueRef = React.useRef(value);
  // Mirror the `hasSelectedValue` store selector so the Field's filled state agrees with the
  // trigger/value placeholder semantics (a value serializing to `''` counts as empty).
  const hasSelectedValue = multiple
    ? Array.isArray(value) && value.length > 0
    : value != null && stringifyAsValue(value, itemToStringValue) !== '';

  useIsoLayoutEffect(() => {
    setFilled(hasSelectedValue);
  }, [hasSelectedValue, setFilled]);

  useIsoLayoutEffect(
    function syncSelectedIndex() {
      const registry = valuesRef.current;
      let nextIndex: number | null;

      if (multiple) {
        const currentValue = Array.isArray(value) ? value : [];
        if (currentValue.length === 0) {
          nextIndex = null;
        } else {
          const lastValue = currentValue[currentValue.length - 1];
          const lastIndex = findItemIndex(registry, lastValue, isItemEqualToValue);
          nextIndex = lastIndex === -1 ? null : lastIndex;
        }
      } else {
        const index = findItemIndex(registry, value as Value, isItemEqualToValue);
        nextIndex = index === -1 ? null : index;
      }

      if (nextIndex === null) {
        selectedItemTextRef.current = null;
      }

      if (open) {
        return;
      }

      store.set('selectedIndex', nextIndex);
    },
    [
      hasSelectedValue,
      multiple,
      open,
      value,
      valuesRef,
      isItemEqualToValue,
      store,
      selectedItemTextRef,
    ],
  );

  function isSelectedValueDirty(currentValue: unknown) {
    const initialValue = validityData.initialValue;

    if (Array.isArray(currentValue) && Array.isArray(initialValue)) {
      return !areArraysEqual(currentValue, initialValue, (itemValue, initialItemValue) =>
        compareItemEquality(itemValue, initialItemValue, isItemEqualToValue),
      );
    }

    return currentValue !== initialValue;
  }

  useValueChanged(value, () => {
    clearErrors(name);
    setDirty(isSelectedValueDirty(value));

    validation.change(value);
  });

  const setOpen = useStableCallback(
    (nextOpen: boolean, eventDetails: SelectRoot.ChangeEventDetails) => {
      onOpenChange?.(nextOpen, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setOpenUnwrapped(nextOpen);

      if (
        !nextOpen &&
        (eventDetails.reason === REASONS.focusOut || eventDetails.reason === REASONS.outsidePress)
      ) {
        setTouched(true);
        setFocused(false);

        if (validationMode === 'onBlur') {
          validation.commit(value);
        }
      }
    },
  );

  const handleUnmount = useStableCallback(() => {
    setMounted(false);
    store.update({ activeIndex: null, openMethod: null });
    onOpenChangeComplete?.(false);
  });

  useOpenChangeComplete({
    enabled: !actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  const setValue = useStableCallback(
    (nextValue: any, eventDetails: SelectRoot.ChangeEventDetails) => {
      onValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueUnwrapped(nextValue);
    },
  );

  const handleScrollArrowVisibility = useStableCallback(() => {
    const scroller = store.state.listElement || popupRef.current;
    if (!scroller) {
      return;
    }

    const maxScrollTop = getMaxScrollOffset(scroller.scrollHeight, scroller.clientHeight);
    const scrollTop = normalizeScrollOffset(scroller.scrollTop, maxScrollTop);
    const shouldShowUp = scrollTop > 0;
    const shouldShowDown = scrollTop < maxScrollTop;

    if (store.state.scrollUpArrowVisible !== shouldShowUp) {
      store.set('scrollUpArrowVisible', shouldShowUp);
    }
    if (store.state.scrollDownArrowVisible !== shouldShowDown) {
      store.set('scrollDownArrowVisible', shouldShowDown);
    }
  });

  const floatingContext = useFloatingRootContext({
    open,
    onOpenChange: setOpen,
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
  });

  const click = useClick(floatingContext, {
    enabled: !readOnly && !disabled,
    event: 'mousedown',
  });

  const dismiss = useDismiss(floatingContext);

  const listNavigation = useListNavigation(floatingContext, {
    enabled: !readOnly && !disabled,
    listRef,
    activeIndex,
    selectedIndex,
    disabledIndices: EMPTY_ARRAY as number[],
    onNavigate(nextActiveIndex) {
      // Retain the highlight while transitioning out.
      if (nextActiveIndex === null && !open) {
        return;
      }

      store.set('activeIndex', nextActiveIndex);
    },
    focusItemOnHover: highlightItemOnHover,
  });

  const typeahead = useTypeahead(floatingContext, {
    enabled: !readOnly && !disabled && (open || !multiple),
    listRef: labelsRef,
    activeIndex,
    selectedIndex,
    // Skip disabled items while matching so typeahead advances to the next selectable item
    // (a click can never select a disabled item and native `<select>` skips them too). Resolve
    // the disabled state from the element via the attribute-only `isElementDisabled` so the
    // hidden, force-mounted items used for closed-trigger typeahead aren't dropped by the
    // `elementsRef`/visibility filter that `disabledIndices` deliberately sidesteps.
    disabledIndices: (index) => isElementDisabled(listRef.current[index]),
    onMatch(index) {
      if (open) {
        store.set('activeIndex', index);
      } else {
        setValue(valuesRef.current[index], createChangeEventDetails('none'));
      }
    },
    onTyping(typing) {
      typingRef.current = typing;
    },
  });

  const mergedTriggerProps = React.useMemo(() => {
    const triggerInteractionProps = mergeProps(
      typeahead.reference,
      listNavigation.reference,
      dismiss.reference,
      click.reference,
      interactionTypeProps,
    );

    if (generatedId) {
      triggerInteractionProps.id = generatedId;
    }

    return triggerInteractionProps;
  }, [
    click.reference,
    typeahead.reference,
    listNavigation.reference,
    dismiss.reference,
    interactionTypeProps,
    generatedId,
  ]);

  const popupProps = React.useMemo(
    () =>
      mergeProps(
        FOCUSABLE_POPUP_PROPS,
        typeahead.floating,
        listNavigation.floating,
        dismiss.floating,
      ),
    [typeahead.floating, listNavigation.floating, dismiss.floating],
  );

  const itemProps =
    (listNavigation.item as React.HTMLProps<HTMLElement> | undefined) ?? EMPTY_OBJECT;

  useOnFirstRender(() => {
    store.update({
      popupProps,
      triggerProps: mergedTriggerProps,
    });
  });

  useIsoLayoutEffect(() => {
    store.update({
      id: generatedId,
      modal,
      multiple,
      value,
      open,
      mounted,
      transitionStatus,
      popupProps,
      triggerProps: mergedTriggerProps,
      items,
      itemToStringLabel,
      itemToStringValue,
      isItemEqualToValue,
      openMethod: renderedOpenMethod,
    });
  }, [
    store,
    generatedId,
    modal,
    multiple,
    value,
    open,
    mounted,
    transitionStatus,
    popupProps,
    mergedTriggerProps,
    items,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue,
    renderedOpenMethod,
  ]);

  const contextValue: SelectRootContext = React.useMemo(
    () => ({
      store,
      name,
      required,
      disabled,
      readOnly,
      multiple,
      highlightItemOnHover,
      setValue,
      setOpen,
      listRef,
      popupRef,
      scrollHandlerRef,
      handleScrollArrowVisibility,
      scrollArrowsMountedCountRef,
      itemProps,
      valueRef,
      valuesRef,
      labelsRef,
      typingRef,
      selectionRef,
      firstItemTextRef,
      selectedItemTextRef,
      validation,
      onOpenChangeComplete,
      alignItemWithTriggerActiveRef,
      initialValueRef,
    }),
    [
      store,
      name,
      required,
      disabled,
      readOnly,
      multiple,
      highlightItemOnHover,
      setValue,
      setOpen,
      itemProps,
      validation,
      onOpenChangeComplete,
      handleScrollArrowVisibility,
    ],
  );

  const ref = useMergedRefs(inputRef, validation.inputRef);

  const hasMultipleSelection = multiple && Array.isArray(value) && value.length > 0;
  const hiddenInputName = multiple ? undefined : name;

  const hiddenInputs = React.useMemo(() => {
    if (!multiple || !Array.isArray(value) || !name) {
      return null;
    }

    return value.map((v) => {
      const currentSerializedValue = stringifyAsValue(v, itemToStringValue);
      return (
        <input
          key={currentSerializedValue}
          type="hidden"
          form={form}
          name={name}
          value={currentSerializedValue}
          disabled={disabled}
        />
      );
    });
  }, [multiple, value, form, name, itemToStringValue, disabled]);

  return (
    <SelectRootContext.Provider value={contextValue}>
      <SelectFloatingContext.Provider value={floatingContext}>
        {children}
        <input
          {...validation.getValidationProps(disabled, {
            onFocus() {
              // Move focus to the trigger element when the hidden input is focused.
              store.state.triggerElement?.focus({
                // Supported in Chrome from 144 (January 2026)
                focusVisible: true,
              });
            },
            // Handle browser autofill.
            onChange(event: React.ChangeEvent<HTMLInputElement>) {
              // Workaround for https://github.com/react/react/issues/9023
              if (event.nativeEvent.defaultPrevented || disabled || readOnly) {
                return;
              }

              const nextValue = event.currentTarget.value;
              const details = createChangeEventDetails(REASONS.none, event.nativeEvent);

              function handleChange() {
                if (multiple) {
                  // Browser autofill only writes a single scalar value.
                  return;
                }

                // Preserve the original serialized matching, then fall back to rendered text,
                // which browsers can autofill for primitive values like `value="US">United States`.
                const nextValueLower = nextValue.toLowerCase();
                let matchingIndex = valuesRef.current.findIndex(
                  (candidate) =>
                    stringifyAsValue(candidate, itemToStringValue).toLowerCase() ===
                      nextValueLower ||
                    stringifyAsLabel(candidate, itemToStringLabel).toLowerCase() === nextValueLower,
                );

                if (matchingIndex === -1) {
                  matchingIndex = valuesRef.current.findIndex((_, index) => {
                    const renderedLabel = labelsRef.current[index];
                    return renderedLabel != null && renderedLabel.toLowerCase() === nextValueLower;
                  });
                }

                const matchingValue =
                  matchingIndex === -1 ? undefined : valuesRef.current[matchingIndex];
                if (matchingValue != null) {
                  // `setValue` may be canceled by `onValueChange`; rely on `useValueChanged` to
                  // mark the field dirty and run validation only when the value actually changes.
                  setValue(matchingValue, details);
                }
              }

              store.set('forceMount', true);
              queueMicrotask(handleChange);
            },
          })}
          id={generatedId && hiddenInputName == null ? `${generatedId}-hidden-input` : undefined}
          form={form}
          name={hiddenInputName}
          autoComplete={autoComplete}
          value={serializedValue}
          disabled={disabled}
          required={required && !hasMultipleSelection}
          readOnly={readOnly}
          ref={ref}
          style={name ? visuallyHiddenInput : visuallyHidden}
          tabIndex={-1}
          aria-hidden
          suppressHydrationWarning
        />
        {hiddenInputs}
      </SelectFloatingContext.Provider>
    </SelectRootContext.Provider>
  );
}

type SelectValueType<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value;

export interface SelectRootProps<Value, Multiple extends boolean | undefined = false> {
  children?: React.ReactNode;
  inputRef?: React.Ref<HTMLInputElement> | undefined;
  name?: string | undefined;
  form?: string | undefined;
  autoComplete?: string | undefined;
  id?: string | undefined;
  required?: boolean | undefined;
  readOnly?: boolean | undefined;
  disabled?: boolean | undefined;
  multiple?: Multiple | undefined;
  highlightItemOnHover?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, eventDetails: SelectRootChangeEventDetails) => void) | undefined;
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  open?: boolean | undefined;
  modal?: boolean | undefined;
  actionsRef?: React.RefObject<SelectRootActions | null> | undefined;
  items?:
    | Record<string, React.ReactNode>
    | ReadonlyArray<{ label: React.ReactNode; value: any }>
    | ReadonlyArray<Group<any>>
    | undefined;
  itemToStringLabel?: ((itemValue: Value) => string) | undefined;
  itemToStringValue?: ((itemValue: Value) => string) | undefined;
  isItemEqualToValue?: ((itemValue: Value, value: Value) => boolean) | undefined;
  defaultValue?: SelectValueType<Value, Multiple> | null | undefined;
  value?: SelectValueType<Value, Multiple> | null | undefined;
  onValueChange?:
    | ((
        value: SelectValueType<Value, Multiple> | (Multiple extends true ? never : null),
        eventDetails: SelectRootChangeEventDetails,
      ) => void)
    | undefined;
}

export interface SelectRootState {}

export interface SelectRootActions {
  unmount: () => void;
}

export type SelectRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.windowResize
  | typeof REASONS.itemPress
  | typeof REASONS.focusOut
  | typeof REASONS.listNavigation
  | typeof REASONS.cancelOpen
  | typeof REASONS.none;

export type SelectRootChangeEventDetails = BaseUIChangeEventDetails<SelectRootChangeEventReason>;

export namespace SelectRoot {
  export type Props<Value, Multiple extends boolean | undefined = false> = SelectRootProps<
    Value,
    Multiple
  >;
  export type State = SelectRootState;
  export type Actions = SelectRootActions;
  export type ChangeEventReason = SelectRootChangeEventReason;
  export type ChangeEventDetails = SelectRootChangeEventDetails;
}
