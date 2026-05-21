import express from "express";
import { config, getReadiness } from "./config.js";
import { createAndFundEscrowJob, getEscrowStatus, listEscrowJobs, refundEscrowJob, releaseEscrowJob } from "./arc.js";
import {
  createDemoPaymentAuthorization,
  evaluatePolicy,
  getSupplierRiskPaymentRequirement,
  paidResource,
  receipts,
  type PaymentRequirement,
} from "./commerce.js";
import { canUseCircleContractExecution, submitDeliverableWithCircleWallet, waitForCircleTransactionHash } from "./circleWallets.js";
import { findTaskByEscrowJobId, getTask, listTasks, saveTask, updateTask, type ProductTask } from "./store.js";

export const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, payment-signature, x-owner-access-code");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

function requireOwnerAccess(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!config.ownerAccessCode) {
    next();
    return;
  }

  const providedCode = req.header("x-owner-access-code");

  if (providedCode !== config.ownerAccessCode) {
    res.status(401).json({
      error: "Owner access required",
      detail: "Enter the owner access code to run agents, view the private ledger, or settle escrow.",
    });
    return;
  }

  next();
}

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

app.get("/api/tasks", requireOwnerAccess, async (_req, res, next) => {
  try {
    res.json({ tasks: await listTasks() });
  } catch (error) {
    next(error);
  }
});

app.get("/api/tasks/:taskId", async (req, res, next) => {
  try {
    const task = await getTask(req.params.taskId);

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    res.json({ task });
  } catch (error) {
    next(error);
  }
});

app.post("/api/tasks/:taskId/deliverable", requireOwnerAccess, async (req, res, next) => {
  try {
    const body = req.body as {
      uri?: string;
      notes?: string;
      submittedBy?: string;
    };
    const uri = body.uri?.trim();
    const notes = body.notes?.trim();

    if (!uri || !notes) {
      res.status(400).json({ error: "Deliverable URI and notes are required." });
      return;
    }

    const currentTask = await getTask(String(req.params.taskId));

    if (!currentTask) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    let onchainDeliverable:
      | NonNullable<ProductTask["deliverable"]>
      | undefined;

    onchainDeliverable = {
      uri,
      notes,
      submittedAt: new Date().toISOString(),
      submittedBy: body.submittedBy?.trim() || "seller/operator",
      onchainStatus: "skipped",
    };

    if (currentTask.arcEscrow?.jobId && canUseCircleContractExecution()) {
      try {
        const circleResult = await submitDeliverableWithCircleWallet({
          jobId: currentTask.arcEscrow.jobId,
          deliverableUri: uri,
        });
        const settledResult = circleResult.transactionId
          ? await waitForCircleTransactionHash({ transactionId: circleResult.transactionId })
          : circleResult;
        onchainDeliverable = {
          ...onchainDeliverable,
          onchainStatus: "submitted",
          onchainTransactionId: settledResult?.transactionId ?? circleResult.transactionId,
          onchainTxHash: settledResult?.txHash ?? circleResult.txHash,
          onchainExplorerUrl: (settledResult?.txHash ?? circleResult.txHash)
            ? `${config.arcExplorerUrl}/tx/${settledResult?.txHash ?? circleResult.txHash}`
            : undefined,
        };
      } catch (error) {
        onchainDeliverable = {
          ...onchainDeliverable,
          onchainStatus: "failed",
          onchainError: error instanceof Error ? error.message : "Circle Wallet contract execution failed.",
        };
      }
    }

    const task = await updateTask(currentTask.taskId, (taskToUpdate) => ({
      ...taskToUpdate,
      status: taskToUpdate.status === "funded" ? "delivered" : taskToUpdate.status,
      deliverable: onchainDeliverable,
    }));

    res.json({ task });
  } catch (error) {
    next(error);
  }
});

app.post("/api/tasks/:taskId/sync-deliverable", requireOwnerAccess, async (req, res, next) => {
  try {
    const task = await getTask(String(req.params.taskId));

    if (!task?.deliverable?.onchainTransactionId) {
      res.status(404).json({ error: "No Circle deliverable transaction to sync." });
      return;
    }

    const circleResult = await waitForCircleTransactionHash({
      transactionId: task.deliverable.onchainTransactionId,
      attempts: 3,
      intervalMs: 1000,
    });

    const updatedTask = await updateTask(task.taskId, (currentTask) => ({
      ...currentTask,
      deliverable: currentTask.deliverable
        ? {
            ...currentTask.deliverable,
            onchainTxHash: circleResult?.txHash ?? currentTask.deliverable.onchainTxHash,
            onchainExplorerUrl: circleResult?.txHash
              ? `${config.arcExplorerUrl}/tx/${circleResult.txHash}`
              : currentTask.deliverable.onchainExplorerUrl,
          }
        : currentTask.deliverable,
    }));

    res.json({ task: updatedTask });
  } catch (error) {
    next(error);
  }
});

app.get("/api/escrow/status", async (_req, res, next) => {
  try {
    res.json(await getEscrowStatus());
  } catch (error) {
    next(error);
  }
});

