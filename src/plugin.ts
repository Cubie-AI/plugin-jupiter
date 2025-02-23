import {
  AgentContext,
  createLogger,
  PluginBase,
  Runtime,
} from "@maiar-ai/core";
import { JupiterService } from "./jupiter";
import {
  generatePriceTemplate,
  generateQuoteTemplate,
  generateTickerTemplate,
  getTokenAddressTemplate,
} from "./templates";
import {
  ContractAddressInfoSchema,
  PluginJupiterConfig,
  PriceInfoSchema,
  QuoteInfoSchema,
  TokenInfoSchema,
} from "./types";

const logger = createLogger("plugin:jupiter");

export class PluginJupiter extends PluginBase {
  private service: JupiterService;

  constructor(private config: PluginJupiterConfig) {
    super({
      id: "plugin-jupiter",
      name: "Jupiter API Plugin",
      description:
        "Facilitate requests to the Jupiter APIs for token information, quotes and swap transaction construction.",
    });

    this.service = new JupiterService(this.config);

    this.addExecutor({
      name: "get_contract_address",
      description:
        "Get the contract address of a token when the user provides the token name or symbol." +
        "Always use this method before calling any other method that requires a contract address.",
      execute: async (context: AgentContext) => {
        const params = await this.runtime.operations.getObject(
          ContractAddressInfoSchema,
          generateTickerTemplate(context.contextChain),
          { temperature: 0.5 }
        );

        logger.info(
          `[PluginJupiter]: get_contract_address params: ${JSON.stringify(
            params
          )}`
        );
        if (!params || (!params.ticker && !params.name)) {
          return {
            success: false,
            error: "Unable to parse token name or symbol from the request",
          };
        }

        const data = await this.service.getTokenByNameOrSymbol(params);
        if (!data) {
          return {
            success: false,
            error:
              "Unable to find token information for the provided name/symbol",
          };
        }

        return {
          success: true,
          data: {
            data,
            helpfulInformation:
              "This data is returned as the contract address of the token when the user provides the token name or symbol.",
          },
        };
      },
    });

    this.addExecutor({
      name: "get_quote",
      description:
        "Get a quote for a swap transaction between two tokens" +
        "For this method you are to infer the swapMode (direction) of the transaction from the users input." +
        "If for example a users says 'Buy 100 $USDC using SOL' that would be an ExactOut transaction." +
        "If a user says 'Use 3 SOL to buy USDC' that would be an ExactIn transaction.",
      execute: async (context: AgentContext) => {
        const params = await this.runtime.operations.getObject(
          QuoteInfoSchema,
          generateQuoteTemplate(context.contextChain),
          { temperature: 0.5 }
        );

        logger.info(
          `[PluginJupiter]: get_quote params: ${JSON.stringify(params)}`
        );
        if (
          !params ||
          !params.inputMint ||
          !params.outputMint ||
          !params.amount
        ) {
          return {
            success: false,
            error: "Missing required fields in the request",
          };
        }

        const data = await this.service.getQuote(params);
        if (!data) {
          return {
            success: false,
            error: "Unable to generate a quote for the provided parameters",
          };
        }

        return {
          success: true,
          data: {
            data,
            helpfulInformation:
              "This data is returned as a quote for a swap transaction between two tokens." +
              "The quote includes the input and output token addresses, the amount to be swapped, and the direction of the swap.",
          },
        };
      },
    });

    this.addExecutor({
      name: "get_price",
      description:
        "Get the price of a list of mint address / contract addresses for tokens on solana" +
        "Mint addresses and Contract addresses are between 32-44 characters long." +
        "If you are supplied with a ticker or token name you should use the get_contract_address method to get the correct address.",
      execute: async (context: AgentContext) => {
        const params = await this.runtime.operations.getObject(
          PriceInfoSchema,
          generatePriceTemplate(context.contextChain),
          { temperature: 0.5 }
        );

        logger.info(
          `[PluginJupiter]: get_price params: ${JSON.stringify(params)}`
        );
        if (!params.mints || !params.mints.length) {
          return {
            success: false,
            error: "No mint addresses provided in the request",
          };
        }

        const data = await this.service.getPrice(params);
        if (!data) {
          return {
            success: false,
            error: "Unable to get prices for the provided mint addresses",
          };
        }

        return {
          success: true,
          data: {
            data,
            helpfulInformation:
              "This data is returned as a map of mint addresses to their respective prices." +
              "The prices are derived as the unit cost of the map token against the vsToken provided or USD by default.",
          },
        };
      },
    });

    this.addExecutor({
      name: "get_token_info",
      description:
        "Get the basic token information of a single mint / contract address for a token on solana",
      execute: async (context: AgentContext) => {
        const params = await this.runtime.operations.getObject(
          TokenInfoSchema,
          getTokenAddressTemplate(context.contextChain),
          { temperature: 0.3 }
        );

        logger.info(
          `[PluginJupiter]: get_token_info params: ${JSON.stringify(params)}`
        );

        if (!params.token) {
          return {
            success: false,
            error:
              "Unable to parse token contract address from current context chain",
          };
        }

        const data = await this.service.getTokenInformation(params.token);
        if (!data) {
          return {
            success: false,
            error: "Unable to find token information for the provided token",
          };
        }

        return {
          success: true,
          data: {
            data,
            helpfulInformation:
              "Returns token information from Jupiter API. This information includes the token name, symbol, daily volume, and community tags.",
          },
        };
      },
    });
  }

  async init(runtime: Runtime): Promise<void> {
    await super.init(runtime);
    await this.service.init();
  }
}
