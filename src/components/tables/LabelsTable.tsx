import { formatCents } from "../../format";
import type { LabelTotal } from "../../group";
import styles from "./LabelsTable.module.css";

interface LabelsTableProps {
  labelTotals: LabelTotal[];
}

export function LabelsTable({
  labelTotals
}: LabelsTableProps) {
  return  <table className={styles.table}>
    <thead>
      <tr>
        <th scope="col">Label</th>
        <th scope="col" className="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      {labelTotals.length === 0 ? (
        <tr>
          <td colSpan={2}>No labels</td>
        </tr>
      ) : (
        [...labelTotals]
          .sort((a, b) => b.total - a.total)
          .map((lt) => (
            <tr key={lt.label}>
              <th scope="row">{lt.label}</th>
              <td className="amount">{formatCents(lt.total)}</td>
            </tr>
          ))
      )}
    </tbody>
  </table>;
}
