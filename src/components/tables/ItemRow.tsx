import { formatCents } from "../../format";
import type { Account, Item } from "../../data";
import type { GroupedItem } from "../../group";
import { ItemEditor } from "./ItemEditor";
import { ItemMenu } from "./ItemMenu";
import styles from "./MonthlyItemsTable.module.css";

interface ItemRowProps {
  groupedItem: GroupedItem;
  accounts: Account[];
  hidden: Set<string>;
  grandTotal: number;
  isEditing: boolean;
  isFirstInCategory: boolean;
  showMoveUp: boolean;
  isActionDisabled: boolean;
  onEditItem: (index: number, patch: Partial<Item>) => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onToggleIgnore: () => void;
  onMoveUp: () => void;
}

function spentPercentage(spentAmount: number, totalSpent: number): string {
  if (totalSpent <= 0) return "0.0%";
  return `${((spentAmount / totalSpent) * 100).toFixed(1)}%`;
}

export function ItemRow({
  groupedItem,
  accounts,
  hidden,
  grandTotal,
  isEditing,
  isFirstInCategory,
  showMoveUp,
  isActionDisabled,
  onEditItem,
  onCancelEdit,
  onStartEdit,
  onToggleIgnore,
  onMoveUp,
}: ItemRowProps) {
  if (isEditing) {
    return <ItemEditor
      categoryId={groupedItem.categoryId}
      accountOptions={accounts}
      groupedItemInEdit={groupedItem}
      isOpenByDefault={true}
      onAddOrUpdate={(itemPatch) => {
        onEditItem(groupedItem.index, itemPatch);
        onCancelEdit();
      }}
      onCancelOrKeep={onCancelEdit}
    />;
  }

  const rowClass = [];
  if (groupedItem.ignore) rowClass.push(styles.ignored);
  if (hidden.has(groupedItem.accountId)) rowClass.push(styles.invisible);

  return <tr className={rowClass.join(" ")}>
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
          showMoveUp={showMoveUp}
          isButtonDisabled={isActionDisabled}
          onEdit={onStartEdit}
          onMoveUp={onMoveUp}
          onToggleIgnore={onToggleIgnore}
        />
      </div>
    </td>
  </tr>;
}