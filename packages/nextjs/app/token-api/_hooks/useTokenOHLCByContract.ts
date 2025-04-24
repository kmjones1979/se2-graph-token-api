"use client";

import { useTokenApi } from "./useTokenApi";
import type { NetworkId } from "./useTokenApi";

/**
 * OHLC data point
 */
export interface OHLCDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  volume_usd?: number;
}

/**
 * Contract OHLC API response
 */
export interface ContractOHLCResponse {
  contract_address: string;
  token_name?: string;
  token_symbol?: string;
  token_decimals?: number;
  network_id: NetworkId;
  resolution: string;
  ohlc: OHLCDataPoint[];
}

/**
 * Parameters for contract OHLC API call
 */
export interface ContractOHLCParams {
  network_id?: NetworkId;
  from_timestamp?: number;
  to_timestamp?: number;
  resolution?: "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "1d" | "1w";
}

/**
 * Hook to fetch OHLC price data for a token contract
 *
 * @param contract - Token contract address
 * @param params - Optional parameters
 * @param options - Hook options
 * @returns OHLC data and functions
 */
export const useTokenOHLCByContract = (
  contract: string | undefined,
  params?: ContractOHLCParams,
  options = { skip: contract ? false : true },
) => {
  // Normalize the contract address (ensure it has 0x prefix)
  const normalizedContract = contract && !contract.startsWith("0x") ? `0x${contract}` : contract;

  return useTokenApi<ContractOHLCResponse>(
    normalizedContract ? `ohlc/contract/evm/${normalizedContract}` : "",
    { ...params },
    options,
  );
};
