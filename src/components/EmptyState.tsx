import styles from "./EmptyState.module.css";

const EXAMPLE_JSON = `{
  "accounts": [{ "id": "abc", "name": "ABC Bank" }],
  "categories": [
    { "id": "need", "name": "What I need, target 50%" },
    { "id": "want", "name": "What I want but don't need, target 30%" },
    { "id": "save", "name": "Save and invest, target 20%" }
  ],
  "spendings": [
    {
      "month": 202607,
      "items": [
        {
          "categoryId": "need",
          "name": "Food (from Shop X)",
          "amount": "123.45",
          "accountId": "abc",
          "labels": ["shop-x"]
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
