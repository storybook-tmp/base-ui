import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Tabs } from '@base-ui/react/tabs';
import theme from '@droppy/theme';
import './tabs.demo.css';

/**
 * Stories follow research/c-components/tabs (Tier 2): the hero Overview/
 * Projects/Account demo with the animated Indicator, the click-vs-focus
 * activation-timing policy (mui/base-ui#3176), and vertical orientation.
 *
 * Tabs activates on CLICK by default — focus alone (arrow-keying through the
 * tablist, or a programmatic `.focus()`) never changes which panel is
 * visible unless `activateOnFocus` is explicitly set on `Tabs.List`. This is
 * the deliberate outcome of #3176 ("Change `activateOnFocus` to false"),
 * argued on WCAG 2.5.2 pointer-cancellation grounds. These stories assert
 * that split explicitly rather than assuming "focus follows selection."
 */
const meta = {
  title: 'Navigation/Tabs',
  component: Tabs.Root,
  subcomponents: {
    'Tabs.List': Tabs.List,
    'Tabs.Tab': Tabs.Tab,
    'Tabs.Indicator': Tabs.Indicator,
    'Tabs.Panel': Tabs.Panel,
  },
} satisfies Meta<typeof Tabs.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

const panelCopy = {
  overview: 'Workspace stats and activity.',
  projects: 'Milestones and deadlines.',
  account: 'Profile and preferences.',
};

function TabsDemo({
  activateOnFocus,
  orientation,
}: {
  activateOnFocus?: boolean;
  orientation?: 'horizontal' | 'vertical';
}) {
  return (
    <Tabs.Root className={theme.TabsRoot} defaultValue="overview" orientation={orientation}>
      <Tabs.List className={theme.TabsList} activateOnFocus={activateOnFocus}>
        <Tabs.Tab className={theme.TabsTab} value="overview">
          Overview
        </Tabs.Tab>
        <Tabs.Tab className={theme.TabsTab} value="projects">
          Projects
        </Tabs.Tab>
        <Tabs.Tab className={theme.TabsTab} value="account">
          Account
        </Tabs.Tab>
        <Tabs.Indicator className={theme.TabsIndicator} data-testid="indicator" />
      </Tabs.List>
      <div className={theme.TabsPanelViewport}>
        <Tabs.Panel className={theme.TabsPanel} value="overview">
          <p className="TabsDemoParagraph">{panelCopy.overview}</p>
        </Tabs.Panel>
        <Tabs.Panel className={theme.TabsPanel} value="projects">
          <p className="TabsDemoParagraph">{panelCopy.projects}</p>
        </Tabs.Panel>
        <Tabs.Panel className={theme.TabsPanel} value="account">
          <p className="TabsDemoParagraph">{panelCopy.account}</p>
        </Tabs.Panel>
      </div>
    </Tabs.Root>
  );
}

/** The docs hero demo: 3 tabs with an animated Indicator tracking the active tab. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => <TabsDemo />,
  play: async ({ canvas, userEvent }) => {
    const tab1 = canvas.getByRole('tab', { name: 'Overview' });
    const tab2 = canvas.getByRole('tab', { name: 'Projects' });
    await expect(tab1).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByText(panelCopy.overview)).toBeVisible();

    await userEvent.click(tab2);

    await waitFor(() => expect(tab2).toHaveAttribute('aria-selected', 'true'));
    await waitFor(() => expect(tab1).toHaveAttribute('aria-selected', 'false'));
    await waitFor(() => expect(canvas.getByText(panelCopy.projects)).toBeVisible());
  },
};

/**
 * Contrast story: `activateOnFocus` opts into "focus follows selection" —
 * arrow-keying to a tab immediately activates its panel, restoring the
 * behavior #3176 turned off by default.
 */
export const ActivateOnFocus: Story = {
  tags: ['api-ref'],
  render: () => <TabsDemo activateOnFocus />,
  play: async ({ canvas, userEvent }) => {
    const tab1 = canvas.getByRole('tab', { name: 'Overview' });
    const tab2 = canvas.getByRole('tab', { name: 'Projects' });

    tab1.focus();
    await expect(tab1).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');

    await waitFor(() => expect(tab2).toHaveFocus());
    // With activateOnFocus, moving focus also activates the tab.
    await waitFor(() => expect(tab2).toHaveAttribute('aria-selected', 'true'));
    await waitFor(() => expect(canvas.getByText(panelCopy.projects)).toBeVisible());
  },
};

