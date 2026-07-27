import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import theme from '@droppy/theme';
import '../menu.demo.css';
import { EllipsisIcon } from '../icons';

/**
 * Recreation of a data-table row-actions menu: kebab trigger per row,
 * `modal={false}` so the page never locks scroll (the wrapper's own stated
 * reason), `align="end"` positioning, and a destructive item. Recomposed from
 * oxidecomputer/console `DropdownMenu.tsx` (MPL-2.0, code-ok,
 * research/d-real-world-usage/menu/ranked.json #4).
 */

const fleetInstances = [
  { id: 'db-primary', dram: '16 GiB', status: 'running' },
  { id: 'db-replica', dram: '16 GiB', status: 'running' },
  { id: 'web-frontend', dram: '8 GiB', status: 'stopped' },
];

export function RowActionsExample() {
  const [lastAction, setLastAction] = React.useState('none');
  return (
    <div className="MenuDemoStack">
      <table className="MenuDemoTable">
        <thead>
          <tr>
            <th>Instance</th>
            <th>DRAM</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {fleetInstances.map((instance) => (
            <tr key={instance.id}>
              <td>{instance.id}</td>
              <td>{instance.dram}</td>
              <td>{instance.status}</td>
              <td>
                {/* modal={false}: row-action menus must not lock page scroll. */}
                <Menu.Root modal={false}>
                  <Menu.Trigger
                    className={theme.MenuTriggerIcon}
                    aria-label={`Row actions for ${instance.id}`}
                  >
                    <EllipsisIcon />
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner
                      className={theme.MenuPositioner}
                      side="bottom"
                      align="end"
                      sideOffset={4}
                    >
                      <Menu.Popup className={theme.MenuPopup}>
                        <Menu.Item
                          className={theme.MenuItem}
                          onClick={() => setLastAction(`Start ${instance.id}`)}
                        >
                          Start
                        </Menu.Item>
                        <Menu.Item
                          className={theme.MenuItem}
                          onClick={() => setLastAction(`Stop ${instance.id}`)}
                        >
                          Stop
                        </Menu.Item>
                        <Menu.Separator className={theme.MenuSeparator} />
                        <Menu.Item
                          className={`${theme.MenuItem} ${theme.MenuDangerItem}`}
                          onClick={() => setLastAction(`Delete ${instance.id}`)}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <output className="MenuDemoOutput">last action: {lastAction}</output>
    </div>
  );
}
