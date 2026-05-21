# SouqAgent Pay

SouqAgent Pay is an Agentic Economy entry for the Stablecoin Commerce Stack Challenge.

It gives UAE and GCC businesses an AI-controlled spending desk where agents can:

- discover paid APIs, datasets, and service agents;
- negotiate price and terms inside a user-defined budget;
- execute gas-free USDC nanopayments through Circle Gateway and x402;
- settle larger deliverable-based work through Arc smart-contract escrow;
- show an audit trail, receipts, spend limits, and Circle product feedback for judging.

Primary submission track: **Best Agentic Economy Experience on Arc**.

Submission identity:

- Team: **VT01**
- Builder: **VT01, solo founder-developer**
- Circle Developer email: **vt01nfts@gmail.com**
- Repository: **https://github.com/Vt01nft/-SouqAgent-Pay**
- Deployment target: **Vercel**

Working thesis: most agent-payment demos stop at "an agent paid an API." SouqAgent Pay makes the buyer experience legible to a business owner: budget policy, vendor discovery, automated purchase, settlement proof, and post-transaction accounting in one product.

## Planned Circle / Arc Stack

- Arc Testnet for EVM-compatible contracts, USDC gas, and fast deterministic settlement.
- Circle Wallets for embedded user and agent wallets.
- Circle Gateway for unified USDC balances and treasury movement.
- Circle Nanopayments for gas-free, sub-cent x402 service payments.
- CCTP / Bridge Kit where useful for cross-chain funding or payout simulation.
- ERC-8004 / ERC-8183-inspired agent identity and job lifecycle flows on Arc.

## Quick Start

```bash
npm install
npm run compile:contracts
npm run server
npm run dev
```

Open the web app at `http://localhost:5173`.

API endpoints:

- `GET /api/health`
- `GET /api/demo/state`
- `POST /api/agent/run`
- `GET /api/seller/supplier-risk`
- `GET /api/escrow/jobs`
- `POST /api/escrow/jobs/:jobId/release`
- `POST /api/escrow/jobs/:jobId/refund`
- `GET /api/tasks`
- `GET /api/tasks/:taskId`

The seller endpoint intentionally returns `402 Payment Required` until a `payment-signature` header is supplied. This models the x402 paid-resource loop used by Circle Gateway Nanopayments.

## Current Implementation

- Working React frontend with a finance-style UI.
- Express backend with deterministic agent execution flow.
- x402-style paid API challenge and retry model.
- Product task ledger with Postgres support and local JSON fallback.
- Shareable receipt pages at `/receipt/:taskId`.
- Owner access code guard for agent spending, private task history, and escrow settlement actions.
- Deliverable proof workflow: funded escrow jobs require saved proof before release.
- Arc USDC escrow contract under `contracts/ArcJobEscrow.sol`.
- Live Arc Testnet escrow creation and funding from the production API.
- Contract compile script that emits `artifacts/ArcJobEscrow.json`.
- Environment template for Circle and Arc credentials.

## Live Testnet Contracts

- Arc Testnet USDC: `0x3600000000000000000000000000000000000000`
- ArcJobEscrow: `0x421707d931D0EF3b0fd4419085b91b713C622256`
- Deployment tx: `0xcc35de9fde88a79fb7dce33051cf233a830fe007a6e4338db8a7d6e4b350fe24`
- Full flow receipt: `https://souqagent-pay.vercel.app/receipt/TASK-20260520191149`
- Circle Wallet deliverable tx: `0xe0d214c51edadc4f9bec75b695e08a8d3450eb2d55a1f087b2ccbc84e5e4086b`
- Escrow release tx: `0xd9ebed3aae17514b3957d51c3094fdf83f0136eb19ac3627f8b4f95f28ada4fd`

## Demo Mode vs Testnet Mode

The project runs in `INTEGRATION_MODE=testnet` for the deployed product. Demo mode remains available as a local fallback so judges can inspect the user flow even if gated Circle products or testnet funds are temporarily unavailable.

Configured testnet rails include:

- Circle API key, wallet set, owner wallet, and agent wallet;
- Circle owner and agent ARC wallet addresses;
- Arc Testnet RPC, USDC address, and deployed escrow address;
- real Arc Testnet escrow creation, funding, release, and refund actions.

The remaining Circle integration gap is replacing the current x402-compatible payment authorization simulator with Circle Gateway/Nanopayments once that product access is available.

## Owner Access

Set `OWNER_ACCESS_CODE` in local and deployment environments. The frontend asks for this code before it can run agents, load the private task ledger, list escrow jobs, or release/refund funded escrow jobs. Public receipt URLs remain readable so they can be shared with judges or counterparties.

## Escrow Release Flow

SouqAgent Pay now follows a full trade workflow: owner instruction, agent-paid supplier risk check, Arc escrow funding, deliverable proof submission, and owner release. Deliverable proof is stored in the durable task ledger and displayed on the receipt page. The backend also attempts a Circle Wallet contract execution from the agent wallet to call `submitDeliverable(uint256,string)` on the Arc escrow contract; the receipt records the Circle transaction id/hash or the fallback error if Circle testnet execution is unavailable.

## Research Artifacts

- [Research notes](./docs/research.md)
- [Winning strategy](./docs/winning-strategy.md)
- [MVP scope](./docs/mvp-scope.md)
- [Submission plan](./docs/submission-plan.md)
- [Demo script](./docs/demo-script.md)
- [Circle Product Feedback](./docs/circle-product-feedback.md)
- [Brand guide](./docs/brand.md)
- [Production roadmap](./docs/production-roadmap.md)

## Submission Requirements Covered

- Functional frontend and backend
- Architecture diagram
- Video demo and presentation script
- GitHub repository with setup docs
- Demo application URL
- Clearly labeled Circle Product Feedback section
