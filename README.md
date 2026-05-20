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

The seller endpoint intentionally returns `402 Payment Required` until a `payment-signature` header is supplied. This models the x402 paid-resource loop used by Circle Gateway Nanopayments.

## Current Implementation

- Working React frontend with a finance-style UI.
- Express backend with deterministic agent execution flow.
- x402-style paid API challenge and retry model.
- Arc USDC escrow contract under `contracts/ArcJobEscrow.sol`.
- Contract compile script that emits `artifacts/ArcJobEscrow.json`.
- Environment template for Circle and Arc credentials.

## Demo Mode vs Testnet Mode

The project currently runs in `INTEGRATION_MODE=demo`. Demo mode is deliberate: it lets judges inspect the full user flow even if gated Circle products or testnet funds are not available yet.

When credentials are available, the adapter boundary is ready for:

- Circle Wallet IDs and API key;
- Circle Gateway balance and nanopayment authorization calls;
- Arc Testnet RPC, USDC address, and deployed escrow address.

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
