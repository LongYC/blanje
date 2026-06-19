import { useEffect, useMemo, useState } from "react";
import { FileLoader } from "./components/FileLoader";
import { SpendingsTable } from "./components/SpendingsTable";
import { downloadJson } from "./download";
import { clearData, loadData, saveData } from "./storage";
import { monthLabel, type SpendingsData, type Spending } from "./types";

const EXAMPLE_JSON = `{
  "accounts": [{ "id": "abc", "name": "ABC Bank" }],
  "categories": [{ "id": "groceries", "name": "Groceries" }],
  "spendings": [
    {
      "month": 202607,
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

export function App() {
  const [data, setData] = useState<SpendingsData | null>(() => loadData());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

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

  function handleLoaded(loaded: SpendingsData) {
    setData(loaded);
    saveData(loaded);
  }

  function handleClear() {
    clearData();
    setData(null);
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
    if (data) {
      const now = new Date();
      downloadJson(data, `blanje_${
        now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}_${String(now.getSeconds()).padStart(2, '0')}`);
    }
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
          <>
            <button type="button" onClick={handleDownload}>
              Save as JSON file
            </button>
            <button type="button" className="clear-btn" onClick={handleClear}>
              Clear data
            </button>
          </>
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
          <SpendingsTable
            items={selected.items}
            categories={data.categories}
            accounts={data.accounts}
            onEditSpending={handleEditSpending}
            onAddSpending={handleAddSpending}
          />
        </section>
      ) : (
        <section className="empty-state">
          <p>
            No data loaded yet. Upload a JSON file to get started. You'll be able to view and edit your spending data, neatly grouped by category. The uploaded file must match the schema shown below:
          </p>
          <pre className="example-json">{EXAMPLE_JSON}</pre>
        </section>
      )}
    </main>
  );
}
