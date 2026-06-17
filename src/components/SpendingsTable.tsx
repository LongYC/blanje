import { useMemo, useState, type FormEvent } from "react";
import { groupByCategory } from "../group";
import { formatCents } from "../format";
import type { Account, MonthlyData, Spending } from "../types";

interface SpendingsTableProps {
  data: MonthlyData;
  /**
   * Called when a spending is edited. `index` is the position within the
   * month's original `spendings` array; `patch` carries the changed fields.
   */
  onEditSpending?: (index: number, patch: Partial<Spending>) => void;
  /** Called when a new spending is added to a category. */
  onAddSpending?: (spending: Spending) => void;
}

export function SpendingsTable({
  data,
  onEditSpending,
  onAddSpending,
}: SpendingsTableProps) {
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
          {onAddSpending && (
            <AddSpendingRow
              categoryId={group.categoryId}
              accounts={data.accounts}
              onAdd={onAddSpending}
            />
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

interface AddSpendingRowProps {
  categoryId: string;
  accounts: Account[];
  onAdd: (spending: Spending) => void;
}

/** A per-category row that expands into a form for adding a new spending. */
function AddSpendingRow({ categoryId, accounts, onAdd }: AddSpendingRowProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");

  function reset() {
    setName("");
    setAmount("");
    setAccountId(accounts[0]?.id ?? "");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim() === "" || amount.trim() === "" || Number.isNaN(Number(amount))) {
      return;
    }
    onAdd({ categoryId, name: name.trim(), amount: amount.trim(), accountId });
    // Keep the form open for quick consecutive entries.
    setName("");
    setAmount("");
  }

  if (!open) {
    return (
      <tr className="add-row">
        <td colSpan={3}>
          <button
            type="button"
            className="add-toggle"
            onClick={() => setOpen(true)}
          >
            + Add item
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="add-row">
      <td colSpan={3}>
        <form className="add-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="cell-input"
            aria-label="New item name"
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <select
            className="cell-input account-select"
            aria-label="Account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            inputMode="decimal"
            className="cell-input amount-input"
            aria-label="New amount"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button type="submit">Add</button>
          <button
            type="button"
            className="clear-btn"
            onClick={() => {
              setOpen(false);
              reset();
            }}
          >
            Done
          </button>
        </form>
      </td>
    </tr>
  );
}
