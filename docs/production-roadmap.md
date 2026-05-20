# Production Roadmap

SouqAgent Pay is now structured as a real product with demo mode as a fallback. The remaining work is mostly credential-bound integration and deployment.

## Working Today

- Frontend product console.
- Backend agent orchestrator.
- Real local x402-style flow: seller returns `402`, agent evaluates policy, signs a payment header, retries, and receives paid data.
- Product readiness endpoint: `GET /api/readiness`.
- Arc escrow contract and compiled artifact.
- Submission documentation and brand assets.

## Next Engineering Milestones

1. Connect Circle Wallets.
   - Create or attach owner and agent wallets.
   - Store wallet IDs in environment variables.
   - Replace demo wallet IDs in `/api/demo/state`.

2. Connect Gateway/Nanopayments.
   - Replace `createDemoPaymentAuthorization` with the Circle x402/Gateway buyer SDK flow.
   - Return real payment response headers and settlement receipts.
   - Keep the current demo path as a fallback for judges.

3. Deploy Arc escrow.
   - Set `ARC_RPC_URL=https://rpc.testnet.arc.network`.
   - Use the Arc Testnet USDC address.
   - Deploy `ArcJobEscrow.sol`.
   - Save the deployed address in `ARC_JOB_ESCROW_ADDRESS`.

4. Add persistence.
   - Store tasks, policy decisions, receipts, and escrow jobs.
   - Recommended first database: Postgres or Supabase.

5. Add authentication.
   - Business owner login.
   - Team-level spend policy.
   - Audit log per organization.

6. Deploy publicly.
   - Frontend and API can deploy together or separately.
   - Set `VITE_API_BASE_URL` to the deployed API URL.

## Credential Blockers

The product cannot perform live/testnet Circle operations until these are supplied:

- `CIRCLE_API_KEY`
- `CIRCLE_WALLET_SET_ID`
- `CIRCLE_OWNER_WALLET_ID`
- `CIRCLE_AGENT_WALLET_ID`
- `ARC_USDC_ADDRESS`
- `ARC_JOB_ESCROW_ADDRESS`

The app exposes those missing values in `/api/readiness` and in the UI readiness panel.
