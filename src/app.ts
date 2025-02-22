import { createLogger } from "@maiar-ai/core";
import { JupiterService } from "./jupiter.js";
import { JupiterTokenResponse, LoadJupiterTokenParams } from "./types.js";

const logger = createLogger("app");

const memoryStory: JupiterTokenResponse[] = [];

// mock a storage function to store data
async function storeData(data: JupiterTokenResponse[]) {
  memoryStory.push(...data);
}

// mock a loader function from an external storage source
async function loadData(params: LoadJupiterTokenParams) {
  return (
    params &&
    memoryStory.filter(
      (token) =>
        (params.name &&
          token.name.toLocaleLowerCase() === params.name.toLocaleLowerCase()) ||
        (params.ticker &&
          token.symbol.toLocaleLowerCase() ===
            params.ticker.toLocaleLowerCase())
    )
  );
}
async function main() {
  const jup = new JupiterService({
    store: storeData,
    load: loadData,
  });

  await jup.init();

  logger.info("Jupiter Service initialized");

  const result = await jup.getPrice({
    mints: ["So11111111111111111111111111111111111111112"],
  });

  console.dir(result, { depth: null });

  const token = await jup.getTokenInformation(
    "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"
  );

  console.dir(token, { depth: null });

  const quote = await jup.getQuote({
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "2MH8ga3TuLvuvX2GUtVRS2BS8B9ujZo3bj5QeAkMpump",
    amount: 1,
    swapMode: "ExactIn",
  });

  console.dir(quote, { depth: null });

  const tokenByName = await jup.getTokenByNameOrSymbol({
    name: "Jupiter",
  });

  console.dir(tokenByName, { depth: null });
}

main();
