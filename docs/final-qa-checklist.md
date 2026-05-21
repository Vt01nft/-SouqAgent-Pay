# Final QA Checklist

## Live App

- [ ] Open `https://souqagent-pay.vercel.app`.
- [ ] Confirm page loads without visible errors.
- [ ] Confirm readiness shows testnet mode, Arc contract, Circle Wallets, Supabase, and owner controls.
- [ ] Confirm production status shows deployer/escrow USDC balance, agent wallet, contract address, latest job, and readiness.
- [ ] Enter owner access code.
- [ ] Confirm task ledger loads.
- [ ] Confirm escrow history loads.

## Receipt Proof

- [ ] Open `https://souqagent-pay.vercel.app/receipt/TASK-20260520191149`.
- [ ] Confirm task status is `released`.
- [ ] Confirm payment authorization is visible.
- [ ] Confirm deliverable notes are visible.
- [ ] Confirm Circle Wallet onchain deliverable tx is visible.
- [ ] Confirm release tx is visible.

## Protected APIs

- [ ] Anonymous `GET /api/tasks` returns `401`.
- [ ] Owner-code `GET /api/tasks` returns saved tasks.
- [ ] Public `GET /api/tasks/TASK-20260520191149` returns the receipt data.
- [ ] Public `GET /api/production/status` returns live balances and latest Arc job.

## Repository

- [ ] README has app URL, repo URL, Circle email, contract, receipt, and tx hashes.
- [ ] `docs/final-submission.md` has all submission fields.
- [ ] `docs/circle-product-feedback.md` is clearly labeled.
- [ ] `docs/demo-script.md` matches the current product.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
