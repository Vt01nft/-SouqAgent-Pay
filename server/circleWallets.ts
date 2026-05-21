import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { config } from "./config.js";

export type CircleContractExecutionResult = {
  transactionId?: string;
  txHash?: string;
  state?: string;
  raw: unknown;
};

let circleClient: ReturnType<typeof initiateDeveloperControlledWalletsClient> | undefined;

function getCircleClient() {
  if (!config.circleApiKey || !config.circleEntitySecret) {
    throw new Error("CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET are required for Circle Wallet contract execution.");
  }

  circleClient ??= initiateDeveloperControlledWalletsClient({
    apiKey: config.circleApiKey,
    entitySecret: config.circleEntitySecret,
  });

  return circleClient;
}

function pickTransaction(payload: unknown) {
  const data = payload as {
    data?: {
      id?: string;
      transaction?: {
        id?: string;
        txHash?: string;
        state?: string;
      };
    };
  };

  return {
    id: data.data?.transaction?.id ?? data.data?.id,
    txHash: data.data?.transaction?.txHash,
    state: data.data?.transaction?.state,
  };
}

export function canUseCircleContractExecution() {
  return Boolean(
    config.circleApiKey &&
      config.circleEntitySecret &&
      config.circleAgentWalletId &&
      config.arcJobEscrowAddress,
  );
}

export async function submitDeliverableWithCircleWallet(input: {
  jobId: string;
  deliverableUri: string;
}): Promise<CircleContractExecutionResult> {
  if (!config.circleAgentWalletId || !config.arcJobEscrowAddress) {
    throw new Error("CIRCLE_AGENT_WALLET_ID and ARC_JOB_ESCROW_ADDRESS are required.");
  }

  const client = getCircleClient();
  const response = await client.createContractExecutionTransaction({
    walletId: config.circleAgentWalletId,
    contractAddress: config.arcJobEscrowAddress,
    abiFunctionSignature: "submitDeliverable(uint256,string)",
    abiParameters: [input.jobId, input.deliverableUri],
    refId: `souqagent-deliverable-${input.jobId}`,
    fee: {
      type: "level",
      config: {
        feeLevel: "HIGH",
      },
    },
  });
  const transaction = pickTransaction(response);

  return {
    transactionId: transaction.id,
    txHash: transaction.txHash,
    state: transaction.state,
    raw: response.data,
  };
}

export async function getCircleTransaction(input: {
  transactionId: string;
}): Promise<CircleContractExecutionResult> {
  const client = getCircleClient();
  const response = await client.getTransaction({
    id: input.transactionId,
  });
  const transaction = pickTransaction(response);

  return {
    transactionId: transaction.id ?? input.transactionId,
    txHash: transaction.txHash,
    state: transaction.state,
    raw: response.data,
  };
}

export async function waitForCircleTransactionHash(input: {
  transactionId: string;
  attempts?: number;
  intervalMs?: number;
}) {
  const attempts = input.attempts ?? 5;
  const intervalMs = input.intervalMs ?? 1500;
  let latest: CircleContractExecutionResult | undefined;

  for (let index = 0; index < attempts; index += 1) {
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    latest = await getCircleTransaction({ transactionId: input.transactionId });

    if (latest.txHash) {
      return latest;
    }
  }

  return latest;
}
