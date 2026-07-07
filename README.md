# Blanje

A client-side-only web app to track monthly spendings using a JSON file.
Data is parsed in the browser, stored in `localStorage`, and shown as a table
grouped by category with per-category and grand totals.

Guidelines when addinng or updating features for the app:

- Does one thing only:
  - to see per-category monthly spendings to be used for decision makings, not to be a comprehensive financial management tool. The account data is just there so that users can cross-check the amounts with their account statements.
- Frictions on desctructive operations:
  - there should be some frictions and quick undo for destructive operations to reduce the chance of accidental data loss.
- Opinionated defaults over customisations:
  - this is a tool to assist and be out of the way of the main goal.
- Utilise browser capabilities:
  - no server, no database in the cloud, no authentication.
- Why JSON:
  - human-readable yet easy to edit and store. This app is designed for people who are comfortable working with JSON files.

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
}
```

If a file contains multiple months, a selector lets you switch between them.

Each item may carry an optional `"ignore": true`, which excludes it from all
totals while keeping it visible (shown greyed out). Toggle it from the item's
`⋯` menu. The property is omitted when `false`, so a saved file never writes
`"ignore": false`.
