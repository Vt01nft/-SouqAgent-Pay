import "dotenv/config";

export type IntegrationMode = "demo" | "testnet" | "live";

export type AppConfig = {
  port: number;
  integrationMode: IntegrationMode;
  publicBaseUrl: string;
  circleDeveloperEmail?: string;
  circleOwnerAddress?: string;
  arcRpcUrl: string;
  arcExplorerUrl: string;
  arcUsdcAddress?: string;
  arcJobEscrowAddress?: string;
  circleApiKey?: string;
  circleWalletSetId?: string;
  circleOwnerWalletId?: string;
  circleAgentWalletId?: string;
};

function integrationMode(value: string | undefined): IntegrationMode {
  if (value === "testnet" || value === "live") {
    return value;
  }

  return "demo";
}

export const config: AppConfig = {
  port: Number(process.env.PORT ?? 8787),
  integrationMode: integrationMode(process.env.INTEGRATION_MODE),
  publicBaseUrl: process.env.PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8787",
  circleDeveloperEmail: process.env.CIRCLE_DEVELOPER_EMAIL,
  circleOwnerAddress: process.env.CIRCLE_OWNER_ADDRESS,
  arcRpcUrl: process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network",
  arcExplorerUrl: process.env.ARC_EXPLORER_URL ?? "https://testnet.arcscan.app",
  arcUsdcAddress: process.env.ARC_USDC_ADDRESS,
  arcJobEscrowAddress: process.env.ARC_JOB_ESCROW_ADDRESS,
  circleApiKey: process.env.CIRCLE_API_KEY,
  circleWalletSetId: process.env.CIRCLE_WALLET_SET_ID,
  circleOwnerWalletId: process.env.CIRCLE_OWNER_WALLET_ID,
  circleAgentWalletId: process.env.CIRCLE_AGENT_WALLET_ID,
};

export function getReadiness() {
  const requiredForTestnet = [
    ["CIRCLE_API_KEY", config.circleApiKey],
    ["CIRCLE_WALLET_SET_ID", config.circleWalletSetId],
    ["CIRCLE_OWNER_WALLET_ID", config.circleOwnerWalletId],
    ["CIRCLE_AGENT_WALLET_ID", config.circleAgentWalletId],
    ["ARC_USDC_ADDRESS", config.arcUsdcAddress],
    ["ARC_JOB_ESCROW_ADDRESS", config.arcJobEscrowAddress],
  ] as const;

  const missing = requiredForTestnet
    .filter(([, value]) => !value)
    .map(([name]) => name);

  return {
    mode: config.integrationMode,
    demoReady: true,
    testnetReady: missing.length === 0,
    missing,
    arc: {
      rpcUrl: config.arcRpcUrl,
      explorerUrl: config.arcExplorerUrl,
      usdcAddress: config.arcUsdcAddress ?? "not-configured",
      jobEscrowAddress: config.arcJobEscrowAddress ?? "not-configured",
    },
    circle: {
      developerEmail: config.circleDeveloperEmail ?? "not-configured",
      ownerAddress: config.circleOwnerAddress ?? "not-configured",
      apiKeyConfigured: Boolean(config.circleApiKey),
      walletSetConfigured: Boolean(config.circleWalletSetId),
      ownerWalletConfigured: Boolean(config.circleOwnerWalletId),
      agentWalletConfigured: Boolean(config.circleAgentWalletId),
    },
  };
}
