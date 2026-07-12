import styles from "./MonthlyHeader.module.css";

interface MonthlyHeaderProps {
  month: number;
  year: number;
  monthlyTotal: string;
  isPrevHidden: boolean;
  isNextHidden: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const MONTH_LABELS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export function MonthlyHeader({
  year,
  month,
  monthlyTotal,
  isPrevHidden,
  isNextHidden,
  onPrev,
  onNext
}: MonthlyHeaderProps) {
  const monthLabel = MONTH_LABELS[month - 1] ?? month;

  return <div className={styles.nav}>
    <h2><span className={styles.month}>{monthLabel}</span> {year}</h2>
    {
      <button
        type="button"
        className={styles.prev}
        onClick={() => onPrev()}
        disabled={isPrevHidden}
        aria-label="Previous month"
      >
        Prev.
      </button>
    }
    {
      <button
        type="button"
        className={styles.next}
        onClick={() => onNext()}
        disabled={isNextHidden}
        aria-label="Next month"
      >
        Next
      </button>
    }
    <p title="Grand total for this month">{monthlyTotal}</p>
  </div>;
}
