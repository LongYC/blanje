import type { Account, Item } from "../../data";
import type { CategoryGroup } from "../../group";
import { ItemEditor } from "./ItemEditor";
import { ItemRow } from "./ItemRow";
import styles from "./MonthlyItemsTable.module.css";

interface CategorySectionProps {
  categoryGroup: CategoryGroup;
  accounts: Account[];
  hidden: Set<string>;
  grandTotal: number;
  editingIndex: number | null;
  onEditItem: (index: number, patch: Partial<Item>) => void;
  onCancelEdit: () => void;
  onStartEdit: (index: number) => void;
  onAddItem: (item: Item) => void;
  onToggleIgnore: (index: number) => void;
  onMoveItemDown: (index: number) => void;
}

export function CategorySection({
  categoryGroup,
  accounts,
  hidden,
  grandTotal,
  editingIndex,
  onEditItem,
  onCancelEdit,
  onStartEdit,
  onAddItem,
  onToggleIgnore,
  onMoveItemDown,
}: CategorySectionProps) {
  const { categoryId, groupedItems } = categoryGroup;

  return <tbody>
    <ItemEditor
      categoryId={categoryId}
      accountOptions={accounts}
      isAddButtonDisabled={editingIndex !== null}
      onAddOrUpdate={onAddItem}
    />
    {groupedItems.length === 0 ? (
      <tr className={styles.empty}>
        <td colSpan={3}>No spendings</td>
      </tr>
    ) : groupedItems.map((groupedItem, index) => (
      <ItemRow
        key={groupedItem.index}
        groupedItem={groupedItem}
        accounts={accounts}
        hidden={hidden}
        grandTotal={grandTotal}
        isEditing={editingIndex === groupedItem.index}
        isLastInCategory={index === groupedItems.length - 1}
        showMoveDown={true}
        isActionDisabled={editingIndex !== null}
        onEditItem={onEditItem}
        onCancelEdit={onCancelEdit}
        onStartEdit={() => onStartEdit(groupedItem.index)}
        onToggleIgnore={() => onToggleIgnore(groupedItem.index)}
        onMoveDown={() => onMoveItemDown(groupedItem.index)}
      />
    ))}
  </tbody>;
}