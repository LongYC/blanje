import type { UserData } from "./data";
import { orderItemsByCategory } from "./group";

/** Trigger a browser download of the given data as a pretty-printed JSON file. */
export function downloadJson(data: UserData, filename: string): void {
  const exportData: UserData = {
    ...data,
    spendings: data.spendings
      .map((spending) => ({
        ...spending,
        items: orderItemsByCategory(spending.items, data.categories),
      }))
      .sort((a, b) => b.month - a.month),
  };
  const json = JSON.stringify(exportData, null, 2);
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
