import { useMemo, useState, type ReactNode } from "react";
import { groupByCategory } from "../../group";
import { formatCents } from "../../format";
import type { Account, Category, Spending } from "../../types";
import { AccountMenu } from "../AccountMenu";
import { AddRow } from "./AddRow";
import { ItemMenu } from "./ItemMenu";

interface SpendingsTableProps {
  items: Spending[];
  categories: Category[];
  accounts: Account[];
  hiddenAccounts?: string[];
  /**
   * Called when a spending is edited. `index` is the position within the
   * month's original `items` array; `patch` carries the changed fields.
   */
  onEditSpending?: (index: number, patch: Partial<Spending>) => void;
  onAddSpending?: (spending: Spending) => void;
  // Toggle whether the item at `index` is ignored in totals.
  onToggleIgnore: (index: number) => void;
  // Move the item at `index` to just before the closest preceding item that shares the same category.
  onMoveItemUp: (index: number) => void;
  onToggleHideAccount: (accountId: string) => void;
}

export function SpendingsTable({
  items,
  categories,
  accounts,
  hiddenAccounts,
  onEditSpending,
  onAddSpending,
  onToggleIgnore,
  onMoveItemUp,
  onToggleHideAccount,
}: SpendingsTableProps) {
  const { groups, accountTotals, grandTotal } = useMemo(
    () => groupByCategory(items, categories, accounts),
    [items, categories, accounts],
  );

  const hidden = useMemo(
    () => new Set(hiddenAccounts ?? []),
    [hiddenAccounts],
  );

  return (
    <>
      <table className="spendings-table">
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
                  {onToggleHideAccount && (
                    <AccountMenu
                      hidden={hidden.has(account.accountId)}
                      onToggleHide={() =>
                        onToggleHideAccount(account.accountId)
                      }
                    />
                  )}
                </div>
              </th>
              <td className="amount">{formatCents(account.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="category-table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col" className="amount">
              Amount
            </th>
            <th scope="col">Account</th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.categoryId}>
            <tr className="category-row">
              <th scope="rowgroup">
                {group.categoryName}
                <span className="category-percent">
                  {group.percentage.toFixed(1)}%
                </span>
              </th>
              <td className="amount category-total">
                {formatCents(group.total)}
              </td>
              <td aria-label="No value"></td>
            </tr>
            {group.spendings.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={3}>No spendings</td>
              </tr>
            ) : (
              group.spendings.map((spending) => (
                <tr
                  key={spending.index}
                  hidden={hidden.has(spending.accountId)}
                  className={spending.ignore ? "ignored-row" : undefined}
                >
                  <td>
                    {onEditSpending ? (
                      <EditableCell
                        value={spending.name}
                        display={
                          spending.name === "" ? (
                            <span className="cell-placeholder">Item name</span>
                          ) : (
                            spending.name
                          )
                        }
                        ariaLabel="Item name"
                        onChange={(name) =>
                          onEditSpending(spending.index, { name })
                        }
                      />
                    ) : (
                      spending.name
                    )}
                  </td>
                  <td className="amount">
                    {onEditSpending ? (
                      <EditableCell
                        value={spending.amount}
                        display={formatCents(spending.amountCents)}
                        ariaLabel="Amount"
                        inputMode="decimal"
                        inputClassName="cell-input amount-input"
                        onChange={(amount) =>
                          onEditSpending(spending.index, { amount })
                        }
                      />
                    ) : (
                      formatCents(spending.amountCents)
                    )}
                  </td>
                  <td className="account-cell">
                    <div className="account-cell-inner">
                      <span className="account-name">
                        {spending.accountName}
                      </span>
                      <ItemMenu
                        ignored={Boolean(spending.ignore)}
                        isFirstInCategory={group.spendings[0].index === spending.index}
                        onToggleIgnore={() => onToggleIgnore(spending.index)}
                        onMoveUp={() => onMoveItemUp(spending.index)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
            {onAddSpending && (
              <AddRow
                categoryId={group.categoryId}
                accounts={accounts}
                onAdd={onAddSpending}
              />
            )}
          </tbody>
        ))}
      </table>
    </>
  );
}

interface EditableCellProps {
  /** Raw value bound to the input while editing. */
  value: string;
  /** What to render in read mode (may differ from `value`, e.g. formatted). */
  display: ReactNode;
  ariaLabel: string;
  inputMode?: "text" | "decimal";
  inputClassName?: string;
  onChange: (value: string) => void;
}

/**
 * Shows `display` as plain text by default and swaps to an input on
 * click/tap, reverting on blur. Read mode lets long values wrap so the
 * full text is visible, which a single-line input can't do in a narrow cell.
 */
function EditableCell({
  value,
  display,
  ariaLabel,
  inputMode = "text",
  inputClassName = "cell-input",
  onChange,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        className="cell-display"
        aria-label={`Edit ${ariaLabel}`}
        onClick={() => setEditing(true)}
      >
        {display}
      </button>
    );
  }

  return (
    <input
      type="text"
      inputMode={inputMode}
      className={inputClassName}
      aria-label={ariaLabel}
      value={value}
      autoFocus
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => {
        // Both keys leave edit mode; edits are already live via onChange.
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          setEditing(false);
        }
      }}
    />
  );
}


