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
  "function nextJobId() view returns (uint256)",
  "function jobs(uint256 jobId) view returns (address buyer,address seller,uint256 amount,string termsUri,string deliverableUri,uint8 state)",
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
