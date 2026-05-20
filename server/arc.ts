import fs from "node:fs";
import path from "node:path";
import { Contract, ContractFactory, JsonRpcProvider, Wallet, parseUnits } from "ethers";
import { config } from "./config.js";

const usdcAbi = [
  "function approve(address spender, uint256 value) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const escrowAbi = [
  "function createJob(address seller, uint256 amount, string termsUri) returns (uint256)",
  "function fundJob(uint256 jobId)",
  "function release(uint256 jobId)",
  "function refund(uint256 jobId)",
  "function nextJobId() view returns (uint256)",
  "function jobs(uint256 jobId) view returns (address buyer,address seller,uint256 amount,string termsUri,string deliverableUri,uint8 state)",
  "event JobCreated(uint256 indexed jobId, address indexed buyer, address indexed seller, uint256 amount, string termsUri)",
];

export type EscrowJobResult = {
  jobId: string;
  contractAddress: string;
  seller: string;
  amount: string;
  state: "funded";
  approveTxHash: string;
  createTxHash: string;
  fundTxHash: string;
  explorerUrls: {
    approve: string;
    create: string;
    fund: string;
    contract: string;
  };
};

export type EscrowJob = {
  jobId: string;
  buyer: string;
  seller: string;
  amount: string;
  amountBaseUnits: string;
  termsUri: string;
  deliverableUri: string;
  state: string;
  explorerUrl: string;
};

const jobStates = ["created", "funded", "delivered", "released", "refunded"];

export function getArcProvider() {
  return new JsonRpcProvider(config.arcRpcUrl);
}

export function getEscrowExplorerUrl(address: string) {
  return `${config.arcExplorerUrl}/address/${address}`;
}

export function getTxExplorerUrl(hash: string) {
  return `${config.arcExplorerUrl}/tx/${hash}`;
}

export async function getEscrowStatus() {
  if (!config.arcJobEscrowAddress) {
    return { configured: false };
  }

  const provider = getArcProvider();
  const code = await provider.getCode(config.arcJobEscrowAddress);
  let nextJobId = "unknown";

  if (code !== "0x") {
    const escrow = new Contract(config.arcJobEscrowAddress, escrowAbi, provider);
    nextJobId = (await escrow.nextJobId()).toString();
  }

  return {
    configured: true,
    address: config.arcJobEscrowAddress,
    hasCode: code !== "0x",
    nextJobId,
    explorerUrl: getEscrowExplorerUrl(config.arcJobEscrowAddress),
  };
}

async function getEscrowReadClient() {
  if (!config.arcJobEscrowAddress || !config.arcUsdcAddress) {
    throw new Error("ARC_JOB_ESCROW_ADDRESS and ARC_USDC_ADDRESS are required.");
  }

  const provider = getArcProvider();
  const escrow = new Contract(config.arcJobEscrowAddress, escrowAbi, provider);
  const usdc = new Contract(config.arcUsdcAddress, usdcAbi, provider);
  const decimals = Number(await usdc.decimals());
  return { provider, escrow, decimals };
}

