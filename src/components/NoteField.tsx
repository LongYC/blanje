import { useState } from "react";
import styles from "./NoteField.module.css";

interface NoteFieldProps {
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}

export function NoteField({ value, editable, onChange }: NoteFieldProps) {
  const [editing, setEditing] = useState(false);

  if (!editable) {
    return value === "" ? null : <p className={styles.note}>{value}</p>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        className={styles.display}
        aria-label="Edit note"
        onClick={() => setEditing(true)}
      >
        {value === "" ? (
          <span className={styles.placeholder}>Add a note</span>
        ) : (
          value
        )}
      </button>
    );
  }

  return (
    <textarea
      id="month-note-input"
      className={styles.input}
      aria-label="Note"
      value={value}
      autoFocus
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => {
        // Escape leaves edit mode; Enter inserts a newline (multi-line note).
        if (e.key === "Escape") {
          e.preventDefault();
          setEditing(false);
        }
      }}
    />
  );
}
