import { useMemo, useState } from "react";
import { CategorySection } from "./CategorySection";
import { SortedItemsSection } from "./SortedItemsSection";
import { toCents } from "../../format";
import styles from "./MonthlyItemsTable.module.css";
import type { MonthlyViewMode } from "../MonthlyHeader";
import type { Account, Item } from "../../data";
import type { CategoryGroup } from "../../group";

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

export function MonthlyItemsTable({
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

  return <table className={styles.table}>
    <colgroup>
      <col className={styles.col} />
      <col />
      <col />
    </colgroup>
    <thead>
      <tr>
        <th scope="col">Item</th>
        <th scope="col" className={styles.amount}>Spent</th>
        <th scope="col">Account</th>
      </tr>
    </thead>
    {viewMode === "name" ? (
      <SortedItemsSection
        items={categoryGroups.flatMap((categoryGroup) => categoryGroup.groupedItems)}
        accounts={accounts}
        hidden={hidden}
        grandTotal={grandTotal}
        editingIndex={editingIndex}
        onEditItem={onEditItem}
        onCancelEdit={() => setEditingIndex(null)}
        onStartEdit={setEditingIndex}
        onToggleIgnore={onToggleIgnore}
        onMoveItemUp={onMoveItemUp}
      />
    ) : categoryGroups.map(({categoryId, categoryName, total, percentage, groupedItems}) => (
      <CategorySection
        key={categoryId}
        categoryGroup={{ categoryId, categoryName, total, percentage, groupedItems }}
        budgetInCents={budgets[categoryId] ? toCents(budgets[categoryId]) : undefined}
        accounts={accounts}
        hidden={hidden}
        grandTotal={grandTotal}
        editingIndex={editingIndex}
        onEditItem={onEditItem}
        onCancelEdit={() => setEditingIndex(null)}
        onStartEdit={setEditingIndex}
        onAddItem={onAddItem}
        onToggleIgnore={onToggleIgnore}
        onMoveItemUp={onMoveItemUp}
      />
    ))}
  </table>;
}
