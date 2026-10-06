import styles from "./MonthlyHeader.module.css";

export type MonthlyViewMode = "category" | "name";

interface MonthlyHeaderProps {
  month: number;
  year: number;
  totalBudget: string;
  totalSpent: string;
  totalUnspentBudget: string;
  totalUnbudgetedSpent: string;
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
  totalBudget,
  totalSpent,
  totalUnspentBudget,
  totalUnbudgetedSpent,
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
    <div className={styles.summary} role="group" aria-label="Monthly totals">
      <dl>
        <div>
          <dt>Total Budget</dt>
          <dd>{totalBudget}</dd>
        </div>
        <div>
          <dt>Total Spent</dt>
          <dd>{totalSpent}</dd>
        </div>
        <div>
          <dt>Unspent budget</dt>
          <dd>{totalUnspentBudget}</dd>
        </div>
        <div>
          <dt>Unbudgeted spent</dt>
          <dd>{totalUnbudgetedSpent}</dd>
        </div>
      </dl>
    </div>
  </div>;
}
