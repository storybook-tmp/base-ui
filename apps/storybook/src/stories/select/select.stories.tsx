import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Select } from '@base-ui/react/select';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import theme from '@droppy/theme';
import './select.demo.css';
import { DemoSelect, CaretUpDownIcon, CaretUpIcon, CaretDownIcon, CheckIcon } from './DemoSelect';

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

const themeItems = [
  { value: null, label: 'Select theme' },
  { value: 'system', label: 'System default' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
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

function OpenSelectCloseExample() {
  const [lastChange, setLastChange] = React.useState('none yet');
  return (
    <div className="SelectDemoStack">
      <DemoSelect
        label="Apple"
        placeholder="Select apple"
        options={apples}
        root={{
          defaultValue: 'gala',
          onValueChange: (value, eventDetails) =>
            setLastChange(`${value} (reason: ${eventDetails.reason})`),
        }}
      />
      <output className="SelectDemoOutput">onValueChange: {lastChange}</output>
    </div>
  );
}

/** The full interaction contract in one story: open on click, move the highlight with arrow keys, commit with Enter, close, and receive `(value, eventDetails)`. The popup portals to `document.body`. */
export const OpenSelectClose: Story = {
  tags: ['api-ref'],
  render: () => <OpenSelectCloseExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('combobox');

    await userEvent.click(trigger);
    const listbox = await body.findByRole('listbox');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Opening focuses the selected item (Gala); ArrowDown moves to Fuji.
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await expect(listbox).not.toBeVisible();
    await expect(trigger).toHaveTextContent('Fuji');
    await expect(canvas.getByText('onValueChange: fuji (reason: item-press)')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Value display                                                       */
/* ------------------------------------------------------------------ */

/** Use `<Select.Value placeholder>` for display-only placeholder text; style it via `[data-placeholder]`. Users cannot clear the value from the select itself. */
export const PlaceholderValue: Story = {
  tags: ['api-ref'],
  render: () => (
    <DemoSelect
      label="Theme"
      placeholder="Select theme"
      options={themeItems.filter((item) => item.value !== null)}
    />
  ),
};

const fontFamilies: Record<string, string> = {
  monospace: 'Monospace',
  serif: 'Serif',
  'sans-serif': 'Sans-serif',
};

/** Pass a function as `<Select.Value>` children to render a formatted value — here previewing the font family itself (docs "Formatting the value"). */
export const FormattedValue: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className={theme.FieldRoot}>
      <Select.Root defaultValue="monospace">
        <Select.Label className={theme.FieldLabel}>Font family</Select.Label>
        <Select.Trigger className={theme.SelectTrigger}>
          <Select.Value className={theme.SelectValue}>
            {(value: string) => <span style={{ fontFamily: value }}>{fontFamilies[value]}</span>}
          </Select.Value>
          <Select.Icon className={theme.SelectIcon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={theme.SelectPositioner} sideOffset={4}>
            <Select.Popup className={theme.SelectPopup}>
              <Select.List className={theme.SelectList}>
                {Object.entries(fontFamilies).map(([value, label]) => (
                  <Select.Item key={value} value={value} className={theme.SelectItem}>
                    <Select.ItemIndicator className={theme.SelectItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={theme.SelectItemText}>
                      <span style={{ fontFamily: value }}>{label}</span>
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

function MultipleClearAllExample() {
  const [value, setValue] = React.useState<string[]>(['javascript', 'typescript']);
  return (
    <div className="SelectDemoStack">
      <div className="SelectDemoRow">
        <DemoSelectMultiple value={value} onValueChange={setValue} />
        <button type="button" className={theme.Button} onClick={() => setValue([])}>
          Clear all
        </button>
      </div>
      <output className="SelectDemoOutput">{value.length} selected</output>
    </div>
  );
}

function DemoSelectMultiple({
  value,
  onValueChange,
}: {
  value: string[];
  onValueChange: (value: string[]) => void;
}) {
  return (
    <div className={theme.FieldRoot}>
      <Select.Root multiple value={value} onValueChange={onValueChange} items={languages}>
        <Select.Label className={theme.FieldLabel}>Languages</Select.Label>
        <Select.Trigger className={theme.SelectTrigger}>
          <Select.Value className={theme.SelectValue} placeholder="Select languages" />
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
                {Object.entries(languages).map(([itemValue, label]) => (
                  <Select.Item key={itemValue} value={itemValue} className={theme.SelectItem}>
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
  );
}

/** Base UI deliberately ships no built-in Clear button (#2734) — pair a controlled `multiple` select with an external "Clear all" action instead. */
export const MultipleControlledWithClearAll: Story = {
  tags: ['api-ref'],
  render: () => <MultipleClearAllExample />,
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('combobox');
    await expect(canvas.getByText('2 selected')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Clear all' }));
    await expect(canvas.getByText('0 selected')).toBeVisible();
    await expect(trigger).toHaveTextContent('Select languages');
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

/** The default macOS-style mode: the popup overlaps the trigger so the selected item's text aligns with the trigger text, and `data-side` becomes `"none"` for styling. Falls back to anchored positioning on touch or when space is tight. */
export const AlignItemWithTriggerDefault: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className={theme.FieldRoot}>
      <Select.Root items={apples} defaultValue="honeycrisp">
        <Select.Label className={theme.FieldLabel}>Apple</Select.Label>
        <Select.Trigger className={theme.SelectTrigger}>
          <Select.Value className={theme.SelectValue} />
          <Select.Icon className={theme.SelectIcon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={theme.SelectPositioner}>
            {/* Without Select.List, the Popup itself is the listbox and carries data-side. */}
            <Select.Popup className={theme.SelectPopup}>
              {apples.map(({ label, value }) => (
                <Select.Item key={value} value={value} className={theme.SelectItem}>
                  <Select.ItemIndicator className={theme.SelectItemIndicator}>
                    <CheckIcon />
                  </Select.ItemIndicator>
                  <Select.ItemText className={theme.SelectItemText}>{label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('combobox'));
    const listbox = await body.findByRole('listbox');
    // Item-aligned mode is active: side/align are ignored and data-side is "none".
    await waitFor(() => expect(listbox).toHaveAttribute('data-side', 'none'));

    await userEvent.keyboard('{Escape}');
  },
};

/** DirectionProvider + `dir="rtl"`: item alignment and indicator columns follow the text direction (recreates `experiments/select-rtl-align-item-with-trigger.tsx`). */
export const RTLItemAlignment: Story = {
  tags: ['api-ref'],
  render: () => (
    <div dir="rtl" className="SelectDemoRtl">
      <DirectionProvider direction="rtl">
        <DemoSelect
          label="اللهجة"
          placeholder="اختر لهجة"
          options={[
            { value: 'arabic', label: 'العربية الفصحى' },
            { value: 'levantine', label: 'العربية الشامية' },
            { value: 'maghrebi', label: 'العربية المغاربية' },
            { value: 'sudanese', label: 'العربية السودانية' },
            { value: 'gulf', label: 'العربية الخليجية' },
          ]}
          root={{ defaultValue: 'arabic' }}
        />
      </DirectionProvider>
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Keyboard, disabled, read-only                                       */
/* ------------------------------------------------------------------ */

/** Disabled items stay focusable so screen reader users can discover them, but they cannot be selected; a `disabled` root disables the whole control. */
export const DisabledOptions: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="SelectDemoRow">
      <DemoSelect
        label="Fruit"
        options={[
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana', disabled: true },
          { value: 'cherry', label: 'Cherry' },
        ]}
        root={{ defaultValue: 'apple' }}
      />
      <DemoSelect
        label="Plan"
        options={[
          { value: 'free', label: 'Free' },
          { value: 'pro', label: 'Pro' },
        ]}
        root={{ defaultValue: 'free', disabled: true }}
      />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const [fruitTrigger, planTrigger] = canvas.getAllByRole('combobox');
    await expect(planTrigger).toBeDisabled();

    await userEvent.click(fruitTrigger);
    const listbox = await body.findByRole('listbox');

    // Opening focuses the selected item ("Apple") once positioning settles.
    const apple = await body.findByRole('option', { name: 'Apple' });
    await waitFor(() => expect(apple).toHaveFocus());

    // ArrowDown moves onto the disabled item: focusable so AT users can discover it.
    await userEvent.keyboard('{ArrowDown}');
    const banana = await body.findByRole('option', { name: 'Banana' });
    await expect(banana).toHaveAttribute('aria-disabled', 'true');
    await waitFor(() => expect(banana).toHaveFocus());

    // Enter on a disabled item selects nothing and keeps the popup open.
    await userEvent.keyboard('{Enter}');
    await expect(listbox).toBeVisible();
    await expect(fruitTrigger).toHaveTextContent('Apple');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(fruitTrigger).toHaveAttribute('aria-expanded', 'false'));
  },
};

/** `readOnly` exposes the value but blocks opening by pointer and keyboard (#2717) — use it for temporarily locked form state instead of `disabled` when the value must stay readable and submittable. */
export const ReadOnly: Story = {
  tags: ['api-ref'],
  render: () => (
    <DemoSelect label="Apple" options={apples} root={{ defaultValue: 'fuji', readOnly: true }} />
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('combobox');
    await expect(trigger).toHaveAttribute('aria-readonly', 'true');

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

/* ------------------------------------------------------------------ */
/* Forms                                                               */

/* ------------------------------------------------------------------ */
/* Modality, hover, animation, interop                                 */
/* ------------------------------------------------------------------ */

/** Set `modal={false}` to keep the rest of the page scrollable and interactive while the popup is open (default `modal` locks scroll and disables outside pointers). */
export const NonModal: Story = {
  tags: ['api-ref'],
  render: () => (
    <div className="SelectDemoRow">
      <DemoSelect
        label="Apple"
        placeholder="Select apple"
        options={apples}
        root={{ modal: false }}
      />
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the WCAG-documented
          fix for a scrollable-but-otherwise-static region (axe `scrollable-region-focusable`,
          technique SCR29) is exactly `tabindex="0"` + `role="region"` on the region itself. */}
      <div tabIndex={0} role="region" aria-label="Page content" className="SelectDemoScrollArea">
        <p>This page content stays scrollable while the non-modal select is open.</p>
        <p>Scroll me.</p>
        <p>Keep scrolling.</p>
        <p>Almost there.</p>
        <p>The end.</p>
      </div>
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* TypeScript                                                          */

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/select)         */
/* ------------------------------------------------------------------ */
