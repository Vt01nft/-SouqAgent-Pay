export type PaymentRequirement = {
  scheme: "exact";
  network: "gateway-evm";
  asset: "USDC";
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: {
    name: "GatewayWalletBatched";
    settlement: "Circle Gateway Nanopayments";
    verifyingContract: string;
  };
};

export type PolicyDecision = {
  approved: boolean;
  reason: string;
  maxAutonomousSpend: number;
  requestedAmount: number;
};

export const paidResource = {
  vendor: "Al Noor Components",
  riskScore: 86,
  summary:
    "Registry match found, no sanctions hit, two late-payment notes in the last 18 months.",
  recommendation: "Proceed with milestone escrow and require delivery proof before release.",
};

export function getSupplierRiskPaymentRequirement(): PaymentRequirement {
  return {
    scheme: "exact",
    network: "gateway-evm",
    asset: "USDC",
    amount: "0.0042",
    payTo: "circle_seller_gateway_wallet_demo",
    maxTimeoutSeconds: 30,
    extra: {
      name: "GatewayWalletBatched",
      settlement: "Circle Gateway Nanopayments",
      verifyingContract: "circle_gateway_wallet_demo_contract",
    },
  };
}

export function evaluatePolicy(amount: string, maxAutonomousSpend = 0.01): PolicyDecision {
  const requestedAmount = Number(amount);

  return {
    approved: requestedAmount <= maxAutonomousSpend,
    reason:
      requestedAmount <= maxAutonomousSpend
        ? `${amount} USDC is below the autonomous approval cap.`
        : `${amount} USDC requires human approval.`,
    maxAutonomousSpend,
    requestedAmount,
  };
}

export function createDemoPaymentAuthorization(requirement: PaymentRequirement) {
  return {
    id: "pay_demo_sig_7f2d9a",
    headerName: "payment-signature",
    headerValue: `demo-x402:${requirement.asset}:${requirement.amount}:${requirement.payTo}`,
    amount: `${requirement.amount} ${requirement.asset}`,
    status: "authorized",
  };
}

export const receipts = [
  {
    id: "R-402-0842",
    label: "Supplier-risk API access",
    rail: "Circle Gateway Nanopayments / x402",
    amount: "0.0042 USDC",
    status: "verified",
    explorerUrl: "demo://gateway/receipt/R-402-0842",
  },
  {
    id: "ARC-JOB-117",
    label: "Vendor document review escrow",
    rail: "Arc USDC Job Escrow",
    amount: "14.00 USDC",
    status: "funded",
    explorerUrl: "demo://arc/jobs/117",
  },
  {
    id: "GW-BAL-009",
    label: "Agent spend allocation",
    rail: "Circle Gateway Balance",
    amount: "25.00 USDC",
    status: "active",
    explorerUrl: "demo://gateway/balance/GW-BAL-009",
  },
];
