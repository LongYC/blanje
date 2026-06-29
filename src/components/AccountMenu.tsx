import styles from "./AccountMenu.module.css";

interface AccountMenuProps {
  hidden: boolean;
  onToggleHide: () => void;
}

/**
 * A toggle button on an account total row that controls whether the account's
 * item rows are hidden from view. Reads "Shown" by default and "Hidden" once
 * toggled. This currently does not affects any totals.
 */
export function AccountMenu({ hidden, onToggleHide }: AccountMenuProps) {
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-pressed={hidden}
      onClick={onToggleHide}
    >
      {hidden ? "Hidden" : "Shown"}
    </button>
  );
}
