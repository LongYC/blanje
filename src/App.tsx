import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { FileLoader } from "./components/FileLoader";
import { SpendingsTable } from "./components/SpendingsTable";
import { Toast } from "./components/Toast";
import { downloadJson } from "./download";
import {
  clearData,
  clearFilename,
  loadData,
  loadFilename,
  loadHiddenAccounts,
  loadLastEdited,
  saveData,
  saveFilename,
  saveHiddenAccounts,
  saveLastEdited,
} from "./storage";
import { monthLabel, type SpendingsData, type Spending } from "./types";

const EXAMPLE_JSON = `{
  "accounts": [{ "id": "abc", "name": "ABC Bank" }],
  "categories": [{ "id": "groceries", "name": "Groceries" }],
  "spendings": [
    {
      "month": 202607,
      "note": "Optional note for the month",
      "items": [
        {
          "categoryId": "groceries",
          "name": "Weekly groceries",
          "amount": "210.30",
          "accountId": "abc"
        }
      ]
    }
  ]
}`;

// Format a date as `YYYY-MM-DD_HHmm_ss` for use as a download filename suffix.
function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}_${pad(date.getHours())}${pad(date.getMinutes())}_${pad(date.getSeconds())}`;
}

export function App() {
  const [data, setData] = useState<SpendingsData | null>(() => loadData());
  const [filename, setFilename] = useState<string | null>(() => loadFilename());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  // Account ids whose item rows are hidden from view. Purely visual — totals are
  // unaffected. Persisted to meta and reset whenever a new file is loaded.
  const [hiddenAccounts, setHiddenAccounts] = useState<string[]>(() =>
    loadHiddenAccounts(),
  );
  // Timestamp of the last item name/amount edit (YYYY-MM-DD_HHmm_ss), or "" if
  // nothing has been edited since the current file was loaded.
  const [lastEdited, setLastEdited] = useState<string>(() => loadLastEdited());
  // When a load replaces existing data we stash it (and its filename) here so
  // the Undo toast can restore both; a non-null `previousData` also drives the
  // toast's visibility.
  const [previousData, setPreviousData] = useState<SpendingsData | null>(null);
  const [previousFilename, setPreviousFilename] = useState<string | null>(null);
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

  function handleLoaded(loaded: SpendingsData, name: string) {
    // Loading over existing data is destructive — keep the old data (and its
    // filename) around so the Undo toast can put it back. Loading into an empty
    // app needs no toast.
    setPreviousData(data);
    setPreviousFilename(filename);
    setData(loaded);
    setFilename(name);
    saveData(loaded);
    saveFilename(name);
    // A fresh file's accounts are unrelated to the previous ones, so start with
    // nothing hidden. This is intentionally not restored by the Undo toast.
    setHiddenAccounts([]);
    saveHiddenAccounts([]);
    // A freshly loaded file hasn't been edited yet.
    setLastEdited("");
    saveLastEdited("");
    setToastToken((t) => t + 1);
  }

  // Toggle whether an account's item rows are hidden, then persist. Hiding is
  // purely visual and never affects any totals.
  function handleToggleHideAccount(accountId: string) {
    setHiddenAccounts((current) => {
      const next = current.includes(accountId)
        ? current.filter((id) => id !== accountId)
        : [...current, accountId];
      saveHiddenAccounts(next);
      return next;
    });
  }

  function handleUndoLoad() {
    if (!previousData) return;
    setData(previousData);
    saveData(previousData);
    setFilename(previousFilename);
    if (previousFilename) saveFilename(previousFilename);
    else clearFilename();
    setPreviousData(null);
    setPreviousFilename(null);
  }

  function handleClear() {
    setConfirmingClear(true);
  }

  function confirmClear() {
    clearData();
    setData(null);
    setFilename(null);
    setPreviousData(null);
    setPreviousFilename(null);
    setConfirmingClear(false);
  }

  // Apply an edit to a single item within the selected month, then persist.
  function handleEditSpending(index: number, patch: Partial<Spending>) {
    if (!data || selectedMonth === null) return;
    const next: SpendingsData = {
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
    saveData(next);
    // Item name/amount edits are the only changes that bump the last-edited
    // timestamp (used as the download filename suffix).
    const stamp = formatTimestamp(new Date());
    setLastEdited(stamp);
    saveLastEdited(stamp);
  }

  // Toggle whether an item is ignored in totals, then persist. Unignoring drops
  // the `ignore` property entirely so a saved file never carries `ignore: false`.
  function handleToggleIgnore(index: number) {
    if (!data || selectedMonth === null) return;
    const next: SpendingsData = {
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
    saveData(next);
  }

  // Update the free-form note on the selected month, then persist.
  function handleEditNote(note: string) {
    if (!data || selectedMonth === null) return;
    const next: SpendingsData = {
      ...data,
      spendings: data.spendings.map((month) =>
        month.month !== selectedMonth ? month : { ...month, note },
      ),
    };
    setData(next);
    saveData(next);
  }

  // Append a new item to the selected month, then persist.
  function handleAddSpending(spending: Spending) {
    if (!data || selectedMonth === null) return;
    const next: SpendingsData = {
      ...data,
      spendings: data.spendings.map((month) =>
        month.month !== selectedMonth
          ? month
          : { ...month, items: [...month.items, spending] },
      ),
    };
    setData(next);
    saveData(next);
  }

  function handleDownload() {
    if (!data) return;
    // Use the last-edited timestamp as the filename suffix when an edit was made;
    // otherwise keep the original filename so an untouched file round-trips.
    const name = lastEdited ? `blanje_${lastEdited}` : filename;
    downloadJson(data, name ?? "blanje_spendings.json");
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>Blanje</h1>
        <p className="tagline">For those who want to track monthly spendings with a JSON file.</p>
      </header>

      <section className="controls">
        <FileLoader onLoaded={handleLoaded} />
        {data && data.spendings.length > 0 && (
          <button type="button" onClick={handleDownload}>
            Save as JSON file
          </button>
        )}
      </section>

      {selected && data ? (
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
          <SpendingsTable
            items={selected.items}
            categories={data.categories}
            accounts={data.accounts}
            hiddenAccounts={hiddenAccounts}
            onEditSpending={handleEditSpending}
            onAddSpending={handleAddSpending}
            onToggleIgnore={handleToggleIgnore}
            onToggleHideAccount={handleToggleHideAccount}
          />
        </section>
      ) : (
        <section className="empty-state">
          <p>
            No data loaded yet. Load a JSON file to this page to get started. You'll be able to view and edit your spending data, grouped by category. All data are client-side only and the JSON file must match the schema shown below:
          </p>
          <pre className="example-json">{EXAMPLE_JSON}</pre>
        </section>
      )}

      {data && data.spendings.length > 0 && (
        <section className="danger-zone">
          <div className="danger-zone-text">
            {filename && (
              <span className="loaded-file">
                Last loaded from <strong>{filename}</strong>
              </span>
            )}
          </div>
          <button type="button" className="clear-btn" onClick={handleClear}>
            Clear all loaded data
          </button>
        </section>
      )}

      <ConfirmDialog
        open={confirmingClear}
        title="Clear all loaded data?"
        description="This permanently deletes all the data loaded. Make sure you have saved all your edits to a new JSON file before you proceed so your data is not lost."
        confirmLabel="Delete data"
        onConfirm={confirmClear}
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

interface NoteFieldProps {
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}

/**
 * A free-form, multi-line note for the month. Renders as plain text and swaps
 * to a textarea on click/tap when editable, committing edits live via onChange
 * and reverting to read mode on blur.
 */
function NoteField({ value, editable, onChange }: NoteFieldProps) {
  const [editing, setEditing] = useState(false);

  if (!editable) {
    return value === "" ? null : <p className="month-note">{value}</p>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="month-note month-note-display"
        aria-label="Edit note"
        onClick={() => setEditing(true)}
      >
        {value === "" ? (
          <span className="cell-placeholder">Add a note</span>
        ) : (
          value
        )}
      </button>
    );
  }

  return (
    <textarea
      id="month-note-input"
      className="month-note month-note-input"
      aria-label="Note"
      value={value}
      autoFocus
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => {
        // Escape leaves edit mode; Enter inserts a newline (multi-line note).
        if (e.key === "Escape") {
          e.preventDefault();
          setEditing(false);
        }
      }}
    />
  );
}
