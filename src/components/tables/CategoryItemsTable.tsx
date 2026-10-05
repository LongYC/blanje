import { useId } from "react";
import type { Account, Item } from "../../data";
import type { CategoryGroup } from "../../group";
import { formatCents } from "../../format";
import { ItemEditor } from "./ItemEditor";
import { ItemRow, type ItemRowStyles } from "./ItemRow";
import styles from "./CategoryItemsTable.module.css";

interface CategoryItemsTableProps {
  categoryGroup: CategoryGroup;
  accounts: Account[];
  hidden: Set<string>;
  grandTotal: number;
  editingIndex: number | null;
  budgetInCents?: number;
  onEditItem: (index: number, patch: Partial<Item>) => void;
  onCancelEdit: () => void;
  onStartEdit: (index: number) => void;
  onAddItem: (item: Item) => void;
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

export function CategoryItemsTable({
  categoryGroup,
  accounts,
  hidden,
  grandTotal,
  editingIndex,
  budgetInCents,
  onEditItem,
  onCancelEdit,
  onStartEdit,
  onAddItem,
  onToggleIgnore,
  onMoveItemDown,
}: CategoryItemsTableProps) {
  const headingId = useId();
  const { categoryId, categoryName, groupedItems, total, percentage } = categoryGroup;
  const budgetLeftInCents = budgetInCents === undefined ? null : budgetInCents - total;

  return <section className={styles.category} aria-labelledby={headingId}>
    <h3 id={headingId} className={styles.categoryHeading}>{categoryName}</h3>
    <dl className={styles.summary}>
      <div className={styles.summaryItem}>
        <dt>Spent</dt>
        <dd>{formatCents(total)}</dd>
      </div>
      <div className={styles.summaryItem}>
        <dt>Of monthly total</dt>
        <dd>{percentage.toFixed(1)}%</dd>
      </div>
      {budgetLeftInCents !== null && budgetInCents !== undefined && (
        <div className={styles.summaryItem}>
          <dt>{budgetLeftInCents < 0 ? "Over budget" : "Budget left"}</dt>
          <dd title={`Budget: ${formatCents(budgetInCents)}`}>
            {formatCents(budgetLeftInCents)}
          </dd>
        </div>
      )}
    </dl>
    <table className={styles.table} aria-labelledby={headingId}>
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
            rowStyles={rowStyles}
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
      </tbody>
    </table>
  </section>;
}