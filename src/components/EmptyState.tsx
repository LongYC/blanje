import styles from "./EmptyState.module.css";

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

export function EmptyState() {
  return <section className={styles.empty}>
    <p>
      No data loaded yet.
      Create and load a JSON file to this page to get started.
      You'll be able to view and edit items plus see totals grouped by category.
      All data are client-side only and the JSON file must match the schema shown below:
    </p>
    <pre className={styles.example}>{EXAMPLE_JSON}</pre>
  </section>;
}
