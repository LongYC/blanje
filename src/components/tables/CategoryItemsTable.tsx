import { useEffect, useId, useRef, useState } from "react";
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
  const { categoryId, categoryName, groupedItems, total, percentage } = categoryGroup;

  const headingId = useId();
  const tableId = `${headingId}-items`;
  const isEditingInCategory = editingIndex !== null && groupedItems.some(({ index }) => index === editingIndex);
  const budgetLeftInCents = budgetInCents === undefined ? null : budgetInCents - total;
  const isOverBudget = budgetLeftInCents === null ? false : budgetLeftInCents < 0;

  const [isItemsExpanded, setIsItemsExpanded] = useState(isEditingInCategory);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

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
      <div className={styles.headerActions}>
        <div className={styles.addToggleSlot}>
          {!isAddFormOpen && (
            <button
              type="button"
              className={styles.toggle}
              aria-label={`Open add form for ${categoryName}`}
              aria-controls={tableId}
              aria-expanded={false}
              title="Add an item to this category"
              disabled={editingIndex !== null}
              onClick={() => setIsAddFormOpen(true)}
            >
              +
            </button>
          )}
        </div>
        <div className={styles.menuContainer} ref={menuRef}>
          <button
            type="button"
            className={styles.menuTrigger}
            aria-label={`${categoryName} item list menu`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            disabled={isEditingInCategory}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            ⋯
          </button>
          {isMenuOpen && (
            <div className={styles.menu} role="menu">
              <button
                type="button"
                role="menuitem"
                className={styles.menuItem}
                onClick={() => {
                  setIsItemsExpanded((expanded) => !expanded);
                  setIsMenuOpen(false);
                }}
              >
                {isItemsExpanded ? "Hide items" : "Show items"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    <table id={tableId} hidden={!isItemsExpanded && !isAddFormOpen} className={styles.table} aria-labelledby={headingId}>
      <colgroup>
        <col className={styles.col} />
        <col />
        <col />
      </colgroup>
      <thead hidden={!isItemsExpanded}>
        <tr>
          <th scope="col">Item</th>
          <th scope="col" className={styles.amount}>Spent</th>
          <th scope="col">Account</th>
        </tr>
      </thead>
      <tbody>
        {isAddFormOpen && (
          <ItemEditor
            categoryId={categoryId}
            accountOptions={accounts}
            onAddOrUpdate={onAddItem}
            onDismiss={() => setIsAddFormOpen(false)}
          />
        )}
        {isItemsExpanded && (groupedItems.length === 0 ? (
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
        )))}
      </tbody>
    </table>
  </section>;
}