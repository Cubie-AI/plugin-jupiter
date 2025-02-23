import { z } from "zod";

export interface JupiterTokenResponse {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  tags: string[];
  daily_volume: number;
  created_at: string;
  freeze_authority: string | null;
  mint_authority: string | null;
  permanent_delegate: string | null;
  minted_at: string;
  extensions: Record<string, string>;
}

export interface JupiterQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  swapMode: "ExactIn" | "ExactOut";
}

export type LoadJupiterTokenParams = {
  ticker?: string;
  name?: string;
};

type JupiterTokenLoader =
  | ((
      params: LoadJupiterTokenParams
    ) => Promise<JupiterTokenResponse[] | undefined>)
  | ((
      params: LoadJupiterTokenParams
    ) => Promise<JupiterTokenResponse | undefined>);

export interface PluginJupiterConfig {
  apiKey?: string;
  store?: (tokens: JupiterTokenResponse[]) => Promise<void>;
  load?: JupiterTokenLoader;
}

export const TokenInfoSchema = z.object({
  token: z.string(),
});

export const PriceInfoSchema = z.object({
  mints: z.array(z.string()),
  vsToken: z.string().optional(),
});

export const QuoteInfoSchema = z.object({
  inputMint: z.string(),
  outputMint: z.string(),
  amount: z.number(),
  swapMode: z.enum(["ExactIn", "ExactOut"]),
});

export const ContractAddressInfoSchema = z.object({
  ticker: z.string().optional(),
  name: z.string().optional(),
});
