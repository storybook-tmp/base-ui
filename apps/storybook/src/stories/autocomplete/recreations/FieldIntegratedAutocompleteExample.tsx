import * as React from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import theme from '@droppy/theme';
import '../autocomplete.demo.css';
import '../autocomplete-real-world.demo.css';

/**
 * Recreation of cloudflare/kumo's Autocomplete wrapper: label/required/description/error
 * arrive as flat top-level props instead of composed `Field` children, and the component
 * wraps `Field.Root`/`Autocomplete.Root` internally. Kumo's own JSDoc draws the line for
 * consumers: "Unlike Combobox, the input value is not constrained to the suggestion list
 * items." Recomposed from the ideas in cloudflare/kumo `autocomplete.tsx` (MIT, code-ok,
 * research/d-real-world-usage/autocomplete/ranked.json #7).
 */
function LabeledAutocomplete({
  name,
  label,
  description,
  errorMessage,
  required,
  placeholder,
  items,
}: {
  name: string;
  label: string;
  description?: string;
  errorMessage?: string;
  required?: boolean;
  placeholder?: string;
  items: readonly string[];
}) {
  return (
    <Field.Root name={name} className={theme.FieldRoot}>
      <Field.Label className={theme.FieldLabel}>{label}</Field.Label>
      <Autocomplete.Root items={items} required={required}>
        <Autocomplete.Input placeholder={placeholder} className={theme.AutocompleteInput} />
        <Autocomplete.Portal>
          <Autocomplete.Positioner className={theme.AutocompletePositioner} sideOffset={4}>
            <Autocomplete.Popup className={theme.AutocompletePopup}>
              <Autocomplete.Empty className={theme.AutocompleteEmpty}>
                No matches.
              </Autocomplete.Empty>
              <Autocomplete.List className={theme.AutocompleteList}>
                {(item: string) => (
                  <Autocomplete.Item key={item} value={item} className={theme.AutocompleteItem}>
                    {item}
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
      {description ? (
        <Field.Description className={theme.FieldDescription}>{description}</Field.Description>
      ) : null}
      <Field.Error className={theme.FieldError} match="valueMissing">
        {errorMessage ?? 'This field is required.'}
      </Field.Error>
    </Field.Root>
  );
}

const destinations = ['Amsterdam', 'Berlin', 'Lisbon', 'Prague', 'Reykjavik'];

export function FieldIntegratedAutocompleteExample() {
  const [status, setStatus] = React.useState<string | null>(null);
  return (
    <Form
      className={theme.FormRoot}
      onSubmit={(event) => {
        event.preventDefault();
        setStatus('Submitted');
      }}
    >
      <LabeledAutocomplete
        name="destination"
        label="Destination"
        description="Unlike Combobox, any typed value is accepted — suggestions only help."
        errorMessage="Please enter a destination."
        required
        placeholder="e.g. Lisbon"
        items={destinations}
      />
      <button type="submit" className={theme.Button}>
        Book trip
      </button>
      {status ? <output className="AutocompleteDemoOutput">{status}</output> : null}
    </Form>
  );
}
