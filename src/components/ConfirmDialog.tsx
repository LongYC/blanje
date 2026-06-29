import { useEffect, useId, useRef } from "react";
import styles from "./ConfirmDialog.module.css";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel: string;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  // Mirror the `open` prop onto the native dialog so it brings its own focus
  // trap, backdrop, Esc handling, and focus restoration to the trigger.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Land focus on the safe choice rather than the destructive one.
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={descId}
      // Esc fires the native `cancel` event; route it back to React state.
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <p id={descId} className={styles.description}>
        {description}
      </p>
      <div className={styles.actions}>
        <Button ref={cancelRef} label={cancelLabel} onClick={onCancel} />
        <Button label={confirmLabel} onClick={onConfirm} variant="danger" />
      </div>
    </dialog>
  );
}
