import { useId } from "react";
import { useState } from "react";
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
  const tableId = `${headingId}-items`;
  const isEditingInCategory = editingIndex !== null && groupedItems.some(({ index }) => index === editingIndex);
  const [isExpanded, setIsExpanded] = useState(isEditingInCategory);
  const isOverBudget = budgetLeftInCents === null ? false : budgetLeftInCents < 0;

  return <section className={styles.category} aria-labelledby={headingId}>
    <div className={styles.categoryHeader}>
      <h3 id={headingId} className={styles.categoryHeading}>{categoryName}</h3>
      <p className={styles.summary}>
        <strong>{percentage.toFixed(1)}%</strong> ({formatCents(total)}) of monthly total
        {budgetLeftInCents !== null && budgetInCents !== undefined ? (
          <span
            className={isOverBudget ? styles.over : styles.within}
            title={`Budget: ${formatCents(budgetInCents)}`}
          >
            , {isOverBudget ? "over budget:" : "budget left:"} <em>{formatCents(budgetLeftInCents)}</em>
          </span>
        ) : "."}
      </p>
      <button
        type="button"
        className={styles.toggle}
        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${categoryName} items`}
        aria-controls={tableId}
        aria-expanded={isExpanded}
        title={isExpanded ? "Hide items and add item form" : "Show items and add item form"}
        disabled={isEditingInCategory}
        onClick={() => setIsExpanded((expanded) => !expanded)}
      >
        {isExpanded ? "-" : "+"}
      </button>
    </div>
    <table id={tableId} hidden={!isExpanded} className={styles.table} aria-labelledby={headingId}>
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