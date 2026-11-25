import { useEffect, useRef } from "react";
/** Presentation-only keyboard lifecycle. Never reads or writes repositories. */
export function useDialogFocus(
  active: boolean,
  selector: string,
  onClose: () => void,
) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!active) return;
    const dialog = document.querySelector<HTMLElement>(selector);
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      [
        ...dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
        ),
      ].filter((el) => el.offsetParent !== null);
    const first = focusable()[0];
    if (first) first.focus();
    else {
      dialog.tabIndex = -1;
      dialog.focus();
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      }
      if (e.key === "Tab") {
        const items = focusable(),
          a = items[0],
          b = items[items.length - 1];
        if (!items.length) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          b.focus();
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    dialog.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      dialog.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [active, selector]);
}
