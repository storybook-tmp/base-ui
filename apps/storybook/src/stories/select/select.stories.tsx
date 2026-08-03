import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Select } from '@base-ui/react/select';
import theme from '@droppy/theme';
import './select.demo.css';
import { CaretUpDownIcon, CaretUpIcon, CaretDownIcon, CheckIcon } from './DemoSelect';

/**
 * Stories follow research/c-components/select (Tier 1): the four kept docs demos,
 * one story per documented use case (positioning, typeahead, forms, multiple
 * selection, object values, interop…), the required full open→navigate→select→close
 * interaction story, and three real-world recreations picked from the top code-ok
 * entries in research/d-real-world-usage/select/ranked.json.
 */
const meta = {
  title: 'Form inputs/Select',
  component: Select.Root,
  subcomponents: {
    'Select.Label': Select.Label,
    'Select.Trigger': Select.Trigger,
    'Select.Value': Select.Value,
    'Select.Icon': Select.Icon,
    'Select.Portal': Select.Portal,
    'Select.Positioner': Select.Positioner,
    'Select.Popup': Select.Popup,
    'Select.List': Select.List,
    'Select.Item': Select.Item,
    'Select.ItemText': Select.ItemText,
    'Select.ItemIndicator': Select.ItemIndicator,
    'Select.Group': Select.Group,
    'Select.GroupLabel': Select.GroupLabel,
    'Select.ScrollUpArrow': Select.ScrollUpArrow,
    'Select.ScrollDownArrow': Select.ScrollDownArrow,
  },
} satisfies Meta<typeof Select.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Shared data + local building blocks                                 */
/* ------------------------------------------------------------------ */

const apples = [
  { label: 'Gala', value: 'gala' },
  { label: 'Fuji', value: 'fuji' },
  { label: 'Honeycrisp', value: 'honeycrisp' },
  { label: 'Granny Smith', value: 'granny-smith' },
  { label: 'Pink Lady', value: 'pink-lady' },
];

const languages = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  rust: 'Rust',
  go: 'Go',
};

/* ------------------------------------------------------------------ */
/* Kept docs demos + core behavior                                     */
/* ------------------------------------------------------------------ */

