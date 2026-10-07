import { useState } from "react";
import { formatCents } from "../format";
import styles from "./MonthlyHeader.module.css";

export type MonthlyViewMode = "category" | "name";

interface MonthlyHeaderProps {
  month: number;
  year: number;
  totalBudgetInCents: number;
  totalSpentInCents: number;
  totalUnbudgetedSpentInCents: number;
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
  totalBudgetInCents,
  totalSpentInCents,
  totalUnbudgetedSpentInCents,
  isPrevHidden,
  isNextHidden,
  onPrev,
  onNext
}: MonthlyHeaderProps) {
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);
  const monthLabel = MONTH_LABELS[month - 1] ?? month;
  const expectedSpentInCents = totalBudgetInCents + totalUnbudgetedSpentInCents;

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
          <dt>Expected spent</dt>
          <dd>
            <button
              type="button"
              className={styles.expected}
              onClick={() => setIsBreakdownExpanded((expanded) => !expanded)}
              aria-label={`Expected spent ${formatCents(expectedSpentInCents)}, ${isBreakdownExpanded ? "hide" : "show"} budget breakdown`}
              aria-expanded={isBreakdownExpanded}
              aria-controls="monthly-spending-breakdown"
            >
              {formatCents(expectedSpentInCents)}
              <span className={styles.chevron} aria-hidden="true" />
            </button>
          </dd>
        </div>
        <div>
          <dt>Current spent</dt>
          <dd>{formatCents(totalSpentInCents)}</dd>
        </div>
      </dl>
      <dl
        id="monthly-spending-breakdown"
        className={styles.breakdown}
        hidden={!isBreakdownExpanded}
      >
        <div>
          <dt>Budget</dt>
          <dd>{formatCents(totalBudgetInCents)}</dd>
        </div>
        <div>
          <dt>Unbudgeted spent</dt>
          <dd>{formatCents(totalUnbudgetedSpentInCents)}</dd>
        </div>
      </dl>
    </div>
  </div>;
}
