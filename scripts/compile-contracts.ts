import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const root = process.cwd();
const sourcePath = path.join(root, "contracts", "ArcJobEscrow.sol");
const source = fs.readFileSync(sourcePath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "ArcJobEscrow.sol": {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = output.errors ?? [];
const failures = errors.filter((error: { severity: string }) => error.severity === "error");

for (const error of errors) {
  const prefix = error.severity === "error" ? "error" : "warning";
  console.log(`${prefix}: ${error.formattedMessage}`);
}

if (failures.length > 0) {
  process.exit(1);
}

const contract = output.contracts["ArcJobEscrow.sol"].ArcJobEscrow;
const outDir = path.join(root, "artifacts");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "ArcJobEscrow.json"),
  JSON.stringify(
    {
      contractName: "ArcJobEscrow",
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object,
    },
    null,
    2,
  ),
);

console.log("Compiled contracts/ArcJobEscrow.sol -> artifacts/ArcJobEscrow.json");
