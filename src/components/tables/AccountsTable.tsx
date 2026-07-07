import { formatCents } from "../../format";
import type { AccountTotal } from "../../group";
import styles from "./AccountsTable.module.css";

interface AccountsTableProps {
  accountTotals: AccountTotal[];
  hiddenAccountIds: string[];
  onAccountVisibilityToggle: (accountId: string) => void;
}

export function AccountsTable({
  accountTotals,
  hiddenAccountIds,
  onAccountVisibilityToggle
}: AccountsTableProps) {
  return <table className={styles.table}>
    <thead>
      <tr>
        <th scope="row" colSpan={2}>Account</th>
        <td className={styles.amount}>Amount</td>
      </tr>
    </thead>
    <tbody>
      {accountTotals.map((account) => (
        <tr key={account.accountId} className={styles.row}>
          <th scope="row" colSpan={2}>
            <div className={styles.inner}>
              <span>{account.accountName}</span>
              <button
                type="button"
                className={styles.toggle}
                aria-pressed={hiddenAccountIds.includes(account.accountId)}
                onClick={() => onAccountVisibilityToggle(account.accountId)}
              >
                {hiddenAccountIds.includes(account.accountId) ? "Hidden" : "Shown"}
              </button>
            </div>
          </th>
          <td className={styles.amount}>{formatCents(account.total)}</td>
        </tr>
      ))}
    </tbody>
  </table>;
}
