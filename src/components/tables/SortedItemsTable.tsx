import type { Account, Item } from "../../data";
import { sortGroupedItemsByName, type GroupedItem } from "../../group";
import { ItemRow, type ItemRowStyles } from "./ItemRow";
import styles from "./SortedItemsTable.module.css";

interface SortedItemsTableProps {
  items: GroupedItem[];
  accounts: Account[];
  hidden: Set<string>;
  totalSpentInCents: number;
  editingIndex: number | null;
  onEditItem: (index: number, patch: Partial<Item>) => void;
  onCancelEdit: () => void;
  onStartEdit: (index: number) => void;
  onToggleIgnore: (index: number) => void;
  onMoveItemDown: (index: number) => void;
}

const rowStyles: ItemRowStyles = {
  ignored: styles.ignored,
  invisible: styles.invisible,
  labels: styles.labels,
  label: styles.label,
  amount: styles.amount,
  percent: styles.percent,
  cell: styles.cell,
};

export function SortedItemsTable({
  items,
  accounts,
  hidden,
  totalSpentInCents,
  editingIndex,
  onEditItem,
  onCancelEdit,
  onStartEdit,
  onToggleIgnore,
  onMoveItemDown,
}: SortedItemsTableProps) {
  const sortedItems = sortGroupedItemsByName(items);

  return <table className={styles.table} aria-label="Items sorted by name">
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
    <tbody>
      {sortedItems.map((groupedItem) => (
        <ItemRow
          key={groupedItem.index}
          groupedItem={groupedItem}
          rowStyles={rowStyles}
          accounts={accounts}
          hidden={hidden}
          totalSpentInCents={totalSpentInCents}
          isEditing={editingIndex === groupedItem.index}
          isLastInCategory={false}
          showMoveDown={false}
          isActionDisabled={editingIndex !== null}
          onEditItem={onEditItem}
          onCancelEdit={onCancelEdit}
          onStartEdit={() => onStartEdit(groupedItem.index)}
          onToggleIgnore={() => onToggleIgnore(groupedItem.index)}
          onMoveDown={() => onMoveItemDown(groupedItem.index)}
        />
      ))}
    </tbody>
  </table>;
}