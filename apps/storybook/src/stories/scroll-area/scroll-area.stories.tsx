import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { ScrollArea } from '@base-ui/react/scroll-area';
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
