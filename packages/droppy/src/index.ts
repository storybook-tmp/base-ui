/**
 * @droppy/theme — theme-only package.
 *
 * This package ships a single stylesheet (`@droppy/theme/styles.css`) with
 * the Droppy design tokens and plain PascalCase component classes (one per
 * Base UI part, named `{Component}{Part}`), plus this lookup object mapping
 * Base UI part names to those class names. There are no component wrappers:
 * import `@base-ui/react` parts directly and bind the class at each call
 * site —
 *
 *   import { Button } from '@base-ui/react/button';
 *   import theme from '@droppy/theme';
 *
 *   <Button className={theme.Button}>Order now</Button>
 *
 * A richer "Droppy" component layer that removes the per-call-site tax is a
 * later phase; see the README.
 */

const theme = {
  Button: 'Button',

  FieldRoot: 'FieldRoot',
  FieldLabel: 'FieldLabel',
  FieldDescription: 'FieldDescription',
  FieldError: 'FieldError',

  Input: 'Input',

  DialogBackdrop: 'DialogBackdrop',
  DialogPopup: 'DialogPopup',
  DialogTitle: 'DialogTitle',
  DialogDescription: 'DialogDescription',

  DrawerBackdrop: 'DrawerBackdrop',
  DrawerPopup: 'DrawerPopup',
  DrawerTitle: 'DrawerTitle',

  TooltipPopup: 'TooltipPopup',

  AccordionRoot: 'AccordionRoot',
  AccordionItem: 'AccordionItem',
  AccordionHeader: 'AccordionHeader',
  AccordionTrigger: 'AccordionTrigger',
  AccordionIcon: 'AccordionIcon',
  AccordionPanel: 'AccordionPanel',
  AccordionContent: 'AccordionContent',

  AvatarRoot: 'AvatarRoot',
  AvatarImage: 'AvatarImage',
  AvatarFallback: 'AvatarFallback',

  CheckboxLabel: 'CheckboxLabel',
  CheckboxRoot: 'CheckboxRoot',
  CheckboxIndicator: 'CheckboxIndicator',

  CheckboxGroupRoot: 'CheckboxGroupRoot',
  CheckboxGroupItem: 'CheckboxGroupItem',

  FieldsetRoot: 'FieldsetRoot',
  FieldsetLegend: 'FieldsetLegend',

  RadioGroupRoot: 'RadioGroupRoot',
  RadioGroupItem: 'RadioGroupItem',
  RadioRoot: 'RadioRoot',
  RadioIndicator: 'RadioIndicator',

  SwitchLabel: 'SwitchLabel',
  SwitchRoot: 'SwitchRoot',
  SwitchThumb: 'SwitchThumb',

  ToggleRoot: 'ToggleRoot',

  ToggleGroupRoot: 'ToggleGroupRoot',
  ToggleGroupItem: 'ToggleGroupItem',

  MeterRoot: 'MeterRoot',
  MeterLabel: 'MeterLabel',
  MeterValue: 'MeterValue',
  MeterTrack: 'MeterTrack',
  MeterIndicator: 'MeterIndicator',
  MeterIndicatorLow: 'MeterIndicatorLow',
  MeterIndicatorHigh: 'MeterIndicatorHigh',

  ProgressRoot: 'ProgressRoot',
  ProgressLabel: 'ProgressLabel',
  ProgressValue: 'ProgressValue',
  ProgressTrack: 'ProgressTrack',
  ProgressIndicator: 'ProgressIndicator',

  CollapsibleRoot: 'CollapsibleRoot',
  CollapsibleIcon: 'CollapsibleIcon',
  CollapsibleTrigger: 'CollapsibleTrigger',
  CollapsiblePanel: 'CollapsiblePanel',
  CollapsibleContent: 'CollapsibleContent',

  SeparatorRoot: 'SeparatorRoot',

  TabsRoot: 'TabsRoot',
  TabsList: 'TabsList',
  TabsTab: 'TabsTab',
  TabsIndicator: 'TabsIndicator',
  TabsPanelViewport: 'TabsPanelViewport',
  TabsPanel: 'TabsPanel',

  ToolbarRoot: 'ToolbarRoot',
  ToolbarGroup: 'ToolbarGroup',
  ToolbarButton: 'ToolbarButton',
  ToolbarSeparator: 'ToolbarSeparator',

  SliderRoot: 'SliderRoot',
  SliderLabel: 'SliderLabel',
  SliderValue: 'SliderValue',
  SliderControl: 'SliderControl',
  SliderTrack: 'SliderTrack',
  SliderIndicator: 'SliderIndicator',
  SliderThumb: 'SliderThumb',
  SliderMarksTrack: 'SliderMarksTrack',
  SliderMark: 'SliderMark',

  OtpFieldRoot: 'OtpFieldRoot',
  OtpFieldInput: 'OtpFieldInput',
  OtpFieldSeparator: 'OtpFieldSeparator',

  NumberFieldRoot: 'NumberFieldRoot',
  NumberFieldScrubArea: 'NumberFieldScrubArea',
  NumberFieldScrubAreaCursor: 'NumberFieldScrubAreaCursor',
  NumberFieldGroup: 'NumberFieldGroup',
  NumberFieldInput: 'NumberFieldInput',
  NumberFieldDecrement: 'NumberFieldDecrement',
  NumberFieldIncrement: 'NumberFieldIncrement',

  FormRoot: 'FormRoot',

  // Field.Item: a Radio/Checkbox paired with its own label, for grouped
  // controls inside a Fieldset.
  FieldItem: 'FieldItem',
  FieldItemLabel: 'FieldItemLabel',
  FieldItemDescription: 'FieldItemDescription',
  FieldTextarea: 'FieldTextarea',
  FieldErrorAnimated: 'FieldErrorAnimated',

  PreviewCardTrigger: 'PreviewCardTrigger',
  PreviewCardPositioner: 'PreviewCardPositioner',
  PreviewCardPopup: 'PreviewCardPopup',
  PreviewCardArrow: 'PreviewCardArrow',
  PreviewCardPopupContent: 'PreviewCardPopupContent',
  PreviewCardImage: 'PreviewCardImage',
  PreviewCardSummary: 'PreviewCardSummary',

  ScrollAreaRoot: 'ScrollAreaRoot',
  ScrollAreaViewport: 'ScrollAreaViewport',
  ScrollAreaContent: 'ScrollAreaContent',
  ScrollAreaViewportFade: 'ScrollAreaViewportFade',
  ScrollAreaScrollbar: 'ScrollAreaScrollbar',
  ScrollAreaThumb: 'ScrollAreaThumb',
  ScrollAreaCorner: 'ScrollAreaCorner',

  MenuTrigger: 'MenuTrigger',
  MenuTriggerIcon: 'MenuTriggerIcon',
  MenuPositioner: 'MenuPositioner',
  MenuPopup: 'MenuPopup',
  MenuItem: 'MenuItem',
  MenuLinkItem: 'MenuLinkItem',
  MenuSubmenuTrigger: 'MenuSubmenuTrigger',
  MenuDangerItem: 'MenuDangerItem',
  MenuCheckboxItem: 'MenuCheckboxItem',
  MenuRadioItem: 'MenuRadioItem',
  MenuCheckboxItemIndicator: 'MenuCheckboxItemIndicator',
  MenuRadioItemIndicator: 'MenuRadioItemIndicator',
  MenuCheckboxItemText: 'MenuCheckboxItemText',
  MenuRadioItemText: 'MenuRadioItemText',
  MenuGroupLabel: 'MenuGroupLabel',
  MenuPlainGroupLabel: 'MenuPlainGroupLabel',
  MenuSeparator: 'MenuSeparator',
  MenuArrow: 'MenuArrow',
  MenuTransitionPositioner: 'MenuTransitionPositioner',
  MenuTransitionPopup: 'MenuTransitionPopup',
  MenuViewport: 'MenuViewport',

  PopoverPositioner: 'PopoverPositioner',
  PopoverPopup: 'PopoverPopup',
  PopoverArrow: 'PopoverArrow',
  PopoverTitle: 'PopoverTitle',
  PopoverDescription: 'PopoverDescription',
  PopoverTrigger: 'PopoverTrigger',
  PopoverIconTrigger: 'PopoverIconTrigger',
  PopoverClose: 'PopoverClose',
  PopoverBackdrop: 'PopoverBackdrop',
  PopoverTransitionPositioner: 'PopoverTransitionPositioner',
  PopoverTransitionPopup: 'PopoverTransitionPopup',
  PopoverViewport: 'PopoverViewport',

  SelectTrigger: 'SelectTrigger',
  SelectValue: 'SelectValue',
  SelectIcon: 'SelectIcon',
  SelectPositioner: 'SelectPositioner',
  SelectPopup: 'SelectPopup',
  SelectList: 'SelectList',
  SelectItem: 'SelectItem',
  SelectItemIndicator: 'SelectItemIndicator',
  SelectItemText: 'SelectItemText',
  SelectItemLabel: 'SelectItemLabel',
  SelectItemDescription: 'SelectItemDescription',
  SelectValueText: 'SelectValueText',
  SelectValuePrimary: 'SelectValuePrimary',
  SelectValueSecondary: 'SelectValueSecondary',
  SelectGroup: 'SelectGroup',
  SelectGroupLabel: 'SelectGroupLabel',
  SelectSeparator: 'SelectSeparator',
  SelectScrollArrow: 'SelectScrollArrow',

  // Dialog additions — also used verbatim by AlertDialog and the
  // "open a dialog from a menu" recipe (no AlertDialog-specific keys).
  DialogActions: 'DialogActions',

  // Drawer additions.
  DrawerDescription: 'DrawerDescription',
  DrawerActions: 'DrawerActions',
  DrawerGrabber: 'DrawerGrabber',

  // Tooltip additions.
  TooltipArrow: 'TooltipArrow',

  // ContextMenu: every popup part mirrors Menu's values under its own
  // collision-safe name (source: "a direct Menu re-export").
  ContextMenuTrigger: 'ContextMenuTrigger',
  ContextMenuPositioner: 'ContextMenuPositioner',
  ContextMenuPopup: 'ContextMenuPopup',
  ContextMenuItem: 'ContextMenuItem',
  ContextMenuLinkItem: 'ContextMenuLinkItem',
  ContextMenuSubmenuTrigger: 'ContextMenuSubmenuTrigger',
  ContextMenuCheckboxItem: 'ContextMenuCheckboxItem',
  ContextMenuRadioItem: 'ContextMenuRadioItem',
  ContextMenuCheckboxItemIndicator: 'ContextMenuCheckboxItemIndicator',
  ContextMenuRadioItemIndicator: 'ContextMenuRadioItemIndicator',
  ContextMenuCheckboxItemText: 'ContextMenuCheckboxItemText',
  ContextMenuRadioItemText: 'ContextMenuRadioItemText',
  ContextMenuGroupLabel: 'ContextMenuGroupLabel',
  ContextMenuSeparator: 'ContextMenuSeparator',

  // Menubar: hosts ordinary Menu.Root instances — MenuPositioner/
  // MenuSeparator/MenuCheckboxItem/MenuRadioItem above are reused as-is.
  MenubarRoot: 'MenubarRoot',
  MenubarMenuTrigger: 'MenubarMenuTrigger',
  MenubarMenuPopup: 'MenubarMenuPopup',
  MenubarMenuItem: 'MenubarMenuItem',
  MenubarSubmenuTrigger: 'MenubarSubmenuTrigger',

  AutocompleteInput: 'AutocompleteInput',
  AutocompleteInputGroup: 'AutocompleteInputGroup',
  AutocompleteGroupedInput: 'AutocompleteGroupedInput',
  AutocompleteActionButtons: 'AutocompleteActionButtons',
  AutocompleteActionButton: 'AutocompleteActionButton',
  AutocompletePositioner: 'AutocompletePositioner',
  AutocompletePopup: 'AutocompletePopup',
  AutocompleteList: 'AutocompleteList',
  AutocompleteItem: 'AutocompleteItem',
  AutocompleteEmpty: 'AutocompleteEmpty',
  AutocompleteStatus: 'AutocompleteStatus',
  AutocompleteGroup: 'AutocompleteGroup',
  AutocompleteGroupLabel: 'AutocompleteGroupLabel',
  AutocompleteItemContent: 'AutocompleteItemContent',
  AutocompleteItemTitle: 'AutocompleteItemTitle',
  AutocompleteItemDescription: 'AutocompleteItemDescription',
  AutocompleteItemRow: 'AutocompleteItemRow',
  AutocompleteItemMeta: 'AutocompleteItemMeta',

  NavigationMenuRoot: 'NavigationMenuRoot',
  NavigationMenuList: 'NavigationMenuList',
  NavigationMenuTrigger: 'NavigationMenuTrigger',
  NavigationMenuChevronTrigger: 'NavigationMenuChevronTrigger',
  NavigationMenuIcon: 'NavigationMenuIcon',
  NavigationMenuPositioner: 'NavigationMenuPositioner',
  NavigationMenuPopup: 'NavigationMenuPopup',
  NavigationMenuContent: 'NavigationMenuContent',
  NavigationMenuViewport: 'NavigationMenuViewport',
  NavigationMenuGridLinkList: 'NavigationMenuGridLinkList',
  NavigationMenuFlexLinkList: 'NavigationMenuFlexLinkList',
  NavigationMenuLinkCard: 'NavigationMenuLinkCard',
  NavigationMenuLinkTitle: 'NavigationMenuLinkTitle',
  NavigationMenuLinkDescription: 'NavigationMenuLinkDescription',
  NavigationMenuBackdrop: 'NavigationMenuBackdrop',
  NavigationMenuArrow: 'NavigationMenuArrow',

  // Combobox's select-like trigger reuses SelectTrigger/SelectIcon above
  // (same "select-like trigger for input-inside-popup pattern" in both
  // source modules) — no separate ComboboxSelectTrigger key.
  ComboboxInputGroup: 'ComboboxInputGroup',
  ComboboxInput: 'ComboboxInput',
  ComboboxActionButtons: 'ComboboxActionButtons',
  ComboboxTrigger: 'ComboboxTrigger',
  ComboboxClear: 'ComboboxClear',
  ComboboxTriggerIcon: 'ComboboxTriggerIcon',
  ComboboxPositioner: 'ComboboxPositioner',
  ComboboxPopup: 'ComboboxPopup',
  ComboboxPopupInput: 'ComboboxPopupInput',
  ComboboxList: 'ComboboxList',
  ComboboxItem: 'ComboboxItem',
  ComboboxItemText: 'ComboboxItemText',
  ComboboxItemIndicator: 'ComboboxItemIndicator',
  ComboboxItemLabel: 'ComboboxItemLabel',
  ComboboxItemDescription: 'ComboboxItemDescription',
  ComboboxEmpty: 'ComboboxEmpty',
  ComboboxStatus: 'ComboboxStatus',
  ComboboxSpinner: 'ComboboxSpinner',
  ComboboxGroup: 'ComboboxGroup',
  ComboboxGroupLabel: 'ComboboxGroupLabel',
  ComboboxSeparator: 'ComboboxSeparator',
  ComboboxChipsInputGroup: 'ComboboxChipsInputGroup',
  ComboboxChips: 'ComboboxChips',
  ComboboxChip: 'ComboboxChip',
  ComboboxChipRemove: 'ComboboxChipRemove',
  ComboboxChipsInput: 'ComboboxChipsInput',
  ComboboxInlineListBox: 'ComboboxInlineListBox',
  ComboboxInlineList: 'ComboboxInlineList',

  ToastViewport: 'ToastViewport',
  ToastRoot: 'ToastRoot',
  ToastContent: 'ToastContent',
  ToastText: 'ToastText',
  ToastActionText: 'ToastActionText',
  ToastMessage: 'ToastMessage',
  ToastTitle: 'ToastTitle',
  ToastDescription: 'ToastDescription',
  ToastClose: 'ToastClose',
  ToastActionButton: 'ToastActionButton',
  ToastAnchoredViewport: 'ToastAnchoredViewport',
  ToastAnchoredPositioner: 'ToastAnchoredPositioner',
  ToastAnchoredRoot: 'ToastAnchoredRoot',
  ToastAnchoredDescription: 'ToastAnchoredDescription',
  ToastSrOnly: 'ToastSrOnly',
  ToastArrow: 'ToastArrow',
} as const;

export default theme;
