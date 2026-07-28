import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { Toolbar } from '@base-ui/react/toolbar';
import theme from '@droppy/theme';
import '../popover.demo.css';

/**
 * Recreation of the link editor in the flashtype markdown editor's formatting
 * toolbar: `Toolbar.Button` composes `Popover.Trigger` via `render` inside a
 * roving-tabindex toolbar, and `initialFocus` routes focus straight to the URL
 * input, past the "Remove link" button (the same idea as Gutenberg's
 * deprioritized-initial-focus hook). Recomposed from opral/flashtype
 * `formatting-toolbar.tsx` (MIT, code-ok,
 * research/d-real-world-usage/popover/ranked.json #3).
 */
export function LinkEditorToolbarExample() {
  const urlInputRef = React.useRef<HTMLInputElement>(null);
  const [href, setHref] = React.useState('https://example.com/docs');
  const [draft, setDraft] = React.useState(href);
  return (
    <div className="PopoverStack">
      <Toolbar.Root className={theme.ToolbarRoot}>
        <Toolbar.Button className={theme.ToolbarButton} aria-label="Bold">
          B
        </Toolbar.Button>
        <Toolbar.Button className={theme.ToolbarButton} aria-label="Italic">
          I
        </Toolbar.Button>
        <Popover.Root>
          <Toolbar.Button className={theme.ToolbarButton} render={<Popover.Trigger />}>
            Edit link
          </Toolbar.Button>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup className={theme.PopoverPopup} initialFocus={urlInputRef}>
                <Popover.Close className={theme.PopoverTrigger} onClick={() => setHref('')}>
                  Remove link
                </Popover.Close>
                <label className="PopoverLabel">
                  URL
                  <input
                    ref={urlInputRef}
                    className={theme.Input}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                </label>
                <Popover.Close className={theme.PopoverTrigger} onClick={() => setHref(draft)}>
                  Save
                </Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </Toolbar.Root>
      <output className="PopoverOutput">href: {href || 'none'}</output>
    </div>
  );
}
