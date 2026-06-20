# Blanje

A client-side-only web app to track monthly spendings using a JSON file.
Data is parsed in the browser, stored in `localStorage`, and shown as a table
grouped by category with per-category and grand totals.

Guidelines when addinng or changing features behind the app:
- Does one thing only: focuses on tracking monthly expenses, not to be a comprehensive financial management tool.
- Clear goal: to let users see per-category spendings, not to track details like transaction time or account types.
- Utilise browser capabilities: no server, no database in the cloud, no authentication.
- Why JSON: human-readable yet easy to edit and store. Target audience is people who are familiar with JSON files.

## Getting started

```bash
nvm use            # switches to the Node version in .nvmrc
pnpm install
pnpm dev           # start the local dev server
```

Open the printed URL, click **Load JSON file**, and pick a spendings file.
A ready-made [`sample-data.json`](./sample-data.json) is included to try it out.

## Other scripts

```bash
pnpm build         # type-check and produce a production build in dist/
pnpm preview       # serve the production build locally
pnpm typecheck     # type-check only
```

## Data format

The app expects an object with global `accounts` and `categories`, plus
`spendings` grouped by month. Each month is a `YYYYMM` integer (e.g. `202607`):

```json
{
  "accounts": [{ "id": "abc", "name": "ABC Bank" }],
  "categories": [{ "id": "wellness", "name": "Wellness and healthcare" }],
  "spendings": [
    {
      "month": 202607,
      "items": [
        {
          "categoryId": "wellness",
          "name": "Sunscreen (from Shop X)",
          "amount": "123.45",
          "accountId": "abc"
        }
      ]
    }
  ]
}
```

If a file contains multiple months, a selector lets you switch between them.
