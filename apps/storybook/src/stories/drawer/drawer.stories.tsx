import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Drawer } from '@base-ui/react/drawer';
import theme from '@droppy/theme';
import './drawer.demo.css';

/**
 * Stories follow research/c-components/drawer (Tier 1): the kept docs demos (hero,
 * position, snap points, indent provider, nested, swipe area, virtual keyboard,
 * mobile nav), the required full open→close interaction story, the four-sides
 * `swipeDirection` matrix, and the swipe styling contract.
 *
 * Drawer runs Dialog's root engine (`useRenderDialogRoot` mode `'drawer'`), so focus,
 * dismissal, and portal behavior are inherited — plays re-prove them on Drawer where
 * cheap and link to the Dialog page otherwise.
 *
 * GESTURE COVERAGE: swipe-to-dismiss, swipe-to-open, and drag-to-snap are pointer
 * gestures driven natively outside React ([#4980](https://github.com/mui/base-ui/pull/4980)).
 * Synthetic pointer sequences do not reliably reach that engine in CI, so no play
 * function here performs a drag. Gesture stories render the full styling contract
 * (`--drawer-swipe-*` vars, `data-swiping`/`data-swipe-dismiss`) for manual testing
 * and assert only gesture-free state.
 *
 * Every story renders the complete `Portal > Backdrop > Viewport > Popup` subtree:
 * Viewport is REQUIRED for Drawer (dev warning without it,
 * [#4495](https://github.com/mui/base-ui/pull/4495)) — unlike Dialog, where it is optional.
 */
const meta = {
  title: 'Overlays/Drawer',
  component: Drawer.Root,
  subcomponents: {
    'Drawer.Trigger': Drawer.Trigger,
    'Drawer.Portal': Drawer.Portal,
    'Drawer.Backdrop': Drawer.Backdrop,
    'Drawer.Viewport': Drawer.Viewport,
    'Drawer.Popup': Drawer.Popup,
    'Drawer.Content': Drawer.Content,
    'Drawer.Title': Drawer.Title,
    'Drawer.Description': Drawer.Description,
    'Drawer.Close': Drawer.Close,
    'Drawer.SwipeArea': Drawer.SwipeArea,
    'Drawer.Provider': Drawer.Provider,
    'Drawer.Indent': Drawer.Indent,
    'Drawer.IndentBackground': Drawer.IndentBackground,
    'Drawer.VirtualKeyboardProvider': Drawer.VirtualKeyboardProvider,
  },
} satisfies Meta<typeof Drawer.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Kept docs demos + core behavior                                     */
/* ------------------------------------------------------------------ */

/** The docs hero demo: a side drawer (`swipeDirection="right"`) with Title, Description, and Close, whose backdrop fades with `--drawer-swipe-progress` while dragging. The `--bleed` margin lets the panel overshoot its edge during spring-back without showing a gap. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <Drawer.Root swipeDirection="right">
      <Drawer.Trigger className={theme.Button}>Open drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={theme.DrawerBackdrop} />
        <Drawer.Viewport className="DrawerHeroViewport">
          <Drawer.Popup className="DrawerHeroPopup">
            <Drawer.Content className="DrawerContent">
              <Drawer.Title className={theme.DrawerTitle}>Drawer</Drawer.Title>
              <Drawer.Description className={theme.DrawerDescription}>
                This is a drawer that slides in from the side. You can swipe to dismiss it.
              </Drawer.Description>
              <div className={theme.DrawerActions}>
                <Drawer.Close className={theme.Button}>Close</Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const doc = canvasElement.ownerDocument;
    const trigger = canvas.getByRole('button', { name: 'Open drawer' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');

    // Open: the popup portals to document.body with role="dialog".
    await userEvent.click(trigger);
    const drawer = await body.findByRole('dialog');
    await waitFor(() => expect(drawer).toBeVisible());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // Focus moves inside the popup (inherited Dialog behavior).
    await waitFor(() => expect(drawer).toContainElement(doc.activeElement as HTMLElement));

    // Close via the visible Close button — the required alternative to gestures.
    await userEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/* ------------------------------------------------------------------ */
/* The four-sides matrix (`swipeDirection`)                            */
/* ------------------------------------------------------------------ */

type SwipeSide = 'up' | 'down' | 'left' | 'right';

