import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { Menu } from '@base-ui/react/menu';
import theme from '@droppy/theme';
import './scroll-area.demo.css';

/**
 * Stories follow research/c-components/scroll-area (Tier 2, floor coverage):
 * the hero recreation (Root+Viewport+Content+Scrollbar+Thumb+Corner, fixed
 * height + long content), a horizontal-only variant, a both-axes grid with
 * Corner, and a dedicated overflow-edge data-attribute styling story. No
 * popup/portal parts are involved — Scroll Area decorates native scrolling,
 * it does not open/close anything.
 */
const meta = {
  title: 'Disclosure & structure/Scroll Area',
  component: ScrollArea.Root,
  subcomponents: {
    'ScrollArea.Viewport': ScrollArea.Viewport,
    'ScrollArea.Content': ScrollArea.Content,
    'ScrollArea.Scrollbar': ScrollArea.Scrollbar,
    'ScrollArea.Thumb': ScrollArea.Thumb,
    'ScrollArea.Corner': ScrollArea.Corner,
  },
} satisfies Meta<typeof ScrollArea.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

const paragraphs = [
  `Vernacular architecture is building done outside any academic tradition, and without
  professional guidance. It is not a particular architectural movement or style, but
  rather a broad category, encompassing a wide range and variety of building types, with
  differing methods of construction, from around the world, both historical and extant and
  classical and modern. Vernacular architecture constitutes 95% of the world's built
  environment, as estimated in 1995 by Amos Rapoport, as measured against the small
  percentage of new buildings every year designed by architects and built by engineers.`,
  `This type of architecture usually serves immediate, local needs, is constrained by the
  materials available in its particular region and reflects local traditions and cultural
  practices. The study of vernacular architecture does not examine formally schooled
  architects, but instead that of the design skills and tradition of local builders, who
  were rarely given any attribution for the work. More recently, vernacular architecture
  has been examined by designers and the building industry in an effort to be more energy
  conscious with contemporary design and construction—part of a broader interest in
  sustainable design.`,
];

/** The docs hero demo: a fixed-height panel of long text content with a single vertical scrollbar whose opacity is gated on `[data-hovering]`/`[data-scrolling]`. `Corner` is composed per the canonical anatomy, but only renders once both axes overflow simultaneously — here it stays absent. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <ScrollArea.Root className={theme.ScrollAreaRoot}>
      <ScrollArea.Viewport className={theme.ScrollAreaViewport}>
        <ScrollArea.Content className={theme.ScrollAreaContent}>
          {paragraphs.map((text, index) => (
            <p key={index} className="Paragraph">
              {text}
            </p>
          ))}
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className={theme.ScrollAreaScrollbar}>
        <ScrollArea.Thumb className={theme.ScrollAreaThumb} />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner className={theme.ScrollAreaCorner} />
    </ScrollArea.Root>
  ),
  play: async ({ canvasElement }) => {
    // The vertical Scrollbar renders (content overflows the fixed height) after the overflow
    // measurement effect, so re-query inside waitFor rather than capturing a stale null.
    await waitFor(() => {
      expect(canvasElement.querySelector('[data-orientation="vertical"]')).not.toBeNull();
    });
  },
};

/** Recreation of the docs "both" demo: a 100-item grid overflows on both axes, so a vertical and a horizontal `Scrollbar` are both rendered, plus `ScrollArea.Corner` — which only renders once both axes overflow simultaneously (`hiddenState.corner`), preventing the two scrollbar tracks from intersecting. */
export const BothAxesWithCorner: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <ScrollArea.Root className="ScrollAreaSquare">
      <ScrollArea.Viewport className={theme.ScrollAreaViewport}>
        <ScrollArea.Content className="ContentPadded">
          <ul className="Grid">
            {Array.from({ length: 100 }, (_, index) => (
              <li key={index} className="Item">
                {index + 1}
              </li>
            ))}
          </ul>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className={theme.ScrollAreaScrollbar}>
        <ScrollArea.Thumb className={theme.ScrollAreaThumb} />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar className={theme.ScrollAreaScrollbar} orientation="horizontal">
        <ScrollArea.Thumb className={theme.ScrollAreaThumb} />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner className={theme.ScrollAreaCorner} />
    </ScrollArea.Root>
  ),
  play: async ({ canvasElement }) => {
    // Both axes overflow the fixed 20rem x 20rem viewport, so both scrollbars — and the Corner
    // that keeps them from intersecting — render after the overflow measurement effect.
    await waitFor(() => {
      expect(canvasElement.querySelector('[data-orientation="vertical"]')).not.toBeNull();
      expect(canvasElement.querySelector('[data-orientation="horizontal"]')).not.toBeNull();
    });
  },
};

