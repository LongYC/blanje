import { useId, useMemo, useState, type ReactNode } from "react";
import { CategorySection } from "./CategorySection";
import { SortedItemsSection } from "./SortedItemsSection";
import { formatCents, toCents } from "../../format";
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
  onMoveItemDown: (index: number) => void;
}

function TableFrame({ ariaLabelledBy, children }: {
  ariaLabelledBy?: string;
  children: ReactNode;
}) {
  return <table className={styles.table} aria-labelledby={ariaLabelledBy}>
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
    {children}
  </table>;
}

interface CategoryTableProps extends Omit<SpendingsTableProps, "categoryGroups" | "budgets" | "viewMode" | "hiddenAccountIds"> {
  categoryGroup: CategoryGroup;
  budgetInCents?: number;
  hidden: Set<string>;
  editingIndex: number | null;
  onCancelEdit: () => void;
  onStartEdit: (index: number) => void;
}

function CategoryTable({
  categoryGroup,
  budgetInCents,
  accounts,
  hidden,
  grandTotal,
  editingIndex,
  onCancelEdit,
  onStartEdit,
  onAddItem,
  onEditItem,
  onToggleIgnore,
  onMoveItemDown,
}: CategoryTableProps) {
  const headingId = useId();
  const { categoryName, total, percentage } = categoryGroup;
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
    <TableFrame ariaLabelledBy={headingId}>
      <CategorySection
        categoryGroup={categoryGroup}
        accounts={accounts}
        hidden={hidden}
        grandTotal={grandTotal}
        editingIndex={editingIndex}
        onEditItem={onEditItem}
        onCancelEdit={onCancelEdit}
        onStartEdit={onStartEdit}
        onAddItem={onAddItem}
        onToggleIgnore={onToggleIgnore}
        onMoveItemDown={onMoveItemDown}
      />
    </TableFrame>
  </section>;
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
  onMoveItemDown
}: SpendingsTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const hidden = useMemo(
    () => new Set(hiddenAccountIds ?? []),
    [hiddenAccountIds],
  );

  if (viewMode === "name") {
    return <TableFrame>
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
        onMoveItemDown={onMoveItemDown}
      />
    </TableFrame>;
  }

  return categoryGroups.map((categoryGroup) => {
    const budget = budgets[categoryGroup.categoryId];

    return <CategoryTable
      key={categoryGroup.categoryId}
      categoryGroup={categoryGroup}
      budgetInCents={budget ? toCents(budget) : undefined}
      accounts={accounts}
      hidden={hidden}
      grandTotal={grandTotal}
      editingIndex={editingIndex}
      onCancelEdit={() => setEditingIndex(null)}
      onStartEdit={setEditingIndex}
      onEditItem={onEditItem}
      onAddItem={onAddItem}
      onToggleIgnore={onToggleIgnore}
      onMoveItemDown={onMoveItemDown}
    />;
  });
}
