import * as React from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';
import theme from '@droppy/theme';
import '../autocomplete.demo.css';
import '../autocomplete-real-world.demo.css';

/**
 * Recreation of keenthemes/reui's full-anatomy, multi-skin Autocomplete: `Backdrop` +
 * `Arrow` are rendered (the fullest part list observed for this component anywhere in
 * the research corpus) and every class list is compound-styled so a single ancestor
 * `data-skin` attribute swaps the whole visual skin, matching reui's `style-vega` /
 * `style-nova` / … convention. Recomposed from the ideas in keenthemes/reui
 * `registry-reui/bases/base/reui/autocomplete.tsx` (MIT, code-ok,
 * research/d-real-world-usage/autocomplete/ranked.json #4).
 */
const componentNames = ['Autocomplete', 'Button', 'Dialog', 'Field', 'Form', 'Select', 'Tabs'];

const skins = ['vega', 'nova'] as const;
type Skin = (typeof skins)[number];

export function MultiSkinAutocompleteExample() {
  const [skin, setSkin] = React.useState<Skin>('vega');

  return (
    <div className="AutocompleteDemoSkinRoot">
      <div className="AutocompleteDemoSkinSwitcher">
        {skins.map((candidate) => (
          <button
            key={candidate}
            type="button"
            className="AutocompleteDemoSkinButton"
            aria-pressed={skin === candidate}
            onClick={() => setSkin(candidate)}
          >
            {candidate}
          </button>
        ))}
      </div>
      <label className={theme.FieldLabel}>
        Search components
        <Autocomplete.Root items={componentNames}>
          <Autocomplete.Input placeholder="e.g. button" className={theme.AutocompleteInput} />
          <Autocomplete.Portal>
            <Autocomplete.Backdrop className="AutocompleteDemoSkinBackdrop" />
            <Autocomplete.Positioner className={theme.AutocompletePositioner} sideOffset={8}>
              <Autocomplete.Popup
                className={`${theme.AutocompletePopup} AutocompleteDemoSkinPopup`}
                data-skin={skin}
              >
                <Autocomplete.Arrow className="AutocompleteDemoSkinArrow" data-skin={skin} />
                <Autocomplete.Empty
                  className={`${theme.AutocompleteEmpty} AutocompleteDemoSkinEmpty`}
                  data-skin={skin}
                >
                  No matches.
                </Autocomplete.Empty>
                <Autocomplete.List className={theme.AutocompleteList}>
                  {(item: string) => (
                    <Autocomplete.Item
                      key={item}
                      value={item}
                      className={`${theme.AutocompleteItem} AutocompleteDemoSkinItem`}
                      data-skin={skin}
                    >
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>
      </label>
    </div>
  );
}
