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
  grandTotal: number;
  hiddenAccountIds: string[];
  AccountMenuComponent: ComponentType<AccountMenuComponentProps>;
}

export function AccountsTable({
  accountTotals,
  grandTotal,
  hiddenAccountIds,
  AccountMenuComponent
}: AccountsTableProps) {
  return <table className={styles.table}>
    <tbody>
      <tr className="grand-total-row">
        <th scope="row" colSpan={2}>
          Total
        </th>
        <td className="amount">{formatCents(grandTotal)}</td>
      </tr>
      {accountTotals.map((account) => (
        <tr key={account.accountId} className="account-total-row">
          <th scope="row" colSpan={2}>
            <div className="account-total-inner">
              <span className="account-name">{account.accountName}</span>
              <AccountMenuComponent
                accountId={account.accountId}
                hidden={hiddenAccountIds.includes(account.accountId)}
              />
            </div>
          </th>
          <td className="amount">{formatCents(account.total)}</td>
        </tr>
      ))}
    </tbody>
  </table>;
}
