# Demo Script

Target length: 2 minutes.

## 0:00 - 0:15

Introduce the problem:

"SMEs increasingly delegate work to AI agents, but agents need safe ways to spend money. SouqAgent Pay gives a business owner budget controls, paid service discovery, USDC payments, and receipts."

## 0:15 - 0:35

Show the live dashboard:

- Gateway balance: 25 USDC
- Autonomous cap: 0.01 USDC
- Escrow ready: 14 USDC
- Active instruction for supplier-risk check
- Owner access panel protecting spend and settlement controls

## 0:35 - 1:10

Click **Run agent task**.

Narrate:

1. The agent discovers x402-compatible paid services.
2. It checks the payment against the business policy.
3. The seller API returns HTTP 402.
4. The agent creates a Gateway-compatible nanopayment authorization.
5. The paid data is delivered and an Arc escrow job is funded with USDC.

## 1:10 - 1:35

Show the task ledger and receipt:

- task ID;
- x402 authorization;
- Arc escrow contract path and fund tx;
- supplier-risk recommendation.
- deliverable proof section;
- Circle Wallet onchain deliverable tx;
- release tx.

## 1:35 - 1:50

Show the architecture section:

"Circle Wallets submit the seller/agent deliverable proof, Gateway and Nanopayments model paid API calls, and Arc handles larger USDC job escrow."

## 1:50 - 2:00

Close:

"SouqAgent Pay now shows the full trade path: owner policy, agent-paid service, Arc escrow funding, Circle Wallet deliverable submission, and USDC release with shareable receipts."
