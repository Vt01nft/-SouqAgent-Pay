export type IntegrationMode = "demo" | "testnet" | "live";

export type PaymentAuthorization = {
  id: string;
  mode: IntegrationMode;
  rail: "Circle Gateway Nanopayments";
  amount: string;
  headerName: "payment-signature";
  headerValue: string;
};

export function createDemoNanopaymentAuthorization(amount: string): PaymentAuthorization {
  return {
    id: "pay_demo_sig_7f2d9a",
    mode: "demo",
    rail: "Circle Gateway Nanopayments",
    amount,
    headerName: "payment-signature",
    headerValue: "demo-x402-authorization",
  };
}

export function describeCircleArcReadiness() {
  return {
    wallets: "Ready for Circle Wallet IDs once developer account keys are supplied.",
    gateway: "Demo balance maps to Circle Gateway unified USDC balance.",
    nanopayments: "x402 flow is represented by the seller 402 challenge and payment header retry.",
    arc: "Arc escrow contract is included under contracts/ArcJobEscrow.sol.",
  };
}
