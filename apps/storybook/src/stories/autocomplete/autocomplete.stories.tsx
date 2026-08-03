import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Dialog } from '@base-ui/react/dialog';
import theme from '@droppy/theme';
import './autocomplete.demo.css';

const meta = {
  title: 'Form inputs/Autocomplete',
  component: Autocomplete.Root,
  subcomponents: {
    'Autocomplete.Value': Autocomplete.Value,
    'Autocomplete.Input': Autocomplete.Input,
    'Autocomplete.InputGroup': Autocomplete.InputGroup,
    'Autocomplete.Trigger': Autocomplete.Trigger,
    'Autocomplete.Icon': Autocomplete.Icon,
    'Autocomplete.Clear': Autocomplete.Clear,
    'Autocomplete.Portal': Autocomplete.Portal,
    'Autocomplete.Positioner': Autocomplete.Positioner,
    'Autocomplete.Popup': Autocomplete.Popup,
    'Autocomplete.List': Autocomplete.List,
    'Autocomplete.Item': Autocomplete.Item,
    'Autocomplete.Group': Autocomplete.Group,
    'Autocomplete.GroupLabel': Autocomplete.GroupLabel,
    'Autocomplete.Collection': Autocomplete.Collection,
    'Autocomplete.Row': Autocomplete.Row,
    'Autocomplete.Status': Autocomplete.Status,
    'Autocomplete.Empty': Autocomplete.Empty,
  },
} satisfies Meta<typeof Autocomplete.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Shared data + local building blocks                                 */
/* ------------------------------------------------------------------ */

const tags = [
  'feature',
  'fix',
  'bug',
  'docs',
  'internal',
  'mobile',
  'accessibility',
  'performance',
];

/**
 * Standard hero-styled anatomy shared by the behavior stories: labeled Input,
 * portalled Popup with Empty + List fed by the `items` prop.
 */
