"use client";

import { useTokenApi } from "./useTokenApi";
import type { NetworkId } from "./useTokenApi";

/**
 * Token metadata information
 */
export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  total_supply: string;
  contract_address: string;
  block_number?: number;
  block_timestamp?: number;
  logo_url?: string;
  market_data?: {
    price_usd?: number;
    fully_diluted_valuation?: number;
    market_cap?: number;
    total_volume_24h?: number;
    price_change_percentage_24h?: number;
  };
}

/**
 * Parameters for token metadata API call
 */
export interface TokenMetadataParams {
  network_id?: NetworkId;
  include_market_data?: boolean;
}

/**
 * Hook to fetch token metadata
 *
 * @param contract - Token contract address
 * @param params - Optional parameters
 * @param options - Hook options
 * @returns Token metadata and functions
 *
 * @example
 * ```typescript
 * const {
 *   data: tokenData,
 *   isLoading,
 *   error
 * } = useTokenMetadata("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", {
 *   network_id: "mainnet"
 * });
 * ```
 */
export const useTokenMetadata = (
  contract: string | undefined,
  params?: TokenMetadataParams,
  options = { skip: contract ? false : true },
) => {
  // Normalize the contract address (ensure it has 0x prefix)
  const normalizedContract = contract && !contract.startsWith("0x") ? `0x${contract}` : contract;

  return useTokenApi<TokenMetadata>(
    normalizedContract ? `tokens/evm/${normalizedContract}` : "",
    { ...params },
    options,
  );
};
