import { useMemo } from "react";
import { groupByCategory } from "../group";
import { formatCents } from "../format";
import type { MonthlyData } from "../types";

interface SpendingsTableProps {
  data: MonthlyData;
}

export function SpendingsTable({ data }: SpendingsTableProps) {
  const { groups, accountTotals, grandTotal } = useMemo(
    () => groupByCategory(data),
    [data],
  );

  return (
    <table className="spendings-table">
      <thead>
        <tr>
          <th scope="col">Item</th>
          <th scope="col">Account</th>
          <th scope="col" className="amount">
            Amount
          </th>
        </tr>
      </thead>
      {groups.map((group) => (
        <tbody key={group.categoryId}>
          <tr className="category-row">
            <th scope="rowgroup" colSpan={2}>
              {group.categoryName}
              <span className="category-percent">
                {group.percentage.toFixed(1)}%
              </span>
            </th>
            <td className="amount category-total">
              {formatCents(group.total)}
            </td>
          </tr>
          {group.spendings.length === 0 ? (
            <tr className="empty-row">
              <td colSpan={3}>No spendings</td>
            </tr>
          ) : (
            group.spendings.map((spending, i) => (
              <tr key={i}>
                <td>{spending.name}</td>
                <td>{spending.accountName}</td>
                <td className="amount">{formatCents(spending.amountCents)}</td>
              </tr>
            ))
          )}
        </tbody>
      ))}
      <tfoot>
        <tr className="grand-total-row">
          <th scope="row" colSpan={2}>
            Total
          </th>
          <td className="amount">{formatCents(grandTotal)}</td>
        </tr>
        {accountTotals.map((account) => (
          <tr key={account.accountId} className="account-total-row">
            <th scope="row" colSpan={2}>
              {account.accountName}
            </th>
            <td className="amount">{formatCents(account.total)}</td>
          </tr>
        ))}
      </tfoot>
    </table>
  );
}
