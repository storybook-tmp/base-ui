import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Combobox } from '@base-ui/react/combobox';
import { Dialog } from '@base-ui/react/dialog';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { useTimeout } from '@base-ui/utils/useTimeout';
import theme from '@droppy/theme';
import './combobox.demo.css';

/**
 * Stories follow research/c-components/combobox (Tier 1): the kept docs demos
 * (hero, multiple+chips, grouped, async single/multiple, creatable, virtualized,
 * input-inside-popup), one story per documented behavior (filtering, useFilter,
 * useFilteredItems, empty state, chips keyboard flow, object values, grid, inline,
 * clearing, forms, animation), and the required full open→filter→select→close
 * interaction story. The virtualized story hand-rolls windowing because this
 * Storybook has no @tanstack/react-virtual dependency (the docs demo uses it).
 */
const meta = {
  title: 'Form inputs/Combobox',
  component: Combobox.Root,
  subcomponents: {
    'Combobox.Label': Combobox.Label,
    'Combobox.Value': Combobox.Value,
    'Combobox.Input': Combobox.Input,
    'Combobox.InputGroup': Combobox.InputGroup,
    'Combobox.Trigger': Combobox.Trigger,
    'Combobox.Icon': Combobox.Icon,
    'Combobox.Clear': Combobox.Clear,
    'Combobox.Chips': Combobox.Chips,
    'Combobox.Chip': Combobox.Chip,
    'Combobox.ChipRemove': Combobox.ChipRemove,
    'Combobox.Portal': Combobox.Portal,
    'Combobox.Positioner': Combobox.Positioner,
    'Combobox.Popup': Combobox.Popup,
    'Combobox.Status': Combobox.Status,
    'Combobox.Empty': Combobox.Empty,
    'Combobox.List': Combobox.List,
    'Combobox.Row': Combobox.Row,
    'Combobox.Item': Combobox.Item,
    'Combobox.ItemIndicator': Combobox.ItemIndicator,
    'Combobox.Group': Combobox.Group,
    'Combobox.GroupLabel': Combobox.GroupLabel,
    'Combobox.Collection': Combobox.Collection,
  },
} satisfies Meta<typeof Combobox.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Shared data + local building blocks                                 */
/* ------------------------------------------------------------------ */

interface Fruit {
  value: string;
  label: string;
}

const fruits: Fruit[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Orange' },
  { value: 'pineapple', label: 'Pineapple' },
  { value: 'grape', label: 'Grape' },
  { value: 'mango', label: 'Mango' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'raspberry', label: 'Raspberry' },
  { value: 'blackberry', label: 'Blackberry' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'peach', label: 'Peach' },
  { value: 'kiwi', label: 'Kiwi' },
  { value: 'watermelon', label: 'Watermelon' },
];

const kiwi = fruits.find((fruit) => fruit.value === 'kiwi') ?? fruits[0];

interface Lang {
  value: string;
  label: string;
}

