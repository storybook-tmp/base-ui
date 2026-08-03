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
