import express from "express";
import { config, getReadiness } from "./config";
import {
  createDemoPaymentAuthorization,
  evaluatePolicy,
  getSupplierRiskPaymentRequirement,
  paidResource,
  receipts,
  type PaymentRequirement,
} from "./commerce";

export const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, payment-signature");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "souqagent-pay",
    integrationMode: config.integrationMode,
    circleDeveloperEmail: config.circleDeveloperEmail,
    arcRpcUrl: config.arcRpcUrl,
  });
});

app.get("/api/readiness", (_req, res) => {
  res.json(getReadiness());
});

app.get("/api/demo/state", (_req, res) => {
  res.json({
    mode: config.integrationMode,
    wallets: {
      owner: config.circleOwnerWalletId ?? config.circleOwnerAddress ?? "circle_user_wallet_demo_7fd2",
      agent: config.circleAgentWalletId ?? "circle_agent_wallet_demo_91ac",
      gatewayBalance: "25.00 USDC",
      arcEscrowReady: "14.00 USDC",
    },
    policy: {
      autonomousCap: "0.01 USDC",
      approvalRequiredAbove: "0.01 USDC",
      categories: ["KYB", "freight", "settlement routing"],
      compliance: config.integrationMode === "demo" ? "demo only" : "testnet/live configured",
    },
    services: [
      {
        id: "kyb-a",
        name: "Gulf KYB Pulse",
        category: "Supplier Risk",
        price: "0.0042 USDC",
        speed: "480 ms",
        trust: 98,
      },
      {
        id: "freight-b",
        name: "PortRate Oracle",
        category: "Trade Quote",
        price: "0.0018 USDC",
        speed: "310 ms",
        trust: 92,
      },
      {
        id: "fx-c",
        name: "Stable Route Quote",
        category: "Settlement Routing",
        price: "0.0009 USDC",
        speed: "190 ms",
        trust: 89,
      },
    ],
    receipts,
  });
});

app.post("/api/agent/run", async (_req, res, next) => {
  try {
    const taskId = `TASK-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`;
    const protocol = _req.header("x-forwarded-proto") ?? _req.protocol;
    const host = _req.header("host");
    const requestBaseUrl = host ? `${protocol}://${host}` : config.publicBaseUrl;
    const sellerUrl = `${requestBaseUrl}/api/seller/supplier-risk`;

    const initialResponse = await fetch(sellerUrl, {
      headers: { "X-Agent-Intent": "supplier-risk-check" },
    });

    if (initialResponse.status !== 402) {
      throw new Error(`Expected x402 seller challenge, got ${initialResponse.status}`);
    }

    const challenge = (await initialResponse.json()) as {
      error: string;
      accepts: PaymentRequirement[];
    };
    const requirement = challenge.accepts[0];
    const policy = evaluatePolicy(requirement.amount);

    if (!policy.approved) {
      res.status(402).json({
        taskId,
        mode: config.integrationMode,
        status: "human-approval-required",
        policy,
      });
      return;
    }

    const authorization = createDemoPaymentAuthorization(requirement);
    const paidResponse = await fetch(sellerUrl, {
      headers: {
        [authorization.headerName]: authorization.headerValue,
        "X-Agent-Intent": "supplier-risk-check",
      },
    });

    if (!paidResponse.ok) {
      throw new Error(`Paid seller request failed with ${paidResponse.status}`);
    }

    const paidData = (await paidResponse.json()) as {
      receiptId: string;
      resource: typeof paidResource;
    };

    res.json({
      taskId,
      mode: config.integrationMode,
      selectedService: "Gulf KYB Pulse",
      steps: [
        {
          id: "discover",
          title: "Agent discovered paid services",
          detail: "Compared KYB, freight, and settlement APIs that advertise x402 payment metadata.",
          status: "complete",
        },
        {
          id: "challenge",
          title: "Seller returned HTTP 402",
          detail: `${challenge.error}: ${requirement.amount} ${requirement.asset} requested on ${requirement.network}.`,
          status: "complete",
        },
        {
          id: "policy",
          title: "Budget policy checked",
          detail: policy.reason,
          status: "complete",
        },
        {
          id: "payment",
          title: "Nanopayment authorized",
          detail: "The agent created a Gateway-compatible x402 payment header and retried the seller API.",
          status: "complete",
        },
        {
          id: "escrow",
          title: "Arc escrow staged",
          detail: "A 14.00 USDC job escrow is ready for milestone release after document review.",
          status: "complete",
        },
      ],
      payment: {
        protocol: "x402",
        rail: "Circle Gateway Nanopayments",
        amount: authorization.amount,
        status: authorization.status,
        authorization: authorization.id,
      },
      result: paidData.resource,
      arcEscrow: {
        jobId: "ARC-JOB-117",
        amount: "14.00 USDC",
        state: "funded",
        contract: config.arcJobEscrowAddress ?? "contracts/ArcJobEscrow.sol",
      },
      receipts,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/seller/supplier-risk", (req, res) => {
  const paymentSignature = req.header("payment-signature");

  if (!paymentSignature) {
    res.status(402).json({
      error: "Payment Required",
      accepts: [getSupplierRiskPaymentRequirement()],
    });
    return;
  }

  res.setHeader("X-Payment-Response", "demo-settlement:R-402-0842");
  res.json({
    paid: true,
    receiptId: "R-402-0842",
    resource: paidResource,
  });
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  void _next;
  console.error(error);
  res.status(500).json({
    error: "SouqAgent Pay orchestration failed",
    detail: error.message,
  });
});