function DemoAutocomplete({
  label,
  placeholder,
  items = tags,
  root,
  popupClassName,
}: {
  label: string;
  placeholder?: string;
  items?: readonly string[];
  root?: Partial<Autocomplete.Root.Props<string>>;
  popupClassName?: string;
}) {
  return (
    <Autocomplete.Root items={items} {...root}>
      <label className={theme.FieldLabel}>
        {label}
        <Autocomplete.Input placeholder={placeholder} className={theme.AutocompleteInput} />
      </label>
      <Autocomplete.Portal>
        <Autocomplete.Positioner className={theme.AutocompletePositioner} sideOffset={4}>
          <Autocomplete.Popup className={popupClassName ?? theme.AutocompletePopup}>
            <Autocomplete.Empty>
              <div className={theme.AutocompleteEmpty}>No matching tags.</div>
            </Autocomplete.Empty>
            <Autocomplete.List className={theme.AutocompleteList}>
              {(tag: string) => (
                <Autocomplete.Item key={tag} className={theme.AutocompleteItem} value={tag}>
                  {tag}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Hero + core behavior                                                */
/* ------------------------------------------------------------------ */

/** The docs hero anatomy extended with `InputGroup`: Input plus the optional non-tabbable Clear and the Trigger that opens the popup without typing. Free-form text is the value; the list only suggests. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <Autocomplete.Root items={tags}>
      <label className={theme.FieldLabel}>
        Search tags
        <Autocomplete.InputGroup className={theme.AutocompleteInputGroup}>
          <Autocomplete.Input
            placeholder="e.g. feature"
            className={theme.AutocompleteGroupedInput}
          />
          <div className={theme.AutocompleteActionButtons}>
            <Autocomplete.Clear className={theme.AutocompleteActionButton} aria-label="Clear input">
              <XIcon />
            </Autocomplete.Clear>
            <Autocomplete.Trigger
              className={theme.AutocompleteActionButton}
              aria-label="Open popup"
            >
              <Autocomplete.Icon className="AutocompleteDemoIcon">
                <CaretDownIcon />
              </Autocomplete.Icon>
            </Autocomplete.Trigger>
          </div>
        </Autocomplete.InputGroup>
      </label>
      <Autocomplete.Portal>
        <Autocomplete.Positioner className={theme.AutocompletePositioner} sideOffset={4}>
          <Autocomplete.Popup className={theme.AutocompletePopup}>
            <Autocomplete.Empty>
              <div className={theme.AutocompleteEmpty}>No matching tags.</div>
            </Autocomplete.Empty>
            <Autocomplete.List className={theme.AutocompleteList}>
              {(tag: string) => (
                <Autocomplete.Item key={tag} className={theme.AutocompleteItem} value={tag}>
                  {tag}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  ),
};

/* ------------------------------------------------------------------ */
/* Filtering modes (`mode` → aria-autocomplete)                        */
/* ------------------------------------------------------------------ */

/** `mode="both"` adds inline completion on top of list filtering: arrowing through suggestions temporarily writes the highlighted item into the input (keyboard only — pointer highlights never overwrite typed text). */
export const InlineAutocompletion: Story = {
  tags: ['api-ref', 'base'],
  render: () => (
    <DemoAutocomplete
      label="Search tags (inline completion)"
      placeholder="e.g. feature"
      root={{ mode: 'both' }}
    />
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole('combobox');
    await expect(input).toHaveAttribute('aria-autocomplete', 'both');

    await userEvent.type(input, 'fe');
    await body.findByRole('listbox');

    // ArrowDown highlights "feature" and inline-completes it into the input.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(input).toHaveValue('feature'));

    // Escape closes; the typed query is what the value reverts to.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
  },
};

/* ------------------------------------------------------------------ */
/* Empty state, auto highlight, open on click                          */
/* ------------------------------------------------------------------ */

/** `autoHighlight` compared: `true` highlights the first match only while typing; `"always"` keeps the first item highlighted whenever the list renders — the command-palette setting, so Enter always has a target. */
export const AutoHighlight: Story = {
  tags: ['api-ref', 'base'],
  render: () => (
    <div className="AutocompleteDemoRow">
      <Autocomplete.Root items={tags} autoHighlight>
        <label className={theme.FieldLabel}>
          While typing
          <Autocomplete.InputGroup className={theme.AutocompleteInputGroup}>
            <Autocomplete.Input
              placeholder="autoHighlight"
              className={theme.AutocompleteGroupedInput}
            />
            <div className={theme.AutocompleteActionButtons}>
              <Autocomplete.Trigger
                className={theme.AutocompleteActionButton}
                aria-label="Open while-typing list"
              >
                <CaretDownIcon />
              </Autocomplete.Trigger>
            </div>
          </Autocomplete.InputGroup>
        </label>
        <Autocomplete.Portal>
          <Autocomplete.Positioner className={theme.AutocompletePositioner} sideOffset={4}>
            <Autocomplete.Popup className={theme.AutocompletePopup}>
              <Autocomplete.List className={theme.AutocompleteList}>
                {(tag: string) => (
                  <Autocomplete.Item key={tag} className={theme.AutocompleteItem} value={tag}>
                    {tag}
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
      <Autocomplete.Root items={tags} autoHighlight="always">
        <label className={theme.FieldLabel}>
          Always
          <Autocomplete.InputGroup className={theme.AutocompleteInputGroup}>
            <Autocomplete.Input
              placeholder='autoHighlight="always"'
              className={theme.AutocompleteGroupedInput}
            />
            <div className={theme.AutocompleteActionButtons}>
              <Autocomplete.Trigger
                className={theme.AutocompleteActionButton}
                aria-label="Open always list"
              >
                <CaretDownIcon />
              </Autocomplete.Trigger>
            </div>
          </Autocomplete.InputGroup>
        </label>
        <Autocomplete.Portal>
          <Autocomplete.Positioner className={theme.AutocompletePositioner} sideOffset={4}>
            <Autocomplete.Popup className={theme.AutocompletePopup}>
              <Autocomplete.List className={theme.AutocompleteList}>
                {(tag: string) => (
                  <Autocomplete.Item key={tag} className={theme.AutocompleteItem} value={tag}>
                    {tag}
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const doc = canvasElement.ownerDocument;
    const countHighlighted = () =>
      Array.from(doc.querySelectorAll('[role="option"]')).filter((option) =>
        option.hasAttribute('data-highlighted'),
      ).length;

    // "always": the first item is highlighted as soon as the popup opens.
    await userEvent.click(await canvas.findByRole('button', { name: 'Open always list' }));
    await body.findByRole('listbox');
    await waitFor(() => expect(countHighlighted()).toBe(1));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('listbox')).not.toBeInTheDocument());

    // true: opening without a query highlights nothing…
    await userEvent.click(await canvas.findByRole('button', { name: 'Open while-typing list' }));
    await body.findByRole('listbox');
    await expect(countHighlighted()).toBe(0);

    // …but typing highlights the first match.
    await userEvent.type(await canvas.findByRole('combobox', { name: 'While typing' }), 'do');
    await waitFor(() => expect(countHighlighted()).toBe(1));
  },
};

/* ------------------------------------------------------------------ */
/* Escape semantics                                                    */

/* ------------------------------------------------------------------ */
/* Free text & forms                                                   */

interface Country {
  code: string;
  name: string;
}

/* ------------------------------------------------------------------ */
/* Highlight tracking                                                  */

/* ------------------------------------------------------------------ */
/* Grouped, fuzzy, limited suggestions                                 */
/* ------------------------------------------------------------------ */

const groupedTags = [
  { value: 'Type', items: ['feature', 'fix', 'bug', 'docs'] },
  { value: 'Component', items: ['accordion', 'autocomplete', 'combobox', 'select'] },
];

/** Grouped suggestions need the grouped `items` shape (`{ value, items }`), `Group` + `GroupLabel`, and `Collection` to re-render each group's filtered subset — a plain `.map` over groups won't wire per-group filtering. */
export const GroupedSuggestions: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <Autocomplete.Root items={groupedTags}>
      <label className={theme.FieldLabel}>
        Search tags
        <Autocomplete.Input placeholder="e.g. combobox" className={theme.AutocompleteInput} />
      </label>
      <Autocomplete.Portal>
        <Autocomplete.Positioner className={theme.AutocompletePositioner} sideOffset={4}>
          <Autocomplete.Popup className={theme.AutocompletePopup}>
            <Autocomplete.Empty>
              <div className={theme.AutocompleteEmpty}>No matching tags.</div>
            </Autocomplete.Empty>
            <Autocomplete.List className={theme.AutocompleteList}>
              {(group: { value: string; items: string[] }) => (
                <Autocomplete.Group
                  key={group.value}
                  items={group.items}
                  className={theme.AutocompleteGroup}
                >
                  <Autocomplete.GroupLabel className={theme.AutocompleteGroupLabel}>
                    {group.value}
                  </Autocomplete.GroupLabel>
                  <Autocomplete.Collection>
                    {(tag: string) => (
                      <Autocomplete.Item key={tag} className={theme.AutocompleteItem} value={tag}>
                        {tag}
                      </Autocomplete.Item>
                    )}
                  </Autocomplete.Collection>
                </Autocomplete.Group>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  ),
};

interface DocEntry {
  title: string;
  description: string;
}

const docEntries: DocEntry[] = [
  { title: 'React Hooks Guide', description: 'useState, useEffect, and custom hooks' },
  { title: 'JavaScript Array Methods', description: 'map, filter, reduce, and forEach' },
  { title: 'CSS Flexbox Layout', description: 'Flexbox for responsive design' },
  { title: 'TypeScript Interfaces', description: 'Interfaces and type definitions' },
  { title: 'React Performance', description: 'Optimizing React application performance' },
  { title: 'Node.js Express Server', description: 'RESTful APIs with Express' },
  { title: 'CSS Grid Layout', description: 'Grid techniques for complex layouts' },
  { title: 'React Testing Library', description: 'Testing React components' },
];

/** Subsequence match: every query character must appear in order. */
function fuzzyMatch(text: string, query: string): boolean {
  const haystack = text.toLowerCase();
  let fromIndex = 0;
  for (const char of query.toLowerCase().replace(/\s+/g, '')) {
    fromIndex = haystack.indexOf(char, fromIndex);
    if (fromIndex === -1) {
      return false;
    }
    fromIndex += 1;
  }
  return true;
}

/** The `filter` prop replaces the default `Intl.Collator` contains matcher with custom logic — here a dependency-free subsequence matcher over title and description (try "rhg"). The docs demo uses `match-sorter` for the same slot. */
export const FuzzyMatching: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <Autocomplete.Root
      items={docEntries}
      filter={(item, query) => fuzzyMatch(item.title, query) || fuzzyMatch(item.description, query)}
      itemToStringValue={(item) => item.title}
    >
      <label className={theme.FieldLabel}>
        Fuzzy search documentation
        <Autocomplete.Input placeholder='e.g. "rhg"' className={theme.AutocompleteInput} />
      </label>
      <Autocomplete.Portal>
        <Autocomplete.Positioner className={theme.AutocompletePositioner} sideOffset={4}>
          <Autocomplete.Popup className={theme.AutocompletePopup}>
            <Autocomplete.Empty>
              <div className={theme.AutocompleteEmpty}>
                No results found for &quot;
                <Autocomplete.Value />
                &quot;
              </div>
            </Autocomplete.Empty>
            <Autocomplete.List className={theme.AutocompleteList}>
              {(item: DocEntry) => (
                <Autocomplete.Item key={item.title} className={theme.AutocompleteItem} value={item}>
                  <span className={theme.AutocompleteItemContent}>
                    <span className={theme.AutocompleteItemTitle}>{item.title}</span>
                    <span className={theme.AutocompleteItemDescription}>{item.description}</span>
                  </span>
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  ),
};

const manyTags = [
  ...tags,
  'frontend',
  'backend',
  'design',
  'research',
  'testing',
  'infrastructure',
  'documentation',
  'localization',
];

function LimitResultsExample() {
  const limit = 6;
  const [value, setValue] = React.useState('');
  const { contains } = Autocomplete.useFilter({ sensitivity: 'base' });

  const trimmed = value.trim();
  const totalMatches = trimmed
    ? manyTags.filter((tag) => contains(tag, trimmed)).length
    : manyTags.length;
  const moreCount = Math.max(0, totalMatches - limit);

  return (
    <Autocomplete.Root items={manyTags} value={value} onValueChange={setValue} limit={limit}>
      <label className={theme.FieldLabel}>
        Limit results to 6
        <Autocomplete.Input placeholder="e.g. e" className={theme.AutocompleteInput} />
      </label>
      <Autocomplete.Portal>
        <Autocomplete.Positioner className={theme.AutocompletePositioner} sideOffset={4}>
          <Autocomplete.Popup className={theme.AutocompletePopup}>
            <Autocomplete.Empty>
              <div className={theme.AutocompleteEmpty}>
                No results found for &quot;{value}&quot;
              </div>
            </Autocomplete.Empty>
            <Autocomplete.List className={theme.AutocompleteList}>
              {(tag: string) => (
                <Autocomplete.Item key={tag} className={theme.AutocompleteItem} value={tag}>
                  {tag}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
            <Autocomplete.Status>
              {moreCount > 0 ? (
                <div className={theme.AutocompleteStatus}>
                  {`Hiding ${moreCount} results (type a more specific query)`}
                </div>
              ) : null}
            </Autocomplete.Status>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}

/** `limit` caps how many suggestions render; surface the remainder through the `Status` live region ("Hiding N results…") to guide users toward a narrower query instead of a giant list. */
export const LimitResults: Story = {
  tags: ['highlight', 'base'],
  render: () => <LimitResultsExample />,
};

/* ------------------------------------------------------------------ */
/* Async suggestions                                                   */
/* ------------------------------------------------------------------ */

interface Movie {
  id: string;
  title: string;
  year: number;
}

const topMovies: Movie[] = [
  { id: '1', title: 'The Shawshank Redemption', year: 1994 },
  { id: '2', title: 'The Godfather', year: 1972 },
  { id: '3', title: 'The Dark Knight', year: 2008 },
  { id: '4', title: '12 Angry Men', year: 1957 },
  { id: '5', title: 'Pulp Fiction', year: 1994 },
  { id: '6', title: 'Forrest Gump', year: 1994 },
  { id: '7', title: 'Fight Club', year: 1999 },
  { id: '8', title: 'Inception', year: 2010 },
  { id: '9', title: 'The Matrix', year: 1999 },
  { id: '10', title: 'Interstellar', year: 2014 },
  { id: '11', title: 'Se7en', year: 1995 },
  { id: '12', title: 'Spirited Away', year: 2001 },
];

async function searchMovies(
  query: string,
  match: (item: string, query: string) => boolean,
): Promise<Movie[]> {
  // Simulated network latency.
  await new Promise((resolve) => {
    setTimeout(resolve, 300);
  });
  return topMovies.filter((movie) => match(movie.title, query) || match(String(movie.year), query));
}

function AsyncSuggestionsExample() {
  const [searchValue, setSearchValue] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<Movie[]>([]);
  const [isPending, startTransition] = React.useTransition();
  const { contains } = Autocomplete.useFilter();
  const abortControllerRef = React.useRef<AbortController | null>(null);

  let status: string | null = null;
  if (isPending) {
    status = 'Searching…';
  } else if (searchValue !== '') {
    status =
      searchResults.length === 0
        ? `No movies matched "${searchValue}"`
        : `${searchResults.length} result${searchResults.length === 1 ? '' : 's'} found`;
  }

  return (
    <Autocomplete.Root
      items={searchResults}
      value={searchValue}
      onValueChange={(nextSearchValue) => {
        setSearchValue(nextSearchValue);

        const controller = new AbortController();
        abortControllerRef.current?.abort();
        abortControllerRef.current = controller;

        if (nextSearchValue === '') {
          setSearchResults([]);
          return;
        }

        startTransition(async () => {
          const movies = await searchMovies(nextSearchValue, contains);
          if (controller.signal.aborted) {
            return;
          }
          startTransition(() => {
            setSearchResults(movies);
          });
        });
      }}
      itemToStringValue={(movie) => movie.title}
      filter={null}
    >
      <label className={theme.FieldLabel}>
        Search movies by name or year
        <Autocomplete.Input
          placeholder="e.g. Pulp Fiction or 1994"
          className={theme.AutocompleteInput}
        />
      </label>
      <Autocomplete.Portal hidden={!status}>
        <Autocomplete.Positioner className={theme.AutocompletePositioner} sideOffset={4}>
          <Autocomplete.Popup
            className={theme.AutocompletePopup}
            aria-busy={isPending || undefined}
          >
            <Autocomplete.Status>
              {status ? <div className={theme.AutocompleteStatus}>{status}</div> : null}
            </Autocomplete.Status>
            <Autocomplete.List className={theme.AutocompleteList}>
              {(movie: Movie) => (
                <Autocomplete.Item key={movie.id} className={theme.AutocompleteItem} value={movie}>
                  <span className={theme.AutocompleteItemRow}>
                    <span>{movie.title}</span>
                    <span className={theme.AutocompleteItemMeta}>{movie.year}</span>
                  </span>
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}

/** Server-backed suggestions: control `value`, pass `filter={null}` so the already-filtered results aren't filtered again (#4196), abort stale requests, and report progress through the `Status` polite live region. */
export const AsyncSuggestions: Story = {
  tags: ['highlight', 'base'],
  render: () => <AsyncSuggestionsExample />,
};

/* ------------------------------------------------------------------ */
/* Command palette (Dialog + inline)                                   */
/* ------------------------------------------------------------------ */

interface Command {
  value: string;
  label: string;
}

const commandGroups = [
  {
    value: 'Navigation',
    items: [
      { value: 'go-home', label: 'Go to Home' },
      { value: 'go-settings', label: 'Go to Settings' },
      { value: 'go-profile', label: 'Go to Profile' },
    ],
  },
  {
    value: 'Actions',
    items: [
      { value: 'toggle-dark-mode', label: 'Toggle Dark Mode' },
      { value: 'copy-link', label: 'Copy Link' },
      { value: 'new-document', label: 'New Document' },
    ],
  },
];

function CommandPaletteExample() {
  const [open, setOpen] = React.useState(false);
  const [lastCommand, setLastCommand] = React.useState('none yet');

  function runCommand(command: Command) {
    setLastCommand(command.label);
    setOpen(false);
  }

  return (
    <div className="AutocompleteDemoStack">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger className={theme.Button}>Open command palette</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className={theme.DialogBackdrop} />
          <Dialog.Popup
            className={`${theme.DialogPopup} AutocompleteDemoPalettePopup`}
            aria-label="Command palette"
          >
            <Autocomplete.Root
              items={commandGroups}
              open
              inline
              autoHighlight="always"
              keepHighlight
            >
              <Autocomplete.Input
                className="AutocompleteDemoPaletteInput"
                aria-label="Search commands"
                placeholder="Search commands…"
              />
              <Autocomplete.Empty>
                <div className={theme.AutocompleteEmpty}>No commands found.</div>
              </Autocomplete.Empty>
              <Autocomplete.List className="AutocompleteDemoPaletteList">
                {(group: { value: string; items: Command[] }) => (
                  <Autocomplete.Group
                    key={group.value}
                    items={group.items}
                    className={theme.AutocompleteGroup}
                  >
                    <Autocomplete.GroupLabel className={theme.AutocompleteGroupLabel}>
                      {group.value}
                    </Autocomplete.GroupLabel>
                    <Autocomplete.Collection>
                      {(command: Command) => (
                        <Autocomplete.Item
                          key={command.value}
                          value={command}
                          className="AutocompleteDemoPaletteItem"
                          onClick={() => runCommand(command)}
                        >
                          <span>{command.label}</span>
                          <span className={theme.AutocompleteItemMeta}>Command</span>
                        </Autocomplete.Item>
                      )}
                    </Autocomplete.Collection>
                  </Autocomplete.Group>
                )}
              </Autocomplete.List>
            </Autocomplete.Root>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <output className="AutocompleteDemoOutput">last command: {lastCommand}</output>
    </div>
  );
}

/** The maintainer-endorsed filterable-menu recipe (#4157): `Dialog` + `<Autocomplete.Root inline open autoHighlight="always" keepHighlight>`. `inline` drops the popup so the list renders in place; `Item.onClick` fires for pointer *and* Enter (#2816). Keep `Empty` mounted so Escape stays contained (#2935). */
export const CommandPalette: Story = {
  tags: ['highlight', 'base'],
  render: () => <CommandPaletteExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(await canvas.findByRole('button', { name: 'Open command palette' }));
    const dialog = await body.findByRole('dialog');
    const input = within(dialog).getByRole('combobox', { name: 'Search commands' });

    // autoHighlight="always" keeps the first match highlighted while filtering.
    await userEvent.type(input, 'dark');
    const option = await body.findByRole('option', { name: /Toggle Dark Mode/ });
    await waitFor(() => expect(option).toHaveAttribute('data-highlighted'));

    // Enter "clicks" the highlighted item: the command runs and closes the dialog.
    await userEvent.keyboard('{Enter}');
    await expect(await canvas.findByText('last command: Toggle Dark Mode')).toBeVisible();
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Grid layout (emoji picker)                                          */
/* ------------------------------------------------------------------ */

interface EmojiItem {
  emoji: string;
  value: string;
}

const emojiItems: EmojiItem[] = [
  { emoji: '😀', value: 'grinning face' },
  { emoji: '😃', value: 'grinning face with big eyes' },
  { emoji: '😉', value: 'winking face' },
  { emoji: '😍', value: 'smiling face with heart-eyes' },
  { emoji: '🐶', value: 'dog face' },
  { emoji: '🐱', value: 'cat face' },
  { emoji: '🦊', value: 'fox' },
  { emoji: '🐼', value: 'panda' },
];

const EMOJI_COLUMNS = 4;

function chunkArray<T>(array: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < array.length; index += size) {
    result.push(array.slice(index, index + size));
  }
  return result;
}

function EmojiGridRows({ onPick }: { onPick: (item: EmojiItem) => void }) {
  const filteredItems = Autocomplete.useFilteredItems<EmojiItem>();
  return (
    <React.Fragment>
      {chunkArray(filteredItems, EMOJI_COLUMNS).map((row, rowIndex) => (
        <Autocomplete.Row key={rowIndex} className="AutocompleteDemoGridRow">
          {row.map((item) => (
            <Autocomplete.Item
              key={item.value}
              value={item}
              aria-label={item.value}
              className="AutocompleteDemoGridItem"
              onClick={() => onPick(item)}
            >
              {item.emoji}
            </Autocomplete.Item>
          ))}
        </Autocomplete.Row>
      ))}
    </React.Fragment>
  );
}

function GridLayoutExample() {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [picked, setPicked] = React.useState('none yet');

  function handlePick(item: EmojiItem) {
    setPicked(`${item.emoji} (${item.value})`);
    setPickerOpen(false);
  }

  return (
    <div className="AutocompleteDemoStack">
      <Autocomplete.Root items={emojiItems} grid open={pickerOpen} onOpenChange={setPickerOpen}>
        <Autocomplete.Trigger className={theme.Button} aria-label="Choose emoji">
          😀 Choose emoji
        </Autocomplete.Trigger>
        <Autocomplete.Portal>
          <Autocomplete.Positioner
            className={theme.AutocompletePositioner}
            sideOffset={4}
            align="start"
          >
            <Autocomplete.Popup
              className={`${theme.AutocompletePopup} AutocompleteDemoGridPopup`}
              aria-label="Select emoji"
            >
              <Autocomplete.Input
                placeholder="Search emojis…"
                className="AutocompleteDemoInsetInput"
              />
              <Autocomplete.Empty>
                <div className={theme.AutocompleteEmpty}>No emojis found.</div>
              </Autocomplete.Empty>
              <Autocomplete.List
                className="AutocompleteDemoGridList"
                style={{ '--cols': EMOJI_COLUMNS } as React.CSSProperties}
              >
                <EmojiGridRows onPick={handlePick} />
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
      <output className="AutocompleteDemoOutput">picked: {picked}</output>
    </div>
  );
}

/** `grid` + `Row` for 2D suggestion layouts (emoji pickers): columns are inferred from each `Row`, and arrow keys move the highlight across and down cells. With the Input inside the Popup, the popup takes `role="dialog"` (#3213). */
export const GridLayout: Story = {
  tags: ['api-ref', 'base'],
  render: () => <GridLayoutExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    // With the Input inside the Popup, the outside Trigger is the combobox
    // reference with aria-haspopup="dialog" (#2973).
    const trigger = await canvas.findByRole('combobox', { name: 'Choose emoji' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(trigger);
    // Input inside the popup: the popup becomes role="dialog" and contains a grid.
    const popup = await body.findByRole('dialog', { name: 'Select emoji' });
    await within(popup).findByRole('grid');
    const searchInput = within(popup).getByPlaceholderText('Search emojis…');
    await userEvent.click(searchInput);

    // ArrowDown enters the grid at the first cell.
    await userEvent.keyboard('{ArrowDown}');
    const first = within(popup).getByRole('gridcell', { name: 'grinning face' });
    await waitFor(() => expect(first).toHaveAttribute('data-highlighted'));

    // ArrowRight moves across the row.
    await userEvent.keyboard('{ArrowRight}');
    const second = within(popup).getByRole('gridcell', { name: 'grinning face with big eyes' });
    await waitFor(() => expect(second).toHaveAttribute('data-highlighted'));

    // ArrowDown moves to the same column in the next row.
    await userEvent.keyboard('{ArrowDown}');
    const below = within(popup).getByRole('gridcell', { name: 'cat face' });
    await waitFor(() => expect(below).toHaveAttribute('data-highlighted'));

    // Enter "clicks" the highlighted cell.
    await userEvent.keyboard('{Enter}');
    await expect(await canvas.findByText('picked: 🐱 (cat face)')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Virtualization (manual windowing)                                   */
/* ------------------------------------------------------------------ */

const virtualItems: string[] = Array.from(
  { length: 1000 },
  (_, index) => `Item ${String(index + 1).padStart(4, '0')}`,
);

const VIRTUAL_ITEM_HEIGHT = 32;
const VIRTUAL_OVERSCAN = 6;

function WindowedList({
  scrollerRef,
  scrollTop,
}: {
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  scrollTop: number;
}) {
  const filteredItems = Autocomplete.useFilteredItems<string>();
  const viewportHeight = scrollerRef.current?.clientHeight ?? VIRTUAL_ITEM_HEIGHT * 9;
  const start = Math.max(0, Math.floor(scrollTop / VIRTUAL_ITEM_HEIGHT) - VIRTUAL_OVERSCAN);
  const end = Math.min(
    filteredItems.length,
    Math.ceil((scrollTop + viewportHeight) / VIRTUAL_ITEM_HEIGHT) + VIRTUAL_OVERSCAN,
  );

  return (
    <div
      role="presentation"
      className="AutocompleteDemoVirtualSpacer"
      style={{ height: filteredItems.length * VIRTUAL_ITEM_HEIGHT }}
    >
      {filteredItems.slice(start, end).map((item, sliceIndex) => {
        const index = start + sliceIndex;
        return (
          <Autocomplete.Item
            key={item}
            index={index}
            value={item}
            className={theme.AutocompleteItem}
            aria-setsize={filteredItems.length}
            aria-posinset={index + 1}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: VIRTUAL_ITEM_HEIGHT,
              transform: `translateY(${index * VIRTUAL_ITEM_HEIGHT}px)`,
            }}
          >
            {item}
          </Autocomplete.Item>
        );
      })}
    </div>
  );
}

function VirtualizedExample() {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = React.useState(0);

  return (
    <Autocomplete.Root
      virtualized
      items={virtualItems}
      openOnInputClick
      onItemHighlighted={(item, eventDetails) => {
        // Keep the keyboard highlight visible inside the windowed scroller.
        const scroller = scrollerRef.current;
        if (!scroller || item == null || eventDetails.reason === 'pointer') {
          return;
        }
        const top = eventDetails.index * VIRTUAL_ITEM_HEIGHT;
        if (top < scroller.scrollTop) {
          scroller.scrollTop = top;
        } else if (top + VIRTUAL_ITEM_HEIGHT > scroller.scrollTop + scroller.clientHeight) {
          scroller.scrollTop = top + VIRTUAL_ITEM_HEIGHT - scroller.clientHeight;
        }
      }}
    >
      <label className={theme.FieldLabel}>
        Search 1,000 items
        <Autocomplete.Input
          placeholder="Click or type to browse"
          className={theme.AutocompleteInput}
        />
      </label>
      <Autocomplete.Portal>
        <Autocomplete.Positioner className={theme.AutocompletePositioner} sideOffset={4}>
          <Autocomplete.Popup className={theme.AutocompletePopup}>
            <Autocomplete.Empty>
              <div className={theme.AutocompleteEmpty}>No items found.</div>
            </Autocomplete.Empty>
            <Autocomplete.List className={theme.AutocompleteList}>
              <div
                role="presentation"
                ref={scrollerRef}
                className="AutocompleteDemoVirtualScroller"
                onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
              >
                <WindowedList scrollerRef={scrollerRef} scrollTop={scrollTop} />
              </div>
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}

/** Large lists: the `virtualized` prop + `useFilteredItems()` render only the visible window (here a dependency-free scroll window; the docs demo uses `@tanstack/react-virtual`). Set `aria-setsize`/`aria-posinset` and the `index` prop on windowed items. */
export const Virtualized: Story = {
  tags: ['highlight', 'base'],
  render: () => <VirtualizedExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole('combobox');

    await userEvent.click(input);
    await body.findByRole('listbox');
    // Windowing proof: of 1,000 items only the visible slice is in the DOM.
    await waitFor(() => expect(body.getAllByRole('option').length).toBeLessThan(50));

    await userEvent.type(input, '0999');
    await expect(await body.findByRole('option', { name: 'Item 0999' })).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Animation                                                           */

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/autocomplete)   */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Icons (inlined — stories must not import docs assets)               */
/* ------------------------------------------------------------------ */

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

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