/** The docs hero demo: labeled select with the `items` prop, a placeholder, and scroll arrows. Use as the starting point for choosing one predefined value in a form. */
export const Basic: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <div className={theme.FieldRoot}>
      <Select.Root items={apples}>
        <Select.Label className={theme.FieldLabel}>Apple</Select.Label>
        <Select.Trigger className={theme.SelectTrigger}>
          <Select.Value className={theme.SelectValue} placeholder="Select apple" />
          <Select.Icon className={theme.SelectIcon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={theme.SelectPositioner} sideOffset={4}>
            <Select.Popup className={theme.SelectPopup}>
              <Select.ScrollUpArrow className={theme.SelectScrollArrow}>
                <CaretUpIcon />
              </Select.ScrollUpArrow>
              <Select.List className={theme.SelectList}>
                {apples.map(({ label, value }) => (
                  <Select.Item key={value} value={value} className={theme.SelectItem}>
                    <Select.ItemIndicator className={theme.SelectItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={theme.SelectItemText}>{label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className={theme.SelectScrollArrow}>
                <CaretDownIcon />
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Value display                                                       */

/* ------------------------------------------------------------------ */
/* Multiple selection                                                  */
/* ------------------------------------------------------------------ */

/** Use `multiple` for array values: the popup stays open while selecting and the trigger renders comma-separated labels via `items` (kept docs demo). */
export const MultipleSelection: Story = {
  tags: ['api-ref', 'base'],
  render: () => (
    <div className={theme.FieldRoot}>
      <Select.Root multiple defaultValue={['javascript', 'typescript']} items={languages}>
        <Select.Label className={theme.FieldLabel}>Languages</Select.Label>
        <Select.Trigger className={theme.SelectTrigger}>
          <Select.Value className={theme.SelectValue} />
          <Select.Icon className={theme.SelectIcon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className={theme.SelectPositioner}
            sideOffset={4}
            alignItemWithTrigger={false}
          >
            <Select.Popup className={theme.SelectPopup}>
              <Select.List className={theme.SelectList}>
                {Object.entries(languages).map(([value, label]) => (
                  <Select.Item key={value} value={value} className={theme.SelectItem}>
                    <Select.ItemIndicator className={theme.SelectItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={theme.SelectItemText}>{label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('combobox');
    await expect(trigger).toHaveTextContent('JavaScript, TypeScript');

    await userEvent.click(trigger);
    const listbox = await body.findByRole('listbox');
    await userEvent.click(await body.findByRole('option', { name: 'Python' }));
    // Multiple mode keeps the popup open after selecting (waitFor: the popup may
    // still be inside its 100ms entrance transition, where opacity is 0).
    await waitFor(() => expect(listbox).toBeVisible());
    await userEvent.click(await body.findByRole('option', { name: 'Rust' }));

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await expect(trigger).toHaveTextContent('JavaScript, TypeScript, Python, Rust');
  },
};

/* ------------------------------------------------------------------ */
/* Object values & groups                                              */
/* ------------------------------------------------------------------ */

interface ShippingMethod {
  id: string;
  name: string;
  duration: string;
  price: string;
}

const shippingMethods: ShippingMethod[] = [
  { id: 'standard', name: 'Standard', duration: 'Delivers in 4-6 business days', price: '$4.99' },
  { id: 'express', name: 'Express', duration: 'Delivers in 2-3 business days', price: '$9.99' },
  { id: 'overnight', name: 'Overnight', duration: 'Delivers next business day', price: '$19.99' },
];

/** Use object values with `isItemEqualToValue` (non-referential equality), `itemToStringLabel` (typeahead/autofill label), and `itemToStringValue` (form serialization) — kept docs demo. */
export const ObjectValues: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <div className={theme.FieldRoot}>
      <Select.Root
        defaultValue={shippingMethods[0]}
        isItemEqualToValue={(itemValue, value) => itemValue.id === value.id}
        itemToStringLabel={(method) => method.name}
        itemToStringValue={(method) => method.id}
      >
        <Select.Label className={theme.FieldLabel}>Shipping method</Select.Label>
        <Select.Trigger className={theme.SelectTrigger}>
          <Select.Value>
            {(method: ShippingMethod) => (
              <span className={theme.SelectValueText}>
                <span className={theme.SelectValuePrimary}>{method.name}</span>
                <span className={theme.SelectValueSecondary}>
                  {method.duration} ({method.price})
                </span>
              </span>
            )}
          </Select.Value>
          <Select.Icon className={theme.SelectIcon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={theme.SelectPositioner} sideOffset={4}>
            <Select.Popup className={theme.SelectPopup}>
              <Select.List className={theme.SelectList}>
                {shippingMethods.map((method) => (
                  <Select.Item key={method.id} value={method} className={theme.SelectItem}>
                    <Select.ItemIndicator className={theme.SelectItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={theme.SelectItemText}>
                      <span className={theme.SelectItemLabel}>{method.name}</span>
                      <span className={theme.SelectItemDescription}>
                        {method.duration} ({method.price})
                      </span>
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  ),
};

const groupedProduce = [
  {
    value: 'Fruits',
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'mango', label: 'Mango' },
      { value: 'grape', label: 'Grape' },
    ],
  },
  {
    value: 'Vegetables',
    items: [
      { value: 'broccoli', label: 'Broccoli' },
      { value: 'carrot', label: 'Carrot' },
      { value: 'spinach', label: 'Spinach' },
      { value: 'zucchini', label: 'Zucchini' },
    ],
  },
];

/** Use `Group` + `GroupLabel` (auto-associated) and `Separator` for related options; the grouped array also feeds the `items` prop (kept docs demo). */
export const GroupedItems: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <div className={theme.FieldRoot}>
      <Select.Root items={groupedProduce}>
        <Select.Label className={theme.FieldLabel}>Produce</Select.Label>
        <Select.Trigger className={theme.SelectTrigger}>
          <Select.Value className={theme.SelectValue} placeholder="Select produce" />
          <Select.Icon className={theme.SelectIcon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={theme.SelectPositioner} sideOffset={4}>
            <Select.Popup className={theme.SelectPopup}>
              <Select.ScrollUpArrow className={theme.SelectScrollArrow}>
                <CaretUpIcon />
              </Select.ScrollUpArrow>
              <Select.List className={theme.SelectList}>
                {groupedProduce.map((group, index) => (
                  <React.Fragment key={group.value}>
                    <Select.Group className={theme.SelectGroup}>
                      <Select.GroupLabel className={theme.SelectGroupLabel}>
                        {group.value}
                      </Select.GroupLabel>
                      {group.items.map((item) => (
                        <Select.Item
                          key={item.value}
                          value={item.value}
                          className={theme.SelectItem}
                        >
                          <Select.ItemIndicator className={theme.SelectItemIndicator}>
                            <CheckIcon />
                          </Select.ItemIndicator>
                          <Select.ItemText className={theme.SelectItemText}>
                            {item.label}
                          </Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Group>
                    {index < groupedProduce.length - 1 ? (
                      <Select.Separator className={theme.SelectSeparator} />
                    ) : null}
                  </React.Fragment>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className={theme.SelectScrollArrow}>
                <CaretDownIcon />
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Long lists & positioning                                            */

/* ------------------------------------------------------------------ */
/* Keyboard, disabled, read-only                                       */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Forms                                                               */

/* ------------------------------------------------------------------ */
/* Modality, hover, animation, interop                                 */

/* ------------------------------------------------------------------ */
/* TypeScript                                                          */

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/select)         */
/* ------------------------------------------------------------------ */
