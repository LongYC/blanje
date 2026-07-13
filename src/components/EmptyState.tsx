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
      To get started, create a JSON following the schema shown below
      and then load it to this page using the top right menu.
      You'll be able to view and edit items plus see totals grouped by categories and labels.
    </p>
    <pre className={styles.example}>{EXAMPLE_JSON}</pre>
  </section>;
}
