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
  onDelete: () => void;
}

// Keep this duration in sync with the delete-countdown animation in ItemMenu.module.css.
const deleteDelayMs = 5000;
const deleteAnimationBufferMs = 100;

export function ItemMenu({
  isItemIgnored,
  isLastInCategory,
  showMoveDown = true,
  isButtonDisabled = false,
  onEdit,
  onMoveDown,
  onToggleIgnore,
  onDelete,
}: ItemMenuProps) {
  const [open, setOpen] = useState(false);
  const [deleteState, setDeleteState] = useState<"allow" | "countdown" | "ready">("allow");
  const containerRef = useRef<HTMLDivElement>(null);
  const deleteTimeoutRef = useRef<number | null>(null);

  function resetDeleteState() {
    setDeleteState("allow");
    if (deleteTimeoutRef.current !== null) {
      window.clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = null;
    }
  }

  function startDeleteCountdown() {
    if (deleteTimeoutRef.current !== null) {
      window.clearTimeout(deleteTimeoutRef.current);
    }
    setDeleteState("countdown");
    deleteTimeoutRef.current = window.setTimeout(
      () => setDeleteState("ready"),
      deleteDelayMs + deleteAnimationBufferMs,
    );
  }

  useEffect(() => {
    if (!open) {
      resetDeleteState();
      return;
    }

    return () => resetDeleteState();
  }, [open]);

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
          <button
            type="button"
            role="menuitem"
            aria-disabled={deleteState === "countdown"}
            className={`${styles.item} ${styles.deleteItem} ${deleteState === "countdown" ? styles.deleteArmed : ""} ${deleteState === "ready" ? styles.deleteReady : ""} ${deleteState === "countdown" ? styles.deleteLocked : ""}`.trim()}
            onClick={() => {
              if (deleteState === "allow") {
                startDeleteCountdown();
                return;
              }
              if (deleteState !== "ready") return;
              setOpen(false);
              resetDeleteState();
              onDelete();
            }}
            title="Delete this item"
          >
            {deleteState === "ready" ? "Delete" : "Allow delete"}
            <span
              className={styles.deleteCountdown}
              aria-hidden="true"
            >
              {deleteState === "ready" ? "Delete" : "Allow delete"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
