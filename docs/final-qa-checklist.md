# Final QA Checklist

## Live App

- [x] Open `https://souqagent-pay.vercel.app`.
- [x] Confirm page loads without visible errors.
- [x] Confirm readiness shows testnet mode, Arc contract, Circle Wallets, Supabase, and owner controls.
- [x] Confirm production status shows deployer/escrow USDC balance, agent wallet, contract address, latest job, and readiness.
- [x] Enter owner access code.
- [x] Confirm task ledger loads.
- [x] Confirm escrow history loads.

## Receipt Proof

- [x] Open `https://souqagent-pay.vercel.app/receipt/TASK-20260520191149`.
- [x] Confirm task status is `released`.
- [x] Confirm payment authorization is visible.
- [x] Confirm deliverable notes are visible.
- [x] Confirm Circle Wallet onchain deliverable tx is visible.
- [x] Confirm release tx is visible.

## Protected APIs

- [x] Anonymous `GET /api/tasks` returns `401`.
- [x] Owner-code `GET /api/tasks` returns saved tasks.
- [x] Public `GET /api/tasks/TASK-20260520191149` returns the receipt data.
- [x] Public `GET /api/production/status` returns live balances and latest Arc job.

## Repository

- [x] README has app URL, repo URL, Circle email, contract, receipt, and tx hashes.
- [x] `docs/final-submission.md` has all submission fields.
- [x] `docs/circle-product-feedback.md` is clearly labeled.
- [x] `docs/demo-script.md` matches the current product.
- [x] `npm run build` passes.
- [x] `npm run lint` passes.
