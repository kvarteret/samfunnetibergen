/**
 * Shared look for floating menus (nav dropdowns, selects, comboboxes) and the
 * quiet panels that sit beside them: a rounded card with a soft shadow, rows
 * that tint on hover, and a short open/close fade.
 */

/** The floating panel of a dropdown, select or combobox. */
export const menuPopupClassName =
  "rounded-xl border border-border bg-card text-foreground shadow-[0_16px_36px_-14px_rgb(0_0_0/0.28)] outline-none transition-[opacity,translate] duration-100 ease-out data-ending-style:-translate-y-1 data-ending-style:opacity-0 data-starting-style:-translate-y-1 data-starting-style:opacity-0"

/** One row in a menu or option list. */
export const menuItemClassName =
  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 outline-none transition-colors duration-100 hover:bg-muted data-highlighted:bg-muted data-disabled:cursor-not-allowed data-disabled:opacity-50"

/** The closed control that opens a select or combobox. */
export const menuTriggerClassName =
  "rounded-lg border border-border bg-card transition-colors duration-100 hover:border-foreground/30 data-popup-open:border-foreground/30"

/** A static panel in the same style, e.g. a price summary. */
export const menuPanelClassName = "rounded-xl border border-border bg-card"
