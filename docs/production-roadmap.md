# Production Roadmap

SouqAgent Pay is now structured as a real product with demo mode as a fallback. The remaining work is mostly credential-bound integration and deployment.

## Working Today

- Frontend product console.
- Backend agent orchestrator.
- Real local x402-style flow: seller returns `402`, agent evaluates policy, signs a payment header, retries, and receives paid data.
- Product readiness endpoint: `GET /api/readiness`.
- Arc escrow contract deployed on Arc Testnet.
- Live production API creates and funds Arc Testnet escrow jobs.
- Submission documentation and brand assets.

## Next Engineering Milestones

1. Connect Gateway/Nanopayments.
   - Replace `createDemoPaymentAuthorization` with the Circle x402/Gateway buyer SDK flow.
   - Return real payment response headers and settlement receipts.
   - Keep the current demo path as a fallback for judges.

2. Expand Arc escrow.
   - Index escrow events for receipt history.
   - Add deliverable upload / proof-of-completion before release.
   - Add role-aware controls so sellers cannot release their own jobs.

3. Add persistence.
   - Store tasks, policy decisions, receipts, and escrow jobs.
   - Recommended first database: Postgres or Supabase.

4. Add authentication.
   - Business owner login.
   - Team-level spend policy.
   - Audit log per organization.

5. Add production monitoring.
   - Runtime logs, failed settlement alerts, and balance monitoring.
   - Submission-safe demo seed flow for judges.

## Credential Blockers

The product can create and settle Arc Testnet escrow jobs today. The remaining live Circle payment blocker is gated access and final API shape for Gateway/Nanopayments:

- Gateway/Nanopayments testnet access confirmation.
- Any required Circle x402 buyer SDK credentials or endpoint configuration.

The app exposes required runtime values in `/api/readiness` and in the UI readiness panel.
