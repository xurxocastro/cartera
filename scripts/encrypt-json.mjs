import { readFile, writeFile } from "node:fs/promises";
import { encryptJson } from "./crypto-utils.mjs";

const outputPath = process.argv[2];
const saltFromPath = process.argv[3] === "--salt-from" ? process.argv[4] : "";
const password = process.env.PORTFOLIO_PASSWORD;

if (!outputPath || !password) {
  console.error("Usage: PORTFOLIO_PASSWORD=... node scripts/encrypt-json.mjs <output> [--salt-from envelope.json]");
  process.exit(1);
}

const saltBase64 = saltFromPath ? JSON.parse(await readFile(saltFromPath, "utf8")).salt : undefined;
const input = await readStdin();
const data = JSON.parse(input);
const envelope = await encryptJson(data, password, { saltBase64 });

await writeFile(outputPath, `${JSON.stringify(envelope, null, 2)}\n`, "utf8");

function readStdin() {
  return new Promise((resolve, reject) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      input += chunk;
    });
    process.stdin.on("end", () => resolve(input));
    process.stdin.on("error", reject);
  });
}
