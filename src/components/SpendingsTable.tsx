import { useMemo } from "react";
import { groupByCategory } from "../group";
import { formatCents } from "../format";
import type { MonthlyData, Spending } from "../types";

interface SpendingsTableProps {
  data: MonthlyData;
  /**
   * Called when a spending is edited. `index` is the position within the
   * month's original `spendings` array; `patch` carries the changed fields.
   */
  onEditSpending?: (index: number, patch: Partial<Spending>) => void;
}

export function SpendingsTable({ data, onEditSpending }: SpendingsTableProps) {
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
            group.spendings.map((spending) => (
              <tr key={spending.index}>
                <td>
                  {onEditSpending ? (
                    <input
                      type="text"
                      className="cell-input"
                      aria-label="Item name"
                      value={spending.name}
                      onChange={(e) =>
                        onEditSpending(spending.index, { name: e.target.value })
                      }
                    />
                  ) : (
                    spending.name
                  )}
                </td>
                <td>{spending.accountName}</td>
                <td className="amount">
                  {onEditSpending ? (
                    <input
                      type="text"
                      inputMode="decimal"
                      className="cell-input amount-input"
                      aria-label="Amount"
                      value={spending.amount}
                      onChange={(e) =>
                        onEditSpending(spending.index, {
                          amount: e.target.value,
                        })
                      }
                    />
                  ) : (
                    formatCents(spending.amountCents)
                  )}
                </td>
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
