import { useMemo, type ComponentType } from "react";
import { groupItemsByCategory } from "../../group";
import { formatCents } from "../../format";
import type { Account, Category, Item } from "../../types";
import { AddRow } from "./AddRow";
import { ItemMenu } from "./ItemMenu";
import { EditableCell } from "./EditableCell";
import { LabelsTable } from "./LabelsTable";
import { AccountsTable } from "./AccountsTable";

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
  const { categoryGroups, accountTotals, grandTotal, labelTotals } = useMemo(
    () => groupItemsByCategory(items, categories, accounts),
    [items, categories, accounts],
  );

  const hidden = useMemo(
    () => new Set(hiddenAccounts ?? []),
    [hiddenAccounts],
  );

  return (
    <>
      <AccountsTable
        accountTotals={accountTotals}
        grandTotal={grandTotal}
        hiddenAccountIds={hidden}
        AccountMenuComponent={AccountMenuComponent}
      />
      <LabelsTable labelTotals={labelTotals} />
      <table className="category-table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col" className="amount">Amount</th>
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
                            <>
                              <span className="cell-placeholder">Item name</span>
                              {groupedItem.labels && groupedItem.labels.length > 0 && (
                                <span className="item-labels">
                                  {groupedItem.labels.map((l) => (
                                    <span className="item-label" key={l}>{l}</span>
                                  ))}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {groupedItem.name}
                              {groupedItem.labels && groupedItem.labels.length > 0 && (
                                <span className="item-labels">
                                  {groupedItem.labels.map((l) => (
                                    <span className="item-label" key={l}>{l}</span>
                                  ))}
                                </span>
                              )}
                            </>
                          )
                        }
                        ariaLabel="Item name"
                        onChange={(name) =>
                          onEditItem(groupedItem.index, { name })
                        }
                      />
                    ) : (
                      <>
                        {groupedItem.name}
                        {groupedItem.labels && groupedItem.labels.length > 0 && (
                          <span className="item-labels">
                            {groupedItem.labels.map((l) => (
                              <span className="item-label" key={l}>{l}</span>
                            ))}
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="amount">
                    {onEditItem ? (
                      <EditableCell
                        value={groupedItem.amount}
                        display={formatCents(groupedItem.amountCents)}
                        ariaLabel="Amount"
                        inputMode="decimal"
                        isAmount={true}
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
