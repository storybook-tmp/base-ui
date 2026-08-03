import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Toast } from '@base-ui/react/toast';
import theme from '@droppy/theme';
import './toast.demo.css';

/**
 * Stories follow research/c-components/toast (Tier 1): the eight kept docs demos
 * plus one story per documented use case (stacking/expand, limit overflow, timers,
 * global manager, manager methods, priority announcements, keyboard flow,
 * lifecycle callbacks, type styling).
 *
 * Toast has no Trigger part and no `open` prop — state is an app-managed queue fed
 * imperatively through `Toast.useToastManager()` / `Toast.createToastManager()`.
 * Every story therefore wraps its content in the same `ToastDemoShell`:
 * `Toast.Provider` > `Toast.Portal` > `Toast.Viewport` > a user-owned render loop
 * over `useToastManager().toasts` (there is no automatic renderer).
 */
const meta = {
  title: 'Overlays/Toast',
  component: Toast.Root,
  subcomponents: {
    'Toast.Provider': Toast.Provider,
    'Toast.Viewport': Toast.Viewport,
    'Toast.Title': Toast.Title,
    'Toast.Description': Toast.Description,
    'Toast.Action': Toast.Action,
    'Toast.Close': Toast.Close,
  },
} satisfies Meta<typeof Toast.Root>;

export default meta;
// Toast.Root's required `toast` prop is only ever supplied internally by the
// Provider/useToastManager scaffold, never via story args — every story here is
// render-based, so the Story type is untyped on args.
type Story = StoryObj;

/* ------------------------------------------------------------------ */
/* Shared scaffold                                                     */
/* ------------------------------------------------------------------ */

interface ToastDemoShellProps extends Omit<Toast.Provider.Props, 'children'> {
  /** Page content rendered inside the provider (buttons that call `useToastManager()`). */
  children?: React.ReactNode;
  /** Renders one toast. Defaults to the docs hero renderer (Title + Description + Close). */
  renderToast?: (toast: Toast.Root.ToastObject) => React.ReactElement;
  viewportClassName?: string;
}

/**
 * The manager-pattern scaffold every toast composition needs: Provider owns the
 * store (timers, stack order, hover/focus state), Portal appends the viewport to
 * `document.body`, Viewport is the polite live region and F6 target, and the
 * mapped render loop over `useToastManager().toasts` is user-owned.
 */
function ToastDemoShell({
  children,
  renderToast = renderStackedToast,
  viewportClassName = theme.ToastViewport,
  ...providerProps
}: ToastDemoShellProps) {
  return (
    <Toast.Provider {...providerProps}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className={viewportClassName}>
          <ToastStack renderToast={renderToast} />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function ToastStack({
  renderToast,
}: {
  renderToast: (toast: Toast.Root.ToastObject) => React.ReactElement;
}) {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <React.Fragment key={toast.id}>{renderToast(toast)}</React.Fragment>
  ));
}

function StackedToastContent() {
  return (
    <Toast.Content className={theme.ToastContent}>
      <div className={theme.ToastText}>
        <Toast.Title className={theme.ToastTitle} />
        <Toast.Description className={theme.ToastDescription} />
      </div>
      <Toast.Close className={theme.ToastClose}>Dismiss</Toast.Close>
    </Toast.Content>
  );
}

