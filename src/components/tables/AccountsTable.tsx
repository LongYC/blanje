import type { ComponentType } from "react";
import { formatCents } from "../../format";
import type { AccountTotal } from "../../group";
import styles from "./AccountsTable.module.css";

interface AccountMenuComponentProps {
  accountId: string;
  hidden: boolean;
}

interface AccountsTableProps {
  accountTotals: AccountTotal[];
  hiddenAccountIds: string[];
  AccountMenuComponent: ComponentType<AccountMenuComponentProps>;
}

export function AccountsTable({
  accountTotals,
  hiddenAccountIds,
  AccountMenuComponent
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
              <AccountMenuComponent
                accountId={account.accountId}
                hidden={hiddenAccountIds.includes(account.accountId)}
              />
            </div>
          </th>
          <td className={styles.amount}>{formatCents(account.total)}</td>
        </tr>
      ))}
    </tbody>
  </table>;
}
