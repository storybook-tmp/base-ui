import * as React from 'react';
import { Select } from '@base-ui/react/select';
import theme from '@droppy/theme';
import './select.demo.css';

/**
 * Shared anatomy + icon helpers used across the behavior stories and the real-world
 * recreations in this directory (extracted so recreations/*.tsx can import them without
 * duplicating or creating a circular import with select.stories.tsx).
 */
export interface DemoOption {
  value: string | null;
  label: string;
  disabled?: boolean;
}

/**
 * Standard hero-styled anatomy shared by the behavior stories. Anatomy-focused
 * stories (Basic, GroupedItems, ObjectValues…) spell out the full part tree inline.
 */
export function DemoSelect({
  label,
  placeholder,
  options,
  itemClassName = theme.SelectItem,
  popupClassName = theme.SelectPopup,
  root,
  positioner,
}: {
  label?: string;
  placeholder?: string;
  options: readonly DemoOption[];
  itemClassName?: string;
  popupClassName?: string;
  root?: Partial<Select.Root.Props<string | null, false>>;
  positioner?: Partial<React.ComponentProps<typeof Select.Positioner>>;
}) {
  return (
    <div className={theme.FieldRoot}>
      <Select.Root items={options as Array<{ value: string | null; label: string }>} {...root}>
        {label ? <Select.Label className={theme.FieldLabel}>{label}</Select.Label> : null}
        <Select.Trigger className={theme.SelectTrigger}>
          <Select.Value className={theme.SelectValue} placeholder={placeholder} />
          <Select.Icon className={theme.SelectIcon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={theme.SelectPositioner} sideOffset={4} {...positioner}>
            <Select.Popup className={popupClassName}>
              <Select.ScrollUpArrow className={theme.SelectScrollArrow}>
                <CaretUpIcon />
              </Select.ScrollUpArrow>
              <Select.List className={theme.SelectList}>
                {options.map((option) => (
                  <Select.Item
                    key={String(option.value)}
                    value={option.value}
                    disabled={option.disabled}
                    className={itemClassName}
                  >
                    <Select.ItemIndicator className={theme.SelectItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={theme.SelectItemText}>
                      {option.label}
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className={theme.SelectScrollArrow}>
                <CaretDownIcon />
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Icons (inlined — stories must not import docs assets)               */
/* ------------------------------------------------------------------ */

export function CaretUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
    </svg>
  );
}

export function CheckIcon(props: React.ComponentProps<'svg'>) {
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

export function CaretUpIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 10H4l4-4.5z" />
    </svg>
  );
}

export function CaretDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 6H4l4 4.5z" />
    </svg>
  );
}

export function SunIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" />
    </svg>
  );
}

export function MoonIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M13.5 9.5A6 6 0 1 1 6.5 2.5a5 5 0 0 0 7 7z" />
    </svg>
  );
}

export function MonitorIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <rect x="1.5" y="2.5" width="13" height="9" />
      <path d="M5.5 14h5M8 11.5V14" />
    </svg>
  );
}