function renderStackedToast(toast: Toast.Root.ToastObject) {
  return (
    <Toast.Root toast={toast} className={theme.ToastRoot}>
      <StackedToastContent />
    </Toast.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Kept docs demos + core behavior                                     */
/* ------------------------------------------------------------------ */

function HeroExample() {
  return (
    <ToastDemoShell>
      <CreateToastButton />
    </ToastDemoShell>
  );
}

function CreateToastButton() {
  const toastManager = Toast.useToastManager();
  const [count, setCount] = React.useState(0);

  function createToast() {
    setCount((prev) => prev + 1);
    toastManager.add({
      title: `Toast ${count + 1} created`,
      description: 'This is a toast notification.',
    });
  }

  return (
    <button type="button" className="Button" onClick={createToast}>
      Create toast
    </button>
  );
}

/** The docs hero demo: toasts are created imperatively — `useToastManager().add({ title, description })` — and render into a bottom-right stacked viewport. There is no Trigger part and no `open` prop. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => <HeroExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Create toast' }));
    // The viewport portals to document.body and is the polite live region.
    const viewport = body.getByRole('region', { name: 'Notifications' });
    const toast = await within(viewport).findByRole('dialog');
    await waitFor(() => expect(within(toast).getByText('Toast 1 created')).toBeVisible());
  },
};

function VaryingHeightsExample() {
  return (
    <ToastDemoShell>
      <VaryingHeightsButton />
    </ToastDemoShell>
  );
}

const VARYING_TEXTS = [
  'Short message.',
  'A bit longer message that spans two lines.',
  'This is a longer description that intentionally takes more vertical space to demonstrate stacking with varying heights.',
  'An even longer description that should span multiple lines so we can verify the clamped collapsed height and smooth expansion animation when hovering or focusing the viewport.',
];

function VaryingHeightsButton() {
  const toastManager = Toast.useToastManager();
  const [count, setCount] = React.useState(0);

  function createToast() {
    setCount((prev) => prev + 1);
    const description = VARYING_TEXTS[count % VARYING_TEXTS.length];
    toastManager.add({
      title: `Toast ${count + 1} created`,
      description,
    });
  }

  return (
    <button type="button" className="Button" onClick={createToast}>
      Create varying height toast
    </button>
  );
}

/** The docs `varying-heights` demo: `Toast.Content` measures each toast's natural height, collapsed toasts clamp to `--toast-frontmost-height`, and `[data-behind]` hides overflowing content until the stack expands ([#2742](https://github.com/mui/base-ui/pull/2742)). */
export const VaryingHeights: Story = {
  tags: ['highlight', 'base'],
  render: () => <VaryingHeightsExample />,
};

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */

function TopCenterExample() {
  return (
    <ToastDemoShell
      viewportClassName="TopViewport"
      renderToast={(toast) => (
        <Toast.Root toast={toast} swipeDirection="up" className="TopToast">
          <StackedToastContent />
        </Toast.Root>
      )}
    >
      <TopCenterButton />
    </ToastDemoShell>
  );
}

function TopCenterButton() {
  const toastManager = Toast.useToastManager();
  const [count, setCount] = React.useState(0);

  function createToast() {
    setCount((prev) => prev + 1);
    toastManager.add({
      title: `Toast ${count + 1} created`,
      description: 'This is a toast notification.',
    });
  }

  return (
    <button type="button" className="Button" onClick={createToast}>
      Create toast
    </button>
  );
}

/** The docs `position` demo: position is pure CSS on the viewport (top-center here), with the stack offsets and enter/exit transforms mirrored. Match `swipeDirection` to the placement — a top stack swipes `"up"`. */
export const CustomPosition: Story = {
  tags: ['highlight', 'base'],
  render: () => <TopCenterExample />,
};

function AnchoredExample() {
  return (
    <ToastDemoShell
      viewportClassName={theme.ToastAnchoredViewport}
      renderToast={renderAnchoredToast}
    >
      <CopyButton />
    </ToastDemoShell>
  );
}

function renderAnchoredToast(toast: Toast.Root.ToastObject) {
  return (
    <Toast.Positioner toast={toast} className={theme.ToastAnchoredPositioner}>
      <Toast.Root toast={toast} className={theme.ToastAnchoredRoot}>
        <Toast.Arrow className={theme.ToastArrow} />
        <Toast.Content>
          <Toast.Description className={theme.ToastAnchoredDescription} />
        </Toast.Content>
      </Toast.Root>
    </Toast.Positioner>
  );
}

function CopyButton() {
  const toastManager = Toast.useToastManager();
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  function handleCopy() {
    toastManager.add({
      description: 'Copied',
      timeout: 1500,
      positionerProps: {
        anchor: buttonRef.current,
        sideOffset: 10,
      },
    });
  }

  return (
    <button type="button" ref={buttonRef} className="Button" onClick={handleCopy}>
      Copy npm install command
    </button>
  );
}

/** Anchored toasts (docs `anchored` demo, simplified — the docs version adds a Tooltip): pass `positionerProps: { anchor }` in `add()` and wrap the Root in `Toast.Positioner` + `Toast.Arrow` ([#3096](https://github.com/mui/base-ui/pull/3096)). Preferred over a tooltip for "Copied"-style feedback because toasts are announced to screen readers. Keep anchored timeouts short, render them in a separate provider from stacked toasts, and note that swiping is disabled for anchored toasts. */
export const AnchoredToast: Story = {
  tags: ['api-ref', 'base'],
  render: () => <AnchoredExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: /Copy npm install/ }));
    const toastText = await body.findByText('Copied');
    await waitFor(() => expect(toastText).toBeVisible());
    // The positioner resolves a side against the anchor button.
    await expect(toastText.closest('[data-side]')).not.toBeNull();
    // Short-lived by design: it dismisses itself.
    await waitFor(() => expect(body.queryByText('Copied')).not.toBeInTheDocument(), {
      timeout: 4000,
    });
  },
};

