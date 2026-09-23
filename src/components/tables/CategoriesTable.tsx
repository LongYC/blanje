import { useMemo, useState } from "react";
import { formatCents, toCents } from "../../format";
import { sortGroupedItemsByName, type CategoryGroup } from "../../group";
import type { Account, Item } from "../../data";
import { ItemEditor } from "./ItemEditor";
import { ItemMenu } from "./ItemMenu";
import styles from "./CategoriesTable.module.css";
import type { MonthlyViewMode } from "../MonthlyHeader";

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
  budgets: Record<string, string>;
  viewMode: MonthlyViewMode;
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
  budgets,
  viewMode,
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

  const sortedItems = useMemo(
    () => sortGroupedItemsByName(categoryGroups.flatMap((categoryGroup) => categoryGroup.groupedItems)),
    [categoryGroups],
  );

  function renderItem(groupedItem: CategoryGroup["groupedItems"][number], isFirstInCategory: boolean) {
    if (editingIndex === groupedItem.index) {
      return <ItemEditor
        key={groupedItem.index}
        categoryId={groupedItem.categoryId}
        accountOptions={accounts}
        groupedItemInEdit={groupedItem}
        isOpenByDefault={true}
        onAddOrUpdate={(itemPatch: Item) => {
          onEditItem(groupedItem.index, itemPatch);
          setEditingIndex(null);
        }}
        onCancelOrKeep={() => setEditingIndex(null)}
      />;
    }

    const rowClass = [];
    if (groupedItem.ignore) rowClass.push(styles.ignored);
    if (hidden.has(groupedItem.accountId)) rowClass.push(styles.invisible);

    return <tr
      key={groupedItem.index}
      className={rowClass.join(" ")}
    >
      <td>
        <div>
          {groupedItem.name}
          {groupedItem.labels && groupedItem.labels.length > 0 && (
            <span className={styles.labels}>
              {groupedItem.labels.map((label) => (
                <span className={styles.label} key={label}>{label}</span>
              ))}
            </span>
          )}
        </div>
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
          <span>{groupedItem.accountName}</span>
          <ItemMenu
            isItemIgnored={Boolean(groupedItem.ignore)}
            isFirstInCategory={isFirstInCategory}
            showMoveUp={viewMode === "category"}
            isButtonDisabled={editingIndex !== null}
            onEdit={() => setEditingIndex(groupedItem.index)}
            onMoveUp={() => onMoveItemUp(groupedItem.index)}
            onToggleIgnore={() => onToggleIgnore(groupedItem.index)}
          />
        </div>
      </td>
    </tr>;
  }

  return <table className={styles.table}>
    <thead>
      <tr>
        <th scope="col">Item</th>
        <th scope="col" className={styles.amount}>Spent</th>
        <th scope="col">Account</th>
      </tr>
    </thead>
    {viewMode === "name" ? (
      <tbody>
        {sortedItems.map((groupedItem) => renderItem(groupedItem, false))}
      </tbody>
    ) : categoryGroups.map(({categoryId, categoryName, total, percentage, groupedItems}) => (
      <tbody key={categoryId}>
        <tr className={styles.row}>
          <th scope="rowgroup">
            {categoryName}
            {
              Boolean(budgets[categoryId]) ? ` (${budgets[categoryId]}, ${formatCents(toCents(budgets[categoryId]) - total)})` : ""
            }
          </th>
          <td className={styles.total}>
            <span className={styles.percent} title="Percentage of this category out of this month's grand total">
              {percentage.toFixed(1)}%
            </span>
            {formatCents(total)}
          </td>
          <td aria-label="No value"></td>
        </tr>
        {groupedItems.length === 0 ? (
          <tr className={styles.empty}>
            <td colSpan={3}>No spendings</td>
          </tr>
        ) : (
          groupedItems.map((groupedItem) => renderItem(groupedItem, groupedItems[0].index === groupedItem.index))
        )}
        <ItemEditor
          categoryId={categoryId}
          accountOptions={accounts}
          isAddButtonDisabled={editingIndex !== null}
          onAddOrUpdate={onAddItem}
        />
      </tbody>
    ))}
  </table>;
}