/**
 * `orientation="vertical"` flips the arrow-key axis to ArrowUp/ArrowDown and
 * emits `aria-orientation="vertical"` on the tablist.
 */
export const VerticalOrientation: Story = {
  tags: ['api-ref'],
  render: () => <TabsDemo orientation="vertical" />,
  play: async ({ canvas, userEvent }) => {
    const tablist = canvas.getByRole('tablist');
    await expect(tablist).toHaveAttribute('aria-orientation', 'vertical');
    await expect(tablist).toHaveAttribute('data-orientation', 'vertical');

    const tab1 = canvas.getByRole('tab', { name: 'Overview' });
    const tab2 = canvas.getByRole('tab', { name: 'Projects' });

    tab1.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(tab2).toHaveFocus());
    // Default activateOnFocus=false still applies regardless of orientation.
    await expect(tab2).toHaveAttribute('aria-selected', 'false');
  },
};

/**
 * A disabled tab is skipped by the automatic-fallback logic: with no
 * `defaultValue` pointing at a specific (enabled) tab, the initially selected
 * tab falls back to the first *enabled* one (`onValueChange` reason
 * `'disabled'`/`'missing'`, see `TabsRoot`'s `firstEnabledTabValue` fallback).
 * A disabled tab stays focusable (`focusableWhenDisabled`) so arrow-key
 * navigation can still land on it, but neither click nor keyboard ever
 * activates it.
 */
export const DisabledTabs: Story = {
  tags: ['api-ref'],
  render: () => (
    <Tabs.Root className={theme.TabsRoot}>
      <Tabs.List className={theme.TabsList}>
        <Tabs.Tab className={theme.TabsTab} value="overview" disabled>
          Overview
        </Tabs.Tab>
        <Tabs.Tab className={theme.TabsTab} value="projects">
          Projects
        </Tabs.Tab>
        <Tabs.Tab className={theme.TabsTab} value="account">
          Account
        </Tabs.Tab>
        <Tabs.Indicator className={theme.TabsIndicator} />
      </Tabs.List>
      <div className={theme.TabsPanelViewport}>
        <Tabs.Panel className={theme.TabsPanel} value="overview">
          <p className="TabsDemoParagraph">{panelCopy.overview}</p>
        </Tabs.Panel>
        <Tabs.Panel className={theme.TabsPanel} value="projects">
          <p className="TabsDemoParagraph">{panelCopy.projects}</p>
        </Tabs.Panel>
        <Tabs.Panel className={theme.TabsPanel} value="account">
          <p className="TabsDemoParagraph">{panelCopy.account}</p>
        </Tabs.Panel>
      </div>
    </Tabs.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const disabledTab = canvas.getByRole('tab', { name: 'Overview' });
    const projectsTab = canvas.getByRole('tab', { name: 'Projects' });

    // No `defaultValue` was given, so the implicit initial selection is
    // "missing" and the root automatically falls back to the first enabled
    // tab, skipping the disabled first tab entirely.
    await waitFor(() => expect(projectsTab).toHaveAttribute('aria-selected', 'true'));
    await expect(disabledTab).toHaveAttribute('aria-selected', 'false');
    await expect(disabledTab).toHaveAttribute('data-disabled');

    // Disabled but discoverable: focusable via the composite, never activates.
    disabledTab.focus();
    await expect(disabledTab).toHaveFocus();
    await userEvent.click(disabledTab);
    await expect(disabledTab).toHaveAttribute('aria-selected', 'false');
    await expect(projectsTab).toHaveAttribute('aria-selected', 'true');
  },
};