/* ------------------------------------------------------------------ */
/* Manager API                                                         */

// A plain function — no hook, no component. Callable from API clients,
// websocket handlers, route loaders, or anywhere else outside React.

function DeduplicateExample() {
  return (
    <ToastDemoShell renderToast={(toast) => <PulseToastItem toast={toast} />}>
      <SaveDraftButton />
    </ToastDemoShell>
  );
}

function SaveDraftButton() {
  const toastManager = Toast.useToastManager();

  function saveDraft() {
    toastManager.add({
      id: 'save-status',
      title: 'Draft saved',
      description: 'Click again while it is visible to replay the pulse.',
    });
  }

  return (
    <button type="button" className="Button" onClick={saveDraft}>
      Save draft
    </button>
  );
}

function PulseToastItem({ toast }: { toast: Toast.Root.ToastObject }) {
  let pulseClassName: string | null = null;

  // New toasts start with `updateKey: 0`, so the first add skips the replay pulse.
  if (toast.updateKey) {
    pulseClassName = toast.updateKey % 2 === 0 ? 'PulseEven' : 'PulseOdd';
  }

  const className = [theme.ToastRoot, pulseClassName].filter(Boolean).join(' ');

  return (
    <Toast.Root toast={toast} className={className}>
      <StackedToastContent />
    </Toast.Root>
  );
}

/** The docs `deduplicate` demo: `add({ id })` with an existing id upserts instead of stacking a duplicate, refreshes the timer, and increments `toast.updateKey` — alternate two animation classes on its parity to replay a pulse ([#4440](https://github.com/mui/base-ui/pull/4440)). */
export const DeduplicateToast: Story = {
  tags: ['highlight', 'base'],
  render: () => <DeduplicateExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const save = canvas.getByRole('button', { name: 'Save draft' });
    await userEvent.click(save);
    await userEvent.click(save);

    // Upsert: two adds with the same id yield exactly one toast.
    await waitFor(() => expect(body.getAllByRole('dialog')).toHaveLength(1));
    const root = body.getByRole('dialog');
    await waitFor(() => expect(within(root).getByText('Draft saved')).toBeVisible());
    // One update happened, so the odd pulse class is applied.
    await expect(root.className).toMatch(/Pulse/);
  },
};

function CustomDataExample() {
  return (
    <ToastDemoShell renderToast={renderCustomDataToast}>
      <CustomDataButton />
    </ToastDemoShell>
  );
}

interface CustomToastData {
  userId: string;
}

function isCustomToast(
  toast: Toast.Root.ToastObject,
): toast is Toast.Root.ToastObject<CustomToastData> {
  return toast.data?.userId !== undefined;
}

