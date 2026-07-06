import styles from "./MonthlyHeader.module.css";

interface MonthlyHeaderProps {
  label: string;
  monthlyTotal: string;
  isPrevHidden: boolean;
  isNextHidden: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthlyHeader({
  label,
  monthlyTotal,
  isPrevHidden,
  isNextHidden,
  onPrev,
  onNext
}: MonthlyHeaderProps) {
  return <div className={styles.nav}>
    {
      <button
        type="button"
        className={styles.prev}
        onClick={() => onPrev()}
        disabled={isPrevHidden}
        aria-label="Previous month"
      >
        ‹
      </button>
    }
    <h2>{label}</h2>
    {
      <button
        type="button"
        className={styles.next}
        onClick={() => onNext()}
        disabled={isNextHidden}
        aria-label="Next month"
      >
        ›
      </button>
    }
    <p title="Grand total for this month">{monthlyTotal}</p>
  </div>;
}