function formatUsdc(baseUnits: bigint, decimals: number) {
  const scale = 10n ** BigInt(decimals);
  const whole = baseUnits / scale;
  const fraction = (baseUnits % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole.toString()}${fraction ? `.${fraction}` : ""} USDC`;
}

export async function listEscrowJobs(): Promise<EscrowJob[]> {
  const { escrow, decimals } = await getEscrowReadClient();
  const nextJobId = Number(await escrow.nextJobId());
  const jobs: EscrowJob[] = [];

  for (let jobId = 1; jobId < nextJobId; jobId += 1) {
    const job = await escrow.jobs(jobId);
    const amount = BigInt(job.amount.toString());
    jobs.push({
      jobId: jobId.toString(),
      buyer: job.buyer,
      seller: job.seller,
      amount: formatUsdc(amount, decimals),
      amountBaseUnits: amount.toString(),
      termsUri: job.termsUri,
      deliverableUri: job.deliverableUri,
      state: jobStates[Number(job.state)] ?? "unknown",
      explorerUrl: getEscrowExplorerUrl(config.arcJobEscrowAddress!),
    });
  }

  return jobs.reverse();
}

async function getEscrowWriteClient() {
  if (!config.arcDeployerPrivateKey || !config.arcJobEscrowAddress) {
    throw new Error("ARC_DEPLOYER_PRIVATE_KEY and ARC_JOB_ESCROW_ADDRESS are required.");
  }

  const provider = getArcProvider();
  const signer = new Wallet(config.arcDeployerPrivateKey, provider);
  const escrow = new Contract(config.arcJobEscrowAddress, escrowAbi, signer);
  return { provider, signer, escrow };
}

export async function releaseEscrowJob(jobId: string) {
  const { provider, signer, escrow } = await getEscrowWriteClient();
  const tx = await escrow.release(BigInt(jobId), {
    nonce: await provider.getTransactionCount(signer.address, "pending"),
  });
  await tx.wait();
  return {
    jobId,
    state: "released",
    txHash: tx.hash,
    explorerUrl: getTxExplorerUrl(tx.hash),
  };
}

export async function refundEscrowJob(jobId: string) {
  const { provider, signer, escrow } = await getEscrowWriteClient();
  const tx = await escrow.refund(BigInt(jobId), {
    nonce: await provider.getTransactionCount(signer.address, "pending"),
  });
  await tx.wait();
  return {
    jobId,
    state: "refunded",
    txHash: tx.hash,
    explorerUrl: getTxExplorerUrl(tx.hash),
  };
}

export async function createAndFundEscrowJob(input: {
  seller: string;
  amountUsdc: string;
  termsUri: string;
}): Promise<EscrowJobResult> {
  if (!config.arcDeployerPrivateKey) {
    throw new Error("ARC_DEPLOYER_PRIVATE_KEY is required to create onchain escrow jobs.");
  }

  if (!config.arcUsdcAddress || !config.arcJobEscrowAddress) {
    throw new Error("ARC_USDC_ADDRESS and ARC_JOB_ESCROW_ADDRESS are required.");
  }

  const provider = getArcProvider();
  const signer = new Wallet(config.arcDeployerPrivateKey, provider);
  const usdc = new Contract(config.arcUsdcAddress, usdcAbi, signer);
  const escrow = new Contract(config.arcJobEscrowAddress, escrowAbi, signer);
  const decimals = Number(await usdc.decimals());
  const amount = parseUnits(input.amountUsdc, decimals);
  const balance = await usdc.balanceOf(signer.address);

  if (balance < amount) {
    throw new Error(`Insufficient Arc Testnet USDC. Need ${input.amountUsdc}, wallet has ${balance.toString()} base units.`);
  }

  const nextJobId = await escrow.nextJobId();
  const approveTx = await usdc.approve(config.arcJobEscrowAddress, amount);
  await approveTx.wait();

  const createTx = await escrow.createJob(input.seller, amount, input.termsUri);
  await createTx.wait();

  const fundTx = await escrow.fundJob(nextJobId);
  await fundTx.wait();

  return {
    jobId: nextJobId.toString(),
    contractAddress: config.arcJobEscrowAddress,
    seller: input.seller,
    amount: `${input.amountUsdc} USDC`,
    state: "funded",
    approveTxHash: approveTx.hash,
    createTxHash: createTx.hash,
    fundTxHash: fundTx.hash,
    explorerUrls: {
      approve: getTxExplorerUrl(approveTx.hash),
      create: getTxExplorerUrl(createTx.hash),
      fund: getTxExplorerUrl(fundTx.hash),
      contract: getEscrowExplorerUrl(config.arcJobEscrowAddress),
    },
  };
}

export async function compileEscrowFactory() {
  const artifactPath = path.join(process.cwd(), "artifacts", "ArcJobEscrow.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  return new ContractFactory(artifact.abi, `0x${artifact.bytecode}`);
}