function renderCustomDataToast(toast: Toast.Root.ToastObject) {
  return (
    <Toast.Root toast={toast} className={theme.ToastRoot}>
      <Toast.Content className={theme.ToastContent}>
        <div className={theme.ToastText}>
          <Toast.Title className={theme.ToastTitle}>{toast.title}</Toast.Title>
          {isCustomToast(toast) && toast.data ? (
            <Toast.Description className={theme.ToastDescription}>
              data.userId is {toast.data.userId}
            </Toast.Description>
          ) : (
            <Toast.Description className={theme.ToastDescription} />
          )}
        </div>
        <Toast.Close className={theme.ToastClose}>Dismiss</Toast.Close>
      </Toast.Content>
    </Toast.Root>
  );
}

function CustomDataButton() {
  const toastManager = Toast.useToastManager();

  function createToast() {
    const data: CustomToastData = {
      userId: '123',
    };

    toastManager.add({
      title: 'Toast with custom data',
      data,
    });
  }

  return (
    <button type="button" className="Button" onClick={createToast}>
      Create custom toast
    </button>
  );
}

/** The docs `custom` demo: `add({ data })` carries an arbitrary typed payload to your renderer; narrow per-toast with a type guard, or type the whole manager with `useToastManager<Data>()` ([#3882](https://github.com/mui/base-ui/pull/3882)). */
export const CustomDataToast: Story = {
  tags: ['highlight', 'base'],
  render: () => <CustomDataExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Create custom toast' }));
    const description = await body.findByText('data.userId is 123');
    await waitFor(() => expect(description).toBeVisible());
  },
};

/* ------------------------------------------------------------------ */
/* Async flows and actions                                             */
/* ------------------------------------------------------------------ */

function PromiseExample() {
  return (
    <ToastDemoShell>
      <RunPromiseButton />
    </ToastDemoShell>
  );
}

function RunPromiseButton() {
  const toastManager = Toast.useToastManager();

  function runPromise() {
    toastManager.promise(
      // Deterministic stand-in for an API request (the docs demo rolls dice).
      new Promise<string>((resolve) => {
        setTimeout(() => resolve('120 records imported'), 1200);
      }),
      {
        loading: 'Importing records…',
        success: (data: string) => `Import finished: ${data}`,
        error: (error: Error) => `Import failed: ${error.message}`,
      },
    );
  }

  return (
    <button type="button" className="Button" onClick={runPromise}>
      Import data
    </button>
  );
}

/** `promise()` models loading → success/error as one updating toast: `type: 'loading'` never auto-dismisses, then the settled type takes normal timers. It returns the chained promise, not an id — pass your own `id` if you need to address the toast later ([#2833](https://github.com/mui/base-ui/issues/2833)). Style states via `[data-type]`. */
export const PromiseToast: Story = {
  tags: ['highlight', 'base'],
  render: () => <PromiseExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Import data' }));

    await waitFor(() => expect(body.getByText('Importing records…')).toBeVisible());
    const root = body.getByRole('dialog');
    await expect(root).toHaveAttribute('data-type', 'loading');

    // The same toast updates in place when the promise resolves.
    await waitFor(
      () => expect(body.getByText('Import finished: 120 records imported')).toBeVisible(),
      { timeout: 4000 },
    );
    await expect(root).toHaveAttribute('data-type', 'success');
  },
};

function UndoExample() {
  return (
    <ToastDemoShell renderToast={renderActionToast}>
      <PerformActionButton />
    </ToastDemoShell>
  );
}

function renderActionToast(toast: Toast.Root.ToastObject) {
  return (
    <Toast.Root toast={toast} className={theme.ToastRoot}>
      <Toast.Content className={theme.ToastContent}>
        <div className={theme.ToastActionText}>
          <div className={theme.ToastMessage}>
            <Toast.Title className={theme.ToastTitle} />
            <Toast.Description className={theme.ToastDescription} />
          </div>
          <Toast.Action className={theme.ToastActionButton} />
        </div>
      </Toast.Content>
    </Toast.Root>
  );
}

