import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { FileLoader } from "./components/FileLoader";
import { AccountMenu } from "./components/AccountMenu";
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
import { type UserData, type Item } from "./types";
import { AccountsTable } from "./components/tables/AccountsTable";
import { AppHeader } from "./components/AppHeader";
import { Button } from "./components/Button";
import { DangerZone } from "./components/DangerZone";
import { EmptyState } from "./components/EmptyState";
import { LabelsTable } from "./components/tables/LabelsTable";
import { NoteField } from "./components/NoteField";
import { groupItemsByCategory } from "./group";

// Format a date as `YYYY-MM-DD_HHmm_ss` for use as a download filename suffix.
function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}_${pad(date.getHours())}${pad(date.getMinutes())}_${pad(date.getSeconds())}`;
}

export function App() {
  const [data, setData] = useState<UserData | null>(() => readUserData());
  const [filename, setFilename] = useState<string | null>(() => readLastLoadedFilename());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
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
    if (data && data.spendings.length > 0) {
      const firstMonth = data.spendings[0].month;
      setSelectedMonth((current) =>
        current !== null && data.spendings.some((s) => s.month === current)
          ? current
          : firstMonth,
      );
    } else {
      setSelectedMonth(null);
    }
  }, [data]);

  const selectedIndex = useMemo(() => {
    if (!data || selectedMonth === null) return -1;
    return data.spendings.findIndex((s) => s.month === selectedMonth);
  }, [data, selectedMonth]);

  const selected = selectedIndex >= 0 ? data!.spendings[selectedIndex] : null;

  // Step to an adjacent month in the spendings list.
  function stepMonth(delta: number) {
    if (!data || selectedIndex < 0) return;
    const next = selectedIndex + delta;
    if (next < 0 || next >= data.spendings.length) return;
    setSelectedMonth(data.spendings[next].month);
  }

  function handleLoaded(loaded: UserData, name: string) {
    // Loading over existing data is destructive — keep the old data (and its
    // filename) around so the Undo toast can put it back. Loading into an empty
    // app needs no toast.
    setPreviousData(data);
    setPreviousFilename(filename);
    setPreviousLastEdited(lastEdited);
    setData(loaded);
    setFilename(name);
    writeUserData(loaded);
    saveLastLoadedFilename(name);
    // This is intentionally not restored by the Undo toast.
    setHiddenAccountIds([]);
    saveHiddenAccounts([]);
    // A freshly loaded file hasn't been edited yet.
    setLastEdited("");
    saveLastEdited("");
    setToastToken((t) => t + 1);
  }

  // Toggle whether an account's item rows are hidden.
  // Hiding currently does not affects calculation of totals.
  function handleToggleHideAccount(accountId: string) {
    setHiddenAccountIds((current) => {
      const next = current.includes(accountId)
        ? current.filter((id) => id !== accountId)
        : [...current, accountId];
      saveHiddenAccounts(next);
      return next;
    });
  }

  const AccountMenuComponent = useCallback(
    ({ accountId, hidden }: { accountId: string; hidden: boolean }) => (
      <AccountMenu
        hidden={hidden}
        onToggleHide={() => handleToggleHideAccount(accountId)}
      />
    ),
    [handleToggleHideAccount],
  );

  function handleUndoLoad() {
    if (!previousData) return;
    setData(previousData);
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
    setData(null);
    setFilename(null);
    setPreviousData(null);
    setPreviousFilename(null);
    setConfirmingClear(false);
  }

  // Apply an edit to a single item within the selected month, then persist.
  function handleEditSpending(index: number, patch: Partial<Item>) {
    if (!data || selectedMonth === null) return;
    const next: UserData = {
      ...data,
      spendings: data.spendings.map((month) =>
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
    setData(next);
    writeUserData(next);
    const stamp = formatTimestamp(new Date());
    setLastEdited(stamp);
    saveLastEdited(stamp);
  }

  // Toggle whether an item is ignored in totals, then persist. Unignoring drops
  // the `ignore` property entirely so a saved file never carries `ignore: false`.
  function handleToggleIgnore(index: number) {
    if (!data || selectedMonth === null) return;
    const next: UserData = {
      ...data,
      spendings: data.spendings.map((month) =>
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
    setData(next);
    writeUserData(next);
  }

  // Update the free-form note on the selected month, then persist.
  function handleEditNote(note: string) {
    if (!data || selectedMonth === null) return;
    const next: UserData = {
      ...data,
      spendings: data.spendings.map((month) =>
        month.month !== selectedMonth ? month : { ...month, note },
      ),
    };
    setData(next);
    writeUserData(next);
    const stamp = formatTimestamp(new Date());
    setLastEdited(stamp);
    saveLastEdited(stamp);
  }

  // Move the item at `index` to just before the closest preceding item that
  // shares the same categoryId. No-op if it is already first in its category.
  function handleMoveItemUp(index: number) {
    if (!data || selectedMonth === null) return;
    const monthEntry = data.spendings.find((s) => s.month === selectedMonth);
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
      ...data,
      spendings: data.spendings.map((month) =>
        month.month !== selectedMonth ? month : { ...month, items: next },
      ),
    };
    setData(nextData);
    writeUserData(nextData);
    const stamp = formatTimestamp(new Date());
    setLastEdited(stamp);
    saveLastEdited(stamp);
  }

  // Append a new item to the selected month, then persist.
  function handleAddSpending(spending: Item) {
    if (!data || selectedMonth === null) return;
    const next: UserData = {
      ...data,
      spendings: data.spendings.map((month) =>
        month.month !== selectedMonth
          ? month
          : { ...month, items: [...month.items, spending] },
      ),
    };
    setData(next);
    writeUserData(next);
    const stamp = formatTimestamp(new Date());
    setLastEdited(stamp);
    saveLastEdited(stamp);
  }

  function handleDownload() {
    if (!data) return;
    // Use the last-edited timestamp as the filename suffix when an edit was made;
    // otherwise keep the original filename so an untouched file round-trips.
    const name = lastEdited ? `blanje_${lastEdited}.json` : filename;
    downloadJson(data, name ?? "blanje_spendings.json");
  }

  if (!data || !selected) {
    return <main className="app">
      <AppHeader />

      <section className="controls">
        <FileLoader onLoaded={handleLoaded} hasExistingData={Boolean(data)} />
        {data && data.spendings.length > 0 && (<Button label="Save to a JSON file" onClick={handleDownload} variant="main" />)}
      </section>

      <EmptyState />
    </main>;
  }

  const { categoryGroups, accountTotals, grandTotal, labelTotals } = groupItemsByCategory(selected.items, data.categories, data.accounts)

  return (
    <main className="app">
      <AppHeader />

      <section className="controls">
        <FileLoader onLoaded={handleLoaded} hasExistingData={Boolean(data)} />
        {data && data.spendings.length > 0 && (<Button label="Save to a JSON file" onClick={handleDownload} variant="main" />)}
      </section>

      <section className="results">
        <div className="month-nav">
          <button
            type="button"
            className="month-nav-btn"
            onClick={() => stepMonth(-1)}
            disabled={selectedIndex <= 0}
            aria-label="Previous month"
          >
            ‹
          </button>
          <h2>{monthLabel(selected.month)}</h2>
          <button
            type="button"
            className="month-nav-btn"
            onClick={() => stepMonth(1)}
            disabled={selectedIndex >= data.spendings.length - 1}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        <NoteField
          value={selected.note ?? ""}
          editable
          onChange={handleEditNote}
        />
        <AccountsTable
          accountTotals={accountTotals}
          grandTotal={grandTotal}
          hiddenAccountIds={hiddenAccountIds}
          AccountMenuComponent={AccountMenuComponent}
        />
        {labelTotals.length > 0 && <LabelsTable labelTotals={labelTotals} />}
        <CategoriesTable
          categoryGroups={categoryGroups}
          accounts={data.accounts}
          hiddenAccountIds={hiddenAccountIds}
          onEditItem={handleEditSpending}
          onAddItem={handleAddSpending}
          onToggleIgnore={handleToggleIgnore}
          onMoveItemUp={handleMoveItemUp}
          AccountMenuComponent={AccountMenuComponent}
        />
      </section>

      {data && data.spendings.length > 0 && <DangerZone filename={filename} onClear={handleClear} />}

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
