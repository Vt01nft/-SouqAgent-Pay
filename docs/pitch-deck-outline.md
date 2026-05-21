# Pitch Deck Outline

## Slide 1: SouqAgent Pay

- AI spending desk for UAE/GCC SMEs
- Owner-controlled agent payments
- USDC settlement on Arc
- Built by VT01

## Slide 2: Problem

- SMEs need supplier checks, freight quotes, and settlement workflows.
- AI agents can automate this work, but they need safe payment rails.
- Existing demos rarely show budget control, proof, and settlement in one product.

## Slide 3: Product

- Owner sets task and autonomous spend cap.
- Agent discovers paid services and handles x402-style payment challenge.
- Supplier-risk result is returned with receipts.
- Larger job is funded through Arc USDC escrow.

## Slide 4: Live Workflow

- Task: `TASK-20260520191149`
- Arc Job: `6`
- Fund tx: `0x8749...897b`
- Circle Wallet deliverable tx: `0xe0d2...086b`
- Release tx: `0xd9eb...a4fd`
- Receipt: https://souqagent-pay.vercel.app/receipt/TASK-20260520191149

## Slide 5: Circle + Arc Architecture

- Circle Wallets: owner/agent wallet layer and deliverable contract execution.
- Gateway/Nanopayments/x402: paid API purchase model.
- Arc: USDC escrow, deterministic settlement, release/refund.
- Supabase: durable business task ledger and receipt metadata.

## Slide 6: Why It Can Win

- Full working frontend and backend.
- Real Arc Testnet escrow actions.
- Real Circle Wallet contract execution.
- Clear business owner UX.
- Shareable receipts with transaction proof.

## Slide 7: Roadmap

- Replace simulated x402 authorization with live Gateway/Nanopayments access.
- Add business-user auth and organization roles.
- Add seller portal and document uploads.
- Add CCTP funding routes and multi-corridor payouts.
