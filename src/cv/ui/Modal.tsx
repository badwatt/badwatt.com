import { useRef, useEffect } from "react";
import { XIcon } from "@phosphor-icons/react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  closeLabel?: string;
}

export function lockBodyScroll() {
  const previousOverflow = String(document.body.style.overflow);
  const previousTouchAction = String(document.body.style.touchAction);
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
  return () => {
    document.body.style.overflow = previousOverflow;
    document.body.style.touchAction = previousTouchAction;
  };
}

export function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  ariaLabel,
  closeLabel,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unlock = lockBodyScroll();

    const focusTimer = setTimeout(() => {
      panelRef.current?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      unlock();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return createPortal(
    <div
      data-testid="modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-badwatt-base/80 backdrop-blur-md transition-opacity duration-300"
    >
      <div
        ref={panelRef}
        data-testid="modal-panel"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={stopPropagation}
        className={[
          "relative z-[71] overflow-y-auto overscroll-contain bg-badwatt-surface outline-none",
          "h-full max-h-[100dvh] w-full rounded-none",
          "md:h-[85vh] md:w-[90vw] md:rounded-3xl md:border md:border-badwatt-border md:shadow-2xl md:shadow-badwatt-primary/10",
          className,
        ].join(" ")}
      >
        {closeLabel && (
          <div className="pointer-events-none sticky top-0 z-[72] flex h-0 justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="pointer-events-auto m-3 cursor-pointer rounded-full border border-badwatt-border bg-badwatt-surface p-2 text-badwatt-muted transition-all duration-300 hover:border-badwatt-primary/40 hover:text-badwatt-primary"
            >
              <XIcon size={20} weight="bold" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
