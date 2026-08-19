import { useMemo, useState } from "react";
import { formatCents } from "../../format";
import type { CategoryGroup } from "../../group";
import type { Account, Item } from "../../data";
import { ItemEditor } from "./ItemEditor";
import { ItemMenu } from "./ItemMenu";
import styles from "./CategoriesTable.module.css";

function spentPercentage(spentAmount: number, totalSpent: number): string {
  if (totalSpent <= 0) {
    return '0.0%';
  }
  
  return `${((spentAmount / totalSpent) * 100).toFixed(1)}%`;
};

interface SpendingsTableProps {
  categoryGroups: CategoryGroup[];
  accounts: Account[];
  hiddenAccountIds: string[];
  grandTotal: number;
  onAddItem: (item: Item) => void;
  onEditItem: (index: number, patch: Partial<Item>) => void;
  onToggleIgnore: (index: number) => void;
  onMoveItemUp: (index: number) => void;
}

export function CategoriesTable({
  categoryGroups,
  accounts,
  hiddenAccountIds,
  grandTotal,
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

  return <table className={styles.table}>
    <thead>
      <tr>
        <th scope="col">Item</th>
        <th scope="col" className={styles.amount}>Spent</th>
        <th scope="col">Account</th>
      </tr>
    </thead>
    {categoryGroups.map((categoryGroup) => (
      <tbody key={categoryGroup.categoryId}>
        <tr className={styles.row}>
          <th scope="rowgroup">
            {categoryGroup.categoryName}
          </th>
          <td className={styles.total}>
            <span className={styles.percent} title="Percentage of this category out of this month's grand total">
              {categoryGroup.percentage.toFixed(1)}%
            </span>
            {formatCents(categoryGroup.total)}
          </td>
          <td aria-label="No value"></td>
        </tr>
        {categoryGroup.groupedItems.length === 0 ? (
          <tr className={styles.empty}>
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
                onAddOrUpdate={(itemPatch: Item) => {
                  onEditItem(groupedItem.index, itemPatch);
                  setEditingIndex(null);
                }}
                onCancelOrKeep={() => setEditingIndex(null)}
              />
            }

            const rowClass = [];
            if (groupedItem.ignore) rowClass.push(styles.ignored);
            if (hidden.has(groupedItem.accountId)) rowClass.push(styles.invisible);

            return <tr
              key={groupedItem.index}
              className={rowClass.join(" ")}
            >
              <td>
                {
                  <div>
                    {groupedItem.name}
                    {groupedItem.labels && groupedItem.labels.length > 0 && (
                      <span className={styles.labels}>
                        {groupedItem.labels.map((l) => (
                          <span className={styles.label} key={l}>{l}</span>
                        ))}
                      </span>
                    )}
                  </div>
                }
              </td>
              <td className={styles.amount}>
                <div>
                  <span className={styles.percent} title="Percentage of this item out of this months's grand total">
                    {spentPercentage(groupedItem.amountCents, grandTotal)}
                  </span>
                  {formatCents(groupedItem.amountCents)}
                </div>
              </td>
              <td>
                <div className={styles.cell}>
                  <span>
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
          onAddOrUpdate={onAddItem}
        />
      </tbody>
    ))}
  </table>;
}
