import { useEffect, useMemo, useState } from "react";
import { FileLoader } from "./components/FileLoader";
import { SpendingsTable } from "./components/SpendingsTable";
import { downloadJson } from "./download";
import { clearData, loadData, saveData } from "./storage";
import {
  periodKey,
  periodLabel,
  type MonthlyData,
  type Spending,
} from "./types";

export function App() {
  const [data, setData] = useState<MonthlyData[] | null>(() => loadData());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Default the selected period to the first available one whenever data changes.
  useEffect(() => {
    if (data && data.length > 0) {
      const firstKey = periodKey(data[0].period);
      setSelectedKey((current) =>
        current && data.some((d) => periodKey(d.period) === current)
          ? current
          : firstKey,
      );
    } else {
      setSelectedKey(null);
    }
  }, [data]);

  const selected = useMemo(() => {
    if (!data || !selectedKey) return null;
    return data.find((d) => periodKey(d.period) === selectedKey) ?? null;
  }, [data, selectedKey]);

  function handleLoaded(loaded: MonthlyData[]) {
    setData(loaded);
    saveData(loaded);
  }

  function handleClear() {
    clearData();
    setData(null);
  }

  // Apply an edit to a single spending within the selected month, then persist.
  function handleEditSpending(index: number, patch: Partial<Spending>) {
    if (!data || !selectedKey) return;
    const next = data.map((month) => {
      if (periodKey(month.period) !== selectedKey) return month;
      return {
        ...month,
        spendings: month.spendings.map((spending, i) =>
          i === index ? { ...spending, ...patch } : spending,
        ),
      };
    });
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
        {data && data.length > 0 && (
          <>
            <label className="period-select">
              <span>Period</span>
              <select
                value={selectedKey ?? ""}
                onChange={(e) => setSelectedKey(e.target.value)}
              >
                {data.map((d) => {
                  const key = periodKey(d.period);
                  return (
                    <option key={key} value={key}>
                      {periodLabel(d.period)}
                    </option>
                  );
                })}
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

      {selected ? (
        <section className="results">
          <h2>{periodLabel(selected.period)}</h2>
          <SpendingsTable data={selected} onEditSpending={handleEditSpending} />
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