function ControlledTabsDemo() {
  const [value, setValue] = React.useState<string>('overview');

  return (
    <div>
      <div className="TabsDemoExternalControls">
        <button
          type="button"
          className="TabsDemoExternalButton"
          onClick={() => setValue('overview')}
        >
          Show overview
        </button>
        <button
          type="button"
          className="TabsDemoExternalButton"
          onClick={() => setValue('projects')}
        >
          Show projects
        </button>
        <button
          type="button"
          className="TabsDemoExternalButton"
          onClick={() => setValue('account')}
        >
          Show account
        </button>
      </div>
      <Tabs.Root
        className={theme.TabsRoot}
        value={value}
        onValueChange={(next) => setValue(next as string)}
      >
        <Tabs.List className={theme.TabsList}>
          <Tabs.Tab className={theme.TabsTab} value="overview">
            Overview
          </Tabs.Tab>
          <Tabs.Tab className={theme.TabsTab} value="projects">
            Projects
          </Tabs.Tab>
          <Tabs.Tab className={theme.TabsTab} value="account">
            Account
          </Tabs.Tab>
          <Tabs.Indicator className={theme.TabsIndicator} />
        </Tabs.List>
        <div className={theme.TabsPanelViewport}>
          <Tabs.Panel className={theme.TabsPanel} value="overview">
            <p className="TabsDemoParagraph">{panelCopy.overview}</p>
          </Tabs.Panel>
          <Tabs.Panel className={theme.TabsPanel} value="projects">
            <p className="TabsDemoParagraph">{panelCopy.projects}</p>
          </Tabs.Panel>
          <Tabs.Panel className={theme.TabsPanel} value="account">
            <p className="TabsDemoParagraph">{panelCopy.account}</p>
          </Tabs.Panel>
        </div>
      </Tabs.Root>
    </div>
  );
}

/**
 * External `value`/`onValueChange` state, driven by buttons that live outside
 * the tablist entirely. Programmatically setting `value` moves the active
 * tab (and the roving-tabindex highlight) exactly as a click would, even
 * though focus never enters the tablist.
 */
export const ControlledValue: Story = {
  tags: ['highlight'],
  render: () => <ControlledTabsDemo />,
  play: async ({ canvas, userEvent }) => {
    const projectsButton = canvas.getByRole('button', { name: 'Show projects' });
    const projectsTab = canvas.getByRole('tab', { name: 'Projects' });

    await expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await userEvent.click(projectsButton);

    await waitFor(() => expect(projectsTab).toHaveAttribute('aria-selected', 'true'));
    await waitFor(() => expect(canvas.getByText(panelCopy.projects)).toBeVisible());
  },
};

/**
 * A tablist with more tabs than fit in a fixed-width container: `Tabs.List`
 * scrolls horizontally (`overflow-x: auto`) rather than wrapping — there is
 * no built-in "scroll buttons" affordance, this is a plain CSS technique.
 */
export const ManyTabsOverflow: Story = {
  tags: ['highlight'],
  render: () => (
    <Tabs.Root className={`${theme.TabsRoot} TabsDemoOverflowRoot`} defaultValue="tab-1">
      <Tabs.List className={`${theme.TabsList} TabsDemoOverflowList`}>
        {Array.from({ length: 8 }, (_, index) => (
          <Tabs.Tab className={theme.TabsTab} value={`tab-${index + 1}`} key={index}>
            Tab {index + 1}
          </Tabs.Tab>
        ))}
        <Tabs.Indicator className={theme.TabsIndicator} />
      </Tabs.List>
      <div className={theme.TabsPanelViewport}>
        {Array.from({ length: 8 }, (_, index) => (
          <Tabs.Panel className={theme.TabsPanel} value={`tab-${index + 1}`} key={index}>
            <p className="TabsDemoParagraph">Panel {index + 1} content.</p>
          </Tabs.Panel>
        ))}
      </div>
    </Tabs.Root>
  ),
  play: async ({ canvasElement, canvas, userEvent }) => {
    const list = canvasElement.querySelector('[role="tablist"]') as HTMLElement;
    // The tablist is narrower than its 8 tabs' combined width, so it overflows.
    await waitFor(() => expect(list.scrollWidth).toBeGreaterThan(list.clientWidth));

    const lastTab = canvas.getByRole('tab', { name: 'Tab 8' });
    await userEvent.click(lastTab);
    await waitFor(() => expect(lastTab).toHaveAttribute('aria-selected', 'true'));
  },
};

function BellIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 6a4 4 0 1 1 8 0c0 3 1 4 1 4H3s1-1 1-4Z" />
      <path d="M6.5 13a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

function GearIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="8" cy="8" r="2.25" />
      <path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.5 3.5l-1.4 1.4M4.9 11.1l-1.4 1.4M12.5 12.5l-1.4-1.4M4.9 4.9 3.5 3.5" />
    </svg>
  );
}

/**
 * Icon + label composition inside `Tabs.Tab` — a common visual pattern the
 * component makes no special accommodation for (or needs any): icons are just
 * ordinary children alongside the label text.
 */
