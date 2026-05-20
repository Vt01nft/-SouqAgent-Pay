# Demo Script

Target length: 2 minutes.

## 0:00 - 0:15

Introduce the problem:

"SMEs increasingly delegate work to AI agents, but agents need safe ways to spend money. SouqAgent Pay gives a business owner budget controls, paid service discovery, USDC payments, and receipts."

## 0:15 - 0:35

Show the dashboard:

- Gateway balance: 25 USDC
- Autonomous cap: 0.01 USDC
- Escrow ready: 14 USDC
- Active instruction for supplier-risk check

## 0:35 - 1:10

Click **Run demo flow**.

Narrate:

1. The agent discovers x402-compatible paid services.
2. It checks the payment against the business policy.
3. The seller API returns HTTP 402.
4. The agent creates a Gateway-compatible nanopayment authorization.
5. The paid data is delivered and receipts are recorded.

## 1:10 - 1:35

Show the live demo output panel:

- task ID;
- x402 authorization;
- Arc escrow contract path;
- supplier-risk recommendation.

## 1:35 - 1:50

Show the architecture section:

"Circle Wallets handle key and wallet UX, Gateway and Nanopayments handle gas-free paid API calls, and Arc handles larger USDC job escrow."

## 1:50 - 2:00

Close:

"This is a testnet/demo MVP today, but the architecture maps directly to Circle Wallets, Gateway, Nanopayments, and Arc escrow for production-grade agent commerce."
