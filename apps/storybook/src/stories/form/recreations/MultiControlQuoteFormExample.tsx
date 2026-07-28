import * as React from 'react';
import { Form } from '@base-ui/react/form';
import { Field } from '@base-ui/react/field';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { NumberField } from '@base-ui/react/number-field';
import theme from '@droppy/theme';
import '../form.demo.css';

const projectTypes = ['Marketing site', 'Web app', 'Mobile app', 'Internal tool', 'API service'];

/**
 * Recreation of the "request a project quote" form in patrick-xin/lumi-ui's
 * `form-rhf.tsx`: one `<Form>` around a deliberately heterogeneous control set
 * (Autocomplete, NumberField, a plain Field.Control) to prove Form doesn't care what's
 * nested inside it — the single file in the whole research corpus mixing this many
 * Base UI control types under one submission flow. (react-hook-form itself isn't a
 * dependency of this repo, so the library-ownership glue is dropped; the multi-control
 * composition is the part being recreated.) Recomposed from the ideas in
 * patrick-xin/lumi-ui `form-rhf.tsx` (MIT, code-ok,
 * research/d-real-world-usage/form/ranked.json #1).
 */
export function MultiControlQuoteFormExample() {
  const [payload, setPayload] = React.useState<string | null>(null);

  return (
    <Form
      className={theme.FormRoot}
      onFormSubmit={(formValues) => {
        setPayload(JSON.stringify(formValues));
      }}
    >
      <Field.Root name="projectType" className={theme.FieldRoot}>
        <Autocomplete.Root items={projectTypes} required>
          <Field.Label className={theme.FieldLabel}>
            Project type
            <Autocomplete.Input placeholder="e.g. Web app" className={theme.AutocompleteInput} />
          </Field.Label>
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
        <Field.Error className={theme.FieldError} match="valueMissing">
          Please enter a project type.
        </Field.Error>
      </Field.Root>

      <Field.Root name="budget" className={theme.FieldRoot}>
        <NumberField.Root defaultValue={5000} min={0} step={500} className={theme.NumberFieldRoot}>
          <Field.Label className={theme.FieldLabel}>Budget (USD)</Field.Label>
          <NumberField.Group className={theme.NumberFieldGroup}>
            <NumberField.Decrement className={theme.NumberFieldDecrement}>−</NumberField.Decrement>
            <NumberField.Input className={theme.NumberFieldInput} />
            <NumberField.Increment className={theme.NumberFieldIncrement}>+</NumberField.Increment>
          </NumberField.Group>
        </NumberField.Root>
      </Field.Root>

      <Field.Root name="email" className={theme.FieldRoot}>
        <Field.Label className={theme.FieldLabel}>Contact email</Field.Label>
        <Field.Control
          type="email"
          required
          placeholder="you@company.com"
          className={theme.Input}
        />
        <Field.Error className={theme.FieldError} match="valueMissing">
          Please enter your email.
        </Field.Error>
      </Field.Root>

      <button type="submit" className={theme.Button}>
        Request quote
      </button>
      {payload ? (
        // The WCAG-documented fix for a scrollable-but-otherwise-static region (axe
        // `scrollable-region-focusable`, technique SCR29) is exactly `tabindex="0"` +
        // `role="region"` on the region itself.
        <pre
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          role="region"
          aria-label="Submitted quote request"
          className="FormDemoPre"
        >
          {payload}
        </pre>
      ) : null}
    </Form>
  );
}
