import { BaseContextItem } from "@maiar-ai/core";

export function getTokenAddressTemplate(contextChain: BaseContextItem[]) {
  return `
    Generate a query by extracting the contract address from the user request. Your response should be a JSON object with a single "token" field containing your response.
    The response should be related to the original message you received from the user. 

    Do NOT include any metadata, context information, or explanation of how the response was generated.
    Look for a relevant solana token contract address in the user's message.
    The address is typically 32 to 44 characters long and starts and base58 encoded.

    Here is the Context Chain of the users initial message, and your internal operations which generated useful data for your response:
    ${JSON.stringify(contextChain, null, 2)}

    Return a JSON object with a single "token" field containing your response.
    
    Example of valid response:
    {
        "token": "2MH8ga3TuLvuvX2GUtVRS2BS8B9ujZo3bj5QeAkMpump"
    }
    `;
}

export function generateQuoteTemplate(contextChain: BaseContextItem[]): string {
  return `
    Generate a quote template for the users request by extracting out the input mint address, the output mint address and the total amount. Your response should be a JSON object with 4 fields, inputMint, outputMint, amount and direction as either ExactIn or ExactOut.
    The response should be related to the original message you received from the user. 

    Do NOT include any metadata, context information, or explanation of how the response was generated.
    The contract address for SOL is always So11111111111111111111111111111111111111112
    You are looking for token contract address, if you are supplied a ticker you should use the ticker_to_contract to get the correct address.
    You are to infer the swapMode of the transaction. If for example a users says "Buy 100 $USDC using SOL" that would be an ExactOut transaction. If a user says "Use 3 SOL to buy USDC" that would be an ExactIn transaction.
    A ticker is typically 2 to 10 characters long and starts with a "$" sign
    A ticker is not always capitalized
    The amount should be a number

    Here is the Context Chain of the users initial message, and your internal operations which generated useful data for your response:
    ${JSON.stringify(contextChain, null, 2)}

    Return a JSON object with 4 fields, inputMint, outputMint, amount and swapMode.
    
    Example of valid response:
    {
        "inputMint": "So11111111111111111111111111111111111111112",
        "outputMint": "2MH8ga3TuLvuvX2GUtVRS2BS8B9ujZo3bj5QeAkMpump",
        "amount": 1,
        "swapMode": "ExactIn"
    }
    `;
}

export function generatePriceTemplate(contextChain: BaseContextItem[]): string {
  return `
    Generate a price template for the users request by extracting out a an array of input mints as 'mints' and an vsToken output mint address which will act as the base in the price quote. 
    Your response should be a JSON object with 2 fields, mints which is a required string array, and vsToken which is an optional string.
    The response should be related to the original message you received from the user. 

    Do NOT include any metadata, context information, or explanation of how the response was generated.
    The defaule vsToken is always EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v which is the mint address for USDC
    You are looking for token contract address/mint addresses, if you are supplied a ticker you should use the ticker_to_contract to get the correct address.
    A ticker is typically 2 to 10 characters long and starts with a "$" sign
    A ticker is not always capitalized
    The amount should be a number

    Here is the Context Chain of the users initial message, and your internal operations which generated useful data for your response:
    ${JSON.stringify(contextChain, null, 2)}

    Return a JSON object with 2 fields, mints, vsToken.
    
    Example of valid response:
    {
        "mints": ["So11111111111111111111111111111111111111112"],
        "vsToken": "2MH8ga3TuLvuvX2GUtVRS2BS8B9ujZo3bj5QeAkMpump",
    }
    `;
}

export function generateTickerTemplate(
  contextChain: BaseContextItem[]
): string {
  return `
    Generate a token query by extracting the ticker/token symbol and/or the token name from the user request. 
    Your response should be a JSON object with either a "ticker" or "name" field contained your response.
    The response should be related to the original message you received from the user. 

    Do NOT include any metadata, context information, or explanation of how the response was generated.
    Look for a relevant tickers, token symbols, or token names in the user's message.
    A ticker is typically 2 to 10 characters long and starts with a "$" sign
    A ticker is not always capitalized
    A token name is typically 3 to 20 characters long

    Here is the Context Chain of the users initial message, and your internal operations which generated useful data for your response:
    ${JSON.stringify(contextChain, null, 2)}

    Return a JSON object with either a "ticker" or "name" field containing your response.
    
    Example's of valid response:
    {
      "ticker": "$WIF"
      "name": ""
    }
    {
      "ticker": "$WIF"
      "name": "Dog wif hat"    
    }
    {
      "ticker": ""
      "name": "Dog wif hat"    
    }

    `;
}