export const TabsWithIcons: Story = {
  tags: ['highlight'],
  render: () => (
    <Tabs.Root className={theme.TabsRoot} defaultValue="alerts">
      <Tabs.List className={theme.TabsList}>
        <Tabs.Tab className={theme.TabsTab} value="alerts">
          <BellIcon className="TabsDemoTabIcon" />
          Alerts
        </Tabs.Tab>
        <Tabs.Tab className={theme.TabsTab} value="settings">
          <GearIcon className="TabsDemoTabIcon" />
          Settings
        </Tabs.Tab>
        <Tabs.Indicator className={theme.TabsIndicator} />
      </Tabs.List>
      <div className={theme.TabsPanelViewport}>
        <Tabs.Panel className={theme.TabsPanel} value="alerts">
          <p className="TabsDemoParagraph">No new alerts.</p>
        </Tabs.Panel>
        <Tabs.Panel className={theme.TabsPanel} value="settings">
          <p className="TabsDemoParagraph">Notification preferences.</p>
        </Tabs.Panel>
      </div>
    </Tabs.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const settingsTab = canvas.getByRole('tab', { name: 'Settings' });
    await userEvent.click(settingsTab);
    await waitFor(() => expect(settingsTab).toHaveAttribute('aria-selected', 'true'));
    await waitFor(() => expect(canvas.getByText('Notification preferences.')).toBeVisible());
  },
};

/**
 * A panel's content can contain an entirely independent, nested `Tabs.Root`.
 * Each `Tabs.Root` owns its own context (value/activation-direction/roving
 * focus), so the inner tabs' selection has no effect on the outer one, and
 * vice versa.
 */
export const NestedContent: Story = {
  tags: ['highlight'],
  render: () => (
    <Tabs.Root className={theme.TabsRoot} defaultValue="overview">
      <Tabs.List className={theme.TabsList}>
        <Tabs.Tab className={theme.TabsTab} value="overview">
          Overview
        </Tabs.Tab>
        <Tabs.Tab className={theme.TabsTab} value="settings">
          Settings
        </Tabs.Tab>
        <Tabs.Indicator className={theme.TabsIndicator} />
      </Tabs.List>
      <div className={theme.TabsPanelViewport}>
        <Tabs.Panel className={theme.TabsPanel} value="overview">
          <p className="TabsDemoParagraph">{panelCopy.overview}</p>
        </Tabs.Panel>
        <Tabs.Panel className={theme.TabsPanel} value="settings">
          <div>
            <p className="TabsDemoParagraph">Notification settings, by channel:</p>
            <Tabs.Root className={`${theme.TabsRoot} TabsDemoNestedRoot`} defaultValue="email">
              <Tabs.List className={theme.TabsList}>
                <Tabs.Tab className={theme.TabsTab} value="email">
                  Email
                </Tabs.Tab>
                <Tabs.Tab className={theme.TabsTab} value="sms">
                  SMS
                </Tabs.Tab>
                <Tabs.Indicator className={theme.TabsIndicator} />
              </Tabs.List>
              <div className={theme.TabsPanelViewport}>
                <Tabs.Panel className={theme.TabsPanel} value="email">
                  <p className="TabsDemoParagraph">Email notification settings.</p>
                </Tabs.Panel>
                <Tabs.Panel className={theme.TabsPanel} value="sms">
                  <p className="TabsDemoParagraph">SMS notification settings.</p>
                </Tabs.Panel>
              </div>
            </Tabs.Root>
          </div>
        </Tabs.Panel>
      </div>
    </Tabs.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const outerSettingsTab = canvas.getByRole('tab', { name: 'Settings' });
    await userEvent.click(outerSettingsTab);
    await waitFor(() => expect(outerSettingsTab).toHaveAttribute('aria-selected', 'true'));

    const innerSmsTab = canvas.getByRole('tab', { name: 'SMS' });
    await userEvent.click(innerSmsTab);
    await waitFor(() => expect(innerSmsTab).toHaveAttribute('aria-selected', 'true'));
    await waitFor(() => expect(canvas.getByText('SMS notification settings.')).toBeVisible());

    // The outer selection is unaffected by the inner tabs' own state.
    await expect(outerSettingsTab).toHaveAttribute('aria-selected', 'true');
  },
};
