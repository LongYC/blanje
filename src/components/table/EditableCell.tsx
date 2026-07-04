import { useState, type ReactNode } from "react";
import styles from "./EditableCell.module.css";

interface EditableCellProps {
  /** Raw value bound to the input while editing. */
  value: string;
  /** What to render in read mode (may differ from `value`, e.g. formatted). */
  display: ReactNode;
  ariaLabel: string;
  inputMode?: "text" | "decimal";
  isAmount?: boolean;
  onChange: (value: string) => void;
}

/**
 * Shows `display` as plain text by default and swaps to an input on
 * click/tap, reverting on blur. Read mode lets long values wrap so the
 * full text is visible, which a single-line input can't do in a narrow cell.
 */
export function EditableCell({
  value,
  display,
  ariaLabel,
  inputMode = "text",
  isAmount = false,
  onChange,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        className={styles.display}
        aria-label={`Edit ${ariaLabel}`}
        onClick={() => setEditing(true)}
      >
        {display}
      </button>
    );
  }

  return (
    <input
      type="text"
      inputMode={inputMode}
      className={`${styles.input} ${isAmount ? styles.amount : ""}`}
      aria-label={ariaLabel}
      value={value}
      autoFocus
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => {
        // Both keys leave edit mode; edits are already live via onChange.
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          setEditing(false);
        }
      }}
    />
  );
}
