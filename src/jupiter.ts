import { createLogger } from "@maiar-ai/core";
import axios, { AxiosInstance } from "axios";
import {
  JupiterQuoteParams,
  JupiterTokenResponse,
  LoadJupiterTokenParams,
  PluginJupiterConfig,
} from "./types";

interface GetPriceParams {
  mints: string[];
  vsToken?: string;
}

interface JupiterPriceMint {
  id: string;
  type: "derivedPrice";
  price: string;
}

interface JupiterPriceResponse {
  data: Record<string, JupiterPriceMint>;
  timeTaken: number;
}

interface JupiterQuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  swapMode: string;
}
const logger = createLogger("service:jupiter");

export class JupiterService {
  private service: AxiosInstance;
  constructor(private config?: PluginJupiterConfig) {
    const headers = {
      "content-type": "application/json",
      ...(this.config?.apiKey && { "x-api-key": this.config.apiKey }),
    };

    this.service = axios.create({
      baseURL: "https://api.jup.ag",
      headers,
      responseType: "json",
    });
  }

  async getPrice(params: GetPriceParams) {
    const { mints, vsToken } = params;

    const response = await this.service.get<JupiterPriceResponse>("/price/v2", {
      params: new URLSearchParams({
        ids: mints.join(","),
        ...(vsToken && { vsToken: vsToken }),
      }),
    });

    logger.info(`[JupiterService]: /price/v2 took ${response.data.timeTaken}`);

    return response.data.data;
  }

  async getQuote(params: JupiterQuoteParams) {
    let inputDecimals = 9;
    let outputDecimals = 9;
    const { inputMint, outputMint, amount, swapMode } = params;

    // get the decimals for the amount. This depends on the swap mode.
    // ExactIn means the amount is the input amount, so we need the decimals of the input mint
    // ExactOut means the amount is the output amount, so we need the decimals of the output mint
    if (swapMode === "ExactOut") {
      inputDecimals = (await this.getTokenInformation(outputMint)).decimals;
      outputDecimals = (await this.getTokenInformation(inputMint)).decimals;
    } else {
      inputDecimals = (await this.getTokenInformation(inputMint)).decimals;
      outputDecimals = (await this.getTokenInformation(outputMint)).decimals;
    }

    const inputAmount = amount * Math.pow(10, inputDecimals);
    const response = await this.service.get<JupiterQuoteResponse>(
      "/swap/v1/quote",
      {
        params: new URLSearchParams({
          inputMint: params.inputMint,
          outputMint: params.outputMint,
          amount: "" + inputAmount,
          swapMode: params.swapMode,
        }),
      }
    );

    logger.info(`[JupiterService]: got quote result ${response.status}`);
    const outputAmount =
      parseFloat(response.data.outAmount) / Math.pow(10, outputDecimals);

    return {
      inputMint,
      outputMint,
      inputAmount,
      outputAmount,
      swapMode,
    };
  }

  async getTokenInformation(token: string) {
    const response = await this.service.get<JupiterTokenResponse>(
      `/tokens/v1/token/${token}`
    );

    logger.info(
      `[JupiterServic]: got token result ${JSON.stringify(response.data)}`
    );

    return response.data;
  }

  async getTokenByNameOrSymbol(params: LoadJupiterTokenParams) {
    let result: JupiterTokenResponse[] | JupiterTokenResponse | undefined =
      undefined;
    logger.info("[JupiterService]: loading token by name or symbol");
    if (this.config?.load) {
      result = await this.config.load(params);
      logger.info(`[JupiterService]: loaded token ${JSON.stringify(result)}`);
    }

    return result;
  }

  async init() {
    if (this.config?.store) {
      logger.info("[JupiterService]: loading all tokens from Jupiter API");
      // this returns about ~200mb of data
      const tokens = await this.service.get<JupiterTokenResponse[]>(
        "/tokens/v1/tagged/verified"
      );
      logger.info(
        `[JupiterService]: loaded ${tokens.data.length} tokens, storing`
      );
      await this.config.store(tokens.data);
    }
  }
}
