"use client";

import { useTokenApi } from "./useTokenApi";
import type { NetworkId } from "./useTokenApi";

/**
 * Historical balance data point for a token
 */
export interface HistoricalBalance {
  timestamp: number;
  block_number: number;
  balance: string;
  balance_usd?: number;
  token_price_usd?: number;
}

/**
 * Token balance history entry with token information
 */
export interface TokenBalanceHistory {
  contract_address: string;
  token_name?: string;
  token_symbol?: string;
  token_decimals?: number;
  balances: HistoricalBalance[];
}

/**
 * Parameters for historical balances API call
 */
export interface HistoricalBalancesParams {
  contract_address?: string;
  network_id?: NetworkId;
  from_timestamp?: number;
  to_timestamp?: number;
  resolution?: "day" | "hour";
}

/**
 * Hook to fetch historical token balances for an address
 *
 * @param address - Wallet address
 * @param params - Optional parameters
 * @param options - Hook options
 * @returns Historical balance data and functions
 */
export const useHistoricalBalances = (
  address: string | undefined,
  params?: HistoricalBalancesParams,
  options = { skip: address ? false : true },
) => {
  // Normalize the address (ensure it has 0x prefix)
  const normalizedAddress = address && !address.startsWith("0x") ? `0x${address}` : address;

  return useTokenApi<TokenBalanceHistory[]>(
    normalizedAddress ? `historical/balances/evm/${normalizedAddress}` : "",
    { ...params },
    options,
  );
};
