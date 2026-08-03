'use client';
import * as React from 'react';
import { AriaCombobox, type AriaComboboxState } from '../../combobox/root/AriaCombobox';
import { useCoreFilter } from '../../combobox/root/utils/useFilter';
import { stringifyAsLabel } from '../../internals/resolveValueLabel';
import { REASONS } from '../../internals/reasons';

/**
 * Groups all parts of the autocomplete.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export function AutocompleteRoot<Items extends readonly { items: readonly any[] }[]>(
  props: Omit<AutocompleteRoot.Props<Items[number]['items'][number]>, 'items'> & {
    /**
     * The items to be displayed in the list.
     * Can be either a flat array of items or an array of groups with items.
     */
    items: Items;
  },
): React.JSX.Element;
export function AutocompleteRoot<ItemValue>(
  props: Omit<AutocompleteRoot.Props<ItemValue>, 'items'> & {
    /**
     * The items to be displayed in the list.
     * Can be either a flat array of items or an array of groups with items.
     */
    items?: readonly ItemValue[] | undefined;
  },
): React.JSX.Element;
export function AutocompleteRoot<ItemValue>(
  props: AutocompleteRoot.Props<ItemValue>,
): React.JSX.Element {
  const {
    openOnInputClick = false,
    value,
    defaultValue,
    onValueChange,
    mode = 'list',
    itemToStringValue,
    ...other
  } = props;

  const enableInline = mode === 'inline' || mode === 'both';
  const staticItems = mode === 'inline' || mode === 'none';

  // Mirror the typed value for uncontrolled usage so we can compose the temporary
  // inline input value.
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
  const [inlineInputValue, setInlineInputValue] = React.useState('');

  React.useEffect(() => {
    if (isControlled) {
      setInlineInputValue('');
    }
  }, [value, isControlled]);

  // Compose the input value shown to the user: inline value takes precedence when present.
  let resolvedInputValue: typeof value;
  if (enableInline && inlineInputValue !== '') {
    resolvedInputValue = inlineInputValue;
  } else if (isControlled) {
    resolvedInputValue = value ?? '';
  } else {
    resolvedInputValue = internalValue;
  }

  const collator = useCoreFilter();

  const baseFilter = React.useMemo<Exclude<typeof other.filter, undefined>>(() => {
    if (other.filter !== undefined) {
      return other.filter;
    }
    return collator.contains;
  }, [other.filter, collator]);

  const resolvedQuery = String(isControlled ? value : internalValue).trim();

  // In "both", wrap filtering to use only the typed value, ignoring the inline value.
  const resolvedFilter: typeof other.filter = React.useMemo(() => {
    if (mode !== 'both') {
      return staticItems ? null : baseFilter;
    }
    if (baseFilter === null) {
      return null;
    }
    return (item, _query, toString) => {
      return baseFilter(item, resolvedQuery, toString);
    };
  }, [baseFilter, mode, resolvedQuery, staticItems]);

  function handleValueChange(nextValue: string, eventDetails: AutocompleteRoot.ChangeEventDetails) {
    setInlineInputValue('');
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue, eventDetails);
  }

  function handleItemHighlighted(
    highlightedValue: any,
    eventDetails: AriaCombobox.HighlightEventDetails,
  ) {
    props.onItemHighlighted?.(highlightedValue, eventDetails);

    if (eventDetails.reason === REASONS.pointer) {
      return;
    }

    if (enableInline) {
      if (highlightedValue == null) {
        setInlineInputValue('');
      } else {
        setInlineInputValue(stringifyAsLabel(highlightedValue, itemToStringValue));
      }
    } else {
      setInlineInputValue('');
    }
  }

  return (
    <AriaCombobox
      {...other}
      itemToStringLabel={itemToStringValue}
      openOnInputClick={openOnInputClick}
      selectionMode="none"
      fillInputOnItemPress
      filter={resolvedFilter}
      autoComplete={mode}
      inputValue={resolvedInputValue}
      defaultInputValue={defaultValue}
      onInputValueChange={handleValueChange}
      onItemHighlighted={handleItemHighlighted}
    />
  );
}

export interface AutocompleteRootState extends AriaComboboxState {}

export interface AutocompleteRootActions {
  unmount: () => void;
}

export type AutocompleteRootChangeEventReason = AriaCombobox.ChangeEventReason;
export type AutocompleteRootChangeEventDetails = AriaCombobox.ChangeEventDetails;

export type AutocompleteRootHighlightEventReason = AriaCombobox.HighlightEventReason;
export type AutocompleteRootHighlightEventDetails = AriaCombobox.HighlightEventDetails;

export interface AutocompleteRootProps<ItemValue> extends Omit<
  AriaCombobox.Props<ItemValue, 'none'>,
  | 'selectionMode'
  | 'selectedValue'
  | 'defaultSelectedValue'
  | 'onSelectedValueChange'
  | 'fillInputOnItemPress'
  | 'itemToStringValue'
  | 'isItemEqualToValue'
  // Different names
  | 'inputValue' // value
  | 'defaultInputValue' // defaultValue
  | 'onInputValueChange' // onValueChange
  | 'autoComplete' // mode
  | 'formAutoComplete'
  | 'itemToStringLabel' // itemToStringValue
  // Custom JSDoc
  | 'inline'
  | 'autoHighlight'
  | 'keepHighlight'
  | 'highlightItemOnHover'
  | 'actionsRef'
  | 'onOpenChange'
  | 'openOnInputClick'
  | 'form'
> {
  form?: string | undefined;
  mode?: 'list' | 'both' | 'inline' | 'none' | undefined;
  inline?: boolean | undefined;
  autoHighlight?: boolean | 'always' | undefined;
  keepHighlight?: boolean | undefined;
  highlightItemOnHover?: boolean | undefined;
  defaultValue?:
    | AriaCombobox.Props<React.ComponentProps<'input'>['defaultValue'], 'none'>['defaultInputValue']
    | undefined;
  value?:
    | AriaCombobox.Props<React.ComponentProps<'input'>['value'], 'none'>['inputValue']
    | undefined;
  onValueChange?:
    | ((value: string, eventDetails: AutocompleteRootChangeEventDetails) => void)
    | undefined;
  submitOnItemClick?: AriaCombobox.Props<ItemValue, 'none'>['submitOnItemClick'] | undefined;
  itemToStringValue?: ((itemValue: ItemValue) => string) | undefined;
  actionsRef?: React.RefObject<AutocompleteRootActions | null> | undefined;
  onOpenChange?:
    | ((open: boolean, eventDetails: AutocompleteRootChangeEventDetails) => void)
    | undefined;
  onItemHighlighted?:
    | ((
        highlightedValue: ItemValue | undefined,
        eventDetails: AutocompleteRootHighlightEventDetails,
      ) => void)
    | undefined;
  openOnInputClick?: boolean | undefined;
}

export namespace AutocompleteRoot {
  export type Props<ItemValue> = AutocompleteRootProps<ItemValue>;
  export type State = AutocompleteRootState;
  export type Actions = AutocompleteRootActions;
  export type ChangeEventReason = AutocompleteRootChangeEventReason;
  export type ChangeEventDetails = AutocompleteRootChangeEventDetails;
  export type HighlightEventReason = AutocompleteRootHighlightEventReason;
  export type HighlightEventDetails = AutocompleteRootHighlightEventDetails;
}