function OverflowDataAttributeExample() {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  const readEdges = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    setAtStart(viewport.getAttribute('data-overflow-y-start') === null);
    setAtEnd(viewport.getAttribute('data-overflow-y-end') === null);
  }, []);

  return (
    <div>
      <ScrollArea.Root className={theme.ScrollAreaRoot}>
        <ScrollArea.Viewport
          ref={viewportRef}
          className={theme.ScrollAreaViewport}
          data-testid="edge-viewport"
          onScroll={readEdges}
        >
          <ScrollArea.Content className={theme.ScrollAreaContent}>
            {paragraphs.map((text, index) => (
              <p key={index} className="Paragraph">
                {text}
              </p>
            ))}
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar className={theme.ScrollAreaScrollbar}>
          <ScrollArea.Thumb className={theme.ScrollAreaThumb} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
      <div className="Legend">
        <span className="Badge" data-active={String(atStart)}>
          at start edge
        </span>
        <span className="Badge" data-active={String(atEnd)}>
          at end edge
        </span>
      </div>
    </div>
  );
}

/** `data-overflow-y-start`/`-y-end` (and their `x` counterparts) appear on the Viewport only once the user has scrolled far enough away from that specific edge (gated by `overflowEdgeThreshold`, default `0`). These — plus the matching `--scroll-area-overflow-{x,y}-{start,end}` CSS vars — are the primary styling surface for gradient scroll-fade masks; they are honest, programmatically-derived measurements, not decorative-only attributes. */
export const OverflowEdgeStyling: Story = {
  tags: ['highlight'],
  render: () => <OverflowDataAttributeExample />,
  play: async ({ canvasElement }) => {
    const viewport = canvasElement.querySelector(
      '[data-testid="edge-viewport"]',
    ) as HTMLElement | null;
    await waitFor(() => expect(viewport).not.toBeNull());
    await waitFor(() => expect(viewport).toHaveAttribute('data-has-overflow-y'));
    // At rest, scrolled to the top: the start-edge attribute is absent.
    await expect(viewport).not.toHaveAttribute('data-overflow-y-start');

    // Scrolling down produces both the start (scrolled away from top) and
    // end (more content below) edge attributes.
    viewport!.scrollTop = 40;
    viewport!.dispatchEvent(new Event('scroll', { bubbles: true }));
    await waitFor(() => expect(viewport).toHaveAttribute('data-overflow-y-start'));

    // Scrolling all the way to the bottom drops the end-edge attribute.
    viewport!.scrollTop = viewport!.scrollHeight;
    viewport!.dispatchEvent(new Event('scroll', { bubbles: true }));
    await waitFor(() => expect(viewport).not.toHaveAttribute('data-overflow-y-end'));
  },
};

/**
 * There is no built-in "always visible scrollbar" prop — the hero recipe's
 * `[data-hovering]`/`[data-scrolling]`-gated opacity is a pure-CSS choice,
 * not a Scroll Area default. This shows the gated recipe next to an
 * always-visible variant (`opacity: 1` unconditionally) side by side.
 */
export const AlwaysVisibleScrollbars: Story = {
  tags: ['highlight'],
  render: () => (
    <div className="Legend2Up">
      <div>
        <ScrollArea.Root className={theme.ScrollAreaRoot}>
          <ScrollArea.Viewport className={theme.ScrollAreaViewport}>
            <ScrollArea.Content className={theme.ScrollAreaContent}>
              {paragraphs.map((text, index) => (
                <p key={index} className="Paragraph">
                  {text}
                </p>
              ))}
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar className={theme.ScrollAreaScrollbar} data-testid="gated-scrollbar">
            <ScrollArea.Thumb className={theme.ScrollAreaThumb} />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
        <div className="LegendLabel">Default: hover/scroll-gated opacity</div>
      </div>
      <div>
        <ScrollArea.Root className={theme.ScrollAreaRoot}>
          <ScrollArea.Viewport className={theme.ScrollAreaViewport}>
            <ScrollArea.Content className={theme.ScrollAreaContent}>
              {paragraphs.map((text, index) => (
                <p key={index} className="Paragraph">
                  {text}
                </p>
              ))}
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            className="ScrollbarAlwaysVisible"
            data-testid="always-visible-scrollbar"
          >
            <ScrollArea.Thumb className={theme.ScrollAreaThumb} />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
        <div className="LegendLabel">Always-visible (custom CSS)</div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // The scrollbars render after the overflow measurement effect; re-query inside waitFor so
    // getComputedStyle is never handed a stale null. At rest (no hover, no scroll) the gated
    // scrollbar is transparent while the always-visible variant is opaque.
    await waitFor(() => {
      const gated = canvasElement.querySelector('[data-testid="gated-scrollbar"]');
      const alwaysVisible = canvasElement.querySelector('[data-testid="always-visible-scrollbar"]');
      expect(gated).not.toBeNull();
      expect(alwaysVisible).not.toBeNull();
      expect(getComputedStyle(gated as HTMLElement).opacity).toBe('0');
      expect(getComputedStyle(alwaysVisible as HTMLElement).opacity).toBe('1');
    });
  },
};

/**
 * The Scrollbar's `[data-scrolling]` state is tracked independently per axis
 * (`scrollingX`/`scrollingY`) — scrolling only the vertical axis never sets
 * `[data-scrolling]` on the horizontal Scrollbar.
 */