const SIDE_COPY: Record<SwipeSide, { trigger: string; title: string; hint: string }> = {
  up: { trigger: 'Open top sheet', title: 'Top sheet', hint: 'Swipe up to dismiss.' },
  down: { trigger: 'Open bottom sheet', title: 'Bottom sheet', hint: 'Swipe down to dismiss.' },
  left: { trigger: 'Open left drawer', title: 'Left drawer', hint: 'Swipe left to dismiss.' },
  right: { trigger: 'Open right drawer', title: 'Right drawer', hint: 'Swipe right to dismiss.' },
};

const SIDE_VIEWPORT_CLASS: Record<SwipeSide, string> = {
  up: 'DrawerEdgeViewportUp',
  down: 'DrawerEdgeViewportDown',
  left: 'DrawerEdgeViewportLeft',
  right: 'DrawerEdgeViewportRight',
};

/**
 * One render function for all four sides: `swipeDirection` sets the dismissal gesture
 * axis and stamps `data-swipe-direction` on the popup — your CSS does the actual
 * placement (there is no Positioner part). The shared `.EdgePopup` class keys size,
 * borders, and enter/exit transforms off `[data-swipe-direction]`.
 */
function EdgeDrawerExample({ side }: { side: SwipeSide }) {
  const copy = SIDE_COPY[side];
  return (
    <Drawer.Root swipeDirection={side}>
      <Drawer.Trigger className={theme.Button}>{copy.trigger}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={theme.DrawerBackdrop} />
        <Drawer.Viewport className={`${'DrawerEdgeViewport'} ${SIDE_VIEWPORT_CLASS[side]}`}>
          <Drawer.Popup className="DrawerEdgePopup">
            <Drawer.Content className="DrawerContent">
              <Drawer.Title className={theme.DrawerTitle}>{copy.title}</Drawer.Title>
              <Drawer.Description className={theme.DrawerDescription}>
                {copy.hint} Positioning is plain CSS — only the gesture axis is configured.
              </Drawer.Description>
              <div className={theme.DrawerActions}>
                <Drawer.Close className={theme.Button}>Close</Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function playEdgeDrawer(side: SwipeSide): Story['play'] {
  return async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: SIDE_COPY[side].trigger }));
    const drawer = await body.findByRole('dialog');
    await waitFor(() => expect(drawer).toHaveAttribute('data-swipe-direction', side));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
  };
}

/** `swipeDirection="down"` — the default: the canonical mobile bottom sheet. */
export const SideBottom: Story = {
  tags: ['highlight', 'base'],
  render: () => <EdgeDrawerExample side="down" />,
  play: playEdgeDrawer('down'),
};

/* ------------------------------------------------------------------ */
/* Snap points                                                         */
/* ------------------------------------------------------------------ */

const SNAP_POINTS: Drawer.Root.SnapPoint[] = ['148px', 1];

