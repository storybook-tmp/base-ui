'use client';
import * as React from 'react';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { MeterRootContext } from './MeterRootContext';
import { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { formatNumber } from '../../utils/formatNumber';
import { valueToPercent } from '../../utils/valueToPercent';
import { clamp } from '../../internals/clamp';
import { useRenderElement } from '../../internals/useRenderElement';

/**
 * Groups all parts of the meter and provides the value for screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export const MeterRoot = React.forwardRef(function MeterRoot(
  componentProps: MeterRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    format,
    getAriaValueText,
    locale,
    max = 100,
    min = 0,
    value: valueProp,
    render,
    className,
    children,
    style,
    ...elementProps
  } = componentProps;

  const [labelId, setLabelId] = React.useState<string | undefined>();

  // `clamp` handles infinity, but NaN needs an explicit fallback before normalizing range outputs.
  const rawPercentage = valueToPercent(valueProp, min, max);
  const percentageValue = clamp(Number.isNaN(rawPercentage) ? 0 : rawPercentage, 0, 100);
  const clampedValue = clamp(Number.isNaN(valueProp) ? min : valueProp, min, max);

  // Without an explicit `format`, the value is displayed as its position within the range so the
  // text stays in sync with the indicator fill for any `min`/`max` (not just the default 0–100).
  const formattedValue = format
    ? formatNumber(valueProp, locale, format)
    : formatNumber(percentageValue / 100, locale, { style: 'percent' });

  let ariaValuetext = formattedValue;
  if (getAriaValueText) {
    ariaValuetext = getAriaValueText(formattedValue, valueProp);
  }

  const defaultProps: HTMLProps = {
    'aria-labelledby': labelId,
    'aria-valuemax': max,
    'aria-valuemin': min,
    'aria-valuenow': clampedValue,
    'aria-valuetext': ariaValuetext,
    role: 'meter',
    children: (
      <React.Fragment>
        {children}
        <span role="presentation" style={visuallyHidden}>
          {/* force NVDA to read the label https://github.com/mui/base-ui/issues/4184 */}x
        </span>
      </React.Fragment>
    ),
  };

  const contextValue: MeterRootContext = React.useMemo(
    () => ({
      formattedValue,
      max,
      min,
      percentageValue,
      setLabelId,
      value: valueProp,
    }),
    [formattedValue, max, min, percentageValue, setLabelId, valueProp],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [defaultProps, elementProps],
  });

  return <MeterRootContext.Provider value={contextValue}>{element}</MeterRootContext.Provider>;
});

export interface MeterRootState {}

export interface MeterRootProps extends BaseUIComponentProps<'div', MeterRootState> {
  'aria-valuetext'?: React.AriaAttributes['aria-valuetext'] | undefined;
  format?: Intl.NumberFormatOptions | undefined;
  getAriaValueText?: ((formattedValue: string, value: number) => string) | undefined;
  locale?: Intl.LocalesArgument | undefined;
  max?: number | undefined;
  min?: number | undefined;
  value: number;
}

export namespace MeterRoot {
  export type State = MeterRootState;
  export type Props = MeterRootProps;
}
