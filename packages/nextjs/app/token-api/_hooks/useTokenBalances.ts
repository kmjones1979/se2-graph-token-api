"use client";

import { useTokenApi } from "./useTokenApi";
import type { NetworkId } from "./useTokenApi";

/**
 * Token balance data returned from the API
 */
export interface TokenBalance {
  contract_address: string;
  amount: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  amount_usd?: number;
  logo_url?: string;
  network_id: NetworkId;
}

/**
 * Parameters for token balances API call
 */
export interface TokenBalancesParams {
  network_id?: NetworkId;
  page?: number;
  page_size?: number;
  min_amount?: string;
  contract_address?: string;
}

/**
 * Hook to fetch token balances for a specific address
 *
 * @param address - Wallet address
 * @param params - Optional filter parameters
 * @param options - Hook options
 * @returns Token balances data and functions
 */
export const useTokenBalances = (
  address: string | undefined,
  params?: TokenBalancesParams,
  options = { skip: address ? false : true },
) => {
  // Normalize the address (ensure it has 0x prefix)
  const normalizedAddress = address && !address.startsWith("0x") ? `0x${address}` : address;

  return useTokenApi<TokenBalance[]>(
    normalizedAddress ? `balances/evm/${normalizedAddress}` : "",
    { ...params },
    options,
  );
};