export const OnScrollVisibility: Story = {
  tags: ['highlight'],
  render: () => (
    <ScrollArea.Root className="ScrollAreaSquare">
      <ScrollArea.Viewport className={theme.ScrollAreaViewport} data-testid="onscroll-viewport">
        <ScrollArea.Content className="ContentPadded">
          <ul className="Grid">
            {Array.from({ length: 100 }, (_, index) => (
              <li key={index} className="Item">
                {index + 1}
              </li>
            ))}
          </ul>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="ScrollbarOnScrollOnly" data-testid="vertical-onscroll">
        <ScrollArea.Thumb className={theme.ScrollAreaThumb} />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar
        className="ScrollbarOnScrollOnly"
        orientation="horizontal"
        data-testid="horizontal-onscroll"
      >
        <ScrollArea.Thumb className={theme.ScrollAreaThumb} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  ),
  play: async ({ canvasElement, userEvent }) => {
    const viewport = canvasElement.querySelector(
      '[data-testid="onscroll-viewport"]',
    ) as HTMLElement;
    // The scrollbars render after the overflow measurement effect — wait for the vertical one
    // to exist before asserting on it.
    const verticalScrollbar = await waitFor(() => {
      const el = canvasElement.querySelector('[data-testid="vertical-onscroll"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    const horizontalScrollbar = canvasElement.querySelector(
      '[data-testid="horizontal-onscroll"]',
    ) as HTMLElement;

    await expect(verticalScrollbar).not.toHaveAttribute('data-scrolling');

    // A scroll only counts as "user-driven" (and thus flips `[data-scrolling]`)
    // once a real user-interaction event — pointer/wheel/touch/key — has
    // fired on the Viewport; a bare synthetic `scroll` event alone is treated
    // as programmatic and skipped by this specific state.
    await userEvent.hover(viewport);
    viewport.scrollTop = 40;
    viewport.dispatchEvent(new Event('scroll', { bubbles: true }));

    await waitFor(() => expect(verticalScrollbar).toHaveAttribute('data-scrolling'));
    // A vertical-only scroll never marks the horizontal scrollbar as scrolling.
    await expect(horizontalScrollbar).not.toHaveAttribute('data-scrolling');
  },
};

/** Recreation of the docs "scroll fade" demo: a `mask-image` gradient on the Viewport, sized from `--scroll-area-overflow-y-start`/`-end` (with the documented `, 40px` SSR fallback for the `-end` var, which is absent until the first measurement effect runs). */
export const GradientScrollFade: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <ScrollArea.Root className={theme.ScrollAreaRoot}>
      <ScrollArea.Viewport className={theme.ScrollAreaViewportFade} data-testid="fade-viewport">
        <ScrollArea.Content className={theme.ScrollAreaContent}>
          {paragraphs.map((text, index) => (
            <p key={index} className="Paragraph">
              {text}
            </p>
          ))}
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className={theme.ScrollAreaScrollbar}>
        <ScrollArea.Thumb className={theme.ScrollAreaThumb} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  ),
  play: async ({ canvasElement }) => {
    const viewport = canvasElement.querySelector('[data-testid="fade-viewport"]') as HTMLElement;

    await waitFor(() =>
      expect(viewport.style.getPropertyValue('--scroll-area-overflow-y-start')).toBe('0px'),
    );

    viewport.scrollTop = 40;
    viewport.dispatchEvent(new Event('scroll', { bubbles: true }));

    // Scrolling away from the top grows the start-edge CSS var, which the
    // mask-image gradient reads directly to fade the top edge in.
    await waitFor(() =>
      expect(viewport.style.getPropertyValue('--scroll-area-overflow-y-start')).not.toBe('0px'),
    );
  },
};

/**
 * Recreation of `experiments/scroll-area/inside-menu.tsx`: `ScrollArea.*`
 * wraps a long list of `Menu.Item`s inside a `Menu.Popup`, with `tabIndex={-1}`
 * on the Viewport so the popup's own focus-trap/list-navigation stays in
 * control instead of the Viewport competing for Tab order ([#4220](https://github.com/mui/base-ui/pull/4220)).
 * `Select.ScrollUpArrow`/`ScrollDownArrow` are a structurally separate
 * mechanism from `ScrollArea.*` — the two don't compose; pick one scroll
 * mechanism per popup.
 */
export const InsideAPopup: Story = {
  tags: ['highlight'],
  render: () => (
    <Menu.Root>
      <Menu.Trigger className={theme.MenuTrigger}>Choose an item</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={theme.MenuPositioner} sideOffset={8}>
          <Menu.Popup className={theme.MenuPopup}>
            <ScrollArea.Root className="MenuScrollArea">
              <ScrollArea.Viewport className="MenuViewport" tabIndex={-1}>
                <ScrollArea.Content>
                  {Array.from({ length: 100 }, (_, index) => (
                    <Menu.Item className={theme.MenuItem} key={index}>
                      Item {index + 1}
                    </Menu.Item>
                  ))}
                </ScrollArea.Content>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar className={theme.ScrollAreaScrollbar}>
                <ScrollArea.Thumb className={theme.ScrollAreaThumb} />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Choose an item' });

    await userEvent.click(trigger);
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());

    const firstItem = body.getByRole('menuitem', { name: 'Item 1' });
    await expect(firstItem).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  },
};
