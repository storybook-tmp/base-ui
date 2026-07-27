'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { FieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import {
  DEFAULT_VALIDITY_STATE,
  fieldValidityMapping,
} from '../../internals/field-constants/constants';
import { useFieldsetRootContext } from '../../fieldset/root/FieldsetRootContext';
import type { Form } from '../../form';
import { useFormContext } from '../../internals/form-context/FormContext';
import { LabelableProvider } from '../../internals/labelable-provider';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFieldValidation } from './useFieldValidation';
import { useFieldControlRegistration } from '../../internals/field-register-control/useFieldControlRegistration';

/**
 * @internal
 */
const FieldRootInner = React.forwardRef(function FieldRootInner(
  componentProps: FieldRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { errors, validationMode: formValidationMode, submitAttemptedRef } = useFormContext();

  const {
    render,
    className,
    validate: validateProp,
    validationDebounceTime = 0,
    validationMode = formValidationMode,
    name,
    disabled: disabledProp = false,
    invalid: invalidProp,
    dirty: dirtyProp,
    touched: touchedProp,
    actionsRef,
    style,
    ...elementProps
  } = componentProps;

  const disabledFieldset = useFieldsetRootContext(true)?.disabled;

  const validate = useStableCallback(validateProp || (() => null));

  const disabled = disabledFieldset || disabledProp;

  const [touchedState, setTouchedUnwrapped] = React.useState(false);
  const [dirtyState, setDirtyUnwrapped] = React.useState(false);
  const [filled, setFilled] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const dirty = dirtyProp ?? dirtyState;
  const touched = touchedProp ?? touchedState;

  const markedDirtyRef = React.useRef(dirty);
  const registeredFieldIdRef = React.useRef<string | undefined>(undefined);
  const [registeredFieldName, setRegisteredFieldName] = React.useState<string>();
  const effectiveName = name ?? registeredFieldName;

  useIsoLayoutEffect(() => {
    if (dirtyProp !== undefined) {
      markedDirtyRef.current = dirtyProp;
    }
  }, [dirtyProp]);

  const getRegisteredFieldId = React.useCallback(() => registeredFieldIdRef.current, []);
  const setRegisteredFieldId = React.useCallback((id: string | undefined) => {
    registeredFieldIdRef.current = id;
  }, []);

  const setDirty: typeof setDirtyUnwrapped = useStableCallback((value) => {
    if (dirtyProp !== undefined) {
      return;
    }

    if (value) {
      markedDirtyRef.current = true;
    }
    setDirtyUnwrapped(value);
  });

  const setTouched: typeof setTouchedUnwrapped = useStableCallback((value) => {
    if (touchedProp !== undefined) {
      return;
    }
    setTouchedUnwrapped(value);
  });

  const shouldValidateOnChange = useStableCallback(
    () =>
      validationMode === 'onChange' ||
      (validationMode === 'onSubmit' && submitAttemptedRef.current),
  );

  const formError =
    effectiveName && Object.hasOwn(errors, effectiveName) ? errors[effectiveName] : null;
  const hasFormError = !!(Array.isArray(formError) ? formError.length : formError);
  const invalid = invalidProp === true || hasFormError;

  const [validityData, setValidityData] = React.useState<FieldValidityData>({
    state: DEFAULT_VALIDITY_STATE,
    error: '',
    errors: [],
    value: null,
    initialValue: null,
  });

  // App-controlled invalidity (the `invalid` prop and `<Form>` errors) keeps the field marked
  // invalid even while disabled. Only computed validity (native constraints and `validate`)
  // is suppressed when disabled, matching `:disabled` not participating in constraint validation.
  const valid = !invalid && (disabled ? null : validityData.state.valid);

  const state: FieldRootState = React.useMemo(
    () => ({
      disabled,
      touched,
      dirty,
      valid,
      filled,
      focused,
    }),
    [disabled, touched, dirty, valid, filled, focused],
  );

  const validation = useFieldValidation({
    setValidityData,
    validate,
    validityData,
    validationDebounceTime,
    invalid,
    markedDirtyRef,
    state,
    shouldValidateOnChange,
    getRegisteredFieldId,
  });

  const [validateFieldControl, registerFieldControl] = useFieldControlRegistration({
    commit: validation.commit,
    invalid,
    markedDirtyRef,
    name,
    setRegisteredFieldName,
    setRegisteredFieldId,
    setValidityData,
    validityData,
  });

  React.useImperativeHandle(actionsRef, () => ({ validate: validateFieldControl }), [
    validateFieldControl,
  ]);

  const contextValue: FieldRootContext = React.useMemo(
    () => ({
      invalid,
      name: effectiveName,
      validityData,
      setValidityData,
      disabled,
      touched,
      setTouched,
      dirty,
      setDirty,
      filled,
      setFilled,
      focused,
      setFocused,
      validate,
      validationMode,
      validationDebounceTime,
      shouldValidateOnChange,
      state,
      markedDirtyRef,
      registerFieldControl,
      validation,
    }),
    [
      invalid,
      effectiveName,
      validityData,
      disabled,
      touched,
      setTouched,
      dirty,
      setDirty,
      filled,
      setFilled,
      focused,
      setFocused,
      validate,
      validationMode,
      validationDebounceTime,
      shouldValidateOnChange,
      state,
      registerFieldControl,
      validation,
    ],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: elementProps,
    stateAttributesMapping: fieldValidityMapping,
  });

  return <FieldRootContext.Provider value={contextValue}>{element}</FieldRootContext.Provider>;
});

/**
 * Groups all parts of the field.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldRoot = React.forwardRef(function FieldRoot(
  componentProps: FieldRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <LabelableProvider>
      <FieldRootInner {...componentProps} ref={forwardedRef} />
    </LabelableProvider>
  );
});

export interface FieldValidityData {
  state: {
    badInput: boolean;
    customError: boolean;
    patternMismatch: boolean;
    rangeOverflow: boolean;
    rangeUnderflow: boolean;
    stepMismatch: boolean;
    tooLong: boolean;
    tooShort: boolean;
    typeMismatch: boolean;
    valueMissing: boolean;
    valid: boolean | null;
  };
  error: string;
  errors: string[];
  value: unknown;
  initialValue: unknown;
}

export interface FieldRootActions {
  validate: () => void;
}

export interface FieldRootState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the field has been touched.
   */
  touched: boolean;
  /**
   * Whether the field value has changed from its initial value.
   */
  dirty: boolean;
  /**
   * Whether the field is valid.
   */
  valid: boolean | null;
  /**
   * Whether the field has a value.
   */
  filled: boolean;
  /**
   * Whether the field is focused.
   */
  focused: boolean;
}

export interface FieldRootProps extends BaseUIComponentProps<'div', FieldRootState> {
  disabled?: boolean | undefined;
  name?: string | undefined;
  validate?:
    | ((
        value: unknown,
        formValues: Form.Values,
      ) => string | string[] | null | Promise<string | string[] | null>)
    | undefined;
  validationMode?: Form.ValidationMode | undefined;
  validationDebounceTime?: number | undefined;
  invalid?: boolean | undefined;
  dirty?: boolean | undefined;
  touched?: boolean | undefined;
  actionsRef?: React.RefObject<FieldRoot.Actions | null> | undefined;
}

export namespace FieldRoot {
  export type State = FieldRootState;
  export type Props = FieldRootProps;
  export type Actions = FieldRootActions;
}
