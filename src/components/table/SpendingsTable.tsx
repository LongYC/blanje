import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { groupItemsByCategory } from "../../group";
import { formatCents } from "../../format";
import type { Account, Category, Item } from "../../types";
import { AddRow } from "./AddRow";
import { ItemMenu } from "./ItemMenu";

interface AccountMenuComponentProps {
  accountId: string;
  hidden: boolean;
}

interface SpendingsTableProps {
  items: Item[];
  categories: Category[];
  accounts: Account[];
  hiddenAccounts?: string[];
  onEditItem?: (index: number, patch: Partial<Item>) => void;
  onAddItem?: (item: Item) => void;
  // Toggle whether the item at `index` is ignored in totals.
  onToggleIgnore: (index: number) => void;
  // Move the item at `index` to just before the closest preceding item that shares the same category.
  onMoveItemUp: (index: number) => void;
  AccountMenuComponent: ComponentType<AccountMenuComponentProps>;
}

export function SpendingsTable({
  items,
  categories,
  accounts,
  hiddenAccounts,
  onEditItem,
  onAddItem,
  onToggleIgnore,
  onMoveItemUp,
  AccountMenuComponent,
}: SpendingsTableProps) {
  const { categoryGroups, accountTotals, grandTotal } = useMemo(
    () => groupItemsByCategory(items, categories, accounts),
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
                  <AccountMenuComponent
                    accountId={account.accountId}
                    hidden={hidden.has(account.accountId)}
                  />
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
        {categoryGroups.map((categoryGroup) => (
          <tbody key={categoryGroup.categoryId}>
            <tr className="category-row">
              <th scope="rowgroup">
                {categoryGroup.categoryName}
                <span className="category-percent">
                  {categoryGroup.percentage.toFixed(1)}%
                </span>
              </th>
              <td className="amount category-total">
                {formatCents(categoryGroup.total)}
              </td>
              <td aria-label="No value"></td>
            </tr>
            {categoryGroup.groupedItems.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={3}>No spendings</td>
              </tr>
            ) : (
              categoryGroup.groupedItems.map((groupedItem) => (
                <tr
                  key={groupedItem.index}
                  hidden={hidden.has(groupedItem.accountId)}
                  className={groupedItem.ignore ? "ignored-row" : undefined}
                >
                  <td>
                    {onEditItem ? (
                      <EditableCell
                        value={groupedItem.name}
                        display={
                          groupedItem.name === "" ? (
                            <span className="cell-placeholder">Item name</span>
                          ) : (
                            groupedItem.name
                          )
                        }
                        ariaLabel="Item name"
                        onChange={(name) =>
                          onEditItem(groupedItem.index, { name })
                        }
                      />
                    ) : (
                      groupedItem.name
                    )}
                  </td>
                  <td className="amount">
                    {onEditItem ? (
                      <EditableCell
                        value={groupedItem.amount}
                        display={formatCents(groupedItem.amountCents)}
                        ariaLabel="Amount"
                        inputMode="decimal"
                        inputClassName="cell-input amount-input"
                        onChange={(amount) =>
                          onEditItem(groupedItem.index, { amount })
                        }
                      />
                    ) : (
                      formatCents(groupedItem.amountCents)
                    )}
                  </td>
                  <td className="account-cell">
                    <div className="account-cell-inner">
                      <span className="account-name">
                        {groupedItem.accountName}
                      </span>
                      <ItemMenu
                        ignored={Boolean(groupedItem.ignore)}
                        isFirstInCategory={categoryGroup.groupedItems[0].index === groupedItem.index}
                        onToggleIgnore={() => onToggleIgnore(groupedItem.index)}
                        onMoveUp={() => onMoveItemUp(groupedItem.index)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
            {onAddItem && (
              <AddRow
                categoryId={categoryGroup.categoryId}
                accounts={accounts}
                onAdd={onAddItem}
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


