import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import theme from '@droppy/theme';
import './checkbox-group.demo.css';

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

function HorizontalRuleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        stroke="currentColor"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const fruits = ['fuji-apple', 'gala-apple', 'granny-smith-apple'];

/**
 * Stories follow research/c-components/checkbox-group (Tier 2): the docs hero (a set of
 * checkboxes sharing one array-valued group), the parent "select all" tri-state cycle — the
 * least obvious behavior in the brief: clicking a parent checkbox in a genuinely mixed state
 * follows `mixed → on → off → mixed` (restoring the exact prior subset), not a plain toggle —
 * and native submission of the group's value as one array-valued field (#1948), which
 * requires wrapping in `Field.Root` since `CheckboxGroup` has no `name` prop of its own.
 */
const meta = {
  title: 'Form inputs/Checkbox Group',
  component: CheckboxGroup,
  subcomponents: { 'Checkbox.Root': Checkbox.Root, 'Checkbox.Indicator': Checkbox.Indicator },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: three checkboxes coordinating one array-valued group. */
export const Basic: Story = {
  tags: ['highlight', 'base'],
  render: () => (
    <CheckboxGroup
      aria-label="Apples"
      defaultValue={['fuji-apple']}
      className={theme.CheckboxGroupRoot}
    >
      <label className={theme.CheckboxGroupItem}>
        <Checkbox.Root value="fuji-apple" className={theme.CheckboxRoot}>
          <Checkbox.Indicator className={theme.CheckboxIndicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Fuji
      </label>
      <label className={theme.CheckboxGroupItem}>
        <Checkbox.Root value="gala-apple" className={theme.CheckboxRoot}>
          <Checkbox.Indicator className={theme.CheckboxIndicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Gala
      </label>
      <label className={theme.CheckboxGroupItem}>
        <Checkbox.Root value="granny-smith-apple" className={theme.CheckboxRoot}>
          <Checkbox.Indicator className={theme.CheckboxIndicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Granny Smith
      </label>
    </CheckboxGroup>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox', { name: 'Fuji' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  },
};

function ParentTriStateExample() {
  const [value, setValue] = React.useState<string[]>(['fuji-apple']);
  return (
    <CheckboxGroup
      aria-label="Apples"
      value={value}
      onValueChange={setValue}
      allValues={fruits}
      className={theme.CheckboxGroupRoot}
    >
      <label className={theme.CheckboxGroupItem}>
        <Checkbox.Root className={theme.CheckboxRoot} parent>
          <Checkbox.Indicator
            className={theme.CheckboxIndicator}
            render={(props, state) => (
              <span {...props}>{state.indeterminate ? <HorizontalRuleIcon /> : <CheckIcon />}</span>
            )}
          />
        </Checkbox.Root>
        All apples
      </label>
      <label className={theme.CheckboxGroupItem}>
        <Checkbox.Root value="fuji-apple" className={theme.CheckboxRoot}>
          <Checkbox.Indicator className={theme.CheckboxIndicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Fuji
      </label>
      <label className={theme.CheckboxGroupItem}>
        <Checkbox.Root value="gala-apple" className={theme.CheckboxRoot}>
          <Checkbox.Indicator className={theme.CheckboxIndicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Gala
      </label>
      <label className={theme.CheckboxGroupItem}>
        <Checkbox.Root value="granny-smith-apple" className={theme.CheckboxRoot}>
          <Checkbox.Indicator className={theme.CheckboxIndicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Granny Smith
      </label>
    </CheckboxGroup>
  );
}

/**
 * Starting from a genuinely mixed selection (Fuji only), clicking the parent follows the
 * tested `mixed → on → off → mixed` cycle — the third click restores exactly the original
 * one-item subset rather than resetting to empty (`useCheckboxGroupParent.ts`, test
 * "preserves initial state if mixed when parent is clicked").
 */
export const ParentCheckboxTriState: Story = {
  tags: ['highlight', 'base'],
  render: () => <ParentTriStateExample />,
  play: async ({ canvas, userEvent }) => {
    const parent = canvas.getByRole('checkbox', { name: 'All apples' });
    const fuji = canvas.getByRole('checkbox', { name: 'Fuji' });
    const gala = canvas.getByRole('checkbox', { name: 'Gala' });

    // Starting state: one of three checked → parent is mixed.
    await waitFor(() => expect(parent).toHaveAttribute('aria-checked', 'mixed'));

    // mixed -> on: every child becomes checked.
    await userEvent.click(parent);
    await waitFor(() => expect(parent).toHaveAttribute('aria-checked', 'true'));
    await waitFor(() => expect(gala).toHaveAttribute('aria-checked', 'true'));

    // on -> off: every child becomes unchecked.
    await userEvent.click(parent);
    await waitFor(() => expect(parent).toHaveAttribute('aria-checked', 'false'));
    await waitFor(() => expect(fuji).toHaveAttribute('aria-checked', 'false'));

    // off -> mixed: restores the exact original subset (Fuji only), not empty.
    await userEvent.click(parent);
    await waitFor(() => expect(fuji).toHaveAttribute('aria-checked', 'true'));
    await waitFor(() => expect(gala).toHaveAttribute('aria-checked', 'false'));
    await waitFor(() => expect(parent).toHaveAttribute('aria-checked', 'mixed'));
  },
};

const userManagementPermissions = ['create-user', 'edit-user'];

function NestedParentExample() {
  const [mainValue, setMainValue] = React.useState<string[]>([]);
  const [managementValue, setManagementValue] = React.useState<string[]>([]);
  const mainPermissions = ['view-dashboard', 'manage-users'];

  return (
    <div className={theme.CheckboxGroupRoot}>
      <CheckboxGroup
        aria-label="Main permissions"
        value={mainValue}
        onValueChange={(value) => {
          if (value.includes('manage-users')) {
            setManagementValue(userManagementPermissions);
          } else if (managementValue.length === userManagementPermissions.length) {
            setManagementValue([]);
          }
          setMainValue(value);
        }}
        allValues={mainPermissions}
        className={theme.CheckboxGroupRoot}
      >
        <label className={theme.CheckboxGroupItem}>
          <Checkbox.Root value="view-dashboard" className={theme.CheckboxRoot}>
            <Checkbox.Indicator className={theme.CheckboxIndicator}>
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          View dashboard
        </label>

        <CheckboxGroup
          aria-label="User management permissions"
          value={managementValue}
          onValueChange={(value) => {
            if (value.length === userManagementPermissions.length) {
              setMainValue((prev) => Array.from(new Set([...prev, 'manage-users'])));
            } else {
              setMainValue((prev) => prev.filter((v) => v !== 'manage-users'));
            }
            setManagementValue(value);
          }}
          allValues={userManagementPermissions}
          className={theme.CheckboxGroupRoot}
        >
          <label className={theme.CheckboxGroupItem}>
            <Checkbox.Root className={theme.CheckboxRoot} parent>
              <Checkbox.Indicator
                className={theme.CheckboxIndicator}
                render={(props, state) => (
                  <span {...props}>
                    {state.indeterminate ? <HorizontalRuleIcon /> : <CheckIcon />}
                  </span>
                )}
              />
            </Checkbox.Root>
            Manage users
          </label>
          <label className={theme.CheckboxGroupItem}>
            <Checkbox.Root value="create-user" className={theme.CheckboxRoot}>
              <Checkbox.Indicator className={theme.CheckboxIndicator}>
                <CheckIcon />
              </Checkbox.Indicator>
            </Checkbox.Root>
            Create user
          </label>
          <label className={theme.CheckboxGroupItem}>
            <Checkbox.Root value="edit-user" className={theme.CheckboxRoot}>
              <Checkbox.Indicator className={theme.CheckboxIndicator}>
                <CheckIcon />
              </Checkbox.Indicator>
            </Checkbox.Root>
            Edit user
          </label>
        </CheckboxGroup>
      </CheckboxGroup>
      <output className="CheckboxGroupDemoOutput">
        manage-users in main: {String(mainValue.includes('manage-users'))}
      </output>
    </div>
  );
}

/**
 * Recreates the docs "nested" demo: two independent `CheckboxGroup` instances wired together by
 * app-level `onValueChange` propagation (there is no native multi-level tree API) — checking
 * every child of the inner "user management" group both checks its own parent **and** adds
 * `"manage-users"` to the outer group's value automatically.
 */
export const NestedParentCheckbox: Story = {
  tags: ['highlight', 'base'],
  render: () => <NestedParentExample />,
  play: async ({ canvas, userEvent }) => {
    const manageUsersParent = canvas.getByRole('checkbox', { name: 'Manage users' });
    await expect(canvas.getByText('manage-users in main: false')).toBeVisible();

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Create user' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Edit user' }));

    await waitFor(() => expect(manageUsersParent).toHaveAttribute('aria-checked', 'true'));
    await waitFor(() => expect(canvas.getByText('manage-users in main: true')).toBeVisible());

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Edit user' }));
    await waitFor(() => expect(canvas.getByText('manage-users in main: false')).toBeVisible());
  },
};
