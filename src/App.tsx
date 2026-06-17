import { useEffect, useMemo, useState } from "react";
import { FileLoader } from "./components/FileLoader";
import { SpendingsTable } from "./components/SpendingsTable";
import { downloadJson } from "./download";
import { clearData, loadData, saveData } from "./storage";
import { monthLabel, type SpendingsData, type Spending } from "./types";

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

  const selected = useMemo(() => {
    if (!data || selectedMonth === null) return null;
    return data.spendings.find((s) => s.month === selectedMonth) ?? null;
  }, [data, selectedMonth]);

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
    if (data) downloadJson(data);
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>Blanje</h1>
        <p className="tagline">View your monthly spendings from a JSON file.</p>
      </header>

      <section className="controls">
        <FileLoader onLoaded={handleLoaded} />
        {data && data.spendings.length > 0 && (
          <>
            <label className="period-select">
              <span>Period</span>
              <select
                value={selectedMonth ?? ""}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {data.spendings.map((s) => (
                  <option key={s.month} value={s.month}>
                    {monthLabel(s.month)}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={handleDownload}>
              Download JSON
            </button>
            <button type="button" className="clear-btn" onClick={handleClear}>
              Clear data
            </button>
          </>
        )}
      </section>

      {selected && data ? (
        <section className="results">
          <h2>{monthLabel(selected.month)}</h2>
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
            No data loaded yet. Load a JSON file to see your spendings grouped by
            category.
          </p>
        </section>
      )}
    </main>
  );
}
