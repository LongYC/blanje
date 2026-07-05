import { useEffect, useRef, useState } from "react";
import styles from "./ItemMenu.module.css";

interface ItemMenuProps {
  ignored: boolean;
  isFirstInCategory: boolean;
  onToggleIgnore: () => void;
  onMoveUp: () => void;
}

export function ItemMenu({
  ignored,
  isFirstInCategory,
  onToggleIgnore,
  onMoveUp,
}: ItemMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Item actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          {!isFirstInCategory && (
            <button
              type="button"
              role="menuitem"
              className={styles.item}
              disabled={isFirstInCategory}
              onClick={() => {
                onMoveUp();
                setOpen(false);
              }}
            >
              Move up
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className={styles.item}
            onClick={() => {
              onToggleIgnore();
              setOpen(false);
            }}
          >
            {ignored ? "Unignore" : "Ignore"}
          </button>
        </div>
      )}
    </div>
  );
}