function SnapPointsExample() {
  const [snapPoint, setSnapPoint] = React.useState<Drawer.Root.SnapPoint | null>(SNAP_POINTS[0]);
  return (
    <Drawer.Root snapPoints={SNAP_POINTS} snapPoint={snapPoint} onSnapPointChange={setSnapPoint}>
      <Drawer.Trigger className={theme.Button}>Open snap drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={theme.DrawerBackdrop} />
        <Drawer.Viewport className="DrawerSheetViewport">
          <Drawer.Popup className="DrawerSnapPopup" data-testid="snap-popup">
            <div className="DrawerDragArea">
              <div className={theme.DrawerGrabber} />
              <Drawer.Title className="DrawerSheetTitle">Snap points</Drawer.Title>
              <div className="DrawerSheetActions">
                <button type="button" className={theme.Button} onClick={() => setSnapPoint(1)}>
                  Expand
                </button>
                <button
                  type="button"
                  className={theme.Button}
                  onClick={() => setSnapPoint(SNAP_POINTS[0])}
                >
                  Peek
                </button>
                <Drawer.Close className={theme.Button}>Close</Drawer.Close>
              </div>
            </div>
            <Drawer.Content className="DrawerSnapScroll">
              <Drawer.Description className="DrawerSheetDescription">
                Drag the sheet between the compact peek and the full-height detent — or drive the
                controlled `snapPoint` with the buttons above.
              </Drawer.Description>
              <div className="DrawerCards" aria-hidden>
                {Array.from({ length: 12 }, (_, index) => (
                  <div className="DrawerCard" key={index} />
                ))}
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/**
 * `snapPoints={['148px', 1]}` (docs values): strings are `px`/`rem` lengths, numbers
 * 0–1 are viewport-height fractions, numbers above 1 are pixels. The popup transform
 * composes `--drawer-snap-point-offset` with `--drawer-swipe-movement-y`, and
 * `data-expanded` marks the full-height detent. The play drives the controlled
 * `snapPoint` prop instead of dragging; `snapToSequentialPoints` (not set here)
 * disables velocity-based point skipping for tall multi-detent sheets.
 */
export const SnapPoints: Story = {
  tags: ['api-ref', 'base'],
  render: () => <SnapPointsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open snap drawer' }));
    const popup = await body.findByTestId('snap-popup');
    // Initial detent is the 148px peek — not the expanded snap point.
    await waitFor(() => expect(popup).not.toHaveAttribute('data-expanded'));

    await userEvent.click(within(popup).getByRole('button', { name: 'Expand' }));
    await waitFor(() => expect(popup).toHaveAttribute('data-expanded'));

    await userEvent.click(within(popup).getByRole('button', { name: 'Peek' }));
    await waitFor(() => expect(popup).not.toHaveAttribute('data-expanded'));

    await userEvent.click(within(popup).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(popup).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* The swipe styling contract                                          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Swipe to open                                                       */
/* ------------------------------------------------------------------ */

/**
 * `Drawer.SwipeArea` is an invisible strip at the closed drawer's edge that listens
 * for swipe gestures to OPEN it (removed during preview, restored in
 * [#4102](https://github.com/mui/base-ui/pull/4102); reliability reworked in
 * [#5105](https://github.com/mui/base-ui/pull/5105)). It is tinted here for
 * demonstration. It is pointer-only, so it must never be the sole way in — this story
 * pairs it with a regular Trigger, and the play uses the trigger, not a gesture.
 */
export const SwipeAreaOpen: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <Drawer.Root swipeDirection="right">
      <Drawer.SwipeArea className="DrawerSwipeAreaStrip" data-testid="swipe-area">
        <span className="DrawerSwipeAreaLabel">Swipe here</span>
      </Drawer.SwipeArea>
      <Drawer.Trigger className={theme.Button}>Open library</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={theme.DrawerBackdrop} />
        <Drawer.Viewport className="DrawerHeroViewport">
          <Drawer.Popup className="DrawerHeroPopup">
            <Drawer.Content className="DrawerContent">
              <Drawer.Title className={theme.DrawerTitle}>Library</Drawer.Title>
              <Drawer.Description className={theme.DrawerDescription}>
                Swipe from the tinted right-edge strip whenever you want to jump back into your
                playlists — or use the button.
              </Drawer.Description>
              <div className={theme.DrawerActions}>
                <Drawer.Close className={theme.Button}>Close</Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const swipeArea = body.getByTestId('swipe-area');
    // The strip renders while closed, reflecting state + gesture axis. SwipeArea's
    // own swipeDirection prop is unset, so it resolves to the OPPOSITE of Root's
    // dismiss direction ('right') — i.e. 'left' opens a drawer that dismisses right.
    await expect(swipeArea).toHaveAttribute('data-closed');
    await expect(swipeArea).toHaveAttribute('data-swipe-direction', 'left');

    await userEvent.click(canvas.getByRole('button', { name: 'Open library' }));
    const drawer = await body.findByRole('dialog');
    await waitFor(() => expect(swipeArea).toHaveAttribute('data-open'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Indent provider (app-shell effect)                                  */
/* ------------------------------------------------------------------ */

function IndentProviderExample() {
  const [portalContainer, setPortalContainer] = React.useState<HTMLDivElement | null>(null);
  return (
    <Drawer.Provider>
      <div className="DrawerIndentRoot" ref={setPortalContainer}>
        <Drawer.IndentBackground className="DrawerIndentBackground" />
        <Drawer.Indent className="DrawerIndent" data-testid="indent">
          <div className="DrawerIndentCenter">
            <Drawer.Root modal={false}>
              <Drawer.Trigger className={theme.Button}>Open drawer</Drawer.Trigger>
              <Drawer.Portal container={portalContainer}>
                <Drawer.Backdrop className="DrawerContainedBackdrop" />
                <Drawer.Viewport className="DrawerContainedViewport">
                  <Drawer.Popup className="DrawerSheetPopup">
                    <div className={theme.DrawerGrabber} />
                    <Drawer.Content className="DrawerContent">
                      <Drawer.Title className="DrawerSheetTitle">Notifications</Drawer.Title>
                      <Drawer.Description className="DrawerSheetDescription">
                        You are all caught up. Good job!
                      </Drawer.Description>
                      <div className="DrawerSheetActions">
                        <Drawer.Close className={theme.Button}>Close</Drawer.Close>
                      </div>
                    </Drawer.Content>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.Root>
          </div>
        </Drawer.Indent>
      </div>
    </Drawer.Provider>
  );
}

/**
 * The vaul-style app-shell effect (a #3680 launch-checklist item): `Drawer.Provider`
 * coordinates globally, `Drawer.Indent` wraps your app's main UI and gets
 * `[data-active]` while any drawer inside the provider is open (scale/inset it in
 * CSS), and `Drawer.IndentBackground` sits behind it as a styleable backdrop layer.
 * Note the Root nests INSIDE the Indent. This demo portals into the shell container
 * so the effect stays contained; the scale eases back as you drag, via
 * `--drawer-swipe-progress` on the Indent.
 */
export const IndentProvider: Story = {
  tags: ['highlight', 'base'],
  render: () => <IndentProviderExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const indent = canvas.getByTestId('indent');
    await expect(indent).not.toHaveAttribute('data-active');

    await userEvent.click(canvas.getByRole('button', { name: 'Open drawer' }));
    const drawer = await body.findByRole('dialog');
    // The app shell wrapper reflects the open drawer.
    await waitFor(() => expect(indent).toHaveAttribute('data-active'));

    await userEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(indent).not.toHaveAttribute('data-active'));
  },
};

/* ------------------------------------------------------------------ */
/* Nesting                                                             */
/* ------------------------------------------------------------------ */

/**
 * Nested drawers stack like cards (docs `nested` demo): the parent popup gets
 * `[data-nested-drawer-open]` / `[data-nested-drawer-swiping]` plus the
 * `--nested-drawers` count and `--drawer-frontmost-height` (border-inclusive since
 * [#4202](https://github.com/mui/base-ui/pull/4202)) to scale itself behind the child.
 * Each drawer remains independently focus-managed.
 */
export const NestedDrawers: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <Drawer.Root>
      <Drawer.Trigger className={theme.Button}>Open drawer stack</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={theme.DrawerBackdrop} />
        <Drawer.Viewport className="DrawerSheetViewport">
          <Drawer.Popup className="DrawerStackPopup">
            <div className={theme.DrawerGrabber} />
            <Drawer.Content className="DrawerStackContent">
              <Drawer.Title className="DrawerSheetTitle">Account</Drawer.Title>
              <Drawer.Description className="DrawerSheetDescription">
                Nested drawers can be styled to stack, while each drawer remains independently focus
                managed.
              </Drawer.Description>
              <div className="DrawerSheetActions">
                <Drawer.Root>
                  <Drawer.Trigger className={theme.Button}>Security settings</Drawer.Trigger>
                  <Drawer.Portal>
                    <Drawer.Viewport className="DrawerSheetViewport">
                      <Drawer.Popup className="DrawerStackPopup">
                        <div className={theme.DrawerGrabber} />
                        <Drawer.Content className="DrawerStackContent">
                          <Drawer.Title className="DrawerSheetTitle">Security</Drawer.Title>
                          <Drawer.Description className="DrawerSheetDescription">
                            Review sign-in activity and update your security preferences.
                          </Drawer.Description>
                          <div className="DrawerSheetActions">
                            <Drawer.Close className={theme.Button}>Done</Drawer.Close>
                          </div>
                        </Drawer.Content>
                      </Drawer.Popup>
                    </Drawer.Viewport>
                  </Drawer.Portal>
                </Drawer.Root>
                <Drawer.Close className={theme.Button}>Close</Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open drawer stack' }));
    const parent = await body.findByRole('dialog', { name: 'Account' });

    await userEvent.click(within(parent).getByRole('button', { name: 'Security settings' }));
    const child = await body.findByRole('dialog', { name: 'Security' });
    // The parent recedes behind the child via its nested-drawer attribute.
    await waitFor(() => expect(parent).toHaveAttribute('data-nested-drawer-open'));

    await userEvent.click(within(child).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(child).not.toBeInTheDocument());
    await waitFor(() => expect(parent).not.toHaveAttribute('data-nested-drawer-open'));
    await expect(parent).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Forms                                                               */

function CloseConfirmationExample() {
  const [blocked, setBlocked] = React.useState(0);
  const [draft, setDraft] = React.useState('');
  const titleId = React.useId();
  return (
    <div className="DrawerStack">
      <Drawer.Root
        onOpenChange={(nextOpen, eventDetails) => {
          // Any light dismissal (swipe, Esc, outside press) with unsaved input is
          // vetoed; only the explicit buttons may discard the draft.
          if (!nextOpen && draft.length > 0 && eventDetails.reason !== 'close-press') {
            eventDetails.cancel();
            setBlocked((count) => count + 1);
          }
        }}
      >
        <Drawer.Trigger className={theme.Button}>Write feedback</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop className={theme.DrawerBackdrop} data-testid="confirm-backdrop" />
          <Drawer.Viewport className="DrawerSheetViewport">
            <Drawer.Popup className="DrawerSheetPopup">
              <div className={theme.DrawerGrabber} />
              <Drawer.Content className="DrawerContent">
                <Drawer.Title id={titleId} className="DrawerSheetTitle">
                  Feedback
                </Drawer.Title>
                <Drawer.Description className="DrawerSheetDescription">
                  With text in the box, swiping, Esc, and outside presses are all vetoed.
                </Drawer.Description>
                <textarea
                  aria-labelledby={titleId}
                  className={theme.FieldTextarea}
                  placeholder="What’s on your mind?"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <div className="DrawerSheetActions">
                  <Drawer.Close className={theme.Button}>Discard</Drawer.Close>
                </div>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
      <output className="DrawerOutput">blocked closes: {blocked}</output>
    </div>
  );
}

/**
 * Vetoing dismissal: there is NO `disableSwipeDismissal` prop — cancel the change
 * request in `onOpenChange` instead. `eventDetails.reason === 'swipe'` identifies
 * gesture dismissal, and `eventDetails.cancel()` keeps the drawer open and cleans up
 * the swipe-dismiss styles (root tests). The same veto covers Esc and outside press
 * here (docs `close-confirmation` pattern, [#4600](https://github.com/mui/base-ui/pull/4600));
 * relatedly, swiping can never force-close a controlled drawer the owner didn't close
 * ([#4133](https://github.com/mui/base-ui/pull/4133)). The play vetoes via Esc — the
 * swipe path needs a real pointer drag.
 */
export const CloseConfirmation: Story = {
  tags: ['highlight', 'base'],
  render: () => <CloseConfirmationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Write feedback' }));
    const drawer = await body.findByRole('dialog');
    await userEvent.type(within(drawer).getByRole('textbox'), 'Draft in progress');

    // Esc with a dirty draft: the close request is canceled.
    await userEvent.keyboard('{Escape}');
    await expect(await canvas.findByText('blocked closes: 1')).toBeVisible();
    await waitFor(() => expect(drawer).toBeVisible());

    // The explicit Discard button (reason `close-press`) still closes.
    await userEvent.click(within(drawer).getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Animation                                                           */
/* ------------------------------------------------------------------ */

function ExitAnimationExample() {
  const [settled, setSettled] = React.useState('none yet');
  return (
    <div className="DrawerStack">
      <Drawer.Root onOpenChangeComplete={(open) => setSettled(open ? 'open' : 'closed')}>
        <Drawer.Trigger className={theme.Button}>Open sheet</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop className={theme.DrawerBackdrop} />
          <Drawer.Viewport className="DrawerSheetViewport">
            <Drawer.Popup className="DrawerSheetPopup">
              <div className={theme.DrawerGrabber} />
              <Drawer.Content className="DrawerContent">
                <Drawer.Title className="DrawerSheetTitle">Animated sheet</Drawer.Title>
                <Drawer.Description className="DrawerSheetDescription">
                  CSS transitions drive both entry and exit via data attributes.
                </Drawer.Description>
                <div className="DrawerSheetActions">
                  <Drawer.Close className={theme.Button}>Close</Drawer.Close>
                </div>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
      <output className="DrawerOutput">animation settled: {settled}</output>
    </div>
  );
}

/**
 * The inherited animation contract on Drawer: transitions hang off
 * `[data-starting-style]`/`[data-ending-style]`, the popup stays mounted until the
 * exit settles, then `onOpenChangeComplete(false)` fires. Drawer adds two exit-only
 * hooks no play can trigger: `[data-swipe-dismiss]` (present when closed by swiping —
 * style a faster, directional exit) and `--drawer-swipe-strength` (0.1–1, scales the
 * release duration so a hard fling exits faster) — both wired in this story's CSS.
 */
export const ExitAnimation: Story = {
  tags: ['animation'],
  render: () => <ExitAnimationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open sheet' }));
    const drawer = await body.findByRole('dialog');
    await expect(await canvas.findByText('animation settled: open')).toBeVisible();

    await userEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
    // Mid-transition the popup is still mounted, marked with data-ending-style.
    await waitFor(() => expect(drawer).toHaveAttribute('data-ending-style'));
    await expect(await canvas.findByText('animation settled: closed')).toBeVisible();
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Keyboard & focus                                                    */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Real-world archetype                                                */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = ['Overview', 'Components', 'Utilities', 'Releases'] as const;

function MobileNavigationExample() {
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState<string>('Overview');
  return (
    <div className="DrawerStack">
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger className={theme.Button} aria-label="Open menu">
          <MenuIcon />
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop className={theme.DrawerBackdrop} />
          <Drawer.Viewport className="DrawerSheetViewport">
            <Drawer.Popup className="DrawerSheetPopup">
              <div className={theme.DrawerGrabber} />
              <Drawer.Content className="DrawerContent">
                <Drawer.Title className="DrawerSheetTitle">Menu</Drawer.Title>
                <nav aria-label="Site">
                  <ul className="DrawerNavList">
                    {NAV_ITEMS.map((item) => (
                      <li key={item}>
                        <button
                          type="button"
                          className="DrawerNavLink"
                          aria-current={page === item ? 'page' : undefined}
                          onClick={() => {
                            setPage(item);
                            setOpen(false);
                          }}
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="DrawerSheetActions">
                  <Drawer.Close className={theme.Button}>Close</Drawer.Close>
                </div>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
      <output className="DrawerOutput">current page: {page}</output>
    </div>
  );
}

/**
 * The mobile-navigation archetype (docs `mobile-nav` demo shape): a hamburger trigger
 * opens a bottom sheet of navigation items; choosing one navigates and closes the
 * controlled drawer. Phase D real-world mining returned only lean, unverified drawer
 * candidates (research/d-real-world-usage/drawer/candidates.json), so this recreates
 * the documented archetype rather than a specific production repo [G].
 */
export const MobileNavigation: Story = {
  tags: ['highlight', 'base'],
  render: () => <MobileNavigationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
    const drawer = await body.findByRole('dialog');
    // Choosing a destination navigates and dismisses the sheet.
    await userEvent.click(within(drawer).getByRole('button', { name: 'Components' }));
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
    await expect(canvas.getByText('current page: Components')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Icons (inlined — stories must not import docs assets)               */
/* ------------------------------------------------------------------ */

function MenuIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Non-modal drawer (docs "non-modal" demo)                             */
/* ------------------------------------------------------------------ */

/**
 * `modal={false}` leaves the page interactive: focus is not trapped and the
 * background keeps scrolling. Paired with `disablePointerDismissal`, the drawer
 * only closes through an explicit control or a swipe.
 */
export const NonModal: Story = {
  tags: ['api-ref', 'base'],
  render: () => (
    <Drawer.Root swipeDirection="right" modal={false} disablePointerDismissal>
      <Drawer.Trigger className={theme.Button}>Open non-modal drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Viewport className="DrawerEdgeViewport DrawerEdgeViewportRight">
          <Drawer.Popup className="DrawerEdgePopup">
            <Drawer.Content className="DrawerContent">
              <Drawer.Title className={theme.DrawerTitle}>Non-modal drawer</Drawer.Title>
              <Drawer.Description className={theme.DrawerDescription}>
                This drawer does not trap focus and ignores outside clicks. Use the close button or
                swipe to dismiss it.
              </Drawer.Description>
              <div className={theme.DrawerActions}>
                <Drawer.Close className={theme.Button}>Close</Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Open non-modal drawer' }));

    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());
    // Non-modal: the trigger behind the drawer stays reachable.
    await expect(canvas.getByRole('button', { name: 'Open non-modal drawer' })).toBeVisible();

    await userEvent.click(body.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Uncontained content (docs "uncontained" demo)                        */
/* ------------------------------------------------------------------ */

const UNCONTAINED_ACTIONS = ['Unfollow', 'Mute', 'Add to Favourites', 'Restrict'];

function UncontainedExample() {
  const [open, setOpen] = React.useState(false);

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className={theme.Button}>Open action sheet</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={theme.DrawerBackdrop} />
        <Drawer.Viewport className="DrawerSheetViewport">
          <Drawer.Popup className="DrawerSheetPopup">
            <Drawer.Content className="DrawerContent">
              <Drawer.Title className="DrawerSheetTitle">Profile actions</Drawer.Title>
              <Drawer.Description className="DrawerSheetDescription">
                Choose an action for this user.
              </Drawer.Description>
              <div className="DrawerSheetActions">
                {UNCONTAINED_ACTIONS.map((action) => (
                  <button
                    key={action}
                    type="button"
                    className={theme.Button}
                    onClick={() => setOpen(false)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </Drawer.Content>
            {/* A second surface outside Content: the popup is not one contained box. */}
            <div className="DrawerStackContent">
              <button type="button" className={theme.Button} onClick={() => setOpen(false)}>
                Block User
              </button>
            </div>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/**
 * The popup holds two visually separate surfaces rather than a single contained
 * box: the action list in `Drawer.Content`, and a detached destructive action
 * below it. Both still ride the same swipe and snap geometry.
 */
export const UncontainedContent: Story = {
  tags: ['highlight', 'base'],
  render: () => <UncontainedExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Open action sheet' }));

    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(body.getByRole('button', { name: 'Block User' })).toBeVisible();

    await userEvent.click(body.getByRole('button', { name: 'Block User' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Virtual-keyboard-aware drawer (docs "virtual-keyboard-aware" demo)   */
/* ------------------------------------------------------------------ */

const KEYBOARD_FIELDS = [
  ['Name', 'Ada Lovelace'],
  ['Phone', '+1 (555) 123-4567'],
  ['Street address', '12 Computing Way'],
  ['City', 'San Francisco'],
];

/**
 * `Drawer.VirtualKeyboardProvider` wraps the Portal so the popup resizes above
 * the on-screen keyboard instead of being covered by it. The effect is only
 * observable on a real touch device; this story documents the composition.
 */
export const VirtualKeyboardAware: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <Drawer.Root>
      <Drawer.Trigger className={theme.Button}>Open keyboard-aware drawer</Drawer.Trigger>
      <Drawer.VirtualKeyboardProvider>
        <Drawer.Portal>
          <Drawer.Backdrop className={theme.DrawerBackdrop} />
          <Drawer.Viewport className="DrawerKeyboardViewport">
            <Drawer.Popup className="DrawerSheetPopup">
              <div className={theme.DrawerGrabber} />
              <Drawer.Title className="DrawerSheetTitle">Delivery details</Drawer.Title>
              <Drawer.Content className="DrawerContent">
                <div className={theme.FormRoot}>
                  {KEYBOARD_FIELDS.map(([label, placeholder]) => (
                    <label className={theme.FieldRoot} key={label}>
                      <span className={theme.FieldLabel}>{label}</span>
                      <input className={theme.Input} placeholder={placeholder} type="text" />
                    </label>
                  ))}
                </div>
              </Drawer.Content>
              <div className="DrawerSheetActions">
                <Drawer.Close className={theme.Button}>Save</Drawer.Close>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    </Drawer.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Open keyboard-aware drawer' }));

    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(body.getByLabelText('Street address')).toBeVisible();

    await userEvent.click(body.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};