app.get("/api/escrow/jobs", requireOwnerAccess, async (_req, res, next) => {
  try {
    res.json({ jobs: await listEscrowJobs() });
  } catch (error) {
    next(error);
  }
});

app.post("/api/escrow/jobs/:jobId/release", requireOwnerAccess, async (req, res, next) => {
  try {
    const jobId = String(req.params.jobId);
    const task = await findTaskByEscrowJobId(jobId);

    if (!task?.deliverable) {
      res.status(409).json({
        error: "Delivery proof required",
        detail: "Submit deliverable proof before releasing this escrow job.",
      });
      return;
    }

    const result = await releaseEscrowJob(jobId);

    if (task) {
      await updateTask(task.taskId, (currentTask) => ({
        ...currentTask,
        status: "released",
        arcEscrow: currentTask.arcEscrow
          ? {
              ...currentTask.arcEscrow,
              state: "released",
              releaseTxHash: result.txHash,
              explorerUrls: {
                ...(currentTask.arcEscrow.explorerUrls ?? {}),
                release: result.explorerUrl,
              },
            }
          : currentTask.arcEscrow,
      }));
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/escrow/jobs/:jobId/refund", requireOwnerAccess, async (req, res, next) => {
  try {
    const jobId = String(req.params.jobId);
    const result = await refundEscrowJob(jobId);
    const task = await findTaskByEscrowJobId(jobId);

    if (task) {
      await updateTask(task.taskId, (currentTask) => ({
        ...currentTask,
        status: "refunded",
        arcEscrow: currentTask.arcEscrow
          ? {
              ...currentTask.arcEscrow,
              state: "refunded",
              refundTxHash: result.txHash,
              explorerUrls: {
                ...(currentTask.arcEscrow.explorerUrls ?? {}),
                refund: result.explorerUrl,
              },
            }
          : currentTask.arcEscrow,
      }));
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
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

app.post("/api/agent/run", requireOwnerAccess, async (_req, res, next) => {
  try {
    const body = _req.body as {
      businessName?: string;
      vendor?: string;
      ownerRequest?: string;
      maxAutonomousSpend?: string;
    };
    const now = new Date();
    const taskId = `TASK-${now.toISOString().replace(/\D/g, "").slice(0, 14)}`;
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
    const maxAutonomousSpend = Number.parseFloat(body.maxAutonomousSpend ?? "0.01");
    const policy = evaluatePolicy(requirement.amount, Number.isFinite(maxAutonomousSpend) ? maxAutonomousSpend : 0.01);

    if (!policy.approved) {
      const blockedTask: ProductTask = {
        taskId,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        mode: config.integrationMode,
        businessName: body.businessName ?? "VT01 Trading",
        vendor: body.vendor ?? "Al Noor Components",
        ownerRequest: body.ownerRequest ?? "Check supplier risk before releasing the next vendor milestone.",
        maxAutonomousSpend: body.maxAutonomousSpend ?? "0.01",
        selectedService: "Gulf KYB Pulse",
        status: "human-approval-required",
        policy,
        receipts: [],
      };
      await saveTask(blockedTask);

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
    const sellerAddress = config.circleAgentWalletAddress;

    if (!sellerAddress && config.integrationMode !== "demo") {
      throw new Error("CIRCLE_AGENT_WALLET_ADDRESS is required before creating real Arc escrow jobs.");
    }

    const escrowJob = await createAndFundEscrowJob({
      seller: sellerAddress ?? "0xd72db4da2d6fd30c4c5e98754c06f570bab99fc3",
      amountUsdc: "0.25",
      termsUri: `souqagent://tasks/${taskId}`,
    });

    const responsePayload = {
      taskId,
      mode: config.integrationMode,
      businessName: body.businessName ?? "VT01 Trading",
      ownerRequest:
        body.ownerRequest ??
        "Check Al Noor Components before releasing the next vendor milestone.",
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
          title: "Arc escrow funded",
          detail: `Job ${escrowJob.jobId} funded on Arc Testnet for ${escrowJob.amount}.`,
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
        jobId: escrowJob.jobId,
        amount: escrowJob.amount,
        state: escrowJob.state,
        contract: escrowJob.contractAddress,
        approveTxHash: escrowJob.approveTxHash,
        createTxHash: escrowJob.createTxHash,
        fundTxHash: escrowJob.fundTxHash,
        explorerUrls: escrowJob.explorerUrls,
      },
      receipts,
      receiptUrl: `/receipt/${taskId}`,
    };

    await saveTask({
      taskId,
      createdAt: now.toISOString(),
      updatedAt: new Date().toISOString(),
      mode: config.integrationMode,
      businessName: responsePayload.businessName,
      vendor: body.vendor ?? paidData.resource.vendor,
      ownerRequest: responsePayload.ownerRequest,
      maxAutonomousSpend: body.maxAutonomousSpend ?? "0.01",
      selectedService: responsePayload.selectedService,
      status: "funded",
      payment: responsePayload.payment,
      result: responsePayload.result,
      arcEscrow: responsePayload.arcEscrow,
      receipts: responsePayload.receipts,
      policy,
      receiptUrl: responsePayload.receiptUrl,
    });

    res.json(responsePayload);
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
