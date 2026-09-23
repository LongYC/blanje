import { formatCents, toCents } from "../../format";
import type { Account, Item } from "../../data";
import type { CategoryGroup } from "../../group";
import { ItemEditor } from "./ItemEditor";
import { ItemRow } from "./ItemRow";
import styles from "./MonthlyItemsTable.module.css";

interface CategorySectionProps {
  categoryGroup: CategoryGroup;
  budget?: string;
  accounts: Account[];
  hidden: Set<string>;
  grandTotal: number;
  editingIndex: number | null;
  onEditItem: (index: number, patch: Partial<Item>) => void;
  onCancelEdit: () => void;
  onStartEdit: (index: number) => void;
  onAddItem: (item: Item) => void;
  onToggleIgnore: (index: number) => void;
  onMoveItemUp: (index: number) => void;
}

export function CategorySection({
  categoryGroup,
  budget,
  accounts,
  hidden,
  grandTotal,
  editingIndex,
  onEditItem,
  onCancelEdit,
  onStartEdit,
  onAddItem,
  onToggleIgnore,
  onMoveItemUp,
}: CategorySectionProps) {
  const { categoryId, categoryName, total, percentage, groupedItems } = categoryGroup;

  return <tbody>
    <tr className={styles.row}>
      <th scope="rowgroup">
        {categoryName}
        {budget ? ` (${budget}, ${formatCents(toCents(budget) - total)})` : ""}
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
    ) : groupedItems.map((groupedItem) => (
      <ItemRow
        key={groupedItem.index}
        groupedItem={groupedItem}
        accounts={accounts}
        hidden={hidden}
        grandTotal={grandTotal}
        isEditing={editingIndex === groupedItem.index}
        isFirstInCategory={groupedItems[0].index === groupedItem.index}
        showMoveUp={true}
        isActionDisabled={editingIndex !== null}
        onEditItem={onEditItem}
        onCancelEdit={onCancelEdit}
        onStartEdit={() => onStartEdit(groupedItem.index)}
        onToggleIgnore={() => onToggleIgnore(groupedItem.index)}
        onMoveUp={() => onMoveItemUp(groupedItem.index)}
      />
    ))}
    <ItemEditor
      categoryId={categoryId}
      accountOptions={accounts}
      isAddButtonDisabled={editingIndex !== null}
      onAddOrUpdate={onAddItem}
    />
  </tbody>;
}