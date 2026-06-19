import { useState } from "react";

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
  // The depleting progress bar doubles as the timer: its animation runs for
  // `duration`, and dismissing happens when that animation ends. Pausing the
  // animation on hover/focus (so keyboard and assistive-tech users aren't
  // rushed) therefore also holds the toast open — visual and timer stay synced.
  const [paused, setPaused] = useState(false);

  return (
    <div
      className="toast"
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="toast-message">{message}</span>
      <button
        type="button"
        className="toast-action"
        aria-label={actionAriaLabel ?? actionLabel}
        onClick={onAction}
      >
        {actionLabel}
      </button>
      <div
        className="toast-progress"
        style={{
          animationDuration: `${duration}ms`,
          animationPlayState: paused ? "paused" : "running",
        }}
        onAnimationEnd={onDismiss}
      />
    </div>
  );
}
