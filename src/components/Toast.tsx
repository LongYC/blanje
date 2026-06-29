import { useState } from "react";
import styles from "./Toast.module.css";

interface ToastProps {
  message: string;
  actionLabel: string;
  actionAriaLabel?: string;
  onAction: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({
  message,
  actionLabel,
  actionAriaLabel,
  onAction,
  onDismiss,
  duration = 6000,
}: ToastProps) {
  // The depleting progress bar doubles as the timer: its animation runs for `duration`,
  // and dismissing happens when that animation ends.
  // Pausing the animation on hover/focus for keyboard and assistive-tech users
  // therefore also holds the toast open — visual and timer stay synced.
  const [paused, setPaused] = useState(false);

  return (
    <div
      className={styles.toast}
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className={styles.message}>{message}</span>
      <button
        type="button"
        className={styles.action}
        aria-label={actionAriaLabel ?? actionLabel}
        onClick={onAction}
      >
        {actionLabel}
      </button>
      <div
        className={styles.progress}
        style={{
          animationDuration: `${duration}ms`,
          animationPlayState: paused ? "paused" : "running",
        }}
        onAnimationEnd={onDismiss}
      />
    </div>
  );
}