const langs: Lang[] = [
  { value: 'js', label: 'JavaScript' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'py', label: 'Python' },
  { value: 'rb', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
];

interface Person {
  id: string;
  name: string;
}

const scientists: Person[] = [
  { id: 'ada', name: 'Ada Lovelace' },
  { id: 'grace', name: 'Grace Hopper' },
  { id: 'katherine', name: 'Katherine Johnson' },
  { id: 'radia', name: 'Radia Perlman' },
];

/**
 * Standard hero-styled anatomy shared by the behavior stories: input outside the
 * popup, caret trigger and (conditionally mounted) clear button in an InputGroup.
 */
function DemoCombobox({
  label,
  placeholder,
  items = fruits,
  root,
  popupClassName = theme.ComboboxPopup,
}: {
  label: string;
  placeholder?: string;
  items?: Fruit[];
  root?: Partial<Combobox.Root.Props<Fruit, false>>;
  popupClassName?: string;
}) {
  const id = React.useId();
  return (
    <Combobox.Root items={items} {...root}>
      <div className={theme.FieldLabel}>
        <label htmlFor={id}>{label}</label>
        <Combobox.InputGroup className={theme.ComboboxInputGroup}>
          <Combobox.Input placeholder={placeholder} id={id} className={theme.ComboboxInput} />
          <div className={theme.ComboboxActionButtons}>
            <Combobox.Clear className={theme.ComboboxClear} aria-label="Clear selection">
              <XIcon />
            </Combobox.Clear>
            <Combobox.Trigger className={theme.ComboboxTrigger} aria-label="Open popup">
              <CaretDownIcon />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className={theme.ComboboxPositioner} sideOffset={4}>
          <Combobox.Popup className={popupClassName}>
            <Combobox.Empty>
              <div className={theme.ComboboxEmpty}>No fruits found.</div>
            </Combobox.Empty>
            <Combobox.List className={theme.ComboboxList}>
              {(item: Fruit) => (
                <Combobox.Item key={item.value} value={item} className={theme.ComboboxItem}>
                  <Combobox.ItemIndicator className={theme.ComboboxItemIndicator}>
                    <CheckIcon />
                  </Combobox.ItemIndicator>
                  <span className={theme.ComboboxItemText}>{item.label}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** Chips anatomy for multiple selection (adapted from the docs "Multiple select" demo). */
function ChipsCombobox({ root }: { root?: Partial<Combobox.Root.Props<Lang, true>> }) {
  const id = React.useId();
  return (
    <Combobox.Root items={langs} multiple {...root}>
      <div className={theme.FieldLabel}>
        <label htmlFor={id}>Languages</label>
        <Combobox.InputGroup className={theme.ComboboxChipsInputGroup}>
          <Combobox.Chips className={theme.ComboboxChips}>
            <Combobox.Value>
              {(value: Lang[]) => (
                <React.Fragment>
                  {value.map((lang) => (
                    <Combobox.Chip
                      key={lang.value}
                      className={theme.ComboboxChip}
                      aria-label={lang.label}
                    >
                      {lang.label}
                      <Combobox.ChipRemove
                        className={theme.ComboboxChipRemove}
                        aria-label={`Remove ${lang.label}`}
                      >
                        <XIcon />
                      </Combobox.ChipRemove>
                    </Combobox.Chip>
                  ))}
                  <Combobox.Input
                    id={id}
                    placeholder={value.length > 0 ? '' : 'e.g. TypeScript'}
                    className={theme.ComboboxChipsInput}
                  />
                </React.Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
        </Combobox.InputGroup>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className={theme.ComboboxPositioner} sideOffset={4}>
          <Combobox.Popup className={theme.ComboboxPopup}>
            <Combobox.Empty>
              <div className={theme.ComboboxEmpty}>No languages found.</div>
            </Combobox.Empty>
            <Combobox.List className={theme.ComboboxList}>
              {(lang: Lang) => (
                <Combobox.Item key={lang.value} value={lang} className={theme.ComboboxItem}>
                  <Combobox.ItemIndicator className={theme.ComboboxItemIndicator}>
                    <CheckIcon />
                  </Combobox.ItemIndicator>
                  <span className={theme.ComboboxItemText}>{lang.label}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Hero + the full interaction contract                                */
/* ------------------------------------------------------------------ */

/** The docs hero demo: a labeled input filtering a fruit list, with a caret trigger and a clear button that mounts only while a value is selected. Use as the starting point for choosing one predefined value from a large list. */
// The combobox demos render both a Combobox.Input and a Combobox.Trigger; in the production
// build the trigger also exposes role="combobox", so getByRole("combobox") is ambiguous there.
// Always target the text <input>.
function comboboxInput(scope: { getAllByRole(role: string): HTMLElement[] }): HTMLInputElement {
  const all = scope.getAllByRole('combobox');
  return (all.find((el) => el instanceof HTMLInputElement) ?? all[0]) as HTMLInputElement;
}

export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => <DemoCombobox label="Choose a fruit" placeholder="e.g. Apple" />,
};

/* ------------------------------------------------------------------ */
/* Controlled state                                                    */
/* ------------------------------------------------------------------ */

function ControlledValueAndInputExample() {
  const [value, setValue] = React.useState<Fruit | null>(null);
  const [inputValue, setInputValue] = React.useState('');
  return (
    <div className="ComboboxDemoStack">
      <DemoCombobox
        label="Fruit"
        placeholder="e.g. Apple"
        root={{ value, onValueChange: setValue, inputValue, onInputValueChange: setInputValue }}
      />
      <div className="ComboboxDemoRow">
        <button
          type="button"
          className={theme.Button}
          onClick={() => {
            setValue(kiwi);
            setInputValue(kiwi.label);
          }}
        >
          Select Kiwi
        </button>
        <button
          type="button"
          className={theme.Button}
          onClick={() => {
            setValue(null);
            setInputValue('');
          }}
        >
          Clear (null)
        </button>
      </div>
      <output className="ComboboxDemoOutput">value: {value ? value.value : 'null'}</output>
    </div>
  );
}

/** The two text-bearing state axes are controlled separately: `value`/`onValueChange` (the committed selection) and `inputValue`/`onInputValueChange` (the text). Programmatic changes update the field without mounting or opening the popup; clear with `null`. */
export const ControlledValueAndInput: Story = {
  tags: ['highlight'],
  render: () => <ControlledValueAndInputExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = comboboxInput(canvas);

    await userEvent.click(canvas.getByRole('button', { name: 'Select Kiwi' }));
    await expect(input).toHaveValue('Kiwi');
    await expect(canvas.getByText('value: kiwi')).toBeVisible();
    // Programmatic value changes must not open the popup.
    await expect(body.queryByRole('listbox')).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Clear (null)' }));
    await expect(input).toHaveValue('');
    await expect(canvas.getByText('value: null')).toBeVisible();
  },
};

function ControlledOpenExample() {
  const [open, setOpen] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);
  return (
    <div className="ComboboxDemoStack">
      <DemoCombobox
        label="Fruit"
        placeholder="e.g. Apple"
        root={{
          open,
          onOpenChange: (nextOpen, eventDetails) => {
            // Veto light dismissal so only explicit actions close the popup.
            if (eventDetails.reason === 'outside-press' || eventDetails.reason === 'focus-out') {
              eventDetails.cancel();
              setLog((entries) => [...entries, `${eventDetails.reason} (canceled)`]);
              return;
            }
            setOpen(nextOpen);
            setLog((entries) => [...entries, eventDetails.reason]);
          },
        }}
      />
      <button type="button" className={theme.Button}>
        Outside area
      </button>
      <output className="ComboboxDemoOutput">
        reasons: {log.length > 0 ? log.join(', ') : 'none'}
      </output>
    </div>
  );
}

/** Use `open` + `onOpenChange` to control the popup. Every change request carries a typed `reason` — clicking the input reports `input-press`, distinct from `trigger-press` (#4015) — and `eventDetails.cancel()` vetoes the change, here keeping the popup open through outside presses. */
export const ControlledOpenWithEventDetails: Story = {
  tags: ['highlight'],
  render: () => <ControlledOpenExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = comboboxInput(canvas);

    await userEvent.click(input);
    const listbox = await body.findByRole('listbox');
    await waitFor(() => expect(listbox).toBeVisible());
    await expect(canvas.getByText(/input-press/)).toBeVisible();

    // Outside press is canceled by the handler, so the popup stays open.
    // (While open, content outside the combobox is aria-hidden, so query by text.)
    await userEvent.click(canvas.getByText('Outside area'));
    await expect(canvas.getByText(/outside-press \(canceled\)/)).toBeVisible();
    await waitFor(() => expect(listbox).toBeVisible());

    // Escape is not canceled and closes the popup.
    await userEvent.click(input);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
    await expect(canvas.getByText(/escape-key/)).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Filtering                                                           */
/* ------------------------------------------------------------------ */

const cities = ['São Paulo', 'Zürich', 'Kraków', 'Reykjavík', 'Málaga', 'Montréal', 'New York'];

function UseFilterExample() {
  const { contains } = Combobox.useFilter();
  const id = React.useId();
  return (
    <Combobox.Root items={cities} filter={contains}>
      <div className={theme.FieldLabel}>
        <label htmlFor={id}>City</label>
        <Combobox.InputGroup className={theme.ComboboxInputGroup}>
          <Combobox.Input placeholder="e.g. Zurich" id={id} className={theme.ComboboxInput} />
          <div className={theme.ComboboxActionButtons}>
            <Combobox.Trigger className={theme.ComboboxTrigger} aria-label="Open popup">
              <CaretDownIcon />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className={theme.ComboboxPositioner} sideOffset={4}>
          <Combobox.Popup className={theme.ComboboxPopup}>
            <Combobox.Empty>
              <div className={theme.ComboboxEmpty}>No cities found.</div>
            </Combobox.Empty>
            <Combobox.List className={theme.ComboboxList}>
              {(city: string) => (
                <Combobox.Item key={city} value={city} className={theme.ComboboxItem}>
                  <Combobox.ItemIndicator className={theme.ComboboxItemIndicator}>
                    <CheckIcon />
                  </Combobox.ItemIndicator>
                  <span className={theme.ComboboxItemText}>{city}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** `Combobox.useFilter()` exposes the same `Intl.Collator`-based matching the component uses internally (`contains`/`startsWith`/`endsWith`; case-, diacritic- and punctuation-insensitive). Pass one of them to the `filter` prop when building external filtering with identical semantics. */
export const ExternalFilterWithUseFilter: Story = {
  tags: ['highlight'],
  render: () => <UseFilterExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(comboboxInput(canvas));
    // Collator matching is diacritic-insensitive: "sao" matches "São Paulo".
    await userEvent.keyboard('sao');
    const match = await body.findByRole('option', { name: 'São Paulo' });
    await waitFor(() => expect(match).toBeVisible());
    await expect(body.queryByRole('option', { name: 'Zürich' })).not.toBeInTheDocument();
  },
};

function FilteredCount() {
  const filteredItems = Combobox.useFilteredItems<Fruit>();
  return (
    <div className={theme.ComboboxStatus}>
      {filteredItems.length} of {fruits.length} rows would render
    </div>
  );
}

/** `Combobox.useFilteredItems()` reads the internal filter's output from inside `<Combobox.Root>` — the hook virtualizers use to derive their row count (see the Virtualized story for the full pattern, #3732). */
export const UseFilteredItemsForVirtualizer: Story = {
  tags: ['highlight'],
  render: () => {
    return (
      <Combobox.Root items={fruits}>
        <div className={theme.FieldLabel}>
          <label htmlFor="use-filtered-items-input">Fruit</label>
          <Combobox.InputGroup className={theme.ComboboxInputGroup}>
            <Combobox.Input
              placeholder="e.g. Apple"
              id="use-filtered-items-input"
              className={theme.ComboboxInput}
            />
            <div className={theme.ComboboxActionButtons}>
              <Combobox.Trigger className={theme.ComboboxTrigger} aria-label="Open popup">
                <CaretDownIcon />
              </Combobox.Trigger>
            </div>
          </Combobox.InputGroup>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner className={theme.ComboboxPositioner} sideOffset={4}>
            <Combobox.Popup className={theme.ComboboxPopup}>
              <Combobox.Empty>
                <div className={theme.ComboboxEmpty}>No fruits found.</div>
              </Combobox.Empty>
              <Combobox.List className={theme.ComboboxList}>
                {(item: Fruit) => (
                  <Combobox.Item key={item.value} value={item} className={theme.ComboboxItem}>
                    <Combobox.ItemIndicator className={theme.ComboboxItemIndicator}>
                      <CheckIcon />
                    </Combobox.ItemIndicator>
                    <span className={theme.ComboboxItemText}>{item.label}</span>
                  </Combobox.Item>
                )}
              </Combobox.List>
              <FilteredCount />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    );
  },
};

/* ------------------------------------------------------------------ */
/* Multiple selection & chips                                          */
/* ------------------------------------------------------------------ */

/** The kept docs "Multiple select" demo: `multiple` turns the value into an array and the `Chips`/`Chip`/`ChipRemove` anatomy renders tokenized selections around the input, mapped through the `Combobox.Value` render prop. */
export const MultipleSelectionChips: Story = {
  tags: ['api-ref', 'base'],
  render: () => <ChipsCombobox />,
};

/* ------------------------------------------------------------------ */
/* Object values                                                       */
/* ------------------------------------------------------------------ */

function PersonAnatomy({ root }: { root?: Partial<Combobox.Root.Props<Person, false>> }) {
  const id = React.useId();
  return (
    <Combobox.Root
      items={scientists}
      itemToStringLabel={(person: Person) => person.name}
      isItemEqualToValue={(itemValue, value) => itemValue.id === value.id}
      {...root}
    >
      <div className={theme.FieldLabel}>
        <label htmlFor={id}>Scientist</label>
        <Combobox.InputGroup className={theme.ComboboxInputGroup}>
          <Combobox.Input placeholder="e.g. Ada" id={id} className={theme.ComboboxInput} />
          <div className={theme.ComboboxActionButtons}>
            <Combobox.Trigger className={theme.ComboboxTrigger} aria-label="Open popup">
              <CaretDownIcon />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className={theme.ComboboxPositioner} sideOffset={4}>
          <Combobox.Popup className={theme.ComboboxPopup}>
            <Combobox.Empty>
              <div className={theme.ComboboxEmpty}>No scientists found.</div>
            </Combobox.Empty>
            <Combobox.List className={theme.ComboboxList}>
              {(person: Person) => (
                <Combobox.Item key={person.id} value={person} className={theme.ComboboxItem}>
                  <Combobox.ItemIndicator className={theme.ComboboxItemIndicator}>
                    <CheckIcon />
                  </Combobox.ItemIndicator>
                  <span className={theme.ComboboxItemText}>{person.name}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function FormSerializationExample() {
  const [payload, setPayload] = React.useState<string | null>(null);
  return (
    <form
      className={theme.FormRoot}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setPayload(`scientist=${String(data.get('scientist'))}`);
      }}
    >
      <PersonAnatomy root={{ name: 'scientist', itemToStringValue: (person) => person.id }} />
      <button type="submit" className={theme.Button}>
        Submit
      </button>
      {payload ? <output className="ComboboxDemoOutput">{payload}</output> : null}
    </form>
  );
}

/** A visually-hidden `<input>` inside Root carries the serialized value into native form submission: `itemToStringValue` controls the payload for object values (`{ value, label }` shapes serialize automatically), `itemToStringLabel` the visible text. */
export const ObjectValuesStringification: Story = {
  tags: ['highlight'],
  render: () => <FormSerializationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(comboboxInput(canvas));
    await userEvent.click(await body.findByRole('option', { name: 'Ada Lovelace' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));

    await expect(await canvas.findByText('scientist=ada')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Clearing                                                            */
/* ------------------------------------------------------------------ */

/** `Combobox.Clear` mounts only while a value is selected and is deliberately not tabbable ("one tab stop per field", #3630) — keyboard users clear with Escape while the popup is closed, or Delete. */
export const ClearableSelection: Story = {
  tags: ['highlight'],
  render: () => (
    <DemoCombobox label="Fruit" placeholder="e.g. Apple" root={{ defaultValue: fruits[0] }} />
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = comboboxInput(canvas);
    await expect(input).toHaveValue('Apple');

    const clear = canvas.getByRole('button', { name: 'Clear selection' });
    // Not tabbable by design: Esc/Delete are the keyboard path.
    await expect(clear).toHaveAttribute('tabindex', '-1');
    await userEvent.click(clear);
    await waitFor(() => expect(input).toHaveValue(''));

    // Select again, then clear with Escape while the popup is closed.
    await userEvent.click(input);
    await userEvent.click(await body.findByRole('option', { name: 'Banana' }));
    await waitFor(() => expect(input).toHaveValue('Banana'));
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(input).toHaveValue(''));
  },
};

/* ------------------------------------------------------------------ */
/* Structure: groups, grid, input placement, inline                    */
/* ------------------------------------------------------------------ */

interface Produce {
  value: string;
  label: string;
}

interface ProduceGroup {
  value: string;
  items: Produce[];
}

const groupedProduce: ProduceGroup[] = [
  {
    value: 'Fruits',
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'mango', label: 'Mango' },
    ],
  },
  {
    value: 'Vegetables',
    items: [
      { value: 'broccoli', label: 'Broccoli' },
      { value: 'carrot', label: 'Carrot' },
      { value: 'spinach', label: 'Spinach' },
    ],
  },
];

/** The kept docs "Grouped" demo: a grouped `items` array feeds `Group` (with its own `items`) + auto-associated `GroupLabel`, and `Collection` renders the filtered items because a wrapper sits between `List` and the items. */
export const GroupedItems: Story = {
  tags: ['highlight', 'base'],
  render: () => {
    return (
      <Combobox.Root items={groupedProduce}>
        <div className={theme.FieldLabel}>
          <label htmlFor="grouped-produce-input">Select produce</label>
          <Combobox.InputGroup className={theme.ComboboxInputGroup}>
            <Combobox.Input
              placeholder="e.g. Mango"
              id="grouped-produce-input"
              className={theme.ComboboxInput}
            />
            <div className={theme.ComboboxActionButtons}>
              <Combobox.Trigger className={theme.ComboboxTrigger} aria-label="Open popup">
                <CaretDownIcon />
              </Combobox.Trigger>
            </div>
          </Combobox.InputGroup>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner className={theme.ComboboxPositioner} sideOffset={4}>
            <Combobox.Popup className={theme.ComboboxPopup}>
              <Combobox.Empty>
                <div className={theme.ComboboxEmpty}>No produce found.</div>
              </Combobox.Empty>
              <Combobox.List className={theme.ComboboxList}>
                {(group: ProduceGroup) => (
                  <Combobox.Group
                    key={group.value}
                    items={group.items}
                    className={theme.ComboboxGroup}
                  >
                    <Combobox.GroupLabel className={theme.ComboboxGroupLabel}>
                      {group.value}
                    </Combobox.GroupLabel>
                    <Combobox.Collection>
                      {(item: Produce) => (
                        <Combobox.Item key={item.value} value={item} className={theme.ComboboxItem}>
                          <Combobox.ItemIndicator className={theme.ComboboxItemIndicator}>
                            <CheckIcon />
                          </Combobox.ItemIndicator>
                          <span className={theme.ComboboxItemText}>{item.label}</span>
                        </Combobox.Item>
                      )}
                    </Combobox.Collection>
                  </Combobox.Group>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    );
  },
};

const countries = ['France', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Ireland', 'Japan', 'Spain'];

/** The kept docs "Input inside popup" demo (searchable select): the trigger is the form control and takes `role="combobox"` (#2973), the popup becomes `role="dialog"` (#3213), and `Combobox.Label` labels the trigger since a native `<label>` cannot. */
export const InputInsidePopup: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <div className={theme.FieldRoot}>
      <Combobox.Root items={countries}>
        <Combobox.Label className={theme.FieldLabel}>Country</Combobox.Label>
        <Combobox.Trigger className={theme.SelectTrigger}>
          <Combobox.Value placeholder="Select country" />
          <Combobox.Icon className={theme.SelectIcon}>
            <CaretUpDownIcon />
          </Combobox.Icon>
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner className={theme.ComboboxPositioner} align="start" sideOffset={4}>
            <Combobox.Popup
              className={`${theme.ComboboxPopup} ComboboxDemoPopupWithInput`}
              aria-label="Select country"
            >
              <Combobox.Input placeholder="e.g. Germany" className={theme.ComboboxPopupInput} />
              <Combobox.Empty>
                <div className={theme.ComboboxEmpty}>No countries found.</div>
              </Combobox.Empty>
              <Combobox.List className={theme.ComboboxList}>
                {(country: string) => (
                  <Combobox.Item key={country} value={country} className={theme.ComboboxItem}>
                    <Combobox.ItemIndicator className={theme.ComboboxItemIndicator}>
                      <CheckIcon />
                    </Combobox.ItemIndicator>
                    <span className={theme.ComboboxItemText}>{country}</span>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = comboboxInput(canvas);

    await userEvent.click(trigger);
    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());

    const input = within(dialog).getByPlaceholderText('e.g. Germany');
    await waitFor(() => expect(input).toHaveFocus());

    await userEvent.keyboard('ger');
    await userEvent.click(await within(dialog).findByRole('option', { name: 'Germany' }));
    await waitFor(() => expect(trigger).toHaveTextContent('Germany'));
  },
};

function InlineAnatomy({ root }: { root?: Partial<Combobox.Root.Props<Fruit, false>> }) {
  const id = React.useId();
  return (
    <Combobox.Root items={fruits} inline open {...root}>
      <div className={theme.FieldLabel}>
        <label htmlFor={id}>Fruit</label>
        <Combobox.InputGroup className={theme.ComboboxInputGroup}>
          <Combobox.Input placeholder="e.g. Apple" id={id} className={theme.ComboboxInput} />
        </Combobox.InputGroup>
      </div>
      <div className={theme.ComboboxInlineListBox}>
        <Combobox.Empty>
          <div className={theme.ComboboxEmpty}>No fruits found.</div>
        </Combobox.Empty>
        <Combobox.List className={theme.ComboboxInlineList}>
          {(item: Fruit) => (
            <Combobox.Item key={item.value} value={item} className={theme.ComboboxItem}>
              <Combobox.ItemIndicator className={theme.ComboboxItemIndicator}>
                <CheckIcon />
              </Combobox.ItemIndicator>
              <span className={theme.ComboboxItemText}>{item.label}</span>
            </Combobox.Item>
          )}
        </Combobox.List>
      </div>
    </Combobox.Root>
  );
}

function InlineDialogExample() {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={theme.Button}>Pick a fruit</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={theme.DialogBackdrop} />
        <Dialog.Popup className={theme.DialogPopup}>
          <Dialog.Title className={theme.DialogTitle}>Pick a fruit</Dialog.Title>
          {/* Bind the combobox's open state to the dialog's so transient state
              (query, highlight, input value) resets when the dialog closes. */}
          <InlineAnatomy root={{ open, onOpenChange: setOpen }} />
          <Dialog.Close className={theme.Button}>Cancel</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The documented Dialog composition (#5069/#3966): an inline combobox inside `Dialog.Popup`, with the combobox `open` bound to the dialog's, so closing the dialog resets the query, highlight, and input value. */
export const InlineInsideDialog: Story = {
  tags: ['highlight'],
  render: () => <InlineDialogExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Pick a fruit' }));
    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());

    const input = within(dialog).getByRole('combobox');
    await userEvent.click(input);
    await userEvent.keyboard('ban');
    await waitFor(() =>
      expect(within(dialog).queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument(),
    );

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());

    // Reopening shows a reset combobox: empty input, unfiltered list.
    await userEvent.click(canvas.getByRole('button', { name: 'Pick a fruit' }));
    const reopenedDialog = await body.findByRole('dialog');
    await expect(within(reopenedDialog).getByRole('combobox')).toHaveValue('');
    // The reopened Dialog.Popup mounts with the theme's enter transition
    // (data-starting-style opacity 0 -> 1); findByRole resolves on the very
    // next DOM mutation, often before that transition has advanced at all,
    // so wait for the popup (and its descendants) to actually be visible
    // rather than asserting immediately.
    await waitFor(async () => {
      expect(await within(reopenedDialog).findByRole('option', { name: 'Apple' })).toBeVisible();
    });
  },
};

/* ------------------------------------------------------------------ */
/* Async search                                                        */
/* ------------------------------------------------------------------ */

interface Contributor {
  id: string;
  name: string;
  role: string;
}

const contributors: Contributor[] = [
  { id: 'leslie', name: 'Leslie Alexander', role: 'Product Manager' },
  { id: 'kathryn', name: 'Kathryn Murphy', role: 'Marketing Lead' },
  { id: 'courtney', name: 'Courtney Henry', role: 'Design Systems' },
  { id: 'michael', name: 'Michael Foster', role: 'Engineering Manager' },
  { id: 'lindsay', name: 'Lindsay Walton', role: 'Product Designer' },
  { id: 'tom', name: 'Tom Cook', role: 'Frontend Engineer' },
  { id: 'whitney', name: 'Whitney Francis', role: 'Customer Success' },
];

function ContributorItem({ contributor }: { contributor: Contributor }) {
  return (
    <Combobox.Item key={contributor.id} value={contributor} className={theme.ComboboxItem}>
      <Combobox.ItemIndicator className={theme.ComboboxItemIndicator}>
        <CheckIcon />
      </Combobox.ItemIndicator>
      <span className={theme.ComboboxItemText}>
        <span className={theme.ComboboxItemLabel}>{contributor.name}</span>
        <span className={theme.ComboboxItemDescription}>{contributor.role}</span>
      </span>
    </Combobox.Item>
  );
}

function AsyncSingleExample() {
  const id = React.useId();
  const [results, setResults] = React.useState<Contributor[]>([]);
  const [value, setValue] = React.useState<Contributor | null>(null);
  const [query, setQuery] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const timeout = useTimeout();
  const { contains } = Combobox.useFilter();

  // Keep the selected value inside `items` so it never disappears between searches.
  const items = React.useMemo(() => {
    if (!value || results.some((contributor) => contributor.id === value.id)) {
      return results;
    }
    return [...results, value];
  }, [results, value]);

  const trimmed = query.trim();
  let status: React.ReactNode = null;
  if (pending) {
    status = (
      <React.Fragment>
        <span className={theme.ComboboxSpinner} aria-hidden />
        Searching…
      </React.Fragment>
    );
  } else if (trimmed === '' && !value) {
    status = 'Start typing to search contributors…';
  }

  return (
    <Combobox.Root
      items={items}
      value={value}
      filter={null}
      itemToStringLabel={(contributor: Contributor) => contributor.name}
      isItemEqualToValue={(itemValue, current) => itemValue.id === current.id}
      onValueChange={(next) => {
        setValue(next);
        setQuery('');
      }}
      onInputValueChange={(next, eventDetails) => {
        setQuery(next);
        if (eventDetails.reason === 'item-press') {
          return;
        }
        timeout.clear();
        if (next.trim() === '') {
          setResults([]);
          setPending(false);
          return;
        }
        setPending(true);
        // Simulated network latency; a real app would fetch here.
        timeout.start(300, () => {
          setResults(
            contributors.filter(
              (contributor) => contains(contributor.name, next) || contains(contributor.role, next),
            ),
          );
          setPending(false);
        });
      }}
    >
      <div className={theme.FieldLabel}>
        <label htmlFor={id}>Assign reviewer</label>
        <Combobox.InputGroup className={theme.ComboboxInputGroup}>
          <Combobox.Input placeholder="e.g. Michael" id={id} className={theme.ComboboxInput} />
          <div className={theme.ComboboxActionButtons}>
            <Combobox.Clear className={theme.ComboboxClear} aria-label="Clear selection">
              <XIcon />
            </Combobox.Clear>
            <Combobox.Trigger className={theme.ComboboxTrigger} aria-label="Open popup">
              <CaretDownIcon />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className={theme.ComboboxPositioner} sideOffset={4}>
          <Combobox.Popup className={theme.ComboboxPopup} aria-busy={pending || undefined}>
            <Combobox.Status>
              {status ? <div className={theme.ComboboxStatus}>{status}</div> : null}
            </Combobox.Status>
            <Combobox.Empty>
              {trimmed !== '' && !pending && results.length === 0 ? (
                <div className={theme.ComboboxEmpty}>No matches for “{trimmed}”.</div>
              ) : null}
            </Combobox.Empty>
            <Combobox.List className={theme.ComboboxList}>
              {(contributor: Contributor) => (
                <ContributorItem key={contributor.id} contributor={contributor} />
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** The kept docs "Async search (single)" pattern: `filter={null}` turns internal filtering off, search results replace `items`, the selected value is merged back into `items` so it survives result changes, and `Combobox.Status` (a polite live region that must stay mounted) narrates the request lifecycle. */
export const AsyncSearchSingle: Story = {
  tags: ['highlight', 'base'],
  render: () => <AsyncSingleExample />,
};

function AsyncMultipleExample() {
  const id = React.useId();
  const [selected, setSelected] = React.useState<Contributor[]>([contributors[0]]);
  const [results, setResults] = React.useState<Contributor[]>([]);
  const [query, setQuery] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const timeout = useTimeout();
  const { contains } = Combobox.useFilter({ multiple: true });

  // `items` = everything known (selected + fetched) so values are never orphaned;
  // `filteredItems` = only the current search results (external filtering, #3068).
  const items = React.useMemo(() => {
    const known = new Map(selected.map((contributor) => [contributor.id, contributor]));
    results.forEach((contributor) => known.set(contributor.id, contributor));
    return [...known.values()];
  }, [selected, results]);

  const filteredItems = query.trim() === '' ? selected : results;

  return (
    <Combobox.Root
      multiple
      items={items}
      filteredItems={filteredItems}
      value={selected}
      itemToStringLabel={(contributor: Contributor) => contributor.name}
      isItemEqualToValue={(itemValue, current) => itemValue.id === current.id}
      onValueChange={setSelected}
      onInputValueChange={(next, eventDetails) => {
        setQuery(next);
        if (eventDetails.reason === 'item-press') {
          return;
        }
        timeout.clear();
        if (next.trim() === '') {
          setResults([]);
          setPending(false);
          return;
        }
        setPending(true);
        timeout.start(300, () => {
          setResults(contributors.filter((contributor) => contains(contributor.name, next)));
          setPending(false);
        });
      }}
    >
      <div className={theme.FieldLabel}>
        <label htmlFor={id}>Reviewers</label>
        <Combobox.InputGroup className={theme.ComboboxChipsInputGroup}>
          <Combobox.Chips className={theme.ComboboxChips}>
            <Combobox.Value>
              {(value: Contributor[]) => (
                <React.Fragment>
                  {value.map((contributor) => (
                    <Combobox.Chip
                      key={contributor.id}
                      className={theme.ComboboxChip}
                      aria-label={contributor.name}
                    >
                      {contributor.name}
                      <Combobox.ChipRemove
                        className={theme.ComboboxChipRemove}
                        aria-label={`Remove ${contributor.name}`}
                      >
                        <XIcon />
                      </Combobox.ChipRemove>
                    </Combobox.Chip>
                  ))}
                  <Combobox.Input
                    id={id}
                    placeholder={value.length > 0 ? '' : 'Search people…'}
                    className={theme.ComboboxChipsInput}
                  />
                </React.Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className={theme.ComboboxPositioner} sideOffset={4}>
          <Combobox.Popup className={theme.ComboboxPopup} aria-busy={pending || undefined}>
            <Combobox.Status>
              {pending ? (
                <div className={theme.ComboboxStatus}>
                  <span className={theme.ComboboxSpinner} aria-hidden />
                  Searching…
                </div>
              ) : null}
            </Combobox.Status>
            <Combobox.Empty>
              {query.trim() !== '' && !pending && results.length === 0 ? (
                <div className={theme.ComboboxEmpty}>No matches.</div>
              ) : null}
            </Combobox.Empty>
            <Combobox.List className={theme.ComboboxList}>
              {(contributor: Contributor) => (
                <ContributorItem key={contributor.id} contributor={contributor} />
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** The kept docs "Async search (multiple)" pattern, using the `filteredItems` prop (#3068): `items` holds everything known (selected + fetched) so chips survive result changes (#3824), while `filteredItems` hands the component only the current results. */
export const AsyncSearchMultiple: Story = {
  tags: ['highlight', 'base'],
  render: () => <AsyncMultipleExample />,
};

/* ------------------------------------------------------------------ */
/* Creatable                                                           */
/* ------------------------------------------------------------------ */

interface Flavor {
  creatable?: string;
  id: string;
  label: string;
}

const initialFlavors: Flavor[] = [
  { id: 'vanilla', label: 'Vanilla' },
  { id: 'chocolate', label: 'Chocolate' },
  { id: 'pistachio', label: 'Pistachio' },
];

function CreatableExample() {
  const id = React.useId();
  const [flavors, setFlavors] = React.useState<Flavor[]>(initialFlavors);
  const [selected, setSelected] = React.useState<Flavor | null>(null);
  const [query, setQuery] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [pendingLabel, setPendingLabel] = React.useState('');

  const trimmed = query.trim();
  const exactExists = flavors.some(
    (flavor) => flavor.label.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
  );
  const itemsForView: Flavor[] =
    trimmed !== '' && !exactExists
      ? [
          ...flavors,
          {
            creatable: trimmed,
            id: `create:${trimmed.toLocaleLowerCase()}`,
            label: `Create "${trimmed}"`,
          },
        ]
      : flavors;

  function handleCreate() {
    const label = pendingLabel.trim();
    if (label === '') {
      return;
    }
    const newItem: Flavor = { id: label.toLocaleLowerCase().replace(/\s+/g, '-'), label };
    setFlavors((previous) => [...previous, newItem]);
    setSelected(newItem);
    setQuery(label);
    setDialogOpen(false);
  }

  return (
    <React.Fragment>
      <Combobox.Root
        items={itemsForView}
        value={selected}
        inputValue={query}
        onInputValueChange={setQuery}
        isItemEqualToValue={(itemValue, current) => itemValue.id === current.id}
        itemToStringLabel={(flavor: Flavor) => flavor.label}
        onValueChange={(next) => {
          if (next && next.creatable) {
            setPendingLabel(next.creatable);
            setDialogOpen(true);
            return;
          }
          setSelected(next);
          setQuery(next ? next.label : '');
        }}
      >
        <div className={theme.FieldLabel}>
          <label htmlFor={id}>Flavor</label>
          <Combobox.InputGroup className={theme.ComboboxInputGroup}>
            <Combobox.Input placeholder="e.g. Vanilla" id={id} className={theme.ComboboxInput} />
            <div className={theme.ComboboxActionButtons}>
              <Combobox.Trigger className={theme.ComboboxTrigger} aria-label="Open popup">
                <CaretDownIcon />
              </Combobox.Trigger>
            </div>
          </Combobox.InputGroup>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner className={theme.ComboboxPositioner} sideOffset={4}>
            <Combobox.Popup className={theme.ComboboxPopup}>
              <Combobox.List className={theme.ComboboxList}>
                {(flavor: Flavor) => (
                  <Combobox.Item key={flavor.id} value={flavor} className={theme.ComboboxItem}>
                    <Combobox.ItemIndicator className={theme.ComboboxItemIndicator}>
                      <CheckIcon />
                    </Combobox.ItemIndicator>
                    <span className={theme.ComboboxItemText}>{flavor.label}</span>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className={theme.DialogBackdrop} />
          <Dialog.Popup className={theme.DialogPopup}>
            <Dialog.Title className={theme.DialogTitle}>Create flavor</Dialog.Title>
            <p className={theme.FieldDescription}>Add “{pendingLabel}” to the list?</p>
            <div className="ComboboxDemoRow">
              <button type="button" className={theme.Button} onClick={handleCreate}>
                Create
              </button>
              <Dialog.Close className={theme.Button}>Cancel</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </React.Fragment>
  );
}

/** The kept docs "Creatable" pattern: when the query has no exact match, a synthetic `Create "…"` item is appended; picking it opens a confirmation Dialog instead of committing, and confirming appends the new item to `items` and selects it. */
export const CreatableEntries: Story = {
  tags: ['highlight', 'base'],
  render: () => <CreatableExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = comboboxInput(canvas);

    await userEvent.click(input);
    await userEvent.keyboard('Tangerine');
    await userEvent.click(await body.findByRole('option', { name: 'Create "Tangerine"' }));

    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(input).toHaveValue('Tangerine');
  },
};

/* ------------------------------------------------------------------ */
/* Virtualization                                                      */
/* ------------------------------------------------------------------ */

interface BigItem {
  id: string;
  name: string;
}

const bigItems: BigItem[] = Array.from({ length: 1000 }, (_, index) => {
  const id = String(index + 1);
  return { id, name: `Item ${id.padStart(4, '0')}` };
});

const ROW_HEIGHT = 32;
const VIEWPORT_HEIGHT = 288; // matches .Scroller max-height (18rem)
const OVERSCAN = 6;

function WindowedList({ scrollerRef }: { scrollerRef: React.RefObject<HTMLDivElement | null> }) {
  const filteredItems = Combobox.useFilteredItems<BigItem>();
  const [scrollTop, setScrollTop] = React.useState(0);

  if (filteredItems.length === 0) {
    return null;
  }

  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(
    filteredItems.length,
    Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ROW_HEIGHT) + OVERSCAN,
  );

  return (
    <div
      role="presentation"
      ref={scrollerRef}
      className="ComboboxDemoScroller"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div
        role="presentation"
        style={{ height: filteredItems.length * ROW_HEIGHT, position: 'relative' }}
      >
        {filteredItems.slice(start, end).map((item, offset) => {
          const index = start + offset;
          return (
            <Combobox.Item
              key={item.id}
              index={index}
              value={item}
              className={`${theme.ComboboxItem} ComboboxDemoVirtualItem`}
              aria-setsize={filteredItems.length}
              aria-posinset={index + 1}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: ROW_HEIGHT,
                transform: `translateY(${index * ROW_HEIGHT}px)`,
              }}
            >
              <Combobox.ItemIndicator className={theme.ComboboxItemIndicator}>
                <CheckIcon />
              </Combobox.ItemIndicator>
              <span className={theme.ComboboxItemText}>{item.name}</span>
            </Combobox.Item>
          );
        })}
      </div>
    </div>
  );
}

function VirtualizedExample() {
  const id = React.useId();
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  return (
    <Combobox.Root
      virtualized
      items={bigItems}
      itemToStringLabel={(item: BigItem) => item.name}
      onItemHighlighted={(item, eventDetails) => {
        const scroller = scrollerRef.current;
        if (!item || !scroller || eventDetails.reason === 'pointer') {
          return;
        }
        // Keep the keyboard highlight inside the window.
        const top = eventDetails.index * ROW_HEIGHT;
        if (top < scroller.scrollTop) {
          scroller.scrollTop = top;
        } else if (top + ROW_HEIGHT > scroller.scrollTop + scroller.clientHeight) {
          scroller.scrollTop = top + ROW_HEIGHT - scroller.clientHeight;
        }
      }}
    >
      <div className={theme.FieldLabel}>
        <label htmlFor={id}>Search 1,000 items</label>
        <Combobox.InputGroup className={theme.ComboboxInputGroup}>
          <Combobox.Input placeholder="e.g. Item 0042" id={id} className={theme.ComboboxInput} />
          <div className={theme.ComboboxActionButtons}>
            <Combobox.Trigger className={theme.ComboboxTrigger} aria-label="Open popup">
              <CaretDownIcon />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className={theme.ComboboxPositioner} sideOffset={4}>
          <Combobox.Popup className={theme.ComboboxPopup}>
            <Combobox.Empty>
              <div className={theme.ComboboxEmpty}>No items found.</div>
            </Combobox.Empty>
            <Combobox.List>
              <WindowedList scrollerRef={scrollerRef} />
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** `virtualized` + `useFilteredItems` + per-item `index`/`aria-setsize`/`aria-posinset`: only the visible window of 1,000 items is mounted. The docs demo uses `@tanstack/react-virtual`; this Storybook hand-rolls fixed-height windowing to stay dependency-free. Virtualize beyond ~1,000 items because mount cost dominates opening (docs "Memoizing items"). */
export const Virtualized: Story = {
  tags: ['api-ref', 'base'],
  render: () => <VirtualizedExample />,
};

/* ------------------------------------------------------------------ */
/* Disabled, read-only, forms                                          */
/* ------------------------------------------------------------------ */

function FieldValidationExample() {
  const [status, setStatus] = React.useState<string | null>(null);
  return (
    <Form
      className={theme.FormRoot}
      onSubmit={(event) => {
        event.preventDefault();
        setStatus('Submitted');
      }}
    >
      <Field.Root name="fruit" className={theme.FieldRoot}>
        <Combobox.Root items={fruits} required>
          <div className={theme.FieldLabel}>
            <Field.Label>Favorite fruit</Field.Label>
            <Combobox.InputGroup className={theme.ComboboxInputGroup}>
              <Combobox.Input placeholder="e.g. Apple" className={theme.ComboboxInput} />
              <div className={theme.ComboboxActionButtons}>
                <Combobox.Trigger className={theme.ComboboxTrigger} aria-label="Open popup">
                  <CaretDownIcon />
                </Combobox.Trigger>
              </div>
            </Combobox.InputGroup>
          </div>
          <Combobox.Portal>
            <Combobox.Positioner className={theme.ComboboxPositioner} sideOffset={4}>
              <Combobox.Popup className={theme.ComboboxPopup}>
                <Combobox.Empty>
                  <div className={theme.ComboboxEmpty}>No fruits found.</div>
                </Combobox.Empty>
                <Combobox.List className={theme.ComboboxList}>
                  {(item: Fruit) => (
                    <Combobox.Item key={item.value} value={item} className={theme.ComboboxItem}>
                      <Combobox.ItemIndicator className={theme.ComboboxItemIndicator}>
                        <CheckIcon />
                      </Combobox.ItemIndicator>
                      <span className={theme.ComboboxItemText}>{item.label}</span>
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
        <Field.Description className={theme.FieldDescription}>
          Only list entries are valid values.
        </Field.Description>
        <Field.Error className={theme.FieldError} match="valueMissing">
          Please choose a fruit.
        </Field.Error>
      </Field.Root>
      <button type="submit" className={theme.Button}>
        Save
      </button>
      {status ? <output className="ComboboxDemoOutput">{status}</output> : null}
    </Form>
  );
}

/** Inside `Field`/`Form`, the combobox participates in constraint validation through its hidden input: `required` blocks submission, `Field.Error` renders the message, and `data-invalid`/`data-touched`/`data-filled` land on the Input for styling. */
export const InFieldWithValidation: Story = {
  tags: ['highlight'],
  render: () => <FieldValidationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = comboboxInput(canvas);

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(await canvas.findByText('Please choose a fruit.')).toBeVisible();
    await expect(input).toHaveAttribute('data-invalid');

    await userEvent.click(input);
    await userEvent.click(await body.findByRole('option', { name: 'Cherry' }));
    await waitFor(() => expect(input).toHaveValue('Cherry'));

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(await canvas.findByText('Submitted')).toBeVisible();
    await expect(canvas.queryByText('Please choose a fruit.')).not.toBeInTheDocument();
  },
};

/* ------------------------------------------------------------------ */
/* Animation                                                           */

/* ------------------------------------------------------------------ */
/* TypeScript                                                          */
/* ------------------------------------------------------------------ */

/**
 * Typed wrapper from the docs TypeScript guidance: generics flow through
 * `Combobox.Root.Props<Value, Multiple>`, so `defaultValue` must be an array
 * exactly when `multiple` is set. Generics cannot cross React context in
 * compound components, so a wrapper is the supported reuse path (#3951).
 */
function MyCombobox<Value, Multiple extends boolean | undefined = false>(
  props: Combobox.Root.Props<Value, Multiple> & {
    label: string;
    placeholder?: string;
    itemToLabel: (item: Value) => string;
  },
): React.JSX.Element {
  const { label, placeholder, itemToLabel, ...rootProps } = props;
  const id = React.useId();
  return (
    <Combobox.Root {...rootProps}>
      <div className={theme.FieldLabel}>
        <label htmlFor={id}>{label}</label>
        <Combobox.InputGroup className={theme.ComboboxInputGroup}>
          <Combobox.Input placeholder={placeholder} id={id} className={theme.ComboboxInput} />
          <div className={theme.ComboboxActionButtons}>
            <Combobox.Trigger className={theme.ComboboxTrigger} aria-label="Open popup">
              <CaretDownIcon />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className={theme.ComboboxPositioner} sideOffset={4}>
          <Combobox.Popup className={theme.ComboboxPopup}>
            <Combobox.List className={theme.ComboboxList}>
              {(item: Value) => (
                <Combobox.Item key={itemToLabel(item)} value={item} className={theme.ComboboxItem}>
                  <Combobox.ItemIndicator className={theme.ComboboxItemIndicator}>
                    <CheckIcon />
                  </Combobox.ItemIndicator>
                  <span className={theme.ComboboxItemText}>{itemToLabel(item)}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** A `MyCombobox<Value, Multiple>` typed wrapper — the story compiling is the test: single mode takes a scalar `defaultValue`, multiple mode requires an array. */
export const TypedWrapperComponent: Story = {
  tags: ['highlight'],
  render: () => (
    <div className="ComboboxDemoRow">
      <MyCombobox
        label="Fruit"
        placeholder="One fruit"
        items={fruits}
        itemToLabel={(fruit) => fruit.label}
        defaultValue={fruits[2]}
      />
      <MyCombobox
        label="Fruits"
        placeholder="Many fruits"
        items={fruits}
        itemToLabel={(fruit) => fruit.label}
        multiple
        defaultValue={[fruits[0], fruits[1]]}
      />
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/combobox)       */
/* ------------------------------------------------------------------ */

interface SyncTarget {
  value: string;
  label: string;
}

interface SyncTargetGroup {
  value: string;
  items: SyncTarget[];
}

interface LlmModel {
  value: string;
  label: string;
}

interface LlmModelGroup {
  value: string;
  items: LlmModel[];
}

/* ------------------------------------------------------------------ */
/* Icons (inlined — stories must not import docs assets)               */
/* ------------------------------------------------------------------ */

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m4.5 4.5 7 7m-7 0 7-7" />
    </svg>
  );
}

function CaretDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 6H4l4 4.5z" />
    </svg>
  );
}

function CaretUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
    </svg>
  );
}
