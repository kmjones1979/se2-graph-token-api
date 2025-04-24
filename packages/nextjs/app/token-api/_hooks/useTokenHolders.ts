"use client";

import { useTokenApi } from "./useTokenApi";
import type { NetworkId } from "./useTokenApi";

/**
 * Token holder information
 */
export interface TokenHolder {
  address: string;
  balance: string;
  balance_usd?: number;
  last_updated_block: number;
  token_share?: number;
}

/**
 * Token holders API response
 */
export interface TokenHoldersResponse {
  contract_address: string;
  holders: TokenHolder[];
  page: number;
  page_size: number;
  total_holders: number;
}

/**
 * Parameters for token holders API call
 */
export interface TokenHoldersParams {
  network_id?: NetworkId;
  page?: number;
  page_size?: number;
  include_price_usd?: boolean;
}

/**
 * Hook to fetch token holders
 *
 * @param contract - Token contract address
 * @param params - Optional parameters
 * @param options - Hook options
 * @returns Token holders data and functions
 */
export const useTokenHolders = (
  contract: string | undefined,
  params?: TokenHoldersParams,
  options = { skip: contract ? false : true },
) => {
  // Normalize the contract address (ensure it has 0x prefix)
  const normalizedContract = contract && !contract.startsWith("0x") ? `0x${contract}` : contract;

  return useTokenApi<TokenHoldersResponse>(
    normalizedContract ? `holders/evm/${normalizedContract}` : "",
    { ...params },
    options,
  );
};
