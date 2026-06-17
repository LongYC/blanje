import type { SpendingsData } from "./types";

/** Trigger a browser download of the given data as a pretty-printed JSON file. */
export function downloadJson(data: SpendingsData, filename = "spendings.json"): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
