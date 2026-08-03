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
