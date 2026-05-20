# MVP Scope

## Primary Track

Best Agentic Economy Experience on Arc

## One-Sentence Description

SouqAgent Pay lets a UAE/GCC business delegate small paid purchases to an AI agent that can discover x402 services, obey budget policy, execute USDC nanopayments, and settle larger deliverable-based jobs on Arc.

## Must-Have Features

- Dashboard with business wallet, agent wallet, spend policy, receipts, and activity timeline.
- Agent task input: "buy supplier-risk data" or "source a paid service."
- Service marketplace with x402 pricing metadata.
- Seller API that returns a payment-required response before serving premium data.
- Buyer agent flow that handles the payment requirement and records the paid result.
- Circle integration adapter for Wallets/Gateway/Nanopayments with demo fallback.
- Arc escrow contract for larger job settlement.
- Architecture diagram and setup docs.
- Circle Product Feedback page/section.

## Nice-To-Have Features

- CCTP / Bridge Kit funding simulation.
- Multiple seller agents competing on price.
- Reputation score after completed jobs.
- Human approval threshold for payments above a configurable amount.
- Exportable receipt PDF or CSV.

## Out Of Scope For First MVP

- Real fiat AED on-ramp.
- Production KYC/KYB.
- Mainnet funds.
- Real credit underwriting.
- Full enterprise-only Circle products unless access is granted.

## Suggested Tech Stack

- Frontend: Vite + React + TypeScript.
- Backend: Node.js + Express.
- Contracts: Solidity + Hardhat or Foundry.
- Chain client: viem.
- Diagrams/docs: Mermaid and Markdown.

## Submission Checklist

- [ ] Title and short description
- [ ] Track selected
- [ ] Circle Developer Account email
- [ ] Circle products used
- [ ] Functional frontend
- [ ] Functional backend
- [ ] Architecture diagram
- [ ] Video demo
- [ ] Presentation
- [ ] GitHub repo
- [ ] Demo URL
- [ ] Circle Product Feedback section
