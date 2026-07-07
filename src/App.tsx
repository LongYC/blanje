import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { CategoriesTable } from "./components/tables/CategoriesTable";
import { Toast } from "./components/Toast";
import { downloadJson } from "./download";
import { monthLabel } from "./parse";
import {
  clearAllData,
  clearFilename,
  readUserData,
  readLastLoadedFilename,
  readHiddenAccountIds,
  readLastEdited,
  writeUserData,
  saveLastLoadedFilename,
  saveHiddenAccounts,
  saveLastEdited,
} from "./storage";
import { type UserData, type Item } from "./data";
import { AccountsTable } from "./components/tables/AccountsTable";
import { AppHeader } from "./components/AppHeader";
import { DangerZone } from "./components/DangerZone";
import { EmptyState } from "./components/EmptyState";
import { LabelsTable } from "./components/tables/LabelsTable";
import { NoteField } from "./components/NoteField";
import { groupItemsByCategory } from "./group";
import styles from "./App.module.css";
import { MonthlyHeader } from "./components/MonthlyHeader";
import { formatCents } from "./format";

// Format a date as `YYYY-MM-DD_HHmm_ss` for use as a download filename suffix.
function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}_${pad(date.getHours())}${pad(date.getMinutes())}_${pad(date.getSeconds())}`;
}

function getNowAsSelectedMonth(): number {
  const date = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return Number(`${date.getFullYear()}${pad(date.getMonth() + 1)}`);
}

export function App() {
  const [userData, setUserData] = useState<UserData | null>(() => readUserData());
  const [filename, setFilename] = useState<string | null>(() => readLastLoadedFilename());
  const [selectedMonth, setSelectedMonth] = useState<number>(getNowAsSelectedMonth());
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [hiddenAccountIds, setHiddenAccountIds] = useState<string[]>(() =>
    readHiddenAccountIds(),
  );
  // Timestamp of the last item name/amount edit (YYYY-MM-DD_HHmm_ss), or "" if
  // nothing has been edited since the current file was loaded.
  const [lastEdited, setLastEdited] = useState<string>(() => readLastEdited());
  // When a load replaces existing data we stash it (and its filename) here so
  // the Undo toast can restore both; a non-null `previousData` also drives the
  // toast's visibility.
  const [previousData, setPreviousData] = useState<UserData | null>(null);
  const [previousFilename, setPreviousFilename] = useState<string | null>(null);
  const [previousLastEdited, setPreviousLastEdited] = useState<string>("");
  // Bumped on each load so a back-to-back replacement remounts the toast and
  // restarts its countdown rather than inheriting the previous one's progress.
  const [toastToken, setToastToken] = useState(0);

  // Default the selected month to the first available one whenever data changes.
  useEffect(() => {
    if (userData && userData?.spendings.length > 0) {
      const firstMonth = userData.spendings[0].month;
      setSelectedMonth((current) =>
        userData.spendings.some((s) => s.month === current) ? current : firstMonth
      );
    }
  }, [userData]);

  const selectedIndex = useMemo(() => {
    if (!userData || selectedMonth === null) return -1;
    return userData.spendings.findIndex((s) => s.month === selectedMonth);
  }, [userData, selectedMonth]);

  const selected = selectedIndex >= 0 ? userData!.spendings[selectedIndex] : null;

  function stepMonth(delta: number) {
    if (!userData || selectedIndex < 0) return;
    const next = selectedIndex + delta;
    if (next < 0 || next >= userData.spendings.length) return;
    setSelectedMonth(userData.spendings[next].month);
  }

  function handleLoaded(newUserData: UserData, newFilename: string) {
    // For undo.
    setPreviousData(userData);
    setPreviousFilename(filename);
    setPreviousLastEdited(lastEdited);
    setHiddenAccountIds([]);
    saveHiddenAccounts([]);

    newUserData.spendings.sort((a, b) => a.month - b.month);
    setUserData(newUserData);
    setFilename(newFilename);
    writeUserData(newUserData);
    saveLastLoadedFilename(newFilename);
    setLastEdited("");
    saveLastEdited("");
    setToastToken((t) => t + 1);
  }

  function handleAccountVisibility(accountId: string) {
    setHiddenAccountIds((current) => {
      const next = current.includes(accountId)
        ? current.filter((id) => id !== accountId)
        : [...current, accountId];
      saveHiddenAccounts(next);
      return next;
    });
  }

  function handleUndoLoad() {
    if (!previousData) return;
    setUserData(previousData);
    writeUserData(previousData);
    setFilename(previousFilename);
    if (previousFilename) saveLastLoadedFilename(previousFilename);
    else clearFilename();
    setLastEdited(previousLastEdited);
    saveLastEdited(previousLastEdited);
    setPreviousData(null);
    setPreviousFilename(null);
    setPreviousLastEdited("");
  }

  function handleClear() {
    setConfirmingClear(true);
  }

  function confirmClear() {
    clearAllData();
    setUserData(null);
    setFilename(null);
    setPreviousData(null);
    setPreviousFilename(null);
    setConfirmingClear(false);
  }

  // Apply an edit to a single item within the selected month, then persist.
  function handleEditSpending(index: number, patch: Partial<Item>) {
    if (!userData || selectedMonth === null) return;
    const next: UserData = {
      ...userData,
      spendings: userData.spendings.map((month) =>
        month.month !== selectedMonth
          ? month
          : {
              ...month,
              items: month.items.map((item, i) =>
                i === index ? { ...item, ...patch } : item,
              ),
            },
      ),
    };
    setUserData(next);
    writeUserData(next);
    const stamp = formatTimestamp(new Date());
    setLastEdited(stamp);
    saveLastEdited(stamp);
  }

  // Toggle whether an item is ignored in totals, then persist. Unignoring drops
  // the `ignore` property entirely so a saved file never carries `ignore: false`.
  function handleToggleIgnore(index: number) {
    if (!userData || selectedMonth === null) return;
    const next: UserData = {
      ...userData,
      spendings: userData.spendings.map((month) =>
        month.month !== selectedMonth
          ? month
          : {
              ...month,
              items: month.items.map((item, i) => {
                if (i !== index) return item;
                if (item.ignore) {
                  const { ignore: _ignore, ...rest } = item;
                  return rest;
                }
                return { ...item, ignore: true };
              }),
            },
      ),
    };
    setUserData(next);
    writeUserData(next);
  }

  // Update the free-form note on the selected month, then persist.
  function handleEditNote(note: string) {
    if (!userData || selectedMonth === null) return;
    const next: UserData = {
      ...userData,
      spendings: userData.spendings.map((month) =>
        month.month !== selectedMonth ? month : { ...month, note },
      ),
    };
    setUserData(next);
    writeUserData(next);
    const stamp = formatTimestamp(new Date());
    setLastEdited(stamp);
    saveLastEdited(stamp);
  }

  // Move the item at `index` to just before the closest preceding item that shares the same category.
  // No-op if it is already first in its category.
  function handleMoveItemUp(index: number) {
    if (!userData || selectedMonth === null) return;
    const monthEntry = userData.spendings.find((s) => s.month === selectedMonth);
    if (!monthEntry) return;

    const items = monthEntry.items;
    const categoryId = items[index]?.categoryId;
    if (categoryId === undefined) return;

    // Find the closest preceding item with the same category.
    let insertBefore = -1;
    for (let i = index - 1; i >= 0; i--) {
      if (items[i].categoryId === categoryId) {
        insertBefore = i;
        break;
      }
    }
    if (insertBefore === -1) return; // already first in category

    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(insertBefore, 0, moved);

    const nextData: UserData = {
      ...userData,
      spendings: userData.spendings.map((month) =>
        month.month !== selectedMonth ? month : { ...month, items: next },
      ),
    };
    setUserData(nextData);
    writeUserData(nextData);
    const stamp = formatTimestamp(new Date());
    setLastEdited(stamp);
    saveLastEdited(stamp);
  }

  // Append a new item to the selected month, then persist.
  function handleAddSpending(spending: Item) {
    if (!userData || selectedMonth === null) return;
    const next: UserData = {
      ...userData,
      spendings: userData.spendings.map((month) =>
        month.month !== selectedMonth
          ? month
          : { ...month, items: [...month.items, spending] },
      ),
    };
    setUserData(next);
    writeUserData(next);
    const stamp = formatTimestamp(new Date());
    setLastEdited(stamp);
    saveLastEdited(stamp);
  }

  function handleDownload() {
    if (!userData) return;
    // Use the last-edited timestamp as the filename suffix when an edit was made;
    // otherwise keep the original filename so an untouched file round-trips.
    const name = lastEdited ? `blanje_${lastEdited}.json` : filename;
    downloadJson(userData, name ?? "blanje_spendings.json");
  }

  if (!userData || !selected) {
    return <main className={styles.app}>
      <AppHeader
        onLoadedNewFile={handleLoaded}
        hasExistingData={Boolean(userData)}
        onDownload={handleDownload}
      />
      <EmptyState />
    </main>;
  }

  const { categoryGroups, accountTotals, grandTotal, labelTotals } = groupItemsByCategory(selected.items, userData.categories, userData.accounts)

  return (
    <main className={styles.app}>
      <AppHeader
        onLoadedNewFile={handleLoaded}
        hasExistingData={Boolean(userData)}
        onDownload={handleDownload}
      />

      <section className="results">
        <MonthlyHeader
          label={monthLabel(selected.month)}
          monthlyTotal={formatCents(grandTotal)}
          isPrevHidden={selectedIndex <= 0}
          isNextHidden={selectedIndex >= userData.spendings.length - 1}
          onPrev={() => stepMonth(-1)}
          onNext={() => stepMonth(1)}
        />
        <NoteField
          value={selected.note ?? ""}
          editable
          onChange={handleEditNote}
        />
        <CategoriesTable
          categoryGroups={categoryGroups}
          accounts={userData.accounts}
          hiddenAccountIds={hiddenAccountIds}
          onEditItem={handleEditSpending}
          onAddItem={handleAddSpending}
          onToggleIgnore={handleToggleIgnore}
          onMoveItemUp={handleMoveItemUp}
        />
        <div className={styles.breakdown}>
          <AccountsTable
            accountTotals={accountTotals}
            hiddenAccountIds={hiddenAccountIds}
            onAccountVisibilityToggle={handleAccountVisibility}
          />
          {labelTotals.length > 0 && <LabelsTable labelTotals={labelTotals} />}
        </div>
      </section>

      {userData && userData.spendings.length > 0 && <DangerZone filename={filename ?? "unknown"} onClear={handleClear} />}

      <ConfirmDialog
        open={confirmingClear}
        title="Clear all loaded data?"
        description="This permanently deletes all the data loaded. Make sure you have saved all your edits to a new JSON file so your data is not lost."
        confirmLabel="Delete data"
        onConfirm={confirmClear}
        cancelLabel="Keep data"
        onCancel={() => setConfirmingClear(false)}
      />

      {previousData && (
        <Toast
          key={toastToken}
          message="Replaced your previous data."
          actionLabel="Undo"
          actionAriaLabel="Undo replacing data"
          onAction={handleUndoLoad}
          onDismiss={() => setPreviousData(null)}
        />
      )}
    </main>
  );
}
