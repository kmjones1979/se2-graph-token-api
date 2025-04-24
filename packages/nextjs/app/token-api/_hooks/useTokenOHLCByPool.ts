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
  volume_token0: number;
  volume_token1: number;
  volume_usd?: number;
}

/**
 * Pool OHLC API response
 */
export interface PoolOHLCResponse {
  pool_address: string;
  token0_address: string;
  token0_symbol?: string;
  token0_name?: string;
  token0_decimals?: number;
  token1_address: string;
  token1_symbol?: string;
  token1_name?: string;
  token1_decimals?: number;
  protocol: string;
  network_id: NetworkId;
  resolution: string;
  ohlc: OHLCDataPoint[];
}

/**
 * Parameters for pool OHLC API call
 */
export interface PoolOHLCParams {
  network_id?: NetworkId;
  from_timestamp?: number;
  to_timestamp?: number;
  resolution?: "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "1d" | "1w";
  token_address?: string;
}

/**
 * Hook to fetch OHLC price data for a liquidity pool
 *
 * @param pool - Pool address
 * @param params - Optional parameters
 * @param options - Hook options
 * @returns OHLC data and functions
 */
export const useTokenOHLCByPool = (
  pool: string | undefined,
  params?: PoolOHLCParams,
  options = { skip: pool ? false : true },
) => {
  // Normalize the pool address (ensure it has 0x prefix)
  const normalizedPool = pool && !pool.startsWith("0x") ? `0x${pool}` : pool;

  return useTokenApi<PoolOHLCResponse>(normalizedPool ? `ohlc/pool/evm/${normalizedPool}` : "", { ...params }, options);
};
