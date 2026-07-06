import { useMemo, useState, type ComponentType } from "react";
import { formatCents } from "../../format";
import type { CategoryGroup } from "../../group";
import type { Account, Item } from "../../types";
import { ItemEditor } from "./ItemEditor";
import { ItemMenu } from "./ItemMenu";

interface AccountMenuComponentProps {
  accountId: string;
  hidden: boolean;
}

interface SpendingsTableProps {
  categoryGroups: CategoryGroup[];
  accounts: Account[];
  hiddenAccountIds: string[];
  onAddItem: (item: Item) => void;
  onEditItem: (index: number, patch: Partial<Item>) => void;
  onToggleIgnore: (index: number) => void;
  // Move the item at `index` to just before the closest preceding item that shares the same category.
  onMoveItemUp: (index: number) => void;
  AccountMenuComponent: ComponentType<AccountMenuComponentProps>;
}

export function CategoriesTable({
  categoryGroups,
  accounts,
  hiddenAccountIds,
  onAddItem,
  onEditItem,
  onToggleIgnore,
  onMoveItemUp
}: SpendingsTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const hidden = useMemo(
    () => new Set(hiddenAccountIds ?? []),
    [hiddenAccountIds],
  );

  return (
    <>
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
              categoryGroup.groupedItems.map((groupedItem) => {
                if (editingIndex === groupedItem.index) {
                  return <ItemEditor
                    categoryId={groupedItem.categoryId}
                    accountOptions={accounts}
                    groupedItemInEdit={groupedItem}
                    isOpenByDefault={true}
                    onSubmit={(itemPatch: Item) => {
                      onEditItem(groupedItem.index, itemPatch);
                      setEditingIndex(null);
                    }}
                    onClose={() => setEditingIndex(null)}
                  />
                }

                return <tr
                  key={groupedItem.index}
                  hidden={hidden.has(groupedItem.accountId)}
                  className={groupedItem.ignore ? "ignored-row" : undefined}
                >
                  <td>
                    {
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
                    }
                  </td>
                  <td className="amount">
                    {formatCents(groupedItem.amountCents)}
                  </td>
                  <td className="account-cell">
                    <div className="account-cell-inner">
                      <span className="account-name">
                        {groupedItem.accountName}
                      </span>
                      <ItemMenu
                        isItemIgnored={Boolean(groupedItem.ignore)}
                        isFirstInCategory={categoryGroup.groupedItems[0].index === groupedItem.index}
                        isButtonDisabled={editingIndex !== null}
                        onEdit={() => setEditingIndex(groupedItem.index)}
                        onMoveUp={() => onMoveItemUp(groupedItem.index)}
                        onToggleIgnore={() => onToggleIgnore(groupedItem.index)}
                      />
                    </div>
                  </td>
                </tr>
              })
            )}
            <ItemEditor
              categoryId={categoryGroup.categoryId}
              accountOptions={accounts}
              isAddButtonDisabled={editingIndex !== null}
              onSubmit={onAddItem}
            />
          </tbody>
        ))}
      </table>
    </>
  );
}
