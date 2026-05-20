# Submission Plan

## Title

SouqAgent Pay

## Short Description

An AI spending desk for UAE/GCC SMEs where autonomous agents discover paid services, obey budget policy, execute USDC nanopayments through Circle Gateway/x402, and settle larger deliverable-based jobs with Arc escrow.

## Track

Best Agentic Economy Experience on Arc

## Circle Products Used

- USDC
- Circle Wallets
- Circle Gateway
- Nanopayments / x402
- CCTP / Bridge Kit as optional funding route

## Submission Identity

- Circle Developer Account email: `vt01nfts@gmail.com`
- Team name: `VT01`
- GitHub repository: `https://github.com/Vt01nft/-SouqAgent-Pay`
- Deployment target: Vercel

## Functional MVP

Included:

- frontend dashboard;
- backend agent orchestrator;
- x402-style seller API;
- Arc USDC escrow contract deployed on Arc Testnet;
- architecture section in the app;
- Circle Product Feedback documentation.

## Live Testnet Evidence

- Production app: `https://souqagent-pay.vercel.app`
- Arc Testnet USDC: `0x3600000000000000000000000000000000000000`
- ArcJobEscrow contract: `0x421707d931D0EF3b0fd4419085b91b713C622256`
- Deployment transaction: `0xcc35de9fde88a79fb7dce33051cf233a830fe007a6e4338db8a7d6e4b350fe24`
- Production-created funded job: `2`
- Production fund transaction: `0xf281f5431a708facc99ed21a93b98d456d4d515be5ddf2e7f84e75a29044f631`

## Architecture

```mermaid
flowchart LR
  Owner["SME Owner"] --> UI["SouqAgent Pay UI"]
  UI --> API["Agent Orchestrator API"]
  API --> Policy["Budget Policy Engine"]
  API --> Seller["x402 Seller API"]
  Seller --> API
  API --> Wallets["Circle Wallets"]
  API --> Gateway["Circle Gateway"]
  Gateway --> Nano["Nanopayments"]
  API --> Arc["Arc Testnet"]
  Arc --> Escrow["ArcJobEscrow.sol"]
  API --> Receipts["Audit Trail"]
  Receipts --> UI
```

## Remaining Submission Assets

- Deployed public URL
- GitHub repository URL
- Circle Developer Account email
- Demo video link
- Final presentation deck
- Optional Arc Testnet transaction hashes after deployment
