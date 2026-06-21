import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { groupByCategory } from "../group";
import { formatCents } from "../format";
import type { Account, Category, Spending } from "../types";

interface SpendingsTableProps {
  items: Spending[];
  categories: Category[];
  accounts: Account[];
  /** Account ids whose item rows are hidden from view (does not affect calculations). */
  hiddenAccounts?: string[];
  /**
   * Called when a spending is edited. `index` is the position within the
   * month's original `items` array; `patch` carries the changed fields.
   */
  onEditSpending?: (index: number, patch: Partial<Spending>) => void;
  /** Called when a new spending is added to a category. */
  onAddSpending?: (spending: Spending) => void;
  /** Toggle whether the item at `index` is ignored in totals. */
  onToggleIgnore?: (index: number) => void;
  /** Toggle whether `accountId`'s item rows are hidden from view. */
  onToggleHideAccount?: (accountId: string) => void;
}

export function SpendingsTable({
  items,
  categories,
  accounts,
  hiddenAccounts,
  onEditSpending,
  onAddSpending,
  onToggleIgnore,
  onToggleHideAccount,
}: SpendingsTableProps) {
  const { groups, accountTotals, grandTotal } = useMemo(
    () => groupByCategory(items, categories, accounts),
    [items, categories, accounts],
  );

  const hidden = useMemo(
    () => new Set(hiddenAccounts ?? []),
    [hiddenAccounts],
  );

  return (
    <>
      <table className="spendings-table">
        <tbody>
          <tr className="grand-total-row">
            <th scope="row" colSpan={2}>
              Total
            </th>
            <td className="amount">{formatCents(grandTotal)}</td>
          </tr>
          {accountTotals.map((account) => (
            <tr key={account.accountId} className="account-total-row">
              <th scope="row" colSpan={2}>
                <div className="account-total-inner">
                  <span className="account-name">{account.accountName}</span>
                  {onToggleHideAccount && (
                    <AccountMenu
                      hidden={hidden.has(account.accountId)}
                      onToggleHide={() =>
                        onToggleHideAccount(account.accountId)
                      }
                    />
                  )}
                </div>
              </th>
              <td className="amount">{formatCents(account.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="category-table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col" className="amount">
              Amount
            </th>
            <th scope="col">Account</th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.categoryId}>
            <tr className="category-row">
              <th scope="rowgroup">
                {group.categoryName}
                <span className="category-percent">
                  {group.percentage.toFixed(1)}%
                </span>
              </th>
              <td className="amount category-total">
                {formatCents(group.total)}
              </td>
              <td aria-label="No value"></td>
            </tr>
            {group.spendings.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={3}>No spendings</td>
              </tr>
            ) : (
              group.spendings.map((spending) => (
                <tr
                  key={spending.index}
                  hidden={hidden.has(spending.accountId)}
                  className={spending.ignore ? "ignored-row" : undefined}
                >
                  <td>
                    {onEditSpending ? (
                      <EditableCell
                        value={spending.name}
                        display={
                          spending.name === "" ? (
                            <span className="cell-placeholder">Item name</span>
                          ) : (
                            spending.name
                          )
                        }
                        ariaLabel="Item name"
                        onChange={(name) =>
                          onEditSpending(spending.index, { name })
                        }
                      />
                    ) : (
                      spending.name
                    )}
                  </td>
                  <td className="amount">
                    {onEditSpending ? (
                      <EditableCell
                        value={spending.amount}
                        display={formatCents(spending.amountCents)}
                        ariaLabel="Amount"
                        inputMode="decimal"
                        inputClassName="cell-input amount-input"
                        onChange={(amount) =>
                          onEditSpending(spending.index, { amount })
                        }
                      />
                    ) : (
                      formatCents(spending.amountCents)
                    )}
                  </td>
                  <td className="account-cell">
                    <div className="account-cell-inner">
                      <span className="account-name">
                        {spending.accountName}
                      </span>
                      {onToggleIgnore && (
                        <ItemMenu
                          ignored={Boolean(spending.ignore)}
                          onToggleIgnore={() => onToggleIgnore(spending.index)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
            {onAddSpending && (
              <AddSpendingRow
                categoryId={group.categoryId}
                accounts={accounts}
                onAdd={onAddSpending}
              />
            )}
          </tbody>
        ))}
      </table>
    </>
  );
}

interface EditableCellProps {
  /** Raw value bound to the input while editing. */
  value: string;
  /** What to render in read mode (may differ from `value`, e.g. formatted). */
  display: ReactNode;
  ariaLabel: string;
  inputMode?: "text" | "decimal";
  inputClassName?: string;
  onChange: (value: string) => void;
}

/**
 * Shows `display` as plain text by default and swaps to an input on
 * click/tap, reverting on blur. Read mode lets long values wrap so the
 * full text is visible, which a single-line input can't do in a narrow cell.
 */
function EditableCell({
  value,
  display,
  ariaLabel,
  inputMode = "text",
  inputClassName = "cell-input",
  onChange,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        className="cell-display"
        aria-label={`Edit ${ariaLabel}`}
        onClick={() => setEditing(true)}
      >
        {display}
      </button>
    );
  }

  return (
    <input
      type="text"
      inputMode={inputMode}
      className={inputClassName}
      aria-label={ariaLabel}
      value={value}
      autoFocus
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => {
        // Both keys leave edit mode; edits are already live via onChange.
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          setEditing(false);
        }
      }}
    />
  );
}

interface ItemMenuProps {
  ignored: boolean;
  onToggleIgnore: () => void;
}

/**
 * A "⋯" trigger that opens a small popover menu for per-item actions. Currently
 * just toggles whether the item is ignored in totals. Closes on outside
 * click/tap or Escape.
 */
function ItemMenu({ ignored, onToggleIgnore }: ItemMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="item-menu" ref={containerRef}>
      <button
        type="button"
        className="item-menu-trigger"
        aria-label="Item actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </button>
      {open && (
        <div className="item-menu-popover" role="menu">
          <button
            type="button"
            role="menuitem"
            className="item-menu-item"
            onClick={() => {
              onToggleIgnore();
              setOpen(false);
            }}
          >
            {ignored ? "Unignore" : "Ignore"}
          </button>
        </div>
      )}
    </div>
  );
}

interface AccountMenuProps {
  hidden: boolean;
  onToggleHide: () => void;
}

/**
 * A toggle button on an account total row that controls whether the account's
 * item rows are hidden from view. Reads "Shown" by default and "Hidden" once
 * toggled. This is purely visual and never affects any totals.
 */
function AccountMenu({ hidden, onToggleHide }: AccountMenuProps) {
  return (
    <button
      type="button"
      className="account-visibility-toggle"
      aria-pressed={hidden}
      onClick={onToggleHide}
    >
      {hidden ? "Hidden" : "Shown"}
    </button>
  );
}

interface AddSpendingRowProps {
  categoryId: string;
  accounts: Account[];
  onAdd: (spending: Spending) => void;
}

/** A per-category row that expands into a form for adding a new spending. */
function AddSpendingRow({ categoryId, accounts, onAdd }: AddSpendingRowProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");

  function reset() {
    setName("");
    setAmount("");
    setAccountId("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      name.trim() === "" ||
      amount.trim() === "" ||
      Number.isNaN(Number(amount)) ||
      accountId === ""
    ) {
      return;
    }
    onAdd({ categoryId, name: name.trim(), amount: amount.trim(), accountId });
    // Keep the form open for quick consecutive entries.
    setName("");
    setAmount("");
    setAccountId("");
  }

  if (!open) {
    return (
      <tr className="add-row">
        <td colSpan={3}>
          <button
            type="button"
            className="add-toggle"
            onClick={() => setOpen(true)}
          >
            + Add item
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="add-row">
      <td colSpan={3}>
        <form className="add-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="cell-input"
            aria-label="New item name"
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="amount-field">
            {/* The mobile decimal keypad has no minus key, so offer an explicit
                sign toggle that flips the leading "-" on the current value. */}
            <button
              type="button"
              className={`sign-toggle${
                amount.startsWith("-") ? " is-negative" : ""
              }`}
              aria-label="Toggle negative amount"
              aria-pressed={amount.startsWith("-")}
              title="Toggle +/−"
              onClick={() =>
                setAmount((a) => (a.startsWith("-") ? a.slice(1) : `-${a}`))
              }
            >
              ±
            </button>
            <input
              type="text"
              inputMode="decimal"
              className="cell-input amount-input"
              aria-label="New amount"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <select
            className={`cell-input account-select${
              accountId === "" ? " is-placeholder" : ""
            }`}
            aria-label="Account"
            value={accountId}
            required
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="" disabled>
              Pick account
            </option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={accountId === ""}>
            Add
          </button>
          <button
            type="button"
            className="close-btn"
            aria-label="Close"
            title="Close"
            onClick={() => {
              setOpen(false);
              reset();
            }}
          >
            ×
          </button>
        </form>
      </td>
    </tr>
  );
}