function PerformActionButton() {
  const toastManager = Toast.useToastManager();

  function performAction() {
    const id = toastManager.add({
      title: 'Message archived',
      description: 'You can undo this action.',
      type: 'success',
      // Long timeout so keyboard and screen-reader users can reach the action (#4975).
      timeout: 10000,
      actionProps: {
        children: 'Undo',
        onClick() {
          toastManager.close(id);
          toastManager.add({
            title: 'Action undone',
          });
        },
      },
    });
  }

  return (
    <button type="button" className="Button" onClick={performAction}>
      Archive message
    </button>
  );
}

/** The docs `undo` demo: `actionProps` (full button props incl. `children`) renders through `Toast.Action`; the handler closes this toast and confirms with another. Pair actions with long timeouts — the docs raised this demo to 10s after a11y review ([#4975](https://github.com/mui/base-ui/pull/4975); [#4253](https://github.com/mui/base-ui/issues/4253) tracks the reachability gap). */
export const UndoAction: Story = {
  tags: ['highlight', 'base'],
  render: () => <UndoExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Archive message' }));
    const undo = await body.findByRole('button', { name: 'Undo' });
    await userEvent.click(undo);

    await waitFor(() => expect(body.getByText('Action undone')).toBeVisible());
    await waitFor(() => expect(body.queryByText('Message archived')).not.toBeInTheDocument(), {
      timeout: 3000,
    });
  },
};

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/toast)          */
/* ------------------------------------------------------------------ */

function renderAnchoredActionToast(toast: Toast.Root.ToastObject) {
  return (
    <Toast.Positioner toast={toast} className={theme.ToastAnchoredPositioner}>
      <Toast.Root toast={toast} className={theme.ToastAnchoredRoot}>
        <Toast.Arrow className={theme.ToastArrow} />
        <Toast.Content>
          <div className={theme.ToastActionText}>
            {/* Visually hidden: the visible text lives in Description alone, but the
                dialog role still needs an accessible name (aria-dialog-name). */}
            <Toast.Title className={theme.ToastSrOnly} />
            <Toast.Description className={theme.ToastAnchoredDescription} />
            <Toast.Action className={theme.ToastActionButton} />
          </div>
        </Toast.Content>
      </Toast.Root>
    </Toast.Positioner>
  );
}

function ArchiveFileRow() {
  const toastManager = Toast.useToastManager();
  const [archived, setArchived] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  function handleArchive() {
    setArchived(true);
    toastManager.add({
      title: 'File archived',
      description: 'roadmap.pdf archived',
      timeout: 6000,
      positionerProps: { anchor: buttonRef.current, sideOffset: 8 },
      actionProps: {
        children: 'Undo',
        onClick() {
          setArchived(false);
        },
      },
    });
  }

  return (
    <div className="Row">
      <span className="ArchivedLabel" data-archived={archived || undefined}>
        roadmap.pdf
      </span>
      <button
        type="button"
        ref={buttonRef}
        className="Button"
        onClick={handleArchive}
        disabled={archived}
      >
        Archive
      </button>
    </div>
  );
}

function AnchoredActionExample() {
  return (
    <ToastDemoShell
      viewportClassName={theme.ToastAnchoredViewport}
      renderToast={renderAnchoredActionToast}
    >
      <ArchiveFileRow />
    </ToastDemoShell>
  );
}

/**
 * Recreation of the Arrow+Action anchored, actionable toast pattern from
 * patrick-xin/lumi-ui `toast.tsx` (MIT, code-ok,
 * research/d-real-world-usage/toast/ranked.json #6) — the fullest Toast anatomy
 * found in any registry, combining `Toast.Arrow` (pointed, anchored) with
 * `Toast.Action` (an actionable button) instead of the common corner-stack toast.
 * Recomposed here as an "Archive, with Undo" row action.
 */
