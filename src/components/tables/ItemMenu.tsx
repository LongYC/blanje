import { useEffect, useRef, useState } from "react";
import styles from "./ItemMenu.module.css";

interface ItemMenuProps {
  isItemIgnored: boolean;
  isLastInCategory: boolean;
  showMoveDown?: boolean;
  isButtonDisabled?: boolean;
  onEdit: () => void;
  onMoveDown: () => void;
  onToggleIgnore: () => void;
}

export function ItemMenu({
  isItemIgnored,
  isLastInCategory,
  showMoveDown = true,
  isButtonDisabled = false,
  onEdit,
  onMoveDown,
  onToggleIgnore
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
        disabled={isButtonDisabled}
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
          <button
            type="button"
            role="menuitem"
            className={styles.item}
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            title="Edit this item"
          >
            Edit
          </button>
          {showMoveDown && !isLastInCategory && <button
            type="button"
            role="menuitem"
            className={styles.item}
            disabled={isLastInCategory}
            onClick={() => {
              onMoveDown();
              setOpen(false);
            }}
            title="Move this item to one row below"
          >
            Move down
          </button>}
          <button
            type="button"
            role="menuitem"
            className={styles.item}
            onClick={() => {
              onToggleIgnore();
              setOpen(false);
            }}
            title="Exclude the amount of this item from totals"
          >
            {isItemIgnored ? "Unignore" : "Ignore"}
          </button>
        </div>
      )}
    </div>
  );
}
