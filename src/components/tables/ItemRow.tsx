import { formatCents } from "../../format";
import type { Account, Item } from "../../data";
import type { GroupedItem } from "../../group";
import { ItemEditor } from "./ItemEditor";
import { ItemMenu } from "./ItemMenu";

export interface ItemRowStyles {
  ignored: string | undefined;
  invisible: string | undefined;
  labels: string | undefined;
  label: string | undefined;
  amount: string | undefined;
  percent: string | undefined;
  cell: string | undefined;
}

interface ItemRowProps {
  groupedItem: GroupedItem;
  rowStyles: ItemRowStyles;
  accounts: Account[];
  hidden: Set<string>;
  grandTotal: number;
  isEditing: boolean;
  isLastInCategory: boolean;
  showMoveDown: boolean;
  isActionDisabled: boolean;
  onEditItem: (index: number, patch: Partial<Item>) => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onToggleIgnore: () => void;
  onMoveDown: () => void;
}

function spentPercentage(spentAmount: number, totalSpent: number): string {
  if (totalSpent <= 0) return "0.0%";
  return `${((spentAmount / totalSpent) * 100).toFixed(1)}%`;
}

export function ItemRow({
  groupedItem,
  rowStyles,
  accounts,
  hidden,
  grandTotal,
  isEditing,
  isLastInCategory,
  showMoveDown,
  isActionDisabled,
  onEditItem,
  onCancelEdit,
  onStartEdit,
  onToggleIgnore,
  onMoveDown,
}: ItemRowProps) {
  if (isEditing) {
    return <ItemEditor
      categoryId={groupedItem.categoryId}
      accountOptions={accounts}
      groupedItemInEdit={groupedItem}
      onAddOrUpdate={(itemPatch) => {
        onEditItem(groupedItem.index, itemPatch);
      }}
      onDismiss={onCancelEdit}
    />;
  }

  const rowClass = [];
  if (groupedItem.ignore) rowClass.push(rowStyles.ignored);
  if (hidden.has(groupedItem.accountId)) rowClass.push(rowStyles.invisible);

  return <tr className={rowClass.join(" ") || undefined}>
    <td>
      <div>
        {groupedItem.name}
        {groupedItem.labels && groupedItem.labels.length > 0 && (
          <span className={rowStyles.labels}>
            {groupedItem.labels.map((label) => (
              <span className={rowStyles.label} key={label}>{label}</span>
            ))}
          </span>
        )}
      </div>
    </td>
    <td className={rowStyles.amount}>
      <div>
        <span className={rowStyles.percent} title="Percentage of this item out of this months's grand total">
          {spentPercentage(groupedItem.amountCents, grandTotal)}
        </span>
        {formatCents(groupedItem.amountCents)}
      </div>
    </td>
    <td>
      <div className={rowStyles.cell}>
        <span>{groupedItem.accountName}</span>
        <ItemMenu
          isItemIgnored={Boolean(groupedItem.ignore)}
          isLastInCategory={isLastInCategory}
          showMoveDown={showMoveDown}
          isButtonDisabled={isActionDisabled}
          onEdit={onStartEdit}
          onMoveDown={onMoveDown}
          onToggleIgnore={onToggleIgnore}
        />
      </div>
    </td>
  </tr>;
}