export const RealWorldAnchoredActionableToast: Story = {
  tags: ['recreation', 'examples'],
  render: () => <AnchoredActionExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const archiveButton = canvas.getByRole('button', { name: 'Archive' });

    await userEvent.click(archiveButton);
    await waitFor(() => expect(archiveButton).toBeDisabled());

    const toastText = await body.findByText('roadmap.pdf archived');
    await waitFor(() => expect(toastText).toBeVisible());
    // Arrow-anchored: the positioner resolves a side against the anchor button.
    await expect(toastText.closest('[data-side]')).not.toBeNull();

    const undo = await body.findByRole('button', { name: 'Undo' });
    await userEvent.click(undo);
    await waitFor(() => expect(archiveButton).not.toBeDisabled());
  },
};

interface AlertToastData {
  severity: 'info' | 'warning' | 'error';
  message: string;
}

function isAlertToast(
  toast: Toast.Root.ToastObject,
): toast is Toast.Root.ToastObject<AlertToastData> {
  return toast.data?.severity !== undefined;
}

/**
 * "Toast as a bare positioning shell": Toast.Root wraps a fully custom `Alert`
 * component instead of Toast.Title/Description/Action/Close. The Alert owns its
 * own dismiss button, which calls the manager's `close(id)` directly rather than
 * rendering `Toast.Close`.
 */
function Alert({
  severity,
  message,
  toastId,
}: {
  severity: AlertToastData['severity'];
  message: string;
  toastId: string;
}) {
  const toastManager = Toast.useToastManager();
  const [copied, setCopied] = React.useState(false);

  return (
    <div className={`${theme.ToastContent} Alert`} data-severity={severity}>
      <div className={theme.ToastText}>
        <p className={theme.ToastDescription}>{message}</p>
      </div>
      <button type="button" className={theme.ToastActionButton} onClick={() => setCopied(true)}>
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button
        type="button"
        className={`${theme.ToastClose} AlertDismiss`}
        aria-label="Dismiss"
        onClick={() => toastManager.close(toastId)}
      >
        ×
      </button>
    </div>
  );
}

function renderAlertToast(toast: Toast.Root.ToastObject) {
  if (!isAlertToast(toast) || !toast.data) {
    return <Toast.Root toast={toast} className={theme.ToastRoot} />;
  }
  return (
    <Toast.Root toast={toast} className={theme.ToastRoot}>
      <Alert severity={toast.data.severity} message={toast.data.message} toastId={toast.id} />
    </Toast.Root>
  );
}

function AlertToastButtons() {
  const toastManager = Toast.useToastManager();
  return (
    <div className="Row">
      <button
        type="button"
        className="Button"
        onClick={() =>
          toastManager.add({
            timeout: 0,
            data: {
              severity: 'error',
              message: 'Bridge transaction failed to confirm.',
            } satisfies AlertToastData,
          })
        }
      >
        Simulate bridge error
      </button>
    </div>
  );
}

function AlertToastExample() {
  return (
    <ToastDemoShell renderToast={renderAlertToast}>
      <AlertToastButtons />
    </ToastDemoShell>
  );
}

/**
 * Recreation of the "Alert inside Toast.Content" idiom from rosen-bridge/ui
 * `ToastProvider.tsx` (MIT, code-ok, research/d-real-world-usage/toast/ranked.json #8)
 * — a full pre-existing `Alert` design (severity, dismiss, a copy action button)
 * renders inside `Toast.Content` in place of Title/Description/Action, and the
 * Alert's own dismiss button calls `close(id)` directly.
 */
export const RealWorldAlertInsideContent: Story = {
  tags: ['recreation', 'examples'],
  render: () => <AlertToastExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Simulate bridge error' }));

    const message = await body.findByText('Bridge transaction failed to confirm.');
    await waitFor(() => expect(message).toBeVisible());
    await expect(message.closest('[data-severity]')).toHaveAttribute('data-severity', 'error');

    await userEvent.click(body.getByRole('button', { name: 'Copy' }));
    await expect(body.getByRole('button', { name: 'Copied' })).toBeVisible();

    await userEvent.click(body.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() =>
      expect(body.queryByText('Bridge transaction failed to confirm.')).not.toBeInTheDocument(),
    );
  },
};
