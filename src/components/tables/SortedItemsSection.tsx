import type { Account, Item } from "../../data";
import { sortGroupedItemsByName, type GroupedItem } from "../../group";
import { ItemRow } from "./ItemRow";

interface SortedItemsSectionProps {
  items: GroupedItem[];
  accounts: Account[];
  hidden: Set<string>;
  grandTotal: number;
  editingIndex: number | null;
  onEditItem: (index: number, patch: Partial<Item>) => void;
  onCancelEdit: () => void;
  onStartEdit: (index: number) => void;
  onToggleIgnore: (index: number) => void;
  onMoveItemDown: (index: number) => void;
}

export function SortedItemsSection({
  items,
  accounts,
  hidden,
  grandTotal,
  editingIndex,
  onEditItem,
  onCancelEdit,
  onStartEdit,
  onToggleIgnore,
  onMoveItemDown,
}: SortedItemsSectionProps) {
  const sortedItems = sortGroupedItemsByName(items);

  return <tbody>
    {sortedItems.map((groupedItem) => (
      <ItemRow
        key={groupedItem.index}
        groupedItem={groupedItem}
        accounts={accounts}
        hidden={hidden}
        grandTotal={grandTotal}
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
  </tbody>;
